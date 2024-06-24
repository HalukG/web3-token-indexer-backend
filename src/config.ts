import dotenv from 'dotenv';
import { Config } from './types/config';

dotenv.config();

function validateConfig(): Config {
  const requiredEnvVars = ['PORT', 'RPC_ENDPOINT', 'TOKEN_ADDRESS', 'CHAIN_ID', 'DATABASE_URL'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  const config: Config = {
    port: parseInt(process.env.PORT!, 10),
    rpcEndpoint: process.env.RPC_ENDPOINT!,
    tokenAddress: process.env.TOKEN_ADDRESS!,
    chainId: parseInt(process.env.CHAIN_ID!, 10),
    databaseUrl: process.env.DATABASE_URL!
  };

  if (!config.rpcEndpoint.startsWith('http://') && !config.rpcEndpoint.startsWith('https://')) {
    throw new Error('Invalid RPC_ENDPOINT format. It should start with http:// or https://');
  }

  return config;
}

export const config = validateConfig();