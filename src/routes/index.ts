import { Router } from 'express';

const router = Router();

/**
 * API Routes
 *
 * Register all route modules here.
 * Example:
 *   router.use('/auth', authRoutes);
 *   router.use('/employees', employeeRoutes);
 *   router.use('/departments', departmentRoutes);
 */

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

export default router;
