# 11. Reference Implementation

## 11.1 Reference Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        DEEPWIKI FRAMEWORK — REFERENCE ARCHITECTURE              │
│                                                                                 │
│  ╔════════════════════════════════════════════════════════════════════════════╗  │
│  ║                           ENTRY POINTS                                    ║  │
│  ╠════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                           ║  │
│  ║  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐           ║  │
│  ║  │ GitHub   │    │ GitLab   │    │   CLI    │    │  API     │           ║  │
│  ║  │ Webhook  │    │ Webhook  │    │ Command  │    │ Request  │           ║  │
│  ║  │ :3100/wh │    │ :3100/wh │    │ deepwiki │    │ :3100/api│           ║  │
│  ║  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘           ║  │
│  ║       └───────────────┼───────────────┼───────────────┘                  ║  │
│  ║                       ▼               ▼                                  ║  │
│  ╚═══════════════════════╪═══════════════╪══════════════════════════════════╝  │
│                          ▼               │                                     │
│  ╔═══════════════════════════════════════╧══════════════════════════════════╗  │
│  ║                        PROCESSING PIPELINE                               ║  │
│  ╠══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                          ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────┐ ║  │
│  ║  │ STAGE 1: INGEST & ANALYZE                                         │ ║  │
│  ║  │                                                                     │ ║  │
│  ║  │  Event Normalizer ──▶ Git Diff Analyzer ──▶ Change Classifier     │ ║  │
│  ║  │                                    │                                │ ║  │
│  ║  │                                    ▼                                │ ║  │
│  ║  │                          ┌─────────────────┐                       │ ║  │
│  ║  │                          │ Parser Registry  │                       │ ║  │
│  ║  │                          │ ┌──┐ ┌──┐ ┌──┐ │                       │ ║  │
│  ║  │                          │ │TS│ │Py│ │Go│ │ ... extensible        │ ║  │
│  ║  │                          │ └──┘ └──┘ └──┘ │                       │ ║  │
│  ║  │                          └────────┬────────┘                       │ ║  │
│  ║  │                                   ▼                                │ ║  │
│  ║  │                          ┌─────────────────┐                       │ ║  │
│  ║  │                          │ Knowledge Graph  │◀─── Cache (Redis)    │ ║  │
│  ║  │                          │ Builder          │───▶ Store (Neo4j)    │ ║  │
│  ║  │                          └────────┬────────┘                       │ ║  │
│  ║  │                                   ▼                                │ ║  │
│  ║  │                          ┌─────────────────┐                       │ ║  │
│  ║  │                          │ Impact Analyzer  │                       │ ║  │
│  ║  │                          │ (graph query)    │                       │ ║  │
│  ║  │                          └────────┬────────┘                       │ ║  │
│  ║  └───────────────────────────────────┼─────────────────────────────────┘ ║  │
│  ║                                      ▼                                   ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────┐ ║  │
│  ║  │ STAGE 2: AI GENERATION                                             │ ║  │
│  ║  │                                                                     │ ║  │
│  ║  │  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐      │ ║  │
│  ║  │  │ Context       │───▶│ Prompt        │───▶│ Claude API    │      │ ║  │
│  ║  │  │ Assembler     │    │ Engine        │    │ Gateway       │      │ ║  │
│  ║  │  │               │    │               │    │               │      │ ║  │
│  ║  │  │ - Budget      │    │ - Template    │    │ - Rate limit  │      │ ║  │
│  ║  │  │ - Rank        │    │ - Populate    │    │ - Retry       │      │ ║  │
│  ║  │  │ - Chunk       │    │ - Version     │    │ - Stream      │      │ ║  │
│  ║  │  └───────────────┘    └───────────────┘    └───────┬───────┘      │ ║  │
│  ║  │                                                     │              │ ║  │
│  ║  │                                              ┌──────┴──────┐       │ ║  │
│  ║  │                                              │  Anthropic  │       │ ║  │
│  ║  │                                              │  Claude API │       │ ║  │
│  ║  │                                              │             │       │ ║  │
│  ║  │     ┌──────────────┐    ┌──────────────┐    │  Opus 4.6   │       │ ║  │
│  ║  │     │ Response     │◀───│ Cost         │◀───│  Sonnet 4.5 │       │ ║  │
│  ║  │     │ Parser       │    │ Tracker      │    │  Haiku 4.5  │       │ ║  │
│  ║  │     └──────┬───────┘    └──────────────┘    └─────────────┘       │ ║  │
│  ║  └────────────┼────────────────────────────────────────────────────────┘ ║  │
│  ║               ▼                                                          ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────┐ ║  │
│  ║  │ STAGE 3: SYNTHESIS                                                 │ ║  │
│  ║  │                                                                     │ ║  │
│  ║  │  Template Renderer ──▶ Cross-Ref Linker ──▶ TOC Builder            │ ║  │
│  ║  │         │                                        │                  │ ║  │
│  ║  │         ▼                                        ▼                  │ ║  │
│  ║  │  Diagram Generator              Document Assembler                 │ ║  │
│  ║  │  (Mermaid/PlantUML)             (WikiBundle output)                │ ║  │
│  ║  └────────────────────────────────────────┬────────────────────────────┘ ║  │
│  ║                                           ▼                              ║  │
│  ║  ┌─────────────────────────────────────────────────────────────────────┐ ║  │
│  ║  │ STAGE 4: VALIDATE & PUBLISH                                        │ ║  │
│  ║  │                                                                     │ ║  │
│  ║  │  Quality Scorer ──▶ Link Validator ──▶ Schema Validator            │ ║  │
│  ║  │                                              │                      │ ║  │
│  ║  │                                    ┌─────────┴─────────┐           │ ║  │
│  ║  │                                    │                   │           │ ║  │
│  ║  │                              [PASS]▼             [FAIL]▼           │ ║  │
│  ║  │                          ┌──────────────┐   ┌──────────────┐      │ ║  │
│  ║  │                          │ Git Commit   │   │ Review Queue │      │ ║  │
│  ║  │                          │ + Deploy     │   │ (PR created) │      │ ║  │
│  ║  │                          └──────────────┘   └──────────────┘      │ ║  │
│  ║  └─────────────────────────────────────────────────────────────────────┘ ║  │
│  ║                                                                          ║  │
│  ╚══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                │
│  ╔══════════════════════════════════════════════════════════════════════════╗  │
│  ║                         DATA STORES                                     ║  │
│  ╠══════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                          ║  │
│  ║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ ║  │
│  ║  │PostgreSQL│  │  Redis   │  │  Neo4j   │  │ pgvector │  │   S3 /   │ ║  │
│  ║  │          │  │          │  │          │  │          │  │   Git    │ ║  │
│  ║  │Metadata  │  │Cache +   │  │Knowledge │  │Embeddings│  │Wiki +   │ ║  │
│  ║  │Runs      │  │Queues    │  │Graph     │  │for RAG   │  │Artifacts│ ║  │
│  ║  │Tenants   │  │Sessions  │  │Entities  │  │Vectors   │  │Static   │ ║  │
│  ║  │Audit Log │  │Rate Limit│  │Relations │  │Search    │  │Site     │ ║  │
│  ║  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ ║  │
│  ║                                                                          ║  │
│  ╚══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                │
│  ╔══════════════════════════════════════════════════════════════════════════╗  │
│  ║                         CONSUMERS                                       ║  │
│  ╠══════════════════════════════════════════════════════════════════════════╣  │
│  ║  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ ║  │
│  ║  │ Web UI   │  │ MCP      │  │ Static   │  │ IDE      │  │ Slack /  │ ║  │
│  ║  │ Dashboard│  │ Server   │  │ Site     │  │ Extension│  │ Notif.   │ ║  │
│  ║  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘ ║  │
│  ╚══════════════════════════════════════════════════════════════════════════╝  │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 11.2 Sample API Definitions

