import { Request, Response, NextFunction } from 'express';
import { JwtUtil, JwtPayload } from '../utils/jwt.util';
import { UnauthorizedError } from '../utils/errors';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export class AuthMiddleware {
  private jwtUtil: JwtUtil;

  constructor() {
    this.jwtUtil = new JwtUtil();
  }

  public authenticate = (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      const payload = this.jwtUtil.verifyToken(token);
      req.user = payload;

      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        next(error);
      } else {
        next(new UnauthorizedError('Invalid or expired token'));
      }
    }
  };

  public requireRole =
    (allowedRoles: string[]) => (req: Request, _res: Response, next: NextFunction): void => {
      if (!req.user) {
        next(new UnauthorizedError('Authentication required'));
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        next(new UnauthorizedError('Insufficient permissions'));
        return;
      }

      next();
    };
}
