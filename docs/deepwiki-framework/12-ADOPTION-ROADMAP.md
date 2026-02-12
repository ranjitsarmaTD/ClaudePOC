# DeepWiki Framework — Adoption Roadmap

**How to leverage this framework to enable intelligent documentation for any project**

---

## Overview: Three Adoption Paths

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CHOOSE YOUR ADOPTION PATH                            │
│                                                                         │
│  PATH A: LIGHTWEIGHT (1-2 weeks)                                        │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Use DeepWiki as a CLI tool in your CI/CD pipeline.                │  │
│  │ No infrastructure to deploy. Just a GitHub Action + Claude API.   │  │
│  │ Best for: Individual projects, small teams, quick wins.           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  PATH B: TEAM-SCALE (4-8 weeks)                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Self-hosted DeepWiki server with webhook-driven generation.       │  │
│  │ Supports 5-20 projects with shared infrastructure.                │  │
│  │ Best for: Engineering teams, multi-repo organizations.            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  PATH C: ENTERPRISE (3-6 months)                                        │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Full platform deployment with multi-tenant, governance, plugins.  │  │
│  │ Kubernetes-based, SSO-integrated, compliance-ready.               │  │
│  │ Best for: Large organizations, regulated industries.              │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# PATH A: Lightweight Adoption (1-2 Weeks)

**Goal**: Get auto-generated documentation running for any single project in days.

## Phase A1: Bootstrap the CLI Tool (Days 1-3)

### What to Build

Extract the core engine into a standalone CLI package. This is the **minimum viable product**.

```
@deepwiki/cli/
├── src/
│   ├── commands/
│   │   ├── init.ts              # deepwiki init
│   │   ├── generate.ts          # deepwiki generate
│   │   └── validate.ts          # deepwiki validate
│   ├── parsers/
│   │   ├── ParserRegistry.ts
│   │   ├── TypeScriptParser.ts  # Start with TS only
│   │   └── GenericParser.ts     # Regex fallback for others
│   ├── graph/
│   │   ├── SimpleGraph.ts       # In-memory graph (no Neo4j yet)
│   │   └── ImpactAnalyzer.ts
│   ├── ai/
│   │   ├── ClaudeClient.ts      # Direct Anthropic API calls
│   │   ├── PromptEngine.ts      # Template-based prompts
│   │   └── templates/           # Prompt templates (markdown files)
│   ├── synthesis/
│   │   ├── MarkdownGenerator.ts
│   │   └── DocumentAssembler.ts
│   └── index.ts
├── templates/                    # Wiki output templates
├── package.json
└── tsconfig.json
```

### Implementation Steps

```
Step 1: Set up the CLI project
─────────────────────────────
mkdir deepwiki-cli && cd deepwiki-cli
npm init -y
npm install typescript commander @anthropic-ai/sdk ts-morph glob yaml
npm install -D @types/node tsx

# Use commander.js for CLI framework
# Use ts-morph for TypeScript parsing
# Use @anthropic-ai/sdk for Claude API

Step 2: Implement the "init" command
─────────────────────────────────────
# deepwiki init
# - Scans the project directory
# - Auto-detects language, framework, project type
# - Generates deepwiki.config.yaml with sensible defaults
# - Creates docs/wiki/ output directory

Step 3: Implement the TypeScript parser
───────────────────────────────────────
# Reuse the TypeScriptParser design from 03-CORE-ENGINE.md
# Parse: classes, functions, interfaces, routes, DTOs, entities
# Build: in-memory SimpleGraph (Map-based, no external DB)

Step 4: Implement the prompt engine
────────────────────────────────────
# Load prompt templates from markdown files
# Populate with code context from parser output
# Call Claude API with streaming

Step 5: Implement the "generate" command
────────────────────────────────────────
# deepwiki generate --mode full
# Pipeline: parse → graph → prompt → Claude → markdown → write files
```

