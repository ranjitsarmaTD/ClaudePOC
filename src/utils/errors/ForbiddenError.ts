import { AppError } from './AppError';

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access', details?: unknown) {
    super(message, 403, 'FORBIDDEN', true, details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
