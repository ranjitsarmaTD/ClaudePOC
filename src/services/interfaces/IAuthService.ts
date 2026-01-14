import { User } from '../../entities/User.entity';
import { LoginDto } from '../../dtos/auth/login.dto';

export interface IAuthService {
  login(dto: LoginDto): Promise<{ token: string; user: User }>;
  validateUser(email: string, password: string): Promise<User | null>;
}
