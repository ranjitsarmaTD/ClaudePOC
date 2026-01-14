import { User } from '../../src/entities/User.entity';
import { UserRole } from '../../src/types/common.types';

export const mockUserData = {
  email: 'admin@test.com',
  password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5agyWgO3J0BFi', // hashed: 'password123'
  role: UserRole.ADMIN,
};

export const createMockUser = (overrides?: Partial<User>): User => {
  const user = new User();
  user.id = overrides?.id || '323e4567-e89b-12d3-a456-426614174000';
  user.email = overrides?.email || mockUserData.email;
  user.password = overrides?.password || mockUserData.password;
  user.role = overrides?.role || mockUserData.role;
  user.createdAt = overrides?.createdAt || new Date();
  user.updatedAt = overrides?.updatedAt || new Date();
  return user;
};
