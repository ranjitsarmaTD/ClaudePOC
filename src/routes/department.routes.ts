import { Router } from 'express';
import { container } from 'tsyringe';
import { DepartmentController } from '../controllers/DepartmentController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { validateDto } from '../middlewares/validation.middleware';
import { CreateDepartmentDto } from '../dtos/department/create-department.dto';
import { UpdateDepartmentDto } from '../dtos/department/update-department.dto';

const router = Router();
const departmentController = container.resolve(DepartmentController);
const authMiddleware = container.resolve(AuthMiddleware);

// All routes require authentication
router.use(authMiddleware.authenticate);

/**
 * @route   GET /api/v1/departments
 * @desc    Get all departments
 * @access  Private (Admin)
 */
router.get('/', departmentController.getAllDepartments);

/**
 * @route   GET /api/v1/departments/:id
 * @desc    Get department by ID
 * @access  Private (Admin)
 */
router.get('/:id', departmentController.getDepartmentById);

/**
 * @route   POST /api/v1/departments
 * @desc    Create new department
 * @access  Private (Admin)
 */
router.post(
  '/',
  validateDto(CreateDepartmentDto, 'body'),
  departmentController.createDepartment
);

/**
 * @route   PUT /api/v1/departments/:id
 * @desc    Update department
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  validateDto(UpdateDepartmentDto, 'body'),
  departmentController.updateDepartment
);

/**
 * @route   DELETE /api/v1/departments/:id
 * @desc    Delete department
 * @access  Private (Admin)
 */
router.delete('/:id', departmentController.deleteDepartment);

export default router;