### Complete API Example (cURL)

```bash
# 1. Register a project
curl -X POST https://api.deepwiki.io/api/v1/projects \
  -H "Authorization: Bearer dwk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HR Admin Backend",
    "provider": "github",
    "owner": "ranjitsarmaTD",
    "repo": "ClaudePOC",
    "branch": "main",
    "config": {
      "include": ["src/**"],
      "exclude": ["**/*.test.ts", "dist/**"],
      "sections": [
        "system_overview",
        "architecture",
        "api_reference",
        "database_schema",
        "service_docs",
        "developer_guide"
      ],
      "aiModel": "claude-sonnet-4-5-20250929",
      "maxTokenBudget": 500000,
      "maxCostBudget": 10.00
    }
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "id": "proj_abc123",
#     "name": "HR Admin Backend",
#     "fullName": "ranjitsarmaTD/ClaudePOC",
#     "status": "active",
#     "webhookUrl": "https://api.deepwiki.io/api/v1/webhooks/github?project=proj_abc123",
#     "webhookSecret": "whsec_xxx",
#     "createdAt": "2026-02-11T14:00:00Z"
#   }
# }

# 2. Trigger full generation
curl -X POST https://api.deepwiki.io/api/v1/projects/proj_abc123/generate \
  -H "Authorization: Bearer dwk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "full"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "runId": "run_def456",
#     "status": "queued",
#     "queuePosition": 1,
#     "estimatedDuration": "5-10 minutes",
#     "statusUrl": "https://api.deepwiki.io/api/v1/projects/proj_abc123/generations/run_def456"
#   }
# }

# 3. Check generation status
curl https://api.deepwiki.io/api/v1/projects/proj_abc123/generations/run_def456 \
  -H "Authorization: Bearer dwk_xxx"

# Response (completed):
# {
#   "success": true,
#   "data": {
#     "runId": "run_def456",
#     "status": "completed",
#     "duration_ms": 342000,
#     "analysis": {
#       "filesAnalyzed": 45,
#       "entitiesDiscovered": 187,
#       "graphNodesUpdated": 187,
#       "impactedSections": ["system_overview", "architecture", "api_reference", ...]
#     },
#     "generation": {
#       "sectionsGenerated": 6,
#       "sectionsSkipped": 0,
#       "sectionsCached": 0,
#       "totalTokens": { "input": 245000, "output": 48000, "cached": 0 },
#       "totalCost_usd": 4.27
#     },
#     "validation": {
#       "passed": true,
#       "qualityScore": 84,
#       "issues": []
#     },
#     "output": {
#       "wikiCommit": "abc123",
#       "deploymentUrl": "https://wiki.deepwiki.io/ranjitsarmaTD/ClaudePOC"
#     }
#   }
# }

# 4. Read a wiki page
curl https://api.deepwiki.io/api/v1/projects/proj_abc123/wiki/03-api-reference/endpoints/employees \
  -H "Authorization: Bearer dwk_xxx" \
  -H "Accept: text/markdown"

# Response: Markdown content of the API reference page

# 5. Search wiki
curl "https://api.deepwiki.io/api/v1/projects/proj_abc123/wiki/search?q=authentication" \
  -H "Authorization: Bearer dwk_xxx"

# Response:
# {
#   "success": true,
#   "data": {
#     "results": [
#       {
#         "page": "08-security/authentication-authorization.md",
#         "title": "Authentication & Authorization",
#         "snippet": "...JWT bearer token authentication using jsonwebtoken...",
#         "score": 0.95
#       },
#       {
#         "page": "03-api-reference/authentication.md",
#         "title": "API Authentication",
#         "snippet": "...All protected endpoints require a valid JWT...",
#         "score": 0.88
#       }
#     ],
#     "totalResults": 2
#   }
# }

# 6. Check drift
curl https://api.deepwiki.io/api/v1/projects/proj_abc123/drift \
  -H "Authorization: Bearer dwk_xxx"

# Response:
# {
#   "success": true,
#   "data": {
#     "summary": {
#       "totalPages": 28,
#       "currentPages": 25,
#       "stalePages": 2,
#       "outdatedPages": 1,
#       "driftScore": 0.11,
#       "recommendation": "incremental"
#     },
#     "pages": [
#       {
#         "path": "05-services/deepwiki-service.md",
#         "status": "outdated",
#         "commitsBehind": 3,
#         "severity": "high"
#       }
#     ]
#   }
# }
```

