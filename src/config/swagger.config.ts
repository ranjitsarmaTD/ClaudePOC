import swaggerJsdoc from 'swagger-jsdoc';
import { appConfig } from './app.config';

const config = appConfig.get();

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HR Admin System API',
      version: '1.0.0',
      description:
        'A comprehensive HR Administration System API built with TypeScript, Express, and PostgreSQL following SOLID principles and layered architecture.',
      contact: {
        name: 'API Support',
        email: 'support@hradmin.com',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.apiPrefix}`,
        description: 'Development server',
      },
      {
        url: `https://api.hradmin.com${config.apiPrefix}`,
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login endpoint',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'NOT_FOUND',
                },
                message: {
                  type: 'string',
                  example: 'Resource not found',
                },
                details: {
                  type: 'object',
                },
              },
            },
          },
        },
        Department: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              maxLength: 100,
              example: 'Engineering',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Software development team',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateDepartmentDto: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              maxLength: 100,
              example: 'Engineering',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Software development team',
            },
          },
        },
        UpdateDepartmentDto: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              maxLength: 100,
              example: 'Software Engineering',
            },
            description: {
              type: 'string',
              nullable: true,
              example: 'Updated description',
            },
          },
        },
        Employee: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            firstName: {
              type: 'string',
              maxLength: 50,
              example: 'John',
            },
            lastName: {
              type: 'string',
              maxLength: 50,
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@company.com',
            },
            phone: {
              type: 'string',
              nullable: true,
              example: '+1-555-0100',
            },
            position: {
              type: 'string',
              example: 'Software Engineer',
            },
            salary: {
              type: 'number',
              format: 'decimal',
              example: 100000,
            },
            hireDate: {
              type: 'string',
              format: 'date',
              example: '2023-01-15',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE'],
              example: 'ACTIVE',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            department: {
              $ref: '#/components/schemas/Department',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateEmployeeDto: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'position', 'salary', 'hireDate'],
          properties: {
            firstName: {
              type: 'string',
              maxLength: 50,
              example: 'John',
            },
            lastName: {
              type: 'string',
              maxLength: 50,
              example: 'Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@company.com',
            },
            phone: {
              type: 'string',
              maxLength: 20,
              nullable: true,
              example: '+1-555-0100',
            },
            position: {
              type: 'string',
              maxLength: 100,
              example: 'Software Engineer',
            },
            salary: {
              type: 'string',
              example: '100000',
            },
            hireDate: {
              type: 'string',
              format: 'date',
              example: '2023-01-15',
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE'],
              example: 'ACTIVE',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
          },
        },
        LoginDto: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@hradmin.com',
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              example: 'Admin@123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                email: {
                  type: 'string',
                  format: 'email',
                },
                role: {
                  type: 'string',
                  enum: ['ADMIN'],
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Departments',
        description: 'Department management endpoints',
      },
      {
        name: 'Employees',
        description: 'Employee management endpoints',
      },
      {
        name: 'Health',
        description: 'Health check and system status',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
