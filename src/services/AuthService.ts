import { injectable, inject } from 'tsyringe';
import bcrypt from 'bcrypt';
import { IAuthService } from './interfaces/IAuthService';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { User } from '../entities/User.entity';
import { LoginDto } from '../dtos/auth/login.dto';
import { JwtUtil } from '../utils/jwt.util';
import { UnauthorizedError } from '../utils/errors';
import { jwtConfig } from '../config';
import { logger } from '../utils/logger';

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly jwtUtil: JwtUtil
  ) {}

  async login(dto: LoginDto): Promise<{ token: string; user: User }> {
    logger.info(`Login attempt for email: ${dto.email}`);

    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.jwtUtil.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    logger.info(`User logged in successfully: ${user.email}`);

    return { token, user };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async hashPassword(password: string): Promise<string> {
    const config = jwtConfig.get();
    return bcrypt.hash(password, config.bcryptRounds);
  }
}
