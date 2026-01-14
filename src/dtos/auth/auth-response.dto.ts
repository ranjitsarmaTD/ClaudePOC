import { User } from '../../entities/User.entity';
import { UserRole } from '../../types/common.types';

export class UserResponseDto {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.role = user.role;
    this.createdAt = user.createdAt;
  }

  static fromEntity(user: User): UserResponseDto {
    return new UserResponseDto(user);
  }
}

export class AuthResponseDto {
  token: string;
  user: UserResponseDto;

  constructor(token: string, user: User) {
    this.token = token;
    this.user = UserResponseDto.fromEntity(user);
  }
}
