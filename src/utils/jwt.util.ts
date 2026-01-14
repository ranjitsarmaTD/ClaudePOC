import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export class JwtUtil {
  private readonly secret: string;
  private readonly expiresIn: string;
  private readonly issuer: string;

  constructor() {
    const config = jwtConfig.get();
    this.secret = config.secret;
    this.expiresIn = config.expiresIn;
    this.issuer = config.issuer;
  }

  public generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: this.issuer,
    });
  }

  public verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: this.issuer,
      }) as JwtPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  public decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}
