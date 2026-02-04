import 'reflect-metadata';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'hr_admin_db_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_SYNCHRONIZE = 'false';
process.env.DB_LOGGING = 'false';
process.env.DB_SSL = 'false';
process.env.JWT_SECRET = 'test_jwt_secret_key_at_least_32_characters_long';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_ISSUER = 'hr-admin-api-test';
process.env.BCRYPT_ROUNDS = '10';

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
