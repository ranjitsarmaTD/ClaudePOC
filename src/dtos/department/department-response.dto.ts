import { Department } from '../../entities/Department.entity';

export class DepartmentResponseDto {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(department: Department) {
    this.id = department.id;
    this.name = department.name;
    this.description = department.description;
    this.createdAt = department.createdAt;
    this.updatedAt = department.updatedAt;
  }

  static fromEntity(department: Department): DepartmentResponseDto {
    return new DepartmentResponseDto(department);
  }

  static fromEntities(departments: Department[]): DepartmentResponseDto[] {
    return departments.map((dept) => new DepartmentResponseDto(dept));
  }
}
