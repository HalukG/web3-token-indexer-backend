# Web3 Transfer Indexer

This project indexes ERC20 token transfers on the Blast network and provides an API to query transfer history for specific addresses. It's built using TypeScript, Express.js, Prisma ORM, and Viem for blockchain interaction.

## Technical Stack

- Docker for containerization
- PostgreSQL for data storage
- Prisma ORM for data interaction and database schema setup
- Express.js as the Node.js framework
- TypeScript for type-safe development
- Viem for blockchain interaction

## Features

- Indexes all transfers of a specified ERC20 token (default: Blast Wrapped Ether) since inception
- Provides a public HTTP API to query transfer history for a given address
- Configurable via environment variables to support different EVM networks and tokens
- Implements pagination for API responses
- Validates Ethereum addresses

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (v18 or later)
- Yarn

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/web3-transfer-indexer.git
cd web3-transfer-indexer
```

2. Modify the `.env` file in the root directory based on token requirements

### Running with Docker

1. Build and start the containers:
```
docker compose up --build
```

2. The application will start indexing transfers and the API will be available at `http://localhost:3000`.

### Using Prisma Studio

Access Prisma Studio at `http://localhost:5555` when the Docker containers are running.

## Configuration

The following environment variables can be configured in the `.env` file:

- `PORT`: The port on which the API server will run
- `RPC_ENDPOINT`: The RPC endpoint for the blockchain
- `TOKEN_ADDRESS`: The address of the ERC20 token to index
- `CHAIN_ID`: The chain ID of the network
- `DB_USER`: PostgreSQL database user
- `DB_PASSWORD`: PostgreSQL database password
- `DB_NAME`: PostgreSQL database name

## API Usage

1. Query transfer history for a specific address:
```
GET /api/transfers/:address
```

Replace `:address` with the Ethereum address you want to query.

Example using curl:

```
curl -X GET "http://localhost:3000/api/transfers/0x1234567890123456789012345678901234567890"
```

2. The API supports pagination with `page` and `limit` query parameters:
```
curl -X GET "http://localhost:3000/api/transfers/0x1234567890123456789012345678901234567890?page=1&limit=10"
```

## Testing

1. Monitor indexing progress:
```
docker-compose logs -f app
```

2. Monitor indexing progress:
```
curl -X GET "http://localhost:3000/api/transfers/0x4300000000000000000000000000000000000004?page=1&limit=10"
```

3. Test with an invalid address:
```
curl -X GET "http://localhost:3000/api/transfers/invalidaddress"
```

4. Access Prisma Studio at http://localhost:5555 to view indexed data.

## Potential Improvements

Given more time, the following improvements could be made:

1. Implement an event-based architecture using message queues (e.g., RabbitMQ, Kafka) to decouple the indexer from the API service.
2. Add filtering options for inbound/outbound transactions.
3. Implement rate limiting and caching to improve API performance.
4. Add support for indexing multiple tokens simultaneously.
5. Add unit and integration tests.

## Completion Status

- [ ] Containerization with Docker
- [ ] Use of specified tech stack (PostgreSQL, Prisma, Express.js, TypeScript, Viem)
- [ ] Indexing of token transfers since inception
- [ ] Public HTTP API for querying transfer history

## License

This project is licensed under the MIT License