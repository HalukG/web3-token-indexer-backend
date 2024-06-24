import { createPublicClient, http, parseAbiItem, Log, PublicClient } from 'viem';
import { blast } from 'viem/chains';
import { PrismaClient, Prisma } from '@prisma/client';
import { Config } from '../types/config';

interface TransferLog extends Log {
  args: {
    from: string;
    to: string;
    value: bigint;
  };
}

interface IndexerDependencies {
  config: Config;
  prisma: PrismaClient;
  client: PublicClient;
}

export class IndexerService {
  private readonly BLOCK_RANGE = 1000n;
  private readonly transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
  private readonly dependencies: IndexerDependencies;

  constructor(config: Config, prisma: PrismaClient) {
    this.dependencies = {
      config,
      prisma,
      client: createPublicClient({
        chain: blast,
        transport: http(config.rpcEndpoint)
      })
    };
  }

  public async indexTransfers(): Promise<void> {
    const latestBlock = await this.dependencies.client.getBlockNumber();
    const initialBlock = await this.getLastIndexedBlock();
    await this.processBlockRange(initialBlock, latestBlock);
  }

  private async processBlockRange(fromBlock: bigint, latestBlock: bigint): Promise<void> {
    if (fromBlock > latestBlock) {
      return;
    }

    const toBlock = this.calculateToBlock(fromBlock, latestBlock);
    
    try {
      console.log(`Indexing blocks ${fromBlock} to ${toBlock}`);
      const logs = await this.getTransferLogs(fromBlock, toBlock);
      console.log(`Found ${logs.length} transfers in this block range`);

      await this.processLogs(logs);

      console.log(`Indexed blocks ${fromBlock} to ${toBlock}`);
    } catch (error) {
      console.error(`Error indexing blocks ${fromBlock} to ${toBlock}:`, error);
    }

    const nextFromBlock = toBlock + 1n;
    await this.processBlockRange(nextFromBlock, latestBlock);
  }

  private calculateToBlock(fromBlock: bigint, latestBlock: bigint): bigint {
    return (fromBlock + this.BLOCK_RANGE) > latestBlock ? latestBlock : fromBlock + this.BLOCK_RANGE;
  }

  private async getLastIndexedBlock(): Promise<bigint> {
    const lastIndexedTransfer = await this.dependencies.prisma.transfer.findFirst({
      orderBy: { blockNumber: 'desc' }
    });

    return lastIndexedTransfer ? BigInt(lastIndexedTransfer.blockNumber + 1) : 0n;
  }

  private async getTransferLogs(fromBlock: bigint, toBlock: bigint): Promise<TransferLog[]> {
    const logs = await this.dependencies.client.getLogs({
      address: this.dependencies.config.tokenAddress as `0x${string}`,
      event: this.transferEvent,
      fromBlock,
      toBlock
    });
    return logs as TransferLog[];
  }

  private async processLogs(logs: ReadonlyArray<TransferLog>): Promise<void> {
    for (const log of logs) {
      await this.processLog(log);
    }
  }

  private async processLog(log: TransferLog): Promise<void> {
    const { from, to, value } = log.args;
    const { blockNumber, transactionHash } = log;

    if (typeof transactionHash === 'string') {
      try {
        await this.dependencies.prisma.transfer.upsert({
          where: { transactionHash },
          update: {},
          create: {
            from: from.toLowerCase(),
            to: to.toLowerCase(),
            amount: value.toString(),
            blockNumber: Number(blockNumber),
            transactionHash,
            timestamp: new Date()
          }
        });
      } catch (error) {
        this.handlePrismaError(error, transactionHash);
      }
    }
  }

  private handlePrismaError(error: unknown, transactionHash: string): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (Array.isArray(target) && target.includes('transactionHash')) {
          console.log(`Duplicate transaction hash: ${transactionHash}. Skipping.`);
        } else {
          console.error('Prisma unique constraint error:', error);
        }
      } else {
        console.error('Prisma error:', error);
      }
    } else {
      console.error('Unknown error:', error);
    }
  }
}