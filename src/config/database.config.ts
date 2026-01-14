interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  synchronize: boolean;
  logging: boolean;
  ssl: boolean;
}

class DatabaseConfigService {
  private readonly config: DatabaseConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): DatabaseConfig {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'hr_admin_db',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.DB_LOGGING === 'true',
      ssl: process.env.DB_SSL === 'true',
    };
  }

  private validateConfig(): void {
    const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];

    const missingVars = requiredVars.filter(
      (varName) => !process.env[varName] || process.env[varName] === ''
    );

    if (missingVars.length > 0) {
      throw new Error(`Missing required database environment variables: ${missingVars.join(', ')}`);
    }

    if (isNaN(this.config.port) || this.config.port < 1 || this.config.port > 65535) {
      throw new Error('DB_PORT must be a valid number between 1 and 65535');
    }

    if (this.config.synchronize && process.env.NODE_ENV === 'production') {
      throw new Error('DB_SYNCHRONIZE must be false in production to prevent data loss');
    }
  }

  public get(): DatabaseConfig {
    return { ...this.config };
  }
}

export const databaseConfig = new DatabaseConfigService();
export type { DatabaseConfig };
