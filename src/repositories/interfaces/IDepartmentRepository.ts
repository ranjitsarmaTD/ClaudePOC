import { Department } from '../../entities/Department.entity';

export interface IDepartmentRepository {
  findAll(): Promise<Department[]>;
  findById(id: string): Promise<Department | null>;
  findByName(name: string): Promise<Department | null>;
  create(department: Partial<Department>): Promise<Department>;
  update(id: string, department: Partial<Department>): Promise<Department | null>;
  delete(id: string): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
  existsById(id: string): Promise<boolean>;
}
