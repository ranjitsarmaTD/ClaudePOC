# Developer Guide

Welcome to the HR Admin System development guide. This document will help you understand the development workflow, best practices, and coding standards.

## Table of Contents

- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Git Workflow](#git-workflow)
- [Code Review](#code-review)
- [Troubleshooting](#troubleshooting)

## Development Environment

### Required Tools

- **Node.js**: v18+ (use nvm for version management)
- **npm**: v9+
- **PostgreSQL**: v14+
- **Git**: v2.30+
- **IDE**: VS Code (recommended) or WebStorm

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ckolkman.vscode-postgres",
    "humao.rest-client",
    "orta.vscode-jest",
    "ms-azuretools.vscode-docker"
  ]
}
```

### Initial Setup

See [Setup Guide](../SETUP.md) for detailed installation instructions.

## Project Structure

```
hr-admin-backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # HTTP request handlers
│   ├── services/         # Business logic
│   ├── repositories/     # Data access layer
│   ├── entities/         # Database entities
│   ├── dtos/             # Data transfer objects
│   ├── middlewares/      # Express middlewares
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── database/         # Database migrations & seeds
│   ├── container/        # Dependency injection
│   ├── app.ts            # Express app setup
│   └── server.ts         # Server entry point
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── fixtures/         # Test data
│   └── helpers/          # Test utilities
├── docs/                 # Documentation
├── scripts/              # Utility scripts
└── dist/                 # Compiled JavaScript (gitignored)
```

### Key Directories

#### `src/controllers/`
HTTP request/response handling. Keep thin - delegate to services.

```typescript
// ✅ Good: Thin controller
export class DepartmentController {
  async getAllDepartments(req: Request, res: Response) {
    const departments = await this.service.getAllDepartments();
    res.json({ success: true, data: departments });
  }
}

// ❌ Bad: Business logic in controller
export class DepartmentController {
  async getAllDepartments(req: Request, res: Response) {
    const departments = await this.repository.findAll();
    const filtered = departments.filter(d => !d.deletedAt);
    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ success: true, data: sorted });
  }
}
```

#### `src/services/`
Business logic implementation. Framework-agnostic.

```typescript
// ✅ Good: Business logic in service
export class DepartmentService {
  async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    // Validation
    if (!dto.name) throw new ValidationError('Name required');

    // Business rule
    const exists = await this.repository.findByName(dto.name);
    if (exists) throw new ConflictError('Already exists');

    // Create
    return await this.repository.create(dto);
  }
}
```

#### `src/repositories/`
Data access abstraction. Always use interfaces.

```typescript
// Interface
export interface IDepartmentRepository {
  findById(id: string): Promise<Department | null>;
  create(data: CreateDepartmentDto): Promise<Department>;
}

// Implementation
@injectable()
export class DepartmentRepository implements IDepartmentRepository {
  private repository: Repository<Department>;

  async findById(id: string): Promise<Department | null> {
    return await this.repository.findOne({ where: { id } });
  }
}
```

## Development Workflow

### 1. Feature Development

```bash
# 1. Create feature branch
git checkout -b feature/add-user-management

# 2. Make changes
# ... code changes ...

# 3. Run tests
npm test

# 4. Check code quality
npm run lint
npm run format

# 5. Commit changes
git add .
git commit -m "feat: add user management module"

# 6. Push to remote
git push origin feature/add-user-management

# 7. Create pull request
```

### 2. Daily Development

```bash
# Terminal 1: Start database
docker start hr-admin-postgres

# Terminal 2: Start dev server
npm run dev

# Terminal 3: Run tests in watch mode
npm run test:watch

# Terminal 4: Git commands, scripts, etc.
```

### 3. Before Committing

```bash
# Run sanity check
npm run sanity-check

# This runs:
# - TypeScript compilation
# - ESLint
# - Prettier
# - Unit tests
# - Security audit
```

## Coding Standards

### TypeScript

#### Use Explicit Types

```typescript
// ✅ Good
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}

// ❌ Bad
function calculateTotal(price, quantity) {
  return price * quantity;
}
```

#### Use Interfaces for Contracts

```typescript
// ✅ Good
interface IUserService {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserDto): Promise<User>;
}

// ❌ Bad
class UserService {
  findById(id: any): any {
    // ...
  }
}
```

#### Use Enums for Constants

```typescript
// ✅ Good
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager'
}

// ❌ Bad
const ROLE_ADMIN = 'admin';
const ROLE_USER = 'user';
```

### Naming Conventions

```typescript
// Classes: PascalCase
export class DepartmentService { }

// Interfaces: PascalCase with 'I' prefix
export interface IDepartmentService { }

// Functions/Methods: camelCase
public async getDepartmentById() { }

// Variables/Parameters: camelCase
const departmentName = 'Engineering';

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Files: kebab-case
department-service.ts
create-department.dto.ts
```

### Error Handling

```typescript
// ✅ Good: Use custom error classes
if (!department) {
  throw new NotFoundError(`Department with id ${id} not found`);
}

// ✅ Good: Handle errors in services
try {
  return await this.repository.create(data);
} catch (error) {
  if (error.code === '23505') {  // Unique constraint
    throw new ConflictError('Department already exists');
  }
  throw error;
}

// ❌ Bad: Generic errors
throw new Error('Something went wrong');

