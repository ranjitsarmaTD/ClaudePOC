# HR Admin System - Backend Architecture

A robust, scalable backend system for HR Administration built with TypeScript, Node.js, and Express following SOLID principles and layered architecture.

## Table of Contents

- [Overview](#overview)
- [High-Level Architecture](#high-level-architecture)
- [Project Structure](#project-structure)
- [Core Entities](#core-entities)
- [Key Design Decisions](#key-design-decisions)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)

---

## Overview

### Core Features

- **Employee Management**: Complete CRUD operations for employee records
- **Department Management**: Complete CRUD operations for departments
- **Employee ↔ Department Association**: Manage relationships between employees and departments
- **JWT Authentication**: Secure admin-only access using JWT tokens

### Architectural Principles

- **SOLID Principles**: Every layer and component follows SOLID design principles
- **Layered Architecture**: Clear separation of concerns across Controller, Service, and Repository layers
- **Dependency Injection**: Constructor-based DI for loose coupling and testability
- **Interface-Driven Design**: All dependencies abstracted behind interfaces
- **Configuration Management**: Zero hardcoded values, environment-based configuration

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth         │  │ Validation   │  │ Error        │      │
│  │ Middleware   │  │ Middleware   │  │ Handler      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Controller Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Employee     │  │ Department   │  │ Auth         │      │
│  │ Controller   │  │ Controller   │  │ Controller   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         (Routes, Request/Response handling)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Employee     │  │ Department   │  │ Auth         │      │
│  │ Service      │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         (Business logic, orchestration)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Repository Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Employee     │  │ Department   │  │ User         │      │
│  │ Repository   │  │ Repository   │  │ Repository   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         (Data access abstraction)                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     ORM Layer                                │
│                     (TypeORM)                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                         │
└─────────────────────────────────────────────────────────────┘
```

### Cross-Cutting Concerns

- **Logger**: Winston/Pino for structured logging
- **Config Manager**: Environment-based configuration with validation
- **Dependency Injection**: Container-managed dependencies
- **Error Handling**: Custom error classes with global handler
- **DTOs & Validation**: class-validator for request validation

---

## Project Structure

```
hr-admin-backend/
├── src/
│   ├── config/                      # Configuration management
│   │   ├── database.config.ts       # DB connection configuration
│   │   ├── jwt.config.ts            # JWT configuration
│   │   ├── app.config.ts            # App-level configuration
│   │   └── index.ts                 # Config aggregator
│   │
│   ├── entities/                    # TypeORM entities
│   │   ├── Employee.entity.ts       # Employee ORM entity
│   │   ├── Department.entity.ts     # Department ORM entity
│   │   └── User.entity.ts           # User ORM entity (auth)
│   │
│   ├── dtos/                        # Data Transfer Objects
│   │   ├── employee/
│   │   │   ├── create-employee.dto.ts
│   │   │   ├── update-employee.dto.ts
│   │   │   └── employee-response.dto.ts
│   │   ├── department/
│   │   │   ├── create-department.dto.ts
│   │   │   ├── update-department.dto.ts
│   │   │   └── department-response.dto.ts
│   │   └── auth/
│   │       ├── login.dto.ts
│   │       └── auth-response.dto.ts
│   │
│   ├── repositories/                # Data access layer
│   │   ├── interfaces/
│   │   │   ├── IEmployeeRepository.ts
│   │   │   ├── IDepartmentRepository.ts
│   │   │   └── IUserRepository.ts
│   │   ├── EmployeeRepository.ts
│   │   ├── DepartmentRepository.ts
│   │   └── UserRepository.ts
│   │
│   ├── services/                    # Business logic layer
│   │   ├── interfaces/
│   │   │   ├── IEmployeeService.ts
│   │   │   ├── IDepartmentService.ts
│   │   │   └── IAuthService.ts
│   │   ├── EmployeeService.ts
│   │   ├── DepartmentService.ts
│   │   └── AuthService.ts
│   │
│   ├── controllers/                 # HTTP request handlers
│   │   ├── EmployeeController.ts
│   │   ├── DepartmentController.ts
│   │   └── AuthController.ts
│   │
│   ├── middlewares/                 # Express middlewares
│   │   ├── auth.middleware.ts       # JWT validation
│   │   ├── validation.middleware.ts # DTO validation
│   │   ├── error.middleware.ts      # Global error handler
│   │   └── logging.middleware.ts    # Request logging
│   │
│   ├── routes/                      # Route definitions
│   │   ├── employee.routes.ts
│   │   ├── department.routes.ts
│   │   ├── auth.routes.ts
│   │   └── index.ts                 # Route aggregator
│   │
│   ├── utils/                       # Utility functions
│   │   ├── errors/                  # Custom error classes
│   │   │   ├── AppError.ts          # Base error class
│   │   │   ├── NotFoundError.ts
│   │   │   ├── ValidationError.ts
│   │   │   ├── UnauthorizedError.ts
│   │   │   └── index.ts
│   │   ├── logger.ts                # Logger utility
│   │   └── jwt.util.ts              # JWT helper functions
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── express.d.ts             # Express type extensions
│   │   └── common.types.ts          # Shared types
│   │
│   ├── database/                    # Database management
│   │   ├── migrations/              # Database migrations
│   │   ├── seeds/                   # Seed data
│   │   └── connection.ts            # DB connection manager
│   │
│   ├── container/                   # Dependency injection
│   │   └── dependency-injection.ts  # DI container setup
│   │
│   ├── app.ts                       # Express app setup
│   └── server.ts                    # Server entry point
│
├── tests/                           # Test suites
│   ├── unit/
│   │   ├── services/
│   │   │   ├── EmployeeService.test.ts
│   │   │   ├── DepartmentService.test.ts
│   │   │   └── AuthService.test.ts
│   │   ├── repositories/
│   │   └── utils/
│   ├── integration/
│   │   ├── employee.test.ts
│   │   ├── department.test.ts
│   │   └── auth.test.ts
│   └── fixtures/
│       └── test-data.ts
│
├── .env.example                     # Environment variables template
├── .env.development
├── .env.test
├── .env.production
├── .gitignore
├── tsconfig.json
├── package.json
├── jest.config.js
└── README.md
```

---

## Core Entities

### Entity Relationship Diagram

```
┌─────────────────────────┐
│        User             │
├─────────────────────────┤
│ id: UUID (PK)           │
│ email: string (unique)  │
│ password: string (hash) │
│ role: enum (ADMIN)      │
│ createdAt: timestamp    │
│ updatedAt: timestamp    │
└─────────────────────────┘


┌─────────────────────────┐         ┌─────────────────────────┐
│      Department         │         │       Employee          │
├─────────────────────────┤         ├─────────────────────────┤
│ id: UUID (PK)           │◄───────┐│ id: UUID (PK)           │
│ name: string (unique)   │        ││ firstName: string       │
│ description: string?    │        ││ lastName: string        │
│ createdAt: timestamp    │        ││ email: string (unique)  │
│ updatedAt: timestamp    │        ││ phone: string?          │
│ deletedAt: timestamp?   │        ││ position: string        │
└─────────────────────────┘        ││ salary: decimal         │
                                    ││ hireDate: date          │
         1                          ││ departmentId: UUID (FK) │
         │                          ││ status: enum (ACTIVE,   │
         │                          ││         INACTIVE)       │
         │                          ││ createdAt: timestamp    │
         │                          ││ updatedAt: timestamp    │
         │                          ││ deletedAt: timestamp?   │
         │                          │└─────────────────────────┘
         │                          │
         └──────────────────────────┘
                   N
```

### Relationships

- **One-to-Many**: Department → Employee
  - One Department can have many Employees
  - One Employee belongs to one Department
  - Foreign Key: `Employee.departmentId` → `Department.id`
  - ON DELETE: SET NULL (maintains data integrity)
  - ON UPDATE: CASCADE

### Database Constraints

**Unique Constraints:**
- `User.email`
- `Department.name`
- `Employee.email`

**Foreign Keys:**
- `Employee.departmentId` → `Department.id`

**Indexes:**
- User: email (unique index)
- Department: name (unique index)
- Employee: email (unique index), departmentId (foreign key index)

**Check Constraints:**
- `Employee.salary >= 0`
- Email format validation (database level)

---

## Key Design Decisions

### 1. ORM Selection: TypeORM

**Chosen:** TypeORM

**Rationale:**
- Native TypeScript support with decorators
- Active Record and Data Mapper patterns support
- Built-in migration system
- Powerful query builder for complex queries
- Excellent PostgreSQL support
- Mature and well-documented ecosystem

**Alternative Considered:** Prisma (simpler DX, but less flexible for complex queries)

### 2. Layered Architecture Pattern

#### Controller Layer
- **Responsibility**: HTTP request/response handling, routing
- **SOLID Principles Applied**:
  - Single Responsibility: Only handles HTTP concerns
  - Dependency Inversion: Depends on service interfaces
- **Testing**: Integration tests with mocked services

#### Service Layer
- **Responsibility**: Business logic, orchestration, transaction management
- **SOLID Principles Applied**:
  - Single Responsibility: One service per domain entity
  - Open/Closed: Extensible without modification
  - Dependency Inversion: Depends on repository interfaces
- **Testing**: Unit tests with mocked repositories

#### Repository Layer
- **Responsibility**: Data access abstraction, ORM interactions
- **SOLID Principles Applied**:
  - Interface Segregation: Specific interfaces per repository
  - Dependency Inversion: Implementation hidden behind interfaces
- **Testing**: Integration tests with test database

### 3. Dependency Injection

**Implementation**: Constructor-based DI with **tsyringe** or **InversifyJS**

**Benefits:**
- All dependencies injected via constructors
- Enables easy mocking for unit tests
- Supports SOLID principles (especially Dependency Inversion)
- Centralized dependency management
- Improved code maintainability

**Dependency Flow:**
```
Container → Controller(Service) → Service(Repository) → Repository(ORM)
```

### 4. Authentication Strategy

**JWT-based Authentication**

**Token Structure:**
```typescript
{
  userId: string,
  email: string,
  role: string,
  exp: number,  // Expiration
  iat: number   // Issued at
}
```

**Security Measures:**
- Passwords hashed with bcrypt (12 rounds)
- JWT secret loaded from environment variables
- Access token expiry: 1 hour (configurable)
- HTTPS enforcement in production
- Rate limiting on authentication endpoints
- Admin-only access validation via middleware

### 5. Validation Strategy

**class-validator + DTOs**

**Features:**
- Validation at the API boundary (fail-fast)
- Strongly-typed DTOs for all requests/responses
- Decorator-based validation rules
- Custom validators for business rules
- Middleware applies validation before reaching controllers

### 6. Error Handling

**Centralized Error Handling**

**Error Response Format:**
```typescript
{
  success: false,
  error: {
    code: "EMPLOYEE_NOT_FOUND",
    message: "Employee with id xyz not found",
    details?: any  // Optional, only in development
  }
}
```

**Features:**
- Custom error classes extending base `AppError`
- Global error middleware catches all errors
- Consistent error response format
- Environment-aware (stack traces only in development)
- Proper HTTP status codes mapping

**Error Types:**
- `NotFoundError` (404)
- `ValidationError` (400)
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `ConflictError` (409)
- `InternalServerError` (500)

### 7. Configuration Management

**Environment-based Configuration**

**Strategy:**
- `.env` files for different environments (dev, test, prod)
- Configuration validation on application startup (fail-fast)
- Type-safe configuration objects
- Zero hardcoded values in source code
- Sensitive data never committed to version control

**Configuration Categories:**
- **Database**: host, port, name, credentials
- **JWT**: secret, expiry, issuer
- **Server**: port, environment, CORS settings
- **Logging**: level, format, output

### 8. Soft Delete Strategy

**Implementation:**
- `deletedAt` timestamp column on relevant entities
- Entities with `deletedAt !== null` are considered deleted
- Global query filter excludes soft-deleted records by default
- Option to include deleted records for admin views
- Maintains referential integrity
- Preserves audit trail

**Benefits:**
- Data recovery capability
- Historical data preservation
- Compliance with data retention policies
- Safe deletion without cascade issues

### 9. Testing Strategy

#### Unit Tests
- Services tested with mocked repositories
- Utilities tested in isolation
- **Target**: 80%+ code coverage
- **Tools**: Jest, ts-jest

#### Integration Tests
- API endpoints tested with test database
- Database operations with real PostgreSQL (Docker)
- Authentication flows tested end-to-end
- Transaction rollback between tests
- **Tools**: Jest, Supertest, Docker

### 10. API Response Format

**Success Response:**
```typescript
{
  success: true,
  data: T,
  meta?: {
    page?: number,
    limit?: number,
    total?: number
  }
}
```

**Error Response:**
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### 11. SOLID Principles Application

#### Single Responsibility Principle (SRP)
- Each class has exactly one reason to change
- Controllers: HTTP handling only
- Services: Business logic only
- Repositories: Data access only

#### Open/Closed Principle (OCP)
- Classes open for extension, closed for modification
- New features added via interfaces and inheritance
- Strategy pattern for extensible behaviors

#### Liskov Substitution Principle (LSP)
- Interface implementations fully substitutable
- Mock implementations for testing
- No behavioral surprises in derived classes

#### Interface Segregation Principle (ISP)
- Small, focused interfaces
- Clients not forced to depend on unused methods
- Separate interfaces for different concerns

#### Dependency Inversion Principle (DIP)
- High-level modules depend on abstractions
- Repositories and services behind interfaces
- Concrete implementations injected at runtime

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js (v18+)
- **Language**: TypeScript (v5+)
- **Framework**: Express.js
- **Database**: PostgreSQL (v14+)
- **ORM**: TypeORM

### Key Libraries
- **Authentication**: jsonwebtoken, bcrypt
- **Validation**: class-validator, class-transformer
- **Dependency Injection**: tsyringe / InversifyJS
- **Logging**: winston / pino
- **Testing**: Jest, Supertest
- **Development**: ts-node, nodemon
- **Linting**: ESLint, Prettier

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- PostgreSQL v14 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hr-admin-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.development

# Configure your database and JWT secret in .env.development

# Run migrations
npm run migration:run

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hr_admin_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRY=1h

# Logging
LOG_LEVEL=debug
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run all tests
npm run test:unit    # Run unit tests
npm run test:int     # Run integration tests
npm run lint         # Lint code
npm run format       # Format code with Prettier
npm run migration:generate  # Generate migration
npm run migration:run       # Run migrations
npm run migration:revert    # Revert last migration
```

---

## API Documentation

### Authentication

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "secure_password"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "ADMIN"
    }
  }
}
```

### Employees

#### Get All Employees
```http
GET /api/v1/employees
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

#### Get Employee by ID
```http
GET /api/v1/employees/:id
Authorization: Bearer <token>
```

#### Create Employee
```http
POST /api/v1/employees
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "position": "Software Engineer",
  "salary": 75000,
  "hireDate": "2024-01-15",
  "departmentId": "uuid",
  "status": "ACTIVE"
}
```

#### Update Employee
```http
PUT /api/v1/employees/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### Delete Employee
```http
DELETE /api/v1/employees/:id
Authorization: Bearer <token>
```

### Departments

#### Get All Departments
```http
GET /api/v1/departments
Authorization: Bearer <token>
```

#### Get Department by ID
```http
GET /api/v1/departments/:id
Authorization: Bearer <token>
```

#### Create Department
```http
POST /api/v1/departments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Engineering",
  "description": "Software development department"
}
```

#### Update Department
```http
PUT /api/v1/departments/:id
Authorization: Bearer <token>
```

#### Delete Department
```http
DELETE /api/v1/departments/:id
Authorization: Bearer <token>
```

---

## Development Roadmap

### Phase 1: Foundation ✓
- [x] Architecture design
- [ ] Project setup and dependencies
- [ ] Database entities and migrations
- [ ] Basic repository layer

### Phase 2: Core Implementation
- [ ] Service layer with business logic
- [ ] Controller layer with API endpoints
- [ ] JWT authentication
- [ ] Validation middleware

### Phase 3: Testing & Quality
- [ ] Unit tests for services
- [ ] Integration tests for APIs
- [ ] Error handling
- [ ] Logging implementation

### Phase 4: Documentation & Deployment
- [ ] API documentation
- [ ] Deployment configuration
- [ ] CI/CD pipeline
- [ ] Production hardening

---

## Contributing

1. Follow the established layered architecture
2. Write tests for all new features
3. Adhere to SOLID principles
4. Use TypeScript strict mode
5. Follow the existing code style (ESLint/Prettier)
6. Update documentation for significant changes

---

## License

[Your License Here]

---

## Contact

[Your Contact Information]

---

**Built with TypeScript, Express, and PostgreSQL following SOLID principles and clean architecture.**
