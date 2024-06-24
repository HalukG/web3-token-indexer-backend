const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function waitForDatabase() {
  while (true) {
    try {
      await client.connect();
      console.log('Database is ready!');
      await client.end();
      break;
    } catch (err) {
      console.log('Waiting for database...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

waitForDatabase();