# System Architecture

## Overview

The HR Admin System follows a layered architecture pattern with clear separation of concerns, implementing SOLID principles and dependency injection for maintainability and testability.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│              (Web App, Mobile App, API Consumers)           │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
│              (Express.js, Middleware, CORS)                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  │
│  │   Security    │  │  Rate Limit   │  │  Validation   │  │
│  │  Middleware   │  │  Middleware   │  │  Middleware   │  │
│  └───────────────┘  └───────────────┘  └───────────────┘  │
│                                                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Controller Layer                          │
│              (Request/Response Handling)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth       │  │  Department  │  │   Employee   │     │
│  │ Controller   │  │  Controller  │  │  Controller  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│                 (Business Logic)                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Auth       │  │  Department  │  │   Employee   │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Repository Layer                           │
│              (Data Access Abstraction)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   User       │  │  Department  │  │   Employee   │     │
│  │ Repository   │  │  Repository  │  │  Repository  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      ORM Layer                               │
│                     (TypeORM)                                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                             │
│                   (PostgreSQL)                               │
└─────────────────────────────────────────────────────────────┘
```

## Layered Architecture

### 1. Controller Layer
**Responsibility**: Handle HTTP requests and responses

**Characteristics**:
- Minimal business logic
- Request validation
- Response formatting
- Error handling delegation
- HTTP-specific concerns

**Example**:
```typescript
@injectable()
export class DepartmentController {
  constructor(
    private readonly departmentService: IDepartmentService
  ) {}

  public async getAllDepartments(req: Request, res: Response) {
    const departments = await this.departmentService.getAllDepartments();
    res.json({ success: true, data: departments });
  }
}
```

### 2. Service Layer
**Responsibility**: Implement business logic

**Characteristics**:
- Framework-agnostic
- Pure business logic
- Transaction management
- Complex validations
- Cross-cutting concerns

**Example**:
```typescript
@injectable()
export class DepartmentService implements IDepartmentService {
  constructor(
    @inject('IDepartmentRepository')
    private readonly departmentRepository: IDepartmentRepository
  ) {}

  public async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    // Business rule: Check for duplicate names
    const existing = await this.departmentRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictError('Department already exists');
    }
    return await this.departmentRepository.create(dto);
  }
}
```

### 3. Repository Layer
**Responsibility**: Data access abstraction

**Characteristics**:
- Database operations
- Query building
- Data mapping
- Transaction support
- Interface-based design

**Example**:
```typescript
@injectable()
export class DepartmentRepository implements IDepartmentRepository {
  private repository: Repository<Department>;

  public async findById(id: string): Promise<Department | null> {
    return await this.repository.findOne({ where: { id } });
  }

  public async create(data: CreateDepartmentDto): Promise<Department> {
    const department = this.repository.create(data);
    return await this.repository.save(department);
  }
}
```

## Design Patterns

### 1. Dependency Injection
Using `tsyringe` for IoC (Inversion of Control):

```typescript
// Register dependencies
container.register<IDepartmentRepository>(
  'IDepartmentRepository',
  { useClass: DepartmentRepository }
);

// Inject dependencies
constructor(
  @inject('IDepartmentRepository')
  private readonly departmentRepository: IDepartmentRepository
) {}
```

**Benefits**:
- Loose coupling
- Easy testing (mock injection)
- Flexibility in implementation
- Separation of concerns

### 2. Repository Pattern
Abstracting data access logic:

```typescript
interface IDepartmentRepository {
  findAll(): Promise<Department[]>;
  findById(id: string): Promise<Department | null>;
  create(data: CreateDepartmentDto): Promise<Department>;
  update(id: string, data: UpdateDepartmentDto): Promise<Department>;
  delete(id: string): Promise<boolean>;
}
```

**Benefits**:
- Database-agnostic business logic
- Easy to test with mocks
- Centralized data access logic
- Flexible implementation switching

### 3. DTO (Data Transfer Object) Pattern
Validating and transforming data:

```typescript
export class CreateDepartmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
```

**Benefits**:
- Input validation
- Type safety
- Data transformation
- Clear API contracts

### 4. Service Layer Pattern
Encapsulating business logic:

```typescript
export class DepartmentService {
  public async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    // Validation
    if (!dto.name) throw new ValidationError('Name required');

