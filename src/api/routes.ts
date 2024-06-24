import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { isAddress } from 'viem';

export function setupRoutes(app: express.Application, prisma: PrismaClient): void {
  app.get('/api/transfers/:address', async (req: Request, res: Response) => {
    const { address } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string) || 10));
    const skip = (page - 1) * limit;

    if (!isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    try {
      const [transfers, totalCount] = await Promise.all([
        prisma.transfer.findMany({
          where: {
            OR: [
              { from: address.toLowerCase() },
              { to: address.toLowerCase() }
            ]
          },
          orderBy: {
            blockNumber: 'desc'
          },
          skip,
          take: limit,
        }),
        prisma.transfer.count({
          where: {
            OR: [
              { from: address.toLowerCase() },
              { to: address.toLowerCase() }
            ]
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      res.json({
        transfers,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error('Error fetching transfers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}