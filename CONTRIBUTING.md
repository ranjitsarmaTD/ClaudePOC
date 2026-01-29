# Contributing to HR Admin System

Thank you for your interest in contributing to the HR Admin System! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Process](#development-process)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Forked the repository** on GitHub
2. **Cloned your fork** locally
3. **Set up the development environment** (see [Setup Guide](./docs/SETUP.md))
4. **Read the** [Developer Guide](./docs/guides/DEVELOPER_GUIDE.md)

### First-Time Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ClaudePOC.git
cd ClaudePOC

# Add upstream remote
git remote add upstream https://github.com/ranjitsarmaTD/ClaudePOC.git

# Install dependencies
npm install

# Create environment file
cp .env.example .env.development

# Start development server
npm run dev
```

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When creating a bug report, include:**
- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node.js version, etc.)
- **Error messages** and logs
- **Screenshots** (if applicable)

**Bug Report Template:**

```markdown
## Description
[Clear description of the bug]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
[What you expected to happen]

## Actual Behavior
[What actually happened]

## Environment
- OS: [e.g., Ubuntu 20.04]
- Node.js: [e.g., 18.12.0]
- npm: [e.g., 9.1.0]

## Additional Context
[Any other relevant information]
```

### Suggesting Features

**Feature Request Template:**

```markdown
## Feature Description
[Clear description of the feature]

## Problem It Solves
[What problem does this solve?]

## Proposed Solution
[How would you implement it?]

## Alternatives Considered
[What other solutions did you consider?]

## Additional Context
[Any other relevant information]
```

### Contributing Code

1. **Find or create an issue** to work on
2. **Comment on the issue** to let others know you're working on it
3. **Create a feature branch**
4. **Make your changes**
5. **Write/update tests**
6. **Update documentation**
7. **Submit a pull request**

## Development Process

### 1. Create a Branch

```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Urgent production fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test improvements

### 2. Make Changes

- Follow the [coding standards](#coding-standards)
- Write clear, concise commit messages
- Keep commits atomic (one logical change per commit)
- Test your changes thoroughly

### 3. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat(department): add ability to archive departments"
```

**Commit message format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes
- `perf`: Performance improvements

**Example:**
```
feat(api): add pagination support to employee endpoints

- Add page and limit query parameters
- Return total count in response headers
- Update API documentation
- Add tests for pagination

Closes #123
```

### 4. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 5. Create Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your feature branch
4. Fill out the PR template
5. Submit the PR

## Pull Request Process

### Before Submitting

**Ensure your PR:**
- [ ] Passes all tests (`npm test`)
- [ ] Follows coding standards (`npm run lint`)
- [ ] Is properly formatted (`npm run format`)
- [ ] Has no security vulnerabilities (`npm audit`)
- [ ] Includes tests for new functionality
- [ ] Updates relevant documentation
- [ ] Has a clear title and description

### PR Template

```markdown
## Description
[Describe your changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Closes #[issue number]

## How Has This Been Tested?
[Describe testing process]

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged

## Screenshots (if applicable)
[Add screenshots]

## Additional Notes
[Any other information]
```

### Review Process

1. **Automated checks** run (tests, linting, build)
2. **Code review** by maintainers
3. **Address feedback** if requested
4. **Approval** by at least one maintainer
5. **Merge** when all checks pass and approved

### After Merge

1. **Delete your feature branch** (optional)
2. **Update your local repository**:
```bash
git checkout main
git pull upstream main
```

## Coding Standards

### TypeScript

- Use **strict TypeScript** settings
- Prefer **interfaces** over types for object shapes
- Use **enums** for constants
- Always specify **return types** for functions
- Use **async/await** over promises
- Avoid **any** type (use unknown or proper types)

### Code Style

- Follow **ESLint** configuration
- Use **Prettier** for formatting
- Maximum line length: **100 characters**
- Indentation: **2 spaces**
- Use **single quotes** for strings
- Always use **semicolons**

### Naming Conventions

```typescript
// Classes: PascalCase
class DepartmentService { }

// Interfaces: PascalCase with 'I' prefix
interface IDepartmentService { }

// Functions/methods: camelCase
function getDepartment() { }

// Variables: camelCase
const departmentName = 'Engineering';

// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;

// Files: kebab-case
department-service.ts
```

### File Organization

```typescript
// 1. Imports (grouped)
import { Router } from 'express';  // External
import { DepartmentService } from '../services';  // Internal

// 2. Types/Interfaces
interface DepartmentData { }

// 3. Constants
const MAX_DEPARTMENTS = 100;

// 4. Main code
export class DepartmentController { }

// 5. Helper functions (if any)
function validateDepartment() { }
```

## Testing Requirements

### Test Coverage

- **Minimum**: 80% code coverage
- **Critical paths**: 100% coverage
- **All new features**: Must include tests
- **Bug fixes**: Must include regression tests

### Writing Tests

```typescript
describe('Feature name', () => {
  // Setup
  beforeEach(() => { });

  // Tests
  it('should do something specific', () => {
    // Arrange
    const input = { };

    // Act
    const result = functionToTest(input);

    // Assert
    expect(result).toBe(expected);
  });

  // Cleanup
  afterEach(() => { });
});
```

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm test -- --coverage

# Watch mode
npm run test:watch

# Specific file
npm test -- path/to/test.spec.ts
```

## Documentation

### Code Documentation

- Use **JSDoc** for public APIs
- Comment **complex logic**
- Explain **why**, not what
- Keep comments **up-to-date**

```typescript
/**
 * Creates a new department with the given information.
 *
 * @param dto - Department creation data
 * @returns The created department
 * @throws {ConflictError} If department name already exists
 * @throws {ValidationError} If data is invalid
 */
async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
  // Implementation
}
```

### API Documentation

- Update **Swagger/OpenAPI** specs
- Include **request/response examples**
- Document **error responses**
- Update **API_OVERVIEW.md**

### General Documentation

When making changes that affect:
- **Setup**: Update `docs/SETUP.md`
- **Architecture**: Update `docs/architecture/ARCHITECTURE.md`
- **API**: Update `docs/api/API_OVERVIEW.md`
- **Deployment**: Update `docs/DEPLOYMENT.md`

## Getting Help

- **Read the docs**: Check [documentation](./docs/)
- **Search issues**: Look for similar problems
- **Ask questions**: Create a discussion on GitHub
- **Contact maintainers**: Tag `@maintainers` in issues

## Recognition

Contributors will be recognized in:
- **Contributors list** in README
- **Release notes** for significant contributions
- **Special mentions** for major features

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing!** 🎉

Your contributions help make this project better for everyone.
