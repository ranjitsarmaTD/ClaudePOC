import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// Configuration
import { appConfig } from './config';

// Middleware
import { errorMiddleware } from './middlewares/error.middleware';
import { loggingMiddleware } from './middlewares/logging.middleware';

// Routes
import routes from './routes';

// Utils
import { logger } from './utils/logger';
import { NotFoundError } from './utils/errors';

// Dependency Injection
import { setupDependencyInjection } from './container/dependency-injection';

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.setupDependencyInjection();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupDependencyInjection(): void {
    setupDependencyInjection();
    logger.info('Dependency injection container initialized');
  }

  private setupMiddlewares(): void {
    const config = appConfig.get();

    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    this.app.use(
      cors({
        origin: config.corsOrigin,
        credentials: config.corsCredentials,
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimitWindowMs,
      max: config.rateLimitMaxRequests,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Request logging
    if (!appConfig.isTest()) {
      this.app.use(loggingMiddleware);
    }

    logger.info('Middlewares initialized');
  }

  private setupRoutes(): void {
    const config = appConfig.get();

    // Mount API routes
    this.app.use(config.apiPrefix, routes);

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        success: true,
        data: {
          name: 'HR Admin API',
          version: '1.0.0',
          description: 'HR Administration System Backend API',
          documentation: `${config.apiPrefix}/docs`,
        },
      });
    });

    // 404 handler
    this.app.use((_req: Request, _res: Response, next: NextFunction) => {
      next(new NotFoundError('Route not found'));
    });

    logger.info('Routes initialized');
  }

  private setupErrorHandling(): void {
    // Global error handler (must be last)
    this.app.use(errorMiddleware);

    logger.info('Error handling initialized');
  }

  public getExpressApp(): Application {
    return this.app;
  }
}
