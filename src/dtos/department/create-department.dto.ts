import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Department name is required' })
  @MaxLength(100, { message: 'Department name must not exceed 100 characters' })
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