### How to Onboard a New Project (After CLI is Built)

```bash
# 1. Install the CLI
npm install -g @deepwiki/cli

# 2. Navigate to any project
cd /path/to/your-project

# 3. Initialize DeepWiki
deepwiki init
# → Creates deepwiki.config.yaml (edit to customize)

# 4. Set your API key
export ANTHROPIC_API_KEY=sk-ant-xxx

# 5. Generate documentation
deepwiki generate --mode full --verbose
# → Creates docs/wiki/ with full documentation

# 6. Preview locally
deepwiki serve --port 4000
# → Open http://localhost:4000
```

### Supported Project Types (Day 1)

Start with these — add more later via parsers/adapters:

| Project Type | Parser | What Gets Documented |
|-------------|--------|---------------------|
| TypeScript/Node.js (Express, NestJS) | ts-morph | APIs, services, entities, DTOs, middleware |
| Python (FastAPI, Django, Flask) | tree-sitter-python (Phase A2) | Endpoints, models, views, serializers |
| Any language | GenericParser (regex) | Functions, classes, imports (basic) |

## Phase A2: CI/CD Integration (Days 4-7)

### Add to Any Project's GitHub Actions

```yaml
# Copy this into any project's .github/workflows/deepwiki.yml

name: DeepWiki Auto-Update
on:
  push:
    branches: [main]
    paths-ignore: ['docs/wiki/**']

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install DeepWiki CLI
        run: npm install -g @deepwiki/cli

      - name: Generate docs
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: deepwiki generate --mode incremental --base-ref HEAD~1

      - name: Commit & push
        run: |
          git config user.name "DeepWiki Bot"
          git config user.email "deepwiki@noreply.github.com"
          git add docs/wiki/
          git diff --staged --quiet || git commit -m "docs(wiki): auto-update"
          git push
```

### Onboarding Checklist for New Projects (Path A)

```
□ Step 1: Add deepwiki.config.yaml to project root
□ Step 2: Add ANTHROPIC_API_KEY to GitHub repo secrets
□ Step 3: Copy the GitHub Actions workflow file
□ Step 4: Run first full generation manually: deepwiki generate --mode full
□ Step 5: Commit the generated docs/wiki/ directory
□ Step 6: Merge to main — auto-updates are now live

Time per project: ~30 minutes after CLI is built
```

---

# PATH B: Team-Scale Adoption (4-8 Weeks)

**Goal**: Centralized DeepWiki service managing documentation for 5-20 projects.

## Phase B1: Core Server (Weeks 1-3)

### Architecture to Build

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │ Webhook  │────▶│ Generation   │────▶│ Wiki Storage │    │
│  │ Receiver │     │ Queue        │     │ (Git repos)  │    │
│  │ (Express)│     │ (Redis/Bull) │     │              │    │
│  └──────────┘     └──────┬───────┘     └──────────────┘    │
│                          │                                   │
│                   ┌──────▼───────┐                           │
│                   │ Workers      │                           │
│                   │ (CLI engine  │                           │
│                   │  as library) │                           │
│                   └──────────────┘                           │
│                                                              │
│  ┌──────────┐     ┌──────────────┐                          │
│  │ REST API │     │ PostgreSQL   │                          │
│  │ (Express)│────▶│ (metadata,   │                          │
│  │          │     │  runs, costs)│                          │
│  └──────────┘     └──────────────┘                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Implementation Roadmap

```
Week 1: Server foundation
──────────────────────────
├── Express API server with project CRUD
├── PostgreSQL schema: projects, generation_runs, pages
├── Redis + BullMQ for job queuing
├── Webhook receiver (GitHub signature validation)
└── Reuse @deepwiki/cli engine as a library (not a CLI binary)

Week 2: Multi-project support
──────────────────────────────
├── Project registration API
├── Per-project configuration storage
├── Git clone/fetch management (shared cache)
├── Concurrent generation with project isolation
├── Cost tracking per project
└── Basic dashboard (project list, run status, costs)

Week 3: Incremental generation
───────────────────────────────
├── Git diff analysis (base..head)
├── Change-to-section mapping
├── Content-addressed caching (Redis)
├── Skip unchanged sections
└── Partial publish on partial success
```

