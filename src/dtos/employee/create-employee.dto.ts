import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsNumber,
  IsPositive,
  IsDateString,
  IsEnum,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { EmployeeStatus } from '../../types/common.types';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName!: string;

  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  email!: string;

  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Phone must not exceed 20 characters' })
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'Position is required' })
  @MaxLength(100, { message: 'Position must not exceed 100 characters' })
  position!: string;

  @IsString()
  @IsNotEmpty({ message: 'Salary is required' })
  salary!: string;

  @IsString()
  @IsNotEmpty({ message: 'Hire date is required' })
  hireDate!: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  status?: string;
}
