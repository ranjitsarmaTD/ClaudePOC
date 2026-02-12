# 5. Generic Template Structure

## 5.1 DeepWiki Output Directory Layout

```
docs/wiki/                                    # Root output directory
│
├── index.md                                  # Wiki homepage / table of contents
├── .deepwiki/
│   ├── manifest.json                         # Generation manifest (source SHA → wiki SHA)
│   ├── config.yaml                           # Config snapshot at generation time
│   └── generation-log.json                   # Append-only generation history
│
├── 01-system-overview/
│   ├── index.md                              # Executive summary
│   ├── project-purpose.md                    # What this project does and why
│   ├── technology-stack.md                   # Languages, frameworks, tools
│   ├── project-structure.md                  # Directory layout with explanations
│   └── key-concepts.md                       # Domain glossary and core abstractions
│
├── 02-architecture/
│   ├── index.md                              # Architecture overview
│   ├── high-level-design.md                  # System context diagram, components
│   ├── data-flow.md                          # Request lifecycle, data pipeline flows
│   ├── architectural-patterns.md             # Patterns in use (DI, Repository, etc.)
│   ├── module-dependency-graph.md            # Inter-module relationships (with diagram)
│   └── design-decisions.md                   # Key trade-offs and rationale
│
├── 03-api-reference/
│   ├── index.md                              # API overview, base URL, auth
│   ├── authentication.md                     # Auth mechanism details
│   ├── endpoints/
│   │   ├── auth.md                           # POST /auth/login
│   │   ├── employees.md                      # CRUD /employees
│   │   ├── departments.md                    # CRUD /departments
│   │   └── deepwiki.md                       # DeepWiki integration endpoints
│   ├── request-response-models.md            # DTOs / request/response schemas
│   ├── error-codes.md                        # Error response catalog
│   └── rate-limiting.md                      # Rate limit policies
│
├── 04-database-schema/
│   ├── index.md                              # Database overview
│   ├── entity-relationship-diagram.md        # ER diagram (Mermaid)
│   ├── entities/
│   │   ├── user.md                           # User table schema + constraints
│   │   ├── employee.md                       # Employee table schema
│   │   └── department.md                     # Department table schema
│   ├── migrations.md                         # Migration history and strategy
│   └── seed-data.md                          # Seed data documentation
│
├── 05-services/
│   ├── index.md                              # Service layer overview
│   ├── auth-service.md                       # AuthService: methods, dependencies, behavior
│   ├── employee-service.md                   # EmployeeService
│   ├── department-service.md                 # DepartmentService
│   └── deepwiki-service.md                   # DeepWikiService (MCP integration)
│
├── 06-workflows/
│   ├── index.md                              # Workflow overview
│   ├── user-login-flow.md                    # Authentication flow (sequence diagram)
│   ├── employee-crud-flow.md                 # Employee CRUD lifecycle
│   ├── request-lifecycle.md                  # HTTP request → response pipeline
│   └── error-handling-flow.md                # Error propagation and handling
│
├── 07-infrastructure/
│   ├── index.md                              # Infrastructure overview
│   ├── environment-configuration.md          # Environment variables, .env setup
│   ├── docker.md                             # Containerization (if applicable)
│   ├── ci-cd-pipeline.md                     # GitHub Actions / CI pipeline
│   └── deployment.md                         # Deployment procedures
│
├── 08-security/
│   ├── index.md                              # Security overview
│   ├── authentication-authorization.md       # JWT, RBAC details
│   ├── input-validation.md                   # Validation strategy (class-validator)
│   ├── security-headers.md                   # Helmet, CORS, rate limiting
│   ├── data-protection.md                    # Encryption, hashing (bcrypt)
│   └── threat-model.md                       # OWASP considerations
│
├── 09-observability/
│   ├── index.md                              # Observability overview
│   ├── logging.md                            # Winston logging config, log levels
│   ├── monitoring.md                         # Health checks, uptime
│   ├── error-tracking.md                     # Error reporting strategy
│   └── metrics.md                            # Key metrics to track
│
├── 10-release-notes/
│   ├── index.md                              # Release notes overview
│   ├── changelog.md                          # Auto-generated changelog
│   └── versions/
│       ├── v1.0.0.md                         # Version-specific notes
│       └── ...
│
├── 11-adr/                                   # Architecture Decision Records
│   ├── index.md                              # ADR index
│   ├── template.md                           # ADR template
│   └── decisions/
│       ├── 001-use-typeorm.md
│       ├── 002-jwt-authentication.md
│       ├── 003-repository-pattern.md
│       ├── 004-tsyringe-di.md
│       └── 005-deepwiki-mcp-integration.md
│
├── 12-runbooks/
│   ├── index.md                              # Runbook index
│   ├── database-operations.md                # DB backup, restore, migration
│   ├── incident-response.md                  # Common incidents and resolution
│   ├── scaling.md                            # How to scale the application
│   └── troubleshooting.md                    # Common issues and fixes
│
├── 13-developer-guide/
│   ├── index.md                              # Developer guide overview
│   ├── local-setup.md                        # Setting up dev environment
│   ├── coding-standards.md                   # Code style, patterns, conventions
│   ├── testing-guide.md                      # Unit, integration, e2e testing
│   ├── adding-a-feature.md                   # Step-by-step: add new endpoint
│   ├── dependency-injection.md               # How DI works in this project
│   └── debugging.md                          # Debugging tips and tools
│
└── 14-onboarding-guide/
    ├── index.md                              # Onboarding overview
    ├── prerequisites.md                      # Required knowledge and tools
    ├── first-day.md                          # First day setup checklist
    ├── codebase-walkthrough.md               # Guided tour of the codebase
    ├── key-files.md                          # Most important files to understand
    └── faq.md                                # Frequently asked questions
```