### Deploy with Docker Compose

Use the `docker-compose.yml` from [09-DEPLOYMENT.md](./09-DEPLOYMENT.md).

```bash
# Clone the DeepWiki server
git clone https://github.com/your-org/deepwiki-server
cd deepwiki-server

# Configure
cp .env.example .env
# Edit .env: set ANTHROPIC_API_KEY, DB_PASSWORD, etc.

# Launch
docker compose up -d

# Register your first project
curl -X POST http://localhost:3100/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "HR Admin Backend",
    "provider": "github",
    "owner": "ranjitsarmaTD",
    "repo": "ClaudePOC",
    "branch": "main"
  }'

# Configure the webhook in GitHub:
# Settings → Webhooks → Add webhook
# URL: https://your-server/api/v1/webhooks/github?project=proj_xxx
# Content type: application/json
# Secret: (from registration response)
# Events: Push events
```

### Onboarding New Projects (Path B)

```
┌─────────────────────────────────────────────────────────────────┐
│             NEW PROJECT ONBOARDING WORKFLOW (Path B)             │
│                                                                  │
│  Step 1: REGISTER via API or Dashboard                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ POST /api/v1/projects                                      │  │
│  │ Provide: git URL, branch, include/exclude patterns         │  │
│  │ Returns: project ID, webhook URL, webhook secret           │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Step 2: CONFIGURE webhook in git provider                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ GitHub: Settings → Webhooks → Add webhook                  │  │
│  │ GitLab: Settings → Webhooks → Add webhook                  │  │
│  │ Bitbucket: Repository settings → Webhooks → Add            │  │
│  │                                                            │  │
│  │ Payload URL: https://deepwiki.internal/api/v1/webhooks/gh  │  │
│  │ Secret: (from step 1)                                      │  │
│  │ Events: Push to main branch                                │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Step 3: ADD deepwiki.config.yaml to project (optional)          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ If not present, DeepWiki uses auto-detected defaults.      │  │
│  │ If present, project-specific overrides take effect.        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Step 4: TRIGGER first full generation                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ POST /api/v1/projects/{id}/generate { "mode": "full" }    │  │
│  │ Or: Dashboard → Project → "Generate Now" button            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Step 5: DONE — Auto-updates happen on every push to main        │
│                                                                  │
│  Time per project: ~10 minutes (mostly webhook setup)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Phase B2: Quality & Governance (Weeks 4-6)

```
Week 4: Validation & quality
─────────────────────────────
├── Quality scoring algorithm (from 07-GOVERNANCE.md)
├── Link validation (no broken internal links)
├── Metadata schema enforcement
├── Generation report with cost breakdown
└── Slack/Teams notification on generation complete

Week 5: Drift detection
────────────────────────
├── Scheduled drift check (daily cron job)
├── Drift report API endpoint
├── Dashboard: drift status badges per project
├── Alert when drift score exceeds threshold
└── One-click "fix drift" → triggers incremental generation

Week 6: Caching & optimization
───────────────────────────────
├── Content-addressed AI response cache
├── Model selection per section type (Opus/Sonnet/Haiku)
├── Prompt caching (reuse system prompts across sections)
├── Cost dashboard with savings report
└── Budget enforcement (per-project limits)
```

## Phase B3: Search & Consumption (Weeks 7-8)

```
Week 7: Search & MCP
─────────────────────
├── Full-text search across all project wikis (Meilisearch)
├── MCP server implementation (so Claude Code can query docs)
├── Static site generation (Docusaurus/VitePress)
└── Per-project wiki URLs