// ❌ Bad: Swallow errors
try {
  await this.repository.create(data);
} catch (error) {
  // Silent failure
}
```

### Async/Await

```typescript
// ✅ Good: Use async/await
async function fetchDepartment(id: string): Promise<Department> {
  const department = await this.repository.findById(id);
  if (!department) {
    throw new NotFoundError('Department not found');
  }
  return department;
}

// ❌ Bad: Promise chains
function fetchDepartment(id: string): Promise<Department> {
  return this.repository.findById(id)
    .then(department => {
      if (!department) {
        throw new NotFoundError('Department not found');
      }
      return department;
    });
}
```

### Dependency Injection

```typescript
// ✅ Good: Use dependency injection
@injectable()
export class DepartmentService {
  constructor(
    @inject('IDepartmentRepository')
    private readonly repository: IDepartmentRepository
  ) {}
}

// ❌ Bad: Direct instantiation
export class DepartmentService {
  private repository = new DepartmentRepository();
}
```

## Testing Guidelines

### Unit Tests

Test business logic in isolation with mocks:

```typescript
describe('DepartmentService', () => {
  let service: DepartmentService;
  let mockRepository: jest.Mocked<IDepartmentRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
    } as any;
    service = new DepartmentService(mockRepository);
  });

  it('should throw NotFoundError when department not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(service.getDepartmentById('123'))
      .rejects
      .toThrow(NotFoundError);
  });
});
```

### Integration Tests

Test API endpoints with real database:

```typescript
describe('Department API', () => {
  let app: Express.Application;
  let authToken: string;

  beforeAll(async () => {
    await initializeTestDatabase();
    const appInstance = new App();
    app = appInstance.getExpressApp();
    authToken = await getTestAuthToken();
  });

  it('should create a department', async () => {
    const response = await request(app)
      .post('/api/v1/departments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Engineering', description: 'Dev team' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### Test Coverage

Aim for:
- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Cover all API endpoints
- **Critical Paths**: 100% coverage for authentication, payment, etc.

Run coverage:

```bash
npm test -- --coverage
```

## Git Workflow

### Branch Naming

```
feature/<feature-name>    # New features
bugfix/<bug-name>         # Bug fixes
hotfix/<issue-name>       # Production hotfixes
refactor/<description>    # Code refactoring
docs/<description>        # Documentation updates
test/<description>        # Test updates
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test updates
- `chore`: Build/tooling changes

Examples:

```bash
feat(department): add department creation endpoint

fix(auth): resolve JWT token expiration issue

docs(api): update API documentation for user endpoints

refactor(service): simplify department validation logic

test(integration): add tests for employee API
```

### Pull Request Process

1. **Create PR** with descriptive title and description
2. **Link Issues**: Reference related issues
3. **Add Labels**: bug, feature, documentation, etc.
4. **Request Review**: Tag relevant reviewers
5. **Address Feedback**: Make requested changes
6. **Merge**: Once approved, squash and merge

## Code Review

### As a Reviewer

**Check for**:
- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] No security vulnerabilities
- [ ] No performance issues
- [ ] Documentation is updated
- [ ] Error handling is proper
- [ ] Edge cases are covered

**Review Guidelines**:
- Be constructive and respectful
- Explain the "why" behind suggestions
- Approve when satisfied, request changes if needed
- Test the changes locally if needed

### As an Author

**Before Requesting Review**:
- [ ] All tests pass
- [ ] Code is formatted
- [ ] Linting passes
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Commits are clean

**During Review**:
- Respond to all comments
- Ask questions if unclear
- Make requested changes promptly
- Re-request review after changes

## Debugging

### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Server",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/src/server.ts"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Logging

```typescript
// Use logger, not console.log
import { logger } from './utils/logger';

logger.info('Department created', { departmentId: department.id });
logger.error('Failed to create department', { error });
logger.debug('Processing request', { userId: req.user.id });
```

### Database Queries

Enable query logging in development:

```env
DB_LOGGING=true
```

View queries in console:

```typescript
// Add query logger
import { getConnection } from 'typeorm';

const connection = getConnection();
connection.query('SELECT * FROM departments');
```

## Performance Tips

### Database Queries

```typescript
// ✅ Good: Use select to limit fields
await repository.find({ select: ['id', 'name'] });

// ✅ Good: Use relations judiciously
await repository.find({ relations: ['department'] });

// ❌ Bad: N+1 queries
for (const employee of employees) {
  const department = await repository.findOne(employee.departmentId);
}
```

### Caching

```typescript
// Cache frequently accessed data
const departments = await this.cacheService.getOrSet(
  'departments:all',
  () => this.repository.findAll(),
  3600  // 1 hour TTL
);
```

## Security Best Practices

- **Never** commit sensitive data (passwords, keys, etc.)
- **Always** validate user input
- **Use** parameterized queries (TypeORM handles this)
- **Sanitize** output to prevent XSS
- **Hash** passwords with bcrypt
- **Use** HTTPS in production
- **Implement** rate limiting
- **Keep** dependencies updated

## Additional Resources

- [Architecture Documentation](../architecture/ARCHITECTURE.md)
- [API Documentation](../api/API_OVERVIEW.md)
- [Testing Guide](../../TESTING_GUIDE.md)
- [Deployment Guide](../DEPLOYMENT.md)

---

**Happy Coding!** 🚀

**Last Updated**: 2026-01-29
