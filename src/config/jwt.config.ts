interface JwtConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
  bcryptRounds: number;
}

class JwtConfigService {
  private readonly config: JwtConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): JwtConfig {
    return {
      secret: process.env.JWT_SECRET || '',
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      issuer: process.env.JWT_ISSUER || 'hr-admin-api',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    };
  }

  private validateConfig(): void {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be set and at least 32 characters long');
    }

    if (isNaN(this.config.bcryptRounds) || this.config.bcryptRounds < 10) {
      throw new Error('BCRYPT_ROUNDS must be a number >= 10');
    }

    // Validate JWT expiry format (basic check)
    const expiryRegex = /^(\d+[smhd])$/;
    if (!expiryRegex.test(this.config.expiresIn)) {
      throw new Error(
        'JWT_EXPIRES_IN must be in format: 1s, 1m, 1h, 1d (seconds, minutes, hours, days)'
      );
    }
  }

  public get(): JwtConfig {
    return { ...this.config };
  }
}

export const jwtConfig = new JwtConfigService();
export type { JwtConfig };
