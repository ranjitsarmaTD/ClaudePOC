import { injectable, inject } from 'tsyringe';
import { IEmployeeService } from './interfaces/IEmployeeService';
import { IEmployeeRepository } from '../repositories/interfaces/IEmployeeRepository';
import { IDepartmentRepository } from '../repositories/interfaces/IDepartmentRepository';
import { Employee } from '../entities/Employee.entity';
import { CreateEmployeeDto } from '../dtos/employee/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/employee/update-employee.dto';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { EmployeeStatus } from '../types/common.types';
import { logger } from '../utils/logger';

@injectable()
export class EmployeeService implements IEmployeeService {
  constructor(
    @inject('IEmployeeRepository')
    private readonly employeeRepository: IEmployeeRepository,
    @inject('IDepartmentRepository')
    private readonly departmentRepository: IDepartmentRepository
  ) {}

  async getAllEmployees(): Promise<Employee[]> {
    logger.info('Fetching all employees');
    const employees = await this.employeeRepository.findAll();
    logger.info(`Found ${employees.length} employees`);
    return employees;
  }

  async getEmployeeById(id: string): Promise<Employee> {
    logger.info(`Fetching employee with id: ${id}`);

    if (!id) {
      throw new ValidationError('Employee ID is required');
    }

    const employee = await this.employeeRepository.findById(id);

    if (!employee) {
      throw new NotFoundError(`Employee with id ${id} not found`);
    }

    return employee;
  }

  async getEmployeesByDepartmentId(departmentId: string): Promise<Employee[]> {
    logger.info(`Fetching employees for department: ${departmentId}`);

    if (!departmentId) {
      throw new ValidationError('Department ID is required');
    }

    // Check if department exists
    const department = await this.departmentRepository.findById(departmentId);
    if (!department) {
      throw new NotFoundError(`Department with id ${departmentId} not found`);
    }

    const employees = await this.employeeRepository.findByDepartmentId(departmentId);
    logger.info(`Found ${employees.length} employees in department ${departmentId}`);
    return employees;
  }

  async createEmployee(dto: CreateEmployeeDto): Promise<Employee> {
    logger.info(`Creating new employee: ${dto.email}`);

    // Check if employee with same email already exists
    const existingEmployee = await this.employeeRepository.findByEmail(dto.email);
    if (existingEmployee) {
      throw new ConflictError(`Employee with email "${dto.email}" already exists`);
    }

    // Validate department if provided
    if (dto.departmentId) {
      const department = await this.departmentRepository.findById(dto.departmentId);
      if (!department) {
        throw new NotFoundError(`Department with id ${dto.departmentId} not found`);
      }
    }

    // Validate and parse salary
    const salary = parseFloat(dto.salary);
    if (isNaN(salary) || salary < 0) {
      throw new ValidationError('Salary must be a valid positive number');
    }

    // Validate and parse hire date
    const hireDate = new Date(dto.hireDate);
    if (isNaN(hireDate.getTime())) {
      throw new ValidationError('Hire date must be a valid date');
    }

    // Validate status if provided
    let status = EmployeeStatus.ACTIVE;
    if (dto.status) {
      if (!Object.values(EmployeeStatus).includes(dto.status as EmployeeStatus)) {
        throw new ValidationError(
          `Status must be one of: ${Object.values(EmployeeStatus).join(', ')}`
        );
      }
      status = dto.status as EmployeeStatus;
    }

    const employee = await this.employeeRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      position: dto.position,
      salary,
      hireDate,
      departmentId: dto.departmentId,
      status,
    });

    logger.info(`Employee created successfully with id: ${employee.id}`);
    return employee;
  }

  async updateEmployee(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    logger.info(`Updating employee with id: ${id}`);

    if (!id) {
      throw new ValidationError('Employee ID is required');
    }

    // Check if employee exists
    const existingEmployee = await this.employeeRepository.findById(id);
    if (!existingEmployee) {
      throw new NotFoundError(`Employee with id ${id} not found`);
    }

    // If email is being updated, check for conflicts
    if (dto.email && dto.email !== existingEmployee.email) {
      const employeeWithSameEmail = await this.employeeRepository.findByEmail(dto.email);
      if (employeeWithSameEmail) {
        throw new ConflictError(`Employee with email "${dto.email}" already exists`);
      }
    }

    // Validate department if being updated
    if (dto.departmentId && dto.departmentId !== existingEmployee.departmentId) {
      const department = await this.departmentRepository.findById(dto.departmentId);
      if (!department) {
        throw new NotFoundError(`Department with id ${dto.departmentId} not found`);
      }
    }

    // Prepare update data
    const updateData: Partial<Employee> = {};

    if (dto.firstName) {
      updateData.firstName = dto.firstName;
    }
    if (dto.lastName) {
      updateData.lastName = dto.lastName;
    }
    if (dto.email) {
      updateData.email = dto.email;
    }
    if (dto.phone !== undefined) {
      updateData.phone = dto.phone;
    }
    if (dto.position) {
      updateData.position = dto.position;
    }
    if (dto.salary) {
      const salary = parseFloat(dto.salary);
      if (isNaN(salary) || salary < 0) {
        throw new ValidationError('Salary must be a valid positive number');
      }
      updateData.salary = salary;
    }
    if (dto.hireDate) {
      const hireDate = new Date(dto.hireDate);
      if (isNaN(hireDate.getTime())) {
        throw new ValidationError('Hire date must be a valid date');
      }
      updateData.hireDate = hireDate;
    }
    if (dto.departmentId !== undefined) {
      updateData.departmentId = dto.departmentId;
    }
    if (dto.status) {
      if (!Object.values(EmployeeStatus).includes(dto.status as EmployeeStatus)) {
        throw new ValidationError(
          `Status must be one of: ${Object.values(EmployeeStatus).join(', ')}`
        );
      }
      updateData.status = dto.status as EmployeeStatus;
    }

    const updatedEmployee = await this.employeeRepository.update(id, updateData);

    if (!updatedEmployee) {
      throw new NotFoundError(`Employee with id ${id} not found after update`);
    }

    logger.info(`Employee updated successfully with id: ${id}`);
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    logger.info(`Deleting employee with id: ${id}`);

    if (!id) {
      throw new ValidationError('Employee ID is required');
    }

    // Check if employee exists
    const existingEmployee = await this.employeeRepository.findById(id);
    if (!existingEmployee) {
      throw new NotFoundError(`Employee with id ${id} not found`);
    }

    const deleted = await this.employeeRepository.delete(id);

    if (!deleted) {
      throw new NotFoundError(`Employee with id ${id} could not be deleted`);
    }

    logger.info(`Employee deleted successfully with id: ${id}`);
  }
}
