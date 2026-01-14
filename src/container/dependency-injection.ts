import 'reflect-metadata';
import { container } from 'tsyringe';

// Import utilities
import { JwtUtil } from '../utils/jwt.util';

// Import middlewares
import { AuthMiddleware } from '../middlewares/auth.middleware';

/**
 * Dependency Injection Container Setup
 *
 * This file configures the dependency injection container using tsyringe.
 * Register all services, repositories, and controllers here.
 *
 * Usage:
 * - Singleton: container.registerSingleton(Token, Implementation)
 * - Transient: container.register(Token, { useClass: Implementation })
 * - Instance: container.registerInstance(Token, instance)
 */

export function setupDependencyInjection(): void {
  // Register utilities as singletons
  container.registerSingleton(JwtUtil);

  // Register middlewares as singletons
  container.registerSingleton(AuthMiddleware);

  // TODO: Register repositories here
  // Example:
  // container.registerSingleton<IEmployeeRepository>(
  //   'IEmployeeRepository',
  //   EmployeeRepository
  // );

  // TODO: Register services here
  // Example:
  // container.registerSingleton<IEmployeeService>(
  //   'IEmployeeService',
  //   EmployeeService
  // );

  // TODO: Register controllers here
  // Example:
  // container.registerSingleton(EmployeeController);
}

export { container };
