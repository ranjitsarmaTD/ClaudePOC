import { Employee } from '../../entities/Employee.entity';
import { EmployeeStatus } from '../../types/common.types';
import { DepartmentResponseDto } from '../department/department-response.dto';

export class EmployeeResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  salary: number;
  hireDate: Date;
  status: EmployeeStatus;
  departmentId?: string;
  department?: DepartmentResponseDto;
  createdAt: Date;
  updatedAt: Date;

  constructor(employee: Employee) {
    this.id = employee.id;
    this.firstName = employee.firstName;
    this.lastName = employee.lastName;
    this.email = employee.email;
    this.phone = employee.phone;
    this.position = employee.position;
    this.salary = employee.salary;
    this.hireDate = employee.hireDate;
    this.status = employee.status;
    this.departmentId = employee.departmentId;
    this.createdAt = employee.createdAt;
    this.updatedAt = employee.updatedAt;

    if (employee.department) {
      this.department = DepartmentResponseDto.fromEntity(employee.department);
    }
  }

  static fromEntity(employee: Employee): EmployeeResponseDto {
    return new EmployeeResponseDto(employee);
  }

  static fromEntities(employees: Employee[]): EmployeeResponseDto[] {
    return employees.map((emp) => new EmployeeResponseDto(emp));
  }
}
