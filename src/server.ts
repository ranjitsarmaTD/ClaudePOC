import 'reflect-metadata';
import { App } from './app';
import { appConfig } from './config';
import { logger } from './utils/logger';
import { initializeDatabase, closeDatabase } from './database/connection';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection', {
    reason,
  });
  process.exit(1);
});

async function bootstrap(): Promise<void> {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Initialize Express application
    const appInstance = new App();
    const app = appInstance.getExpressApp();

    const config = appConfig.get();

    // Start server
    const server = app.listen(config.port, () => {
      logger.info(`Server started successfully`, {
        environment: config.nodeEnv,
        port: config.port,
        apiPrefix: config.apiPrefix,
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} signal received: closing HTTP server`);

      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close database connection
      await closeDatabase();

      process.exit(0);
    };

    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Start the server
void bootstrap();
