import express from 'express';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { IndexerService } from './services/indexer';
import { setupRoutes } from './api/routes';

const app = express();
const prisma = new PrismaClient();
const indexerService = new IndexerService(config, prisma);

setupRoutes(app, prisma);

async function connectWithRetry(retries = 5, delay = 5000): Promise<void> {
  while (retries > 0) {
    try {
      await prisma.$connect();
      console.log('Connected to database');
      return;
    } catch (error) {
      console.error('Failed to connect to database:', error);
      retries -= 1;
      console.log(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached. Unable to connect to the database.');
}

async function startServer(): Promise<void> {
  try {
    await connectWithRetry();

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });

    console.log('Starting indexing...');
    await indexerService.indexTransfers();
    console.log('Indexing complete');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});