---

## 5.2 Page Templates

### Section Index Template

```markdown
---
deepwiki:
  pageId: "{{SECTION_ID}}-index"
  sectionType: "{{SECTION_TYPE}}"
  title: "{{SECTION_TITLE}}"
  generatedAt: "{{GENERATED_AT}}"
  sourceCommit: "{{SOURCE_COMMIT}}"
---

# {{SECTION_TITLE}}

{{SECTION_DESCRIPTION}}

## Pages in This Section

{{#each PAGES}}
- [{{this.title}}]({{this.path}}) — {{this.summary}}
{{/each}}

## Key Takeaways

{{KEY_TAKEAWAYS}}

---

*Generated by DeepWiki v{{GENERATOR_VERSION}} from commit `{{SOURCE_COMMIT_SHORT}}`*
```

### API Endpoint Template

```markdown
---
deepwiki:
  pageId: "api-{{MODULE_NAME}}"
  sectionType: "api_reference"
  title: "{{MODULE_TITLE}} API"
  sourceFiles: {{SOURCE_FILES_JSON}}
---

# {{MODULE_TITLE}} API

{{MODULE_DESCRIPTION}}

## Endpoints

{{#each ENDPOINTS}}
### {{this.method}} `{{this.path}}`

{{this.description}}

**Authentication**: {{this.auth}}

#### Request

{{#if this.pathParams}}
**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
{{#each this.pathParams}}
| `{{this.name}}` | `{{this.type}}` | {{this.required}} | {{this.description}} |
{{/each}}
{{/if}}

{{#if this.requestBody}}
**Request Body:**

```json
{{this.requestBodyExample}}
```

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
{{#each this.requestBody.fields}}
| `{{this.name}}` | `{{this.type}}` | {{this.required}} | {{this.validation}} | {{this.description}} |
{{/each}}
{{/if}}

#### Response

**Success ({{this.successCode}}):**

```json
{{this.successExample}}
```

**Error Responses:**

| Code | Condition | Response |
|------|-----------|----------|
{{#each this.errorResponses}}
| {{this.code}} | {{this.condition}} | {{this.description}} |
{{/each}}

{{/each}}

---

*Source: {{SOURCE_FILES}}*
```

### Service Documentation Template

```markdown
---
deepwiki:
  pageId: "service-{{SERVICE_NAME}}"
  sectionType: "service_docs"
  title: "{{SERVICE_TITLE}}"
  sourceFiles: {{SOURCE_FILES_JSON}}
---

# {{SERVICE_TITLE}}

{{SERVICE_DESCRIPTION}}

## Responsibilities

{{RESPONSIBILITIES_LIST}}

## Dependencies

```
{{DEPENDENCY_DIAGRAM}}
```

## Interface

```typescript
{{INTERFACE_DEFINITION}}
```

## Methods

{{#each METHODS}}
### `{{this.signature}}`

{{this.description}}

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
{{#each this.parameters}}
| `{{this.name}}` | `{{this.type}}` | {{this.description}} |
{{/each}}

**Returns:** `{{this.returnType}}` — {{this.returnDescription}}

**Throws:**

{{#each this.throws}}
- `{{this.errorType}}` — {{this.condition}}
{{/each}}

**Example Usage:**

```typescript
{{this.usageExample}}
```

{{/each}}

## Architectural Notes

{{ARCHITECTURAL_NOTES}}

---

*Source: {{SOURCE_FILES}}*
```

### ADR Template

```markdown
---
deepwiki:
  pageId: "adr-{{ADR_NUMBER}}"
  sectionType: "adr"
  title: "ADR-{{ADR_NUMBER}}: {{ADR_TITLE}}"
---

# ADR-{{ADR_NUMBER}}: {{ADR_TITLE}}

**Date:** {{DATE}}
**Status:** {{STATUS}} <!-- Proposed | Accepted | Deprecated | Superseded -->
**Deciders:** {{DECIDERS}}

## Context

{{CONTEXT_DESCRIPTION}}

## Decision

{{DECISION_DESCRIPTION}}

## Consequences

### Positive

{{#each POSITIVE_CONSEQUENCES}}
- {{this}}
{{/each}}

### Negative

{{#each NEGATIVE_CONSEQUENCES}}
- {{this}}
{{/each}}

### Neutral

{{#each NEUTRAL_CONSEQUENCES}}
- {{this}}
{{/each}}

## Alternatives Considered

{{#each ALTERNATIVES}}
### {{this.name}}

{{this.description}}

**Why rejected:** {{this.rejectionReason}}
{{/each}}

## References

{{#each REFERENCES}}
- {{this}}
{{/each}}
```
