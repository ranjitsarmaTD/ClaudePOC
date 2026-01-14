import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IEmployeeService } from '../services/interfaces/IEmployeeService';
import { CreateEmployeeDto } from '../dtos/employee/create-employee.dto';
import { UpdateEmployeeDto } from '../dtos/employee/update-employee.dto';
import { EmployeeResponseDto } from '../dtos/employee/employee-response.dto';
import { ApiResponse } from '../types/common.types';

@injectable()
export class EmployeeController {
  constructor(
    @inject('IEmployeeService')
    private readonly employeeService: IEmployeeService
  ) {}

  public getAllEmployees = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const employees = await this.employeeService.getAllEmployees();
      const response: ApiResponse<EmployeeResponseDto[]> = {
        success: true,
        data: EmployeeResponseDto.fromEntities(employees),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  public getEmployeeById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const employee = await this.employeeService.getEmployeeById(id);
      const response: ApiResponse<EmployeeResponseDto> = {
        success: true,
        data: EmployeeResponseDto.fromEntity(employee),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  public getEmployeesByDepartment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { departmentId } = req.params;
      const employees = await this.employeeService.getEmployeesByDepartmentId(departmentId);
      const response: ApiResponse<EmployeeResponseDto[]> = {
        success: true,
        data: EmployeeResponseDto.fromEntities(employees),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  public createEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dto = req.body as CreateEmployeeDto;
      const employee = await this.employeeService.createEmployee(dto);
      const response: ApiResponse<EmployeeResponseDto> = {
        success: true,
        data: EmployeeResponseDto.fromEntity(employee),
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  public updateEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const dto = req.body as UpdateEmployeeDto;
      const employee = await this.employeeService.updateEmployee(id, dto);
      const response: ApiResponse<EmployeeResponseDto> = {
        success: true,
        data: EmployeeResponseDto.fromEntity(employee),
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  public deleteEmployee = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.employeeService.deleteEmployee(id);
      const response: ApiResponse<null> = {
        success: true,
      };
      res.status(204).json(response);
    } catch (error) {
      next(error);
    }
  };
}
