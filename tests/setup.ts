import 'reflect-metadata';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
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
