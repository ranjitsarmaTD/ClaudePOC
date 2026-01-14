import 'reflect-metadata';
import { container } from 'tsyringe';

// Import utilities
import { JwtUtil } from '../utils/jwt.util';

// Import middlewares
import { AuthMiddleware } from '../middlewares/auth.middleware';

// Import repositories
import { DepartmentRepository } from '../repositories/DepartmentRepository';
import { EmployeeRepository } from '../repositories/EmployeeRepository';
import { UserRepository } from '../repositories/UserRepository';
import { IDepartmentRepository } from '../repositories/interfaces/IDepartmentRepository';
import { IEmployeeRepository } from '../repositories/interfaces/IEmployeeRepository';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';

// Import services
import { DepartmentService } from '../services/DepartmentService';
import { EmployeeService } from '../services/EmployeeService';
import { AuthService } from '../services/AuthService';
import { IDepartmentService } from '../services/interfaces/IDepartmentService';
import { IEmployeeService } from '../services/interfaces/IEmployeeService';
import { IAuthService } from '../services/interfaces/IAuthService';

// Import controllers
import { DepartmentController } from '../controllers/DepartmentController';
import { EmployeeController } from '../controllers/EmployeeController';
import { AuthController } from '../controllers/AuthController';

/**
 * Dependency Injection Container Setup
 *
 * This file configures the dependency injection container using tsyringe.
 * All dependencies are registered as singletons for optimal performance.
 */

export function setupDependencyInjection(): void {
  // Register utilities as singletons
  container.registerSingleton(JwtUtil);

  // Register middlewares as singletons
  container.registerSingleton(AuthMiddleware);

  // Register repositories as singletons
  container.registerSingleton<IDepartmentRepository>(
    'IDepartmentRepository',
    DepartmentRepository
  );
  container.registerSingleton<IEmployeeRepository>(
    'IEmployeeRepository',
    EmployeeRepository
  );
  container.registerSingleton<IUserRepository>('IUserRepository', UserRepository);

  // Register services as singletons
  container.registerSingleton<IDepartmentService>('IDepartmentService', DepartmentService);
  container.registerSingleton<IEmployeeService>('IEmployeeService', EmployeeService);
  container.registerSingleton<IAuthService>('IAuthService', AuthService);

  // Register controllers as singletons
  container.registerSingleton(DepartmentController);
  container.registerSingleton(EmployeeController);
  container.registerSingleton(AuthController);
}

export { container };
