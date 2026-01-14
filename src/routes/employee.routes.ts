/* eslint-disable @typescript-eslint/no-misused-promises */
import { Router } from 'express';
import { container } from 'tsyringe';
import { EmployeeController } from '../controllers/EmployeeController';
import { AuthMiddleware } from '../middlewares/auth.middleware';
import { validateDto } from '../middlewares/validation.middleware';
import { CreateEmployeeDto } from '../dtos/employee/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/employee/update-employee.dto';

const router = Router();
const employeeController = container.resolve(EmployeeController);
const authMiddleware = container.resolve(AuthMiddleware);

// All routes require authentication
router.use(authMiddleware.authenticate);

/**
 * @route   GET /api/v1/employees
 * @desc    Get all employees
 * @access  Private (Admin)
 */
router.get('/', employeeController.getAllEmployees);

/**
 * @route   GET /api/v1/employees/:id
 * @desc    Get employee by ID
 * @access  Private (Admin)
 */
router.get('/:id', employeeController.getEmployeeById);

/**
 * @route   GET /api/v1/employees/department/:departmentId
 * @desc    Get employees by department
 * @access  Private (Admin)
 */
router.get('/department/:departmentId', employeeController.getEmployeesByDepartment);

/**
 * @route   POST /api/v1/employees
 * @desc    Create new employee
 * @access  Private (Admin)
 */
router.post('/', validateDto(CreateEmployeeDto, 'body'), employeeController.createEmployee);

/**
 * @route   PUT /api/v1/employees/:id
 * @desc    Update employee
 * @access  Private (Admin)
 */
router.put('/:id', validateDto(UpdateEmployeeDto, 'body'), employeeController.updateEmployee);

/**
 * @route   DELETE /api/v1/employees/:id
 * @desc    Delete employee
 * @access  Private (Admin)
 */
router.delete('/:id', employeeController.deleteEmployee);

export default router;
