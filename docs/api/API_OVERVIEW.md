# API Overview

The HR Admin System provides a RESTful API for managing employees, departments, and user authentication.

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All API endpoints (except authentication endpoints) require JWT Bearer token authentication.

```http
Authorization: Bearer <your_jwt_token>
```

See [Authentication Guide](./AUTHENTICATION.md) for details.

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

## API Endpoints

### Health Check

#### GET /health

Check API health status.

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "timestamp": "2026-01-29T10:30:00.000Z",
    "uptime": 123.45
  }
}
```

---

## Authentication Endpoints

### POST /auth/login

Authenticate user and receive JWT token.

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "your_password"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Invalid credentials

---

## Department Endpoints

### GET /departments

Get all departments.

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Engineering",
      "description": "Software development team",
      "createdAt": "2026-01-29T10:00:00.000Z",
      "updatedAt": "2026-01-29T10:00:00.000Z"
    }
  ]
}
```

### GET /departments/:id

Get department by ID.

**Authentication**: Required

**URL Parameters**:
- `id`: Department UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Engineering",
    "description": "Software development team",
    "createdAt": "2026-01-29T10:00:00.000Z",
    "updatedAt": "2026-01-29T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: Department not found

### POST /departments

Create a new department.

**Authentication**: Required

**Request Body**:
```json
{
  "name": "Engineering",
  "description": "Software development team"
}
```

**Validation Rules**:
- `name`: Required, string, 1-100 characters, unique
- `description`: Optional, string, max 500 characters

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Engineering",
    "description": "Software development team",
    "createdAt": "2026-01-29T10:00:00.000Z",
    "updatedAt": "2026-01-29T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `409 Conflict`: Department name already exists

### PUT /departments/:id

Update an existing department.

**Authentication**: Required

**URL Parameters**:
- `id`: Department UUID

**Request Body**:
```json
{
  "name": "Software Engineering",
  "description": "Updated description"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Software Engineering",
    "description": "Updated description",
    "createdAt": "2026-01-29T10:00:00.000Z",
    "updatedAt": "2026-01-29T11:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `404 Not Found`: Department not found
- `409 Conflict`: Department name already exists

### DELETE /departments/:id

Delete a department (soft delete).

**Authentication**: Required

**URL Parameters**:
- `id`: Department UUID

**Success Response** (204 No Content)

**Error Responses**:
- `404 Not Found`: Department not found

---

## Employee Endpoints

### GET /employees

Get all employees.

**Authentication**: Required

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `departmentId` (optional): Filter by department ID
- `status` (optional): Filter by status (active, inactive, terminated)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "position": "Software Engineer",
      "salary": 85000.00,
      "status": "active",
      "hireDate": "2025-01-15",
      "departmentId": "550e8400-e29b-41d4-a716-446655440000",
      "department": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Engineering"
      },
      "createdAt": "2026-01-29T10:00:00.000Z",
      "updatedAt": "2026-01-29T10:00:00.000Z"
    }
  ]
}
```

### GET /employees/:id

Get employee by ID.

**Authentication**: Required

**URL Parameters**:
- `id`: Employee UUID

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "position": "Software Engineer",
    "salary": 85000.00,
    "status": "active",
    "hireDate": "2025-01-15",
    "departmentId": "550e8400-e29b-41d4-a716-446655440000",
    "department": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Engineering",
      "description": "Software development team"
    },
    "createdAt": "2026-01-29T10:00:00.000Z",
    "updatedAt": "2026-01-29T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: Employee not found

### POST /employees

Create a new employee.

**Authentication**: Required

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "position": "Software Engineer",
  "salary": 85000.00,
  "status": "active",
  "hireDate": "2025-01-15",
  "departmentId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validation Rules**:
- `firstName`: Required, string, 1-50 characters
- `lastName`: Required, string, 1-50 characters
- `email`: Required, valid email format, unique
- `position`: Required, string, 1-100 characters
- `salary`: Required, number, positive
- `status`: Required, enum (active, inactive, terminated)
- `hireDate`: Required, date (YYYY-MM-DD)
- `departmentId`: Optional, valid department UUID

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "position": "Software Engineer",
    "salary": 85000.00,
    "status": "active",
    "hireDate": "2025-01-15",
    "departmentId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-01-29T10:00:00.000Z",
    "updatedAt": "2026-01-29T10:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `409 Conflict`: Email already exists

### PUT /employees/:id

Update an existing employee.

**Authentication**: Required

**URL Parameters**:
- `id`: Employee UUID

**Request Body** (all fields optional):
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "position": "Senior Software Engineer",
  "salary": 95000.00,
  "status": "active"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "john.doe@example.com",
    "position": "Senior Software Engineer",
    "salary": 95000.00,
    "status": "active",
    "hireDate": "2025-01-15",
    "departmentId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-01-29T10:00:00.000Z",
    "updatedAt": "2026-01-29T11:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error
- `404 Not Found`: Employee not found

### DELETE /employees/:id

Delete an employee (soft delete).

**Authentication**: Required

**URL Parameters**:
- `id`: Employee UUID

**Success Response** (204 No Content)

**Error Responses**:
- `404 Not Found`: Employee not found

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Window**: 15 minutes
- **Max Requests**: 100 requests per window
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets

When rate limit is exceeded:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later"
  }
}
```

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Headers**:
- `X-Total-Count`: Total number of items
- `X-Page`: Current page
- `X-Per-Page`: Items per page
- `X-Total-Pages`: Total pages

## Interactive Documentation

For interactive API documentation with request/response examples, visit:
```
http://localhost:3000/api/v1/docs
```

## SDKs and Client Libraries

Currently, no official SDKs are available. Use standard HTTP clients:
- JavaScript/TypeScript: `axios`, `fetch`
- Python: `requests`, `httpx`
- Go: `net/http`
- Java: `HttpClient`, `OkHttp`

## Postman Collection

A Postman collection is available for testing:
```bash
# Import from file
./postman/HR-Admin-API.postman_collection.json
```

## Additional Resources

- [Authentication Guide](./AUTHENTICATION.md)
- [Error Handling](./ERROR_HANDLING.md)
- [API Design Principles](./API_DESIGN.md)

---

**Last Updated**: 2026-01-29
