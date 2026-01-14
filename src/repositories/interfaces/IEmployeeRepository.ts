import { Employee } from '../../entities/Employee.entity';

export interface IEmployeeRepository {
  findAll(): Promise<Employee[]>;
  findById(id: string): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findByDepartmentId(departmentId: string): Promise<Employee[]>;
  create(employee: Partial<Employee>): Promise<Employee>;
  update(id: string, employee: Partial<Employee>): Promise<Employee | null>;
  delete(id: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
  existsById(id: string): Promise<boolean>;
  countByDepartmentId(departmentId: string): Promise<number>;
}
