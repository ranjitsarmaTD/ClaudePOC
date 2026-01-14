import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
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
    const options: SignOptions = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
      expiresIn: this.expiresIn as any,
      issuer: this.issuer,
    };
    return jwt.sign(payload, this.secret, options);
  }

  public verifyToken(token: string): JwtPayload {
    try {
      const options: VerifyOptions = {
        issuer: this.issuer,
      };
      const decoded = jwt.verify(token, this.secret, options) as JwtPayload;
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
