import { AppError } from './AppError';

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details?: unknown) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, details);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