Week 8: Dashboard & polish
──────────────────────────
├── Web dashboard: project list, run history, costs, drift
├── User management (simple API keys)
├── CLI tool for interacting with server
└── Documentation for the DeepWiki server itself (meta!)
```

---

# PATH C: Enterprise Adoption (3-6 Months)

**Goal**: Full platform with multi-tenant, governance, plugins, Kubernetes deployment.

## Quarterly Roadmap

```
┌─────────────────────────────────────────────────────────────────┐
│                 ENTERPRISE ROADMAP                               │
│                                                                  │
│  Q1: FOUNDATION (Months 1-3)                                     │
│  ═════════════════════════════                                    │
│                                                                  │
│  Month 1: Core Platform                                          │
│  ├── Everything from Path B (Phases B1-B3)                       │
│  ├── Kubernetes Helm chart                                       │
│  ├── Horizontal scaling (worker auto-scaling on queue depth)     │
│  └── Observability (Prometheus metrics, Grafana dashboards)      │
│                                                                  │
│  Month 2: Multi-Tenant                                           │
│  ├── Tenant isolation (schema-per-tenant in PostgreSQL)          │
│  ├── SSO integration (SAML/OIDC)                                 │
│  ├── RBAC (Admin, Project Owner, Contributor, Viewer)            │
│  ├── Per-tenant billing and cost tracking                        │
│  └── Tenant onboarding self-service portal                       │
│                                                                  │
│  Month 3: Governance & Compliance                                │
│  ├── Approval workflows (auto/conditional/full-review)           │
│  ├── Audit logging (immutable trail of all generations)          │
│  ├── Wiki version control (git-backed with rollback)             │
│  ├── Data retention policies                                     │
│  └── SOC2 / compliance documentation                             │
│                                                                  │
│  Q2: EXTENSIBILITY (Months 4-6)                                  │
│  ═══════════════════════════════                                  │
│                                                                  │
│  Month 4: Plugin System                                          │
│  ├── Plugin SDK and lifecycle manager                            │
│  ├── Built-in plugins: OpenAPI, Database Schema, Docker, K8s     │
│  ├── Custom wiki section registration                            │
│  └── Plugin marketplace (internal)                               │
│                                                                  │
│  Month 5: Multi-Language & Domain Adapters                       │
│  ├── Python parser (tree-sitter)                                 │
│  ├── Java parser (tree-sitter)                                   │
│  ├── Go parser (tree-sitter)                                     │
│  ├── Domain adapters: REST API, gRPC, GraphQL, Event-Driven      │
│  └── Frontend adapter (React component catalog)                  │
│                                                                  │
│  Month 6: Knowledge Graph & RAG                                  │
│  ├── Neo4j integration for persistent knowledge graph            │
│  ├── Embedding pipeline (pgvector)                               │
│  ├── RAG-powered search and question answering                   │
│  ├── Cross-repo knowledge linking                                │
│  └── "Ask DeepWiki" chatbot for developers                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

# How to Onboard ANY Project (Universal Guide)

Regardless of which path you choose, here's the universal checklist:

## Quick-Start for a New Project

### 1. Assess the Project

```bash
# What language? What framework? How big?
# DeepWiki auto-detects, but it helps to know upfront.

# Project type mapping:
# ┌──────────────────────┬────────────────┬──────────────────────┐
# │ Project Type         │ Primary Parser │ Key Sections         │
# ├──────────────────────┼────────────────┼──────────────────────┤
# │ Express/NestJS API   │ TypeScript     │ API, Services, DB    │
# │ React/Next.js App    │ TypeScript     │ Components, State    │
# │ FastAPI/Django       │ Python         │ API, Models, Views   │
# │ Spring Boot          │ Java           │ Controllers, JPA     │
# │ Go microservice      │ Go             │ Handlers, Models     │
# │ Airflow/Spark        │ Python         │ DAGs, Transforms     │
# │ Terraform/K8s        │ HCL/YAML       │ Resources, Modules   │
# │ Monorepo (mixed)     │ Multi-parser   │ Per-package + system │
# └──────────────────────┴────────────────┴──────────────────────┘
```

