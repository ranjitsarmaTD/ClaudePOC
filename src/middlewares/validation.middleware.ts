import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { ValidationError } from '../utils/errors';

type Constructor<T> = { new (...args: unknown[]): T };

export const validateDto =
  <T extends object>(dtoClass: Constructor<T>, source: 'body' | 'query' | 'params' = 'body') =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoInstance = plainToInstance(dtoClass, req[source]);

      const errors = await validate(dtoInstance, {
        whitelist: true,
        forbidNonWhitelisted: true,
        skipMissingProperties: false,
      });

      if (errors.length > 0) {
        const formattedErrors = formatValidationErrors(errors);
        throw new ValidationError('Validation failed', formattedErrors);
      }

      // Replace request data with transformed DTO instance
      req[source] = dtoInstance;

      next();
    } catch (error) {
      next(error);
    }
  };

function formatValidationErrors(
  errors: ClassValidatorError[]
): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  errors.forEach((error) => {
    if (error.constraints) {
      formatted[error.property] = Object.values(error.constraints);
    }

    if (error.children && error.children.length > 0) {
      const childErrors = formatValidationErrors(error.children);
      Object.keys(childErrors).forEach((key) => {
        formatted[`${error.property}.${key}`] = childErrors[key];
      });
    }
  });

  return formatted;
}