---

## 11.3 Sample Metadata Schema

### JSON Schema for Page Metadata

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://deepwiki.io/schemas/page-metadata/v1",
  "title": "DeepWiki Page Metadata",
  "description": "Front-matter metadata schema for DeepWiki-generated documentation pages",
  "type": "object",
  "required": ["deepwiki"],
  "properties": {
    "deepwiki": {
      "type": "object",
      "required": ["pageId", "sectionType", "title", "generatedAt", "sourceCommit", "generatorVersion"],
      "properties": {
        "pageId": {
          "type": "string",
          "pattern": "^[a-z0-9-]+$",
          "description": "Unique page identifier within the wiki"
        },
        "sectionType": {
          "type": "string",
          "enum": [
            "system_overview", "architecture", "api_reference",
            "database_schema", "service_docs", "workflow",
            "infrastructure", "security", "observability",
            "release_notes", "adr", "runbook",
            "developer_guide", "onboarding_guide"
          ]
        },
        "title": {
          "type": "string",
          "minLength": 1,
          "maxLength": 200
        },
        "generatedAt": {
          "type": "string",
          "format": "date-time"
        },
        "sourceCommit": {
          "type": "string",
          "pattern": "^[a-f0-9]{7,40}$"
        },
        "generatorVersion": {
          "type": "string",
          "pattern": "^\\d+\\.\\d+\\.\\d+$"
        },
        "aiModel": {
          "type": "string"
        },
        "qualityScore": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100
        },
        "tokenUsage": {
          "type": "object",
          "properties": {
            "input": { "type": "integer", "minimum": 0 },
            "output": { "type": "integer", "minimum": 0 }
          }
        },
        "sourceFiles": {
          "type": "array",
          "items": { "type": "string" }
        },
        "dependencies": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Page IDs that this page depends on"
        },
        "tags": {
          "type": "array",
          "items": { "type": "string" }
        },
        "lastValidated": {
          "type": "string",
          "format": "date-time"
        },
        "driftStatus": {
          "type": "string",
          "enum": ["current", "stale", "outdated"]
        },
        "approvalStatus": {
          "type": "string",
          "enum": ["auto-approved", "pending", "approved", "rejected"]
        },
        "editedBy": {
          "type": "string",
          "enum": ["ai", "human", "mixed"],
          "default": "ai"
        }
      }
    }
  }
}
```

---

## 11.4 Sample Claude Prompt Template

### System Overview Generation Prompt

```markdown
# System Prompt (system-overview.prompt.md)

