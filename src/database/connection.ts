import { DataSource } from 'typeorm';
import { databaseConfig } from '../config';
import { logger } from '../utils/logger';

// Import entities
import { Department } from '../entities/Department.entity';
import { Employee } from '../entities/Employee.entity';
import { User } from '../entities/User.entity';

const config = databaseConfig.get();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.database,
  synchronize: config.synchronize,
  logging: config.logging,
  entities: [Department, Employee, User],
  migrations: ['src/database/migrations/**/*.ts'],
  subscribers: [],
  ssl: config.ssl ? { rejectUnauthorized: false } : false,
});

export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database connection...');
    await AppDataSource.initialize();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to initialize database connection', { error });
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed successfully');
    }
  } catch (error) {
    logger.error('Failed to close database connection', { error });
    throw error;
  }
}
