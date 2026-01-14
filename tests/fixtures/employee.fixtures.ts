import { Employee } from '../../src/entities/Employee.entity';
import { EmployeeStatus } from '../../src/types/common.types';

export const mockEmployeeData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@test.com',
  phone: '+1-555-0100',
  position: 'Software Engineer',
  salary: 100000,
  hireDate: new Date('2023-01-15'),
  status: EmployeeStatus.ACTIVE,
};

export const createMockEmployee = (overrides?: Partial<Employee>): Employee => {
  const employee = new Employee();
  employee.id = overrides?.id || '223e4567-e89b-12d3-a456-426614174000';
  employee.firstName = overrides?.firstName || mockEmployeeData.firstName;
  employee.lastName = overrides?.lastName || mockEmployeeData.lastName;
  employee.email = overrides?.email || mockEmployeeData.email;
  employee.phone = overrides?.phone || mockEmployeeData.phone;
  employee.position = overrides?.position || mockEmployeeData.position;
  employee.salary = overrides?.salary || mockEmployeeData.salary;
  employee.hireDate = overrides?.hireDate || mockEmployeeData.hireDate;
  employee.status = overrides?.status || mockEmployeeData.status;
  employee.departmentId = overrides?.departmentId;
  employee.createdAt = overrides?.createdAt || new Date();
  employee.updatedAt = overrides?.updatedAt || new Date();
  return employee;
};

export const mockEmployees = [
  createMockEmployee({
    id: '223e4567-e89b-12d3-a456-426614174001',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice.smith@test.com',
    position: 'Senior Developer',
    salary: 120000,
    departmentId: '123e4567-e89b-12d3-a456-426614174001',
  }),
  createMockEmployee({
    id: '223e4567-e89b-12d3-a456-426614174002',
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@test.com',
    position: 'QA Engineer',
    salary: 85000,
    departmentId: '123e4567-e89b-12d3-a456-426614174001',
  }),
  createMockEmployee({
    id: '223e4567-e89b-12d3-a456-426614174003',
    firstName: 'Charlie',
    lastName: 'Brown',
    email: 'charlie.brown@test.com',
    position: 'Sales Manager',
    salary: 95000,
    departmentId: '123e4567-e89b-12d3-a456-426614174002',
  }),
];
