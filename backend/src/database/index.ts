import knex from 'knex';
import { config } from '../config';

export const db = knex({
  client: 'postgresql',
  connection: {
    host: config.DB.HOST,
    port: config.DB.PORT,
    database: config.DB.NAME,
    user: config.DB.USER,
    password: config.DB.PASSWORD,
  },
});

export async function initializeDatabase() {
  try {
    await db.raw('SELECT 1');
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}
