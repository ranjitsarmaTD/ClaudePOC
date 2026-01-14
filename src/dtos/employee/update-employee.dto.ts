import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EmployeeStatus } from '../../types/common.types';

export class UpdateEmployeeDto {
  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Position must not exceed 100 characters' })
  position?: string;

  @IsString()
  @IsOptional()
  salary?: string;

  @IsString()
  @IsOptional()
  hireDate?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
