import { Repository } from 'typeorm';
import { injectable } from 'tsyringe';
import { Employee } from '../entities/Employee.entity';
import { IEmployeeRepository } from './interfaces/IEmployeeRepository';
import { AppDataSource } from '../database/connection';

@injectable()
export class EmployeeRepository implements IEmployeeRepository {
  private repository: Repository<Employee>;

  constructor() {
    this.repository = AppDataSource.getRepository(Employee);
  }

  async findAll(): Promise<Employee[]> {
    return this.repository.find({
      relations: ['department'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Employee | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['department'],
    });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return this.repository.findOne({
      where: { email },
      relations: ['department'],
    });
  }

  async findByDepartmentId(departmentId: string): Promise<Employee[]> {
    return this.repository.find({
      where: { departmentId },
      relations: ['department'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(employee: Partial<Employee>): Promise<Employee> {
    const newEmployee = this.repository.create(employee);
    return this.repository.save(newEmployee);
  }

  async update(id: string, employee: Partial<Employee>): Promise<Employee | null> {
    await this.repository.update(id, employee);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { email },
    });
    return count > 0;
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id },
    });
    return count > 0;
  }

  async countByDepartmentId(departmentId: string): Promise<number> {
    return this.repository.count({
      where: { departmentId },
    });
  }
}
