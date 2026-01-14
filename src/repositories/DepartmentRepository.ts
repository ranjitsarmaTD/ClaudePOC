import { Repository } from 'typeorm';
import { injectable } from 'tsyringe';
import { Department } from '../entities/Department.entity';
import { IDepartmentRepository } from './interfaces/IDepartmentRepository';
import { AppDataSource } from '../database/connection';

@injectable()
export class DepartmentRepository implements IDepartmentRepository {
  private repository: Repository<Department>;

  constructor() {
    this.repository = AppDataSource.getRepository(Department);
  }

  async findAll(): Promise<Department[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Department | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Department | null> {
    return this.repository.findOne({
      where: { name },
    });
  }

  async create(department: Partial<Department>): Promise<Department> {
    const newDepartment = this.repository.create(department);
    return this.repository.save(newDepartment);
  }

  async update(id: string, department: Partial<Department>): Promise<Department | null> {
    await this.repository.update(id, department);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  async existsByName(name: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { name },
    });
    return count > 0;
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id },
    });
    return count > 0;
  }
}