You are a senior technical writer with deep software architecture expertise. Your task
is to generate a comprehensive System Overview document for a software project.

## Context
- **Project Name**: {{PROJECT_NAME}}
- **Project Type**: {{PROJECT_TYPE}}
- **Technology Stack**: {{TECH_STACK}}
- **Framework**: {{FRAMEWORK}}
- **Architecture Pattern**: {{ARCHITECTURE_PATTERN}}

## Requirements
Generate a System Overview document that includes:

1. **Executive Summary** (2-3 paragraphs)
   - What the project does (purpose and business value)
   - Who it serves (target users/consumers)
   - Core capabilities in plain language

2. **Technology Stack** (table format)
   - Category | Technology | Version | Purpose
   - Cover: runtime, language, framework, database, ORM, auth, testing, CI/CD

3. **Project Structure** (tree format with explanations)
   - Directory layout with purpose annotations
   - Key files and their roles

4. **Architecture Overview** (brief, with diagram)
   - High-level component diagram (Mermaid syntax)
   - Request flow description
   - Layered architecture explanation

5. **Key Concepts** (glossary)
   - Domain terms specific to this project
   - Architectural patterns in use and their roles

## Output Format
- Use clean Markdown with proper heading hierarchy (##, ###)
- Use Mermaid diagrams where appropriate (```mermaid blocks)
- Use tables for structured data
- Be precise — refer to actual file paths and module names from the code
- Do NOT invent or assume features not present in the code
- Do NOT include boilerplate disclaimers or caveats

## Style Guidelines
- Write for a developer joining the team for the first time
- Be concise but thorough — every sentence should add value
- Use active voice
- Technical accuracy over marketing language
```

```markdown
# User Prompt (system-overview.user.md)

{{UPDATE_MODE}} for the project "{{PROJECT_NAME}}".

## Project Source Code

The following files represent the project structure and implementation:

{{CODE_CONTEXT}}

## Dependency Graph

The project's module dependency structure:

{{DEPENDENCY_GRAPH}}

## Project Configuration

```json
{{PROJECT_CONFIG}}
```

{{#if EXISTING_DOCS}}
## Existing Documentation

The current documentation to be updated:

{{EXISTING_DOCS}}
{{/if}}

Generate the System Overview document now. Use only information evident
in the provided source code. Reference actual file paths.
```

### API Reference Generation Prompt

```markdown
# System Prompt (api-docs.prompt.md)

You are an API documentation specialist. Generate precise, developer-friendly
API reference documentation from source code.

## Context
- **Project Name**: {{PROJECT_NAME}}
- **Framework**: {{FRAMEWORK}}
- **API Prefix**: {{API_PREFIX}}
- **Auth Mechanism**: {{AUTH_MECHANISM}}

## Requirements
For each API endpoint, document:

1. **HTTP Method & Path** (e.g., `POST /api/v1/employees`)
2. **Description** — What this endpoint does
3. **Authentication** — Required? What type?
4. **Request**
   - Path parameters (name, type, required, description)
   - Query parameters (name, type, default, description)
   - Request body schema (from DTO/validator decorators)
   - Example request body (realistic, valid JSON)
5. **Response**
   - Success response (status code, schema, example)
   - Error responses (status code, condition, example)
6. **Validation Rules** — Extract from class-validator decorators

## Output Format
- Group endpoints by resource (employees, departments, auth, etc.)
- Use tables for parameters
- Use fenced JSON blocks for examples
- Include curl examples for each endpoint
- Extract validation rules from DTO decorators (@IsString, @IsNotEmpty, etc.)

## Critical Rules
- ONLY document endpoints that exist in the route files
- Extract request/response schemas from DTOs — do NOT invent fields
- Validation rules must match the actual decorators in the DTO classes
- HTTP status codes must match what the controller/error handler returns
```

```markdown
# User Prompt (api-docs.user.md)

Generate API reference documentation for the "{{TARGET_MODULE}}" module.

## Route Definitions

{{ROUTE_FILES}}

## Controller Implementation

{{CONTROLLER_FILES}}

## DTOs (Request/Response Models)

{{DTO_FILES}}

## Service Interface

{{SERVICE_INTERFACE_FILES}}

## Middleware Chain

{{MIDDLEWARE_FILES}}

## Error Types

{{ERROR_FILES}}

{{#if EXISTING_DOCS}}
## Current Documentation

Update the following existing documentation to reflect any changes:

{{EXISTING_DOCS}}
{{/if}}

Generate complete API reference documentation for this module's endpoints.
Ensure every endpoint in the route file is documented. Extract all validation
rules from DTO decorators.
```

---

## 11.5 MCP Server Tool Definitions

For integrating DeepWiki as an MCP server (so Claude Code or other AI tools can query project documentation):

```typescript
// MCP Tool Definitions for DeepWiki
const MCP_TOOLS = [
  {
    name: 'ask_deepwiki',
    description: 'Ask a question about a project\'s documentation. Returns an AI-generated answer based on the project\'s DeepWiki.',
    inputSchema: {
      type: 'object',
      required: ['project', 'question'],
      properties: {
        project: {
          type: 'string',
          description: 'Project identifier (e.g., "owner/repo" or project ID)',
        },
        question: {
          type: 'string',
          description: 'Natural language question about the project',
        },
      },
    },
  },
  {
    name: 'read_wiki_page',
    description: 'Read a specific page from a project\'s DeepWiki documentation.',
    inputSchema: {
      type: 'object',
      required: ['project', 'page'],
      properties: {
        project: { type: 'string' },
        page: {
          type: 'string',
          description: 'Page path (e.g., "03-api-reference/endpoints/employees")',
        },
        format: {
          type: 'string',
          enum: ['markdown', 'plain'],
          default: 'markdown',
        },
      },
    },
  },
  {
    name: 'read_wiki_structure',
    description: 'Get the table of contents / structure of a project\'s DeepWiki.',
    inputSchema: {
      type: 'object',
      required: ['project'],
      properties: {
        project: { type: 'string' },
      },
    },
  },
  {
    name: 'search_wiki',
    description: 'Search across a project\'s DeepWiki documentation.',
    inputSchema: {
      type: 'object',
      required: ['project', 'query'],
      properties: {
        project: { type: 'string' },
        query: { type: 'string' },
        limit: { type: 'number', default: 5 },
      },
    },
  },
  {
    name: 'check_drift',
    description: 'Check if a project\'s documentation is up-to-date with the source code.',
    inputSchema: {
      type: 'object',
      required: ['project'],
      properties: {
        project: { type: 'string' },
      },
    },
  },
  {
    name: 'trigger_generation',
    description: 'Trigger documentation generation for a project.',
    inputSchema: {
      type: 'object',
      required: ['project'],
      properties: {
        project: { type: 'string' },
        mode: {
          type: 'string',
          enum: ['full', 'incremental'],
          default: 'incremental',
        },
        sections: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific sections to regenerate (empty = all impacted)',
        },
      },
    },
  },
];
```

---

## 11.6 CLI Reference

```
deepwiki — AI-powered documentation generation framework

USAGE:
  deepwiki <command> [options]

COMMANDS:
  init          Initialize DeepWiki for a project
  generate      Generate documentation (full or incremental)
  validate      Run validation checks on existing wiki
  serve         Start local development server for wiki
  drift         Check documentation drift against source code
  diff          Show differences between wiki versions
  rollback      Roll back to a previous wiki version
  history       Show generation history
  config        Manage DeepWiki configuration
  graph         Inspect and query the knowledge graph
  cost          View AI cost reports

EXAMPLES:
  # Initialize DeepWiki in current project
  deepwiki init

  # Generate wiki from current code
  deepwiki generate --mode full --verbose

  # Incremental update after a commit
  deepwiki generate --mode incremental --base-ref HEAD~1

  # Check for stale documentation
  deepwiki drift

  # Validate existing wiki
  deepwiki validate --path docs/wiki --strict

  # Start local preview server
  deepwiki serve --port 4000

  # View cost report for last 30 days
  deepwiki cost --period 30d

  # Query the knowledge graph
  deepwiki graph query --node "AuthService" --depth 2

  # Roll back last generation
  deepwiki rollback --last

OPTIONS:
  --config, -c    Path to deepwiki.config.yaml (default: ./deepwiki.config.yaml)
  --verbose, -v   Enable verbose logging
  --quiet, -q     Suppress non-error output
  --dry-run       Show what would be generated without calling AI
  --help, -h      Show help
  --version       Show version
```
