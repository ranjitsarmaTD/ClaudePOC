import { DataSource } from 'typeorm';
import { Department } from '../../src/entities/Department.entity';
import { Employee } from '../../src/entities/Employee.entity';
import { User } from '../../src/entities/User.entity';

export const TestDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hr_admin_db_test',
  synchronize: true, // Only for tests
  dropSchema: true, // Clean database before each test run
  logging: false,
  entities: [Department, Employee, User],
});

export async function initializeTestDatabase(): Promise<void> {
  if (!TestDataSource.isInitialized) {
    await TestDataSource.initialize();
  }
}

export async function closeTestDatabase(): Promise<void> {
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
}

export async function clearDatabase(): Promise<void> {
  const queryRunner = TestDataSource.createQueryRunner();

  try {
    // Clear tables in correct order (child tables first to avoid FK constraint errors)
    await queryRunner.query('TRUNCATE TABLE "employees" CASCADE;');
    await queryRunner.query('TRUNCATE TABLE "users" CASCADE;');
    await queryRunner.query('TRUNCATE TABLE "departments" CASCADE;');
  } catch (error) {
    // If tables don't exist yet, ignore the error
    console.log('Warning: Could not clear database tables', error);
  } finally {
    await queryRunner.release();
  }
}
