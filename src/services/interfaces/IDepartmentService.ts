import { Department } from '../../entities/Department.entity';
import { CreateDepartmentDto } from '../../dtos/department/create-department.dto';
import { UpdateDepartmentDto } from '../../dtos/department/update-department.dto';

export interface IDepartmentService {
  getAllDepartments(): Promise<Department[]>;
  getDepartmentById(id: string): Promise<Department>;
  createDepartment(dto: CreateDepartmentDto): Promise<Department>;
  updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<Department>;
  deleteDepartment(id: string): Promise<void>;
}