    // Business rule
    const exists = await this.departmentRepository.findByName(dto.name);
    if (exists) throw new ConflictError('Already exists');

    // Create
    return await this.departmentRepository.create(dto);
  }
}
```

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
Each class has one reason to change:
- **Controllers**: Handle HTTP requests/responses only
- **Services**: Implement business logic only
- **Repositories**: Handle data access only

### Open/Closed Principle (OCP)
Open for extension, closed for modification:
```typescript
// Base interface
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
}

// Extend without modifying
interface IDepartmentRepository extends IRepository<Department> {
  findByName(name: string): Promise<Department | null>;
}
```

### Liskov Substitution Principle (LSP)
Implementations can be substituted:
```typescript
// Can use any implementation
const repo: IDepartmentRepository = new DepartmentRepository();
// Or: const repo: IDepartmentRepository = new InMemoryDepartmentRepository();
```

### Interface Segregation Principle (ISP)
Small, focused interfaces:
```typescript
// Separate interfaces for different concerns
interface IReadRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
}

interface IWriteRepository<T> {
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
}
```

### Dependency Inversion Principle (DIP)
Depend on abstractions, not concretions:
```typescript
// Depend on interface, not concrete class
constructor(
  @inject('IDepartmentRepository')  // Interface
  private readonly repo: IDepartmentRepository
) {}
```

## Data Flow

### Request Flow
```
1. Client → HTTP Request
2. Express Middleware (CORS, Rate Limit, etc.)
3. Authentication Middleware (JWT validation)
4. Validation Middleware (DTO validation)
5. Controller (Parse request, call service)
6. Service (Business logic, validation)
7. Repository (Database operations)
8. Database (Execute query)
9. Repository → Service → Controller
10. Response Formatting
11. HTTP Response → Client
```

### Error Flow
```
1. Error occurs in any layer
2. Throw custom error (NotFoundError, ValidationError, etc.)
3. Error bubbles up through layers
4. Global error middleware catches error
5. Format error response
6. Send HTTP error response
```

## Security Architecture

### Authentication Flow
```
1. User sends credentials (POST /auth/login)
2. Validate credentials against database
3. Generate JWT token
4. Return token to client
5. Client includes token in subsequent requests
6. Server validates token on each request
```

### Authorization
```
1. Extract user from JWT token
2. Check user role/permissions
3. Allow or deny access to resource
```

### Security Layers
- **Transport Security**: HTTPS
- **Authentication**: JWT Bearer tokens
- **Authorization**: Role-based access control
- **Input Validation**: DTO validation with class-validator
- **SQL Injection Prevention**: TypeORM parameterized queries
- **XSS Prevention**: Response sanitization
- **CSRF Prevention**: SameSite cookies, CORS configuration
- **Rate Limiting**: Express rate-limit middleware

## Scalability Considerations

### Horizontal Scaling
- **Stateless API**: No server-side session storage
- **JWT Tokens**: Self-contained authentication
- **Load Balancer**: Distribute requests across instances

### Vertical Scaling
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for frequently accessed data
- **Query Optimization**: Indexed database queries

### Database Scaling
- **Read Replicas**: Distribute read operations
- **Write Master**: Single source for writes
- **Connection Pooling**: Manage database connections
- **Query Optimization**: Efficient queries and indexes

## Technology Stack

- **Runtime**: Node.js v18+
- **Language**: TypeScript 5.3+
- **Framework**: Express.js
- **ORM**: TypeORM
- **Database**: PostgreSQL 14+
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: class-validator
- **Dependency Injection**: tsyringe
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI, TypeDoc

## Related Documentation

- [Database Schema](./DATABASE.md)
- [API Design](../api/API_DESIGN.md)
- [Security Guide](../guides/SECURITY.md)

---

**Last Updated**: 2026-01-29
