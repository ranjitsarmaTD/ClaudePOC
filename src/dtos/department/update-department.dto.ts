import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateDepartmentDto {
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Department name must not exceed 100 characters' })
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
