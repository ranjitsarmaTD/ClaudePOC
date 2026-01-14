import { AppError } from './AppError';

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', details?: unknown) {
    super(message, 401, 'UNAUTHORIZED', true, details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
