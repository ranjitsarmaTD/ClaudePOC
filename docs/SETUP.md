# Setup Guide

This guide will help you set up the HR Admin System on your local machine for development.

## Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js**: v18.0.0 or higher (v22.x recommended)
- **npm**: v9.0.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Git**: v2.30.0 or higher

### Optional
- **Docker**: For containerized development
- **Docker Compose**: For multi-container setup
- **pgAdmin**: PostgreSQL management tool

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/ranjitsarmaTD/ClaudePOC.git
cd ClaudePOC
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies (approximately 700+ packages).

### 3. Database Setup

#### Option A: Local PostgreSQL

1. **Create Database**:
```bash
createdb hr_admin_db_dev
```

2. **Enable UUID Extension**:
```bash
psql -d hr_admin_db_dev -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
```

3. **Create Test Database** (optional, for running tests):
```bash
createdb hr_admin_db_test
psql -d hr_admin_db_test -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
```

#### Option B: Docker PostgreSQL

```bash
docker run --name hr-admin-postgres \
  -e POSTGRES_DB=hr_admin_db_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  -d postgres:14-alpine

# Wait for container to be ready
sleep 5

# Enable UUID extension
docker exec hr-admin-postgres psql -U postgres -d hr_admin_db_dev \
  -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
```

### 4. Environment Configuration

1. **Copy Environment Template**:
```bash
cp .env.example .env.development
```

2. **Edit Configuration**:
```bash
# Open in your preferred editor
nano .env.development
# or
code .env.development
```

3. **Update Required Values**:
```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hr_admin_db_dev
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_SYNCHRONIZE=true  # Auto-sync schema in development
DB_LOGGING=true      # Enable SQL logging
DB_SSL=false

# JWT Configuration (IMPORTANT: Change in production!)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=1h
JWT_ISSUER=hr-admin-api

# Logging Configuration
LOG_LEVEL=debug
LOG_FORMAT=pretty

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Bcrypt Rounds
BCRYPT_ROUNDS=12
```

### 5. Run Database Migrations

```bash
# Run migrations
npm run migration:run

# Seed initial data (optional)
npm run seed
```

### 6. Build the Project

```bash
npm run build
```

### 7. Start the Development Server

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The server will start on `http://localhost:3000` (or the PORT specified in your .env file).

## Verification

### Test the API

1. **Health Check**:
```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2026-01-29T10:30:00.000Z",
    "uptime": 12.345
  }
}
```

2. **API Documentation**:
Visit `http://localhost:3000/api/v1/docs` to access Swagger UI.

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage
```

## Development Workflow

### Daily Development

1. **Start Database**:
```bash
# If using Docker
docker start hr-admin-postgres
```

2. **Start Development Server**:
```bash
npm run dev
```

3. **Run Tests** (in another terminal):
```bash
npm run test:watch
```

### Code Quality Checks

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Check code formatting
npm run format:check

# Format code
npm run format

# Run all quality checks
npm run sanity-check
```

## Common Issues

### Port Already in Use

If port 3000 is already in use:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env.development
PORT=3001
```

### Database Connection Failed

1. **Check PostgreSQL is running**:
```bash
# macOS
pg_isready

# Linux
sudo service postgresql status

# Docker
docker ps | grep postgres
```

2. **Verify credentials**:
```bash
psql -U postgres -h localhost
```

3. **Check database exists**:
```bash
psql -U postgres -c "\l" | grep hr_admin
```

### Module Not Found

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear TypeScript cache
rm -rf dist
npm run build
```

### TypeScript Errors

```bash
# Clean build
rm -rf dist
npm run build

# Check TypeScript version
npx tsc --version  # Should be 5.3.x or higher
```

## IDE Setup

### VS Code

Recommended extensions:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ckolkman.vscode-postgres",
    "humao.rest-client"
  ]
}
```

### Settings

Create `.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Next Steps

After successful setup:

1. Read the [Developer Guide](./guides/DEVELOPER_GUIDE.md)
2. Explore the [API Documentation](./api/API_OVERVIEW.md)
3. Review the [Testing Guide](../TESTING_GUIDE.md)
4. Understand the [Architecture](./architecture/ARCHITECTURE.md)

## Additional Resources

- [Configuration Guide](./CONFIGURATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [FAQ](./FAQ.md)

---

**Need Help?** Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) or create an issue on GitHub.
