import { DepartmentService } from '../../../src/services/DepartmentService';
import { IDepartmentRepository } from '../../../src/repositories/interfaces/IDepartmentRepository';
import { NotFoundError, ConflictError, ValidationError } from '../../../src/utils/errors';
import { createMockDepartment, mockDepartments } from '../../fixtures/department.fixtures';

describe('DepartmentService', () => {
  let departmentService: DepartmentService;
  let mockDepartmentRepository: jest.Mocked<IDepartmentRepository>;

  beforeEach(() => {
    // Create mock repository
    mockDepartmentRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByName: jest.fn(),
      existsById: jest.fn(),
    };

    // Inject mock repository
    departmentService = new DepartmentService(mockDepartmentRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDepartments', () => {
    it('should return all departments', async () => {
      mockDepartmentRepository.findAll.mockResolvedValue(mockDepartments);

      const result = await departmentService.getAllDepartments();

      expect(result).toEqual(mockDepartments);
      expect(mockDepartmentRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no departments exist', async () => {
      mockDepartmentRepository.findAll.mockResolvedValue([]);

      const result = await departmentService.getAllDepartments();

      expect(result).toEqual([]);
      expect(mockDepartmentRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDepartmentById', () => {
    it('should return department when found', async () => {
      const mockDept = createMockDepartment();
      mockDepartmentRepository.findById.mockResolvedValue(mockDept);

      const result = await departmentService.getDepartmentById(mockDept.id);

      expect(result).toEqual(mockDept);
      expect(mockDepartmentRepository.findById).toHaveBeenCalledWith(mockDept.id);
    });

    it('should throw NotFoundError when department not found', async () => {
      const id = 'non-existent-id';
      mockDepartmentRepository.findById.mockResolvedValue(null);

      await expect(departmentService.getDepartmentById(id)).rejects.toThrow(NotFoundError);
      expect(mockDepartmentRepository.findById).toHaveBeenCalledWith(id);
    });

    it('should throw ValidationError when id is empty', async () => {
      await expect(departmentService.getDepartmentById('')).rejects.toThrow(ValidationError);
      expect(mockDepartmentRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('createDepartment', () => {
    it('should create department successfully', async () => {
      const dto = { name: 'New Department', description: 'Test description' };
      const mockDept = createMockDepartment(dto);

      mockDepartmentRepository.findByName.mockResolvedValue(null);
      mockDepartmentRepository.create.mockResolvedValue(mockDept);

      const result = await departmentService.createDepartment(dto);

      expect(result).toEqual(mockDept);
      expect(mockDepartmentRepository.findByName).toHaveBeenCalledWith(dto.name);
      expect(mockDepartmentRepository.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictError when department name already exists', async () => {
      const dto = { name: 'Existing Department', description: 'Test' };
      const existingDept = createMockDepartment({ name: dto.name });

      mockDepartmentRepository.findByName.mockResolvedValue(existingDept);

      await expect(departmentService.createDepartment(dto)).rejects.toThrow(ConflictError);
      expect(mockDepartmentRepository.findByName).toHaveBeenCalledWith(dto.name);
      expect(mockDepartmentRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateDepartment', () => {
    it('should update department successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const dto = { name: 'Updated Department' };
      const existingDept = createMockDepartment({ id, name: 'Old Name' });
      const updatedDept = createMockDepartment({ id, name: dto.name });

      mockDepartmentRepository.findById.mockResolvedValue(existingDept);
      mockDepartmentRepository.findByName.mockResolvedValue(null);
      mockDepartmentRepository.update.mockResolvedValue(updatedDept);

      const result = await departmentService.updateDepartment(id, dto);

      expect(result).toEqual(updatedDept);
      expect(mockDepartmentRepository.findById).toHaveBeenCalledWith(id);
      expect(mockDepartmentRepository.update).toHaveBeenCalledWith(id, dto);
    });

    it('should throw NotFoundError when department does not exist', async () => {
      const id = 'non-existent-id';
      const dto = { name: 'Updated Department' };

      mockDepartmentRepository.findById.mockResolvedValue(null);

      await expect(departmentService.updateDepartment(id, dto)).rejects.toThrow(NotFoundError);
      expect(mockDepartmentRepository.findById).toHaveBeenCalledWith(id);
      expect(mockDepartmentRepository.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictError when new name already exists', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const dto = { name: 'Existing Name' };
      const existingDept = createMockDepartment({ id, name: 'Old Name' });
      const conflictDept = createMockDepartment({
        id: 'different-id',
        name: dto.name,
      });

      mockDepartmentRepository.findById.mockResolvedValue(existingDept);
      mockDepartmentRepository.findByName.mockResolvedValue(conflictDept);

      await expect(departmentService.updateDepartment(id, dto)).rejects.toThrow(ConflictError);
      expect(mockDepartmentRepository.update).not.toHaveBeenCalled();
    });

    it('should not check for name conflict when name is not being updated', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const dto = { description: 'Updated description' };
      const existingDept = createMockDepartment({ id });
      const updatedDept = createMockDepartment({ id, description: dto.description });

      mockDepartmentRepository.findById.mockResolvedValue(existingDept);
      mockDepartmentRepository.update.mockResolvedValue(updatedDept);

      const result = await departmentService.updateDepartment(id, dto);

      expect(result).toEqual(updatedDept);
      expect(mockDepartmentRepository.findByName).not.toHaveBeenCalled();
    });
  });

  describe('deleteDepartment', () => {
    it('should delete department successfully', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const existingDept = createMockDepartment({ id });

      mockDepartmentRepository.findById.mockResolvedValue(existingDept);
      mockDepartmentRepository.delete.mockResolvedValue(true);

      await departmentService.deleteDepartment(id);

      expect(mockDepartmentRepository.findById).toHaveBeenCalledWith(id);
      expect(mockDepartmentRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw NotFoundError when department does not exist', async () => {
      const id = 'non-existent-id';

      mockDepartmentRepository.findById.mockResolvedValue(null);

      await expect(departmentService.deleteDepartment(id)).rejects.toThrow(NotFoundError);
      expect(mockDepartmentRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError when delete operation fails', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const existingDept = createMockDepartment({ id });

      mockDepartmentRepository.findById.mockResolvedValue(existingDept);
      mockDepartmentRepository.delete.mockResolvedValue(false);

      await expect(departmentService.deleteDepartment(id)).rejects.toThrow(NotFoundError);
      expect(mockDepartmentRepository.delete).toHaveBeenCalledWith(id);
    });

    it('should throw ValidationError when id is empty', async () => {
      await expect(departmentService.deleteDepartment('')).rejects.toThrow(ValidationError);
      expect(mockDepartmentRepository.findById).not.toHaveBeenCalled();
    });
  });
});