### 2. Create the Config File

```yaml
# deepwiki.config.yaml — drop this in any project root

deepwiki:
  version: "1.0"

  project:
    name: "Your Project Name"            # ← Change this
    type: "backend-api"                  # ← backend-api | frontend | fullstack | data-pipeline | library
    languages:
      - typescript                       # ← Your primary language
    framework: "express"                 # ← Your framework

  source:
    include:
      - "src/**"                         # ← Where your source code lives
    exclude:
      - "**/*.test.*"
      - "**/*.spec.*"
      - "dist/**"
      - "node_modules/**"
      - ".git/**"

  generation:
    mode: "incremental"
    sections:                            # ← Pick what you need
      - system_overview
      - architecture
      - api_reference
      - database_schema
      - service_docs
      - developer_guide

  ai:
    defaultModel: "claude-sonnet-4-5-20250929"
    maxCostBudget: 10.00                 # ← USD per generation run
```

### 3. Generate

```bash
# Path A (CLI):
deepwiki generate --mode full

# Path B/C (Server):
curl -X POST https://deepwiki.internal/api/v1/projects/{id}/generate \
  -d '{"mode": "full"}'
```

### 4. Review and Ship

```bash
# Preview
deepwiki serve --port 4000

# Commit
git add docs/wiki/
git commit -m "docs(wiki): add DeepWiki-generated documentation"
git push
```

---

## Cross-Project Configuration Patterns

### Pattern 1: Monorepo with Multiple Services

```yaml
# deepwiki.config.yaml at monorepo root
deepwiki:
  project:
    name: "Platform Monorepo"
    type: "monorepo"

  source:
    discovery:
      strategy: "workspace"
      roots:
        - "packages/*"
        - "services/*"
        - "libs/*"

  output:
    strategy: "hybrid"
    # Produces:
    # docs/wiki/               ← System-level wiki
    # packages/auth/docs/wiki/ ← Per-package wiki
    # services/api/docs/wiki/  ← Per-service wiki
```

### Pattern 2: Microservices (Separate Repos)

```yaml
# Each service gets its own deepwiki.config.yaml
# PLUS a "system" project that aggregates them

# In the system/infra repo:
deepwiki:
  project:
    name: "Platform System Overview"
    type: "system"

  source:
    aggregateFrom:
      - { provider: "github", owner: "org", repo: "auth-service" }
      - { provider: "github", owner: "org", repo: "user-service" }
      - { provider: "github", owner: "org", repo: "payment-service" }
      - { provider: "github", owner: "org", repo: "notification-service" }

  generation:
    sections:
      - system_overview           # Cross-service architecture
      - architecture              # Service dependency map
      - workflow                  # Cross-service workflows
      - infrastructure            # Shared infra docs
```

### Pattern 3: Data Engineering Pipeline

```yaml
deepwiki:
  project:
    name: "Analytics Pipeline"
    type: "data-pipeline"
    languages: [python]
    framework: "airflow"

  source:
    include:
      - "dags/**"
      - "transformations/**"
      - "schemas/**"
      - "models/**"

  generation:
    sections:
      - system_overview
      - architecture
      - data_pipeline             # Custom section (via plugin)
      - database_schema
      - workflow
      - runbook

  plugins:
    - name: "data-pipeline"
      config:
        dagDiscovery: "dags/"
        schemaPath: "schemas/"
```

---

## Priority Implementation Order

If you're starting from scratch, build in this order:

