import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IAuthService } from '../services/interfaces/IAuthService';
import { LoginDto } from '../dtos/auth/login.dto';
import { AuthResponseDto } from '../dtos/auth/auth-response.dto';
import { ApiResponse } from '../types/common.types';

@injectable()
export class AuthController {
  constructor(
    @inject('IAuthService')
    private readonly authService: IAuthService
  ) {}

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = req.body as LoginDto;
      const { token, user } = await this.authService.login(dto);
      const response: ApiResponse<AuthResponseDto> = {
        success: true,
        data: new AuthResponseDto(token, user),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
