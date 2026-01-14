import { injectable, inject } from 'tsyringe';
import { IDepartmentService } from './interfaces/IDepartmentService';
import { IDepartmentRepository } from '../repositories/interfaces/IDepartmentRepository';
import { Department } from '../entities/Department.entity';
import { CreateDepartmentDto } from '../dtos/department/create-department.dto';
import { UpdateDepartmentDto } from '../dtos/department/update-department.dto';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

@injectable()
export class DepartmentService implements IDepartmentService {
  constructor(
    @inject('IDepartmentRepository')
    private readonly departmentRepository: IDepartmentRepository
  ) {}

  async getAllDepartments(): Promise<Department[]> {
    logger.info('Fetching all departments');
    const departments = await this.departmentRepository.findAll();
    logger.info(`Found ${departments.length} departments`);
    return departments;
  }

  async getDepartmentById(id: string): Promise<Department> {
    logger.info(`Fetching department with id: ${id}`);

    if (!id) {
      throw new ValidationError('Department ID is required');
    }

    const department = await this.departmentRepository.findById(id);

    if (!department) {
      throw new NotFoundError(`Department with id ${id} not found`);
    }

    return department;
  }

  async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    logger.info(`Creating new department: ${dto.name}`);

    // Check if department with same name already exists
    const existingDepartment = await this.departmentRepository.findByName(dto.name);
    if (existingDepartment) {
      throw new ConflictError(`Department with name "${dto.name}" already exists`);
    }

    const department = await this.departmentRepository.create({
      name: dto.name,
      description: dto.description,
    });

    logger.info(`Department created successfully with id: ${department.id}`);
    return department;
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<Department> {
    logger.info(`Updating department with id: ${id}`);

    if (!id) {
      throw new ValidationError('Department ID is required');
    }

    // Check if department exists
    const existingDepartment = await this.departmentRepository.findById(id);
    if (!existingDepartment) {
      throw new NotFoundError(`Department with id ${id} not found`);
    }

    // If name is being updated, check for conflicts
    if (dto.name && dto.name !== existingDepartment.name) {
      const departmentWithSameName = await this.departmentRepository.findByName(dto.name);
      if (departmentWithSameName) {
        throw new ConflictError(`Department with name "${dto.name}" already exists`);
      }
    }

    const updatedDepartment = await this.departmentRepository.update(id, dto);

    if (!updatedDepartment) {
      throw new NotFoundError(`Department with id ${id} not found after update`);
    }

    logger.info(`Department updated successfully with id: ${id}`);
    return updatedDepartment;
  }

  async deleteDepartment(id: string): Promise<void> {
    logger.info(`Deleting department with id: ${id}`);

    if (!id) {
      throw new ValidationError('Department ID is required');
    }

    // Check if department exists
    const existingDepartment = await this.departmentRepository.findById(id);
    if (!existingDepartment) {
      throw new NotFoundError(`Department with id ${id} not found`);
    }

    const deleted = await this.departmentRepository.delete(id);

    if (!deleted) {
      throw new NotFoundError(`Department with id ${id} could not be deleted`);
    }

    logger.info(`Department deleted successfully with id: ${id}`);
  }
}
