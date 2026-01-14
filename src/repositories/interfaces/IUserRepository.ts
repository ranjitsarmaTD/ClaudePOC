import { User } from '../../entities/User.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Partial<User>): Promise<User>;
  existsByEmail(email: string): Promise<boolean>;
}
