import { Router } from 'express';
import { container } from 'tsyringe';
import { AuthController } from '../controllers/AuthController';
import { validateDto } from '../middlewares/validation.middleware';
import { LoginDto } from '../dtos/auth/login.dto';

const router = Router();
const authController = container.resolve(AuthController);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/login', validateDto(LoginDto, 'body'), authController.login);

export default router;
