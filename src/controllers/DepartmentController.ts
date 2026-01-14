import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IDepartmentService } from '../services/interfaces/IDepartmentService';
import { CreateDepartmentDto } from '../dtos/department/create-department.dto';
import { UpdateDepartmentDto } from '../dtos/department/update-department.dto';
import { DepartmentResponseDto } from '../dtos/department/department-response.dto';
import { ApiResponse } from '../types/common.types';

@injectable()
export class DepartmentController {
  constructor(
    @inject('IDepartmentService')
    private readonly departmentService: IDepartmentService
  ) {}

  public getAllDepartments = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const departments = await this.departmentService.getAllDepartments();
      const response: ApiResponse<DepartmentResponseDto[]> = {
        success: true,
        data: DepartmentResponseDto.fromEntities(departments),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  public getDepartmentById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const department = await this.departmentService.getDepartmentById(id);
      const response: ApiResponse<DepartmentResponseDto> = {
        success: true,
        data: DepartmentResponseDto.fromEntity(department),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  public createDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as CreateDepartmentDto;
      const department = await this.departmentService.createDepartment(dto);
      const response: ApiResponse<DepartmentResponseDto> = {
        success: true,
        data: DepartmentResponseDto.fromEntity(department),
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  public updateDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto = req.body as UpdateDepartmentDto;
      const department = await this.departmentService.updateDepartment(id, dto);
      const response: ApiResponse<DepartmentResponseDto> = {
        success: true,
        data: DepartmentResponseDto.fromEntity(department),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  public deleteDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.departmentService.deleteDepartment(id);
      const response: ApiResponse<null> = {
        success: true,
      };
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  };
}