```
┌─────────────────────────────────────────────────────────────────┐
│              RECOMMENDED BUILD ORDER                             │
│                                                                  │
│  WEEK 1-2: MVP (one project, full generation)                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 1. TypeScript parser (ts-morph)                            │  │
│  │ 2. Simple in-memory graph                                  │  │
│  │ 3. Prompt templates (system_overview + api_reference)      │  │
│  │ 4. Claude API client with streaming                        │  │
│  │ 5. Markdown generator                                      │  │
│  │ 6. CLI: deepwiki init + deepwiki generate                  │  │
│  │                                                            │  │
│  │ TEST: Generate docs for your HR Admin Backend project      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  WEEK 3-4: Incremental + CI/CD                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 7. Git diff analyzer                                       │  │
│  │ 8. Change-to-section mapping                               │  │
│  │ 9. Content-addressed caching                               │  │
│  │ 10. GitHub Actions workflow template                       │  │
│  │                                                            │  │
│  │ TEST: Make a code change, verify only affected docs update │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  WEEK 5-6: Multi-project                                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 11. Server with project registration API                   │  │
│  │ 12. Webhook receiver                                       │  │
│  │ 13. Job queue (BullMQ)                                     │  │
│  │ 14. Cost tracking                                          │  │
│  │                                                            │  │
│  │ TEST: Register 3 different projects, trigger via webhook   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  WEEK 7-8: Quality + consumption                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 15. Quality scoring                                        │  │
│  │ 16. Drift detection                                        │  │
│  │ 17. MCP server (so AI tools can query your wikis)          │  │
│  │ 18. Static site generation                                 │  │
│  │ 19. Web dashboard                                          │  │
│  │                                                            │  │
│  │ TEST: Claude Code can answer questions about your projects │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  MONTH 3+: Scale (as needed)                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 20. Additional language parsers (Python, Java, Go)         │  │
│  │ 21. Plugin system                                          │  │
│  │ 22. Multi-tenant support                                   │  │
│  │ 23. Knowledge graph (Neo4j)                                │  │
│  │ 24. RAG pipeline                                           │  │
│  │ 25. Kubernetes deployment                                  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Estimates Per Project

```
┌─────────────────────────────────────────────────────────────────┐
│              ESTIMATED AI COSTS PER PROJECT                     │
│                                                                  │
│  First full generation:                                          │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Small project (< 100 files):    $2 - $5                  │  │
│  │  Medium project (100-500 files): $5 - $15                  │  │
│  │  Large project (500+ files):     $15 - $40                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Subsequent incremental updates (per PR merge):                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Typical PR (5-10 files):        $0.30 - $1.00             │  │
│  │  Large PR (20-50 files):         $1.00 - $3.00             │  │
│  │  With caching (70% hit rate):    30-50% less               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Monthly estimate (active project, 20 merges/month):             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Using Sonnet for most sections: $10 - $30/month           │  │
│  │  Using Haiku for simple docs:    $5 - $15/month            │  │
│  │  Using Opus for everything:      $50 - $150/month          │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Recommendation: Use Sonnet as default, Opus only for           │
│  architecture/ADR sections. This gives 80% of the quality       │
│  at 20% of the Opus cost.                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Immediate Next Steps for Your Organization

```
TODAY:
  □ Pick your adoption path (A, B, or C)
  □ Set up an Anthropic API key for the team

THIS WEEK:
  □ Create the @deepwiki/cli package scaffold
  □ Implement TypeScript parser using ts-morph
  □ Write 2 prompt templates (system_overview + api_reference)
  □ Test: Generate docs for ClaudePOC (your current project)

NEXT WEEK:
  □ Add remaining prompt templates (service_docs, database_schema, etc.)
  □ Implement incremental mode (git diff → targeted regeneration)
  □ Create GitHub Actions reusable workflow
  □ Onboard 2-3 more projects to validate the framework

MONTH 1:
  □ Evaluate: Is CLI enough, or do we need a server? (Path A vs B)
  □ If Path B: Start server implementation
  □ Publish CLI as internal npm package
  □ Create onboarding docs for other teams
```
