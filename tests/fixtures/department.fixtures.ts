import { Department } from '../../src/entities/Department.entity';

export const mockDepartmentData = {
  name: 'Test Department',
  description: 'Test department description',
};

export const createMockDepartment = (overrides?: Partial<Department>): Department => {
  const department = new Department();
  department.id = overrides?.id || '123e4567-e89b-12d3-a456-426614174000';
  department.name = overrides?.name || mockDepartmentData.name;
  department.description = overrides?.description || mockDepartmentData.description;
  department.createdAt = overrides?.createdAt || new Date();
  department.updatedAt = overrides?.updatedAt || new Date();
  return department;
};

export const mockDepartments = [
  createMockDepartment({
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Engineering',
    description: 'Software development team',
  }),
  createMockDepartment({
    id: '123e4567-e89b-12d3-a456-426614174002',
    name: 'Sales',
    description: 'Sales operations team',
  }),
  createMockDepartment({
    id: '123e4567-e89b-12d3-a456-426614174003',
    name: 'Marketing',
    description: 'Marketing team',
  }),
];
