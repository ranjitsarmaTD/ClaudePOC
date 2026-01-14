import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigin: string;
  corsCredentials: boolean;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

class AppConfigService {
  private readonly config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): AppConfig {
    return {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      apiPrefix: process.env.API_PREFIX || '/api/v1',
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      corsCredentials: process.env.CORS_CREDENTIALS === 'true',
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    };
  }

  private validateConfig(): void {
    const requiredVars = ['NODE_ENV', 'PORT'];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    if (isNaN(this.config.port) || this.config.port < 1 || this.config.port > 65535) {
      throw new Error('PORT must be a valid number between 1 and 65535');
    }

    if (!['development', 'test', 'production'].includes(this.config.nodeEnv)) {
      throw new Error('NODE_ENV must be one of: development, test, production');
    }
  }

  public get(): AppConfig {
    return { ...this.config };
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }
}

export const appConfig = new AppConfigService();
export type { AppConfig };
