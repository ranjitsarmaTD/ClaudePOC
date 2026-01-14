import { Employee } from '../../entities/Employee.entity';
import { CreateEmployeeDto } from '../../dtos/employee/create-employee.dto';
import { UpdateEmployeeDto } from '../../dtos/employee/update-employee.dto';

export interface IEmployeeService {
  getAllEmployees(): Promise<Employee[]>;
  getEmployeeById(id: string): Promise<Employee>;
  getEmployeesByDepartmentId(departmentId: string): Promise<Employee[]>;
  createEmployee(dto: CreateEmployeeDto): Promise<Employee>;
  updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
}
