import { Router } from 'express';
import authRoutes from './auth.routes';
import employeeRoutes from './employee.routes';
import departmentRoutes from './department.routes';

const router = Router();

/**
 * API Routes
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

// Auth routes (public)
router.use('/auth', authRoutes);

// Protected routes
router.use('/employees', employeeRoutes);
router.use('/departments', departmentRoutes);

export default router;
