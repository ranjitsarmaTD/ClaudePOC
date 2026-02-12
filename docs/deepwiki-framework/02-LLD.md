# 2. Low-Level Design (LLD)

## 2.1 Module-Level Breakdown

```
deepwiki-framework/
│
├── packages/
│   │
│   ├── @deepwiki/core                    # Core engine (parser, graph, change detection)
│   │   ├── src/
│   │   │   ├── parsers/
│   │   │   │   ├── ParserRegistry.ts          # Language parser discovery & registration
│   │   │   │   ├── ILanguageParser.ts          # Parser interface contract
│   │   │   │   ├── TypeScriptParser.ts         # TS/JS parser (ts-morph)
│   │   │   │   ├── PythonParser.ts             # Python parser (tree-sitter)
│   │   │   │   ├── JavaParser.ts               # Java parser (tree-sitter)
│   │   │   │   ├── GoParser.ts                 # Go parser (tree-sitter)
│   │   │   │   ├── RustParser.ts               # Rust parser (tree-sitter)
│   │   │   │   ├── GenericParser.ts            # Fallback regex-based parser
│   │   │   │   └── ConfigParser.ts             # YAML/JSON/TOML/HCL parser
│   │   │   │
│   │   │   ├── graph/
│   │   │   │   ├── KnowledgeGraph.ts           # In-memory graph structure
│   │   │   │   ├── GraphBuilder.ts             # Constructs graph from parsed ASTs
│   │   │   │   ├── GraphSerializer.ts          # Serialize/deserialize to storage
│   │   │   │   ├── DependencyResolver.ts       # Resolves import/require chains
│   │   │   │   ├── ImpactAnalyzer.ts           # Given changes → affected graph nodes
│   │   │   │   └── GraphQueryEngine.ts         # Query graph for context assembly
│   │   │   │
│   │   │   ├── change-detection/
│   │   │   │   ├── GitDiffAnalyzer.ts          # Parses git diffs into structured changes
│   │   │   │   ├── ChangeClassifier.ts         # Classifies changes (code/config/docs/infra)
│   │   │   │   ├── ScopeResolver.ts            # Maps file changes to logical modules
│   │   │   │   └── IncrementalPlanner.ts       # Plans which sections to regenerate
│   │   │   │
│   │   │   ├── models/
│   │   │   │   ├── CodeEntity.ts               # Function, Class, Module, etc.
│   │   │   │   ├── Relationship.ts             # imports, extends, implements, calls
│   │   │   │   ├── ChangeSet.ts                # Set of file changes with metadata
│   │   │   │   ├── ImpactMap.ts                # Affected wiki sections
│   │   │   │   └── ProjectStructure.ts         # Top-level project model
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   └── package.json
│   │
│   ├── @deepwiki/ai                      # Claude integration layer
│   │   ├── src/
│   │   │   ├── orchestration/
│   │   │   │   ├── PromptEngine.ts             # Selects & populates prompt templates
│   │   │   │   ├── ContextAssembler.ts         # Builds context windows from graph
│   │   │   │   ├── ChunkingStrategy.ts         # Splits large contexts
│   │   │   │   ├── PromptTemplateRegistry.ts   # Manages prompt templates
│   │   │   │   └── ResponseParser.ts           # Parses Claude's structured output
│   │   │   │
│   │   │   ├── execution/
│   │   │   │   ├── ClaudeClient.ts             # Anthropic API wrapper
│   │   │   │   ├── RateLimiter.ts              # Token bucket rate limiter
│   │   │   │   ├── RetryPolicy.ts              # Exponential backoff with jitter
│   │   │   │   ├── BatchProcessor.ts           # Batches multiple sections
│   │   │   │   └── StreamHandler.ts            # Handles streaming responses
│   │   │   │
│   │   │   ├── optimization/
│   │   │   │   ├── CacheManager.ts             # Response caching (content-addressed)
│   │   │   │   ├── TokenCounter.ts             # Pre-flight token estimation
│   │   │   │   ├── CostTracker.ts              # Per-project cost accounting
│   │   │   │   ├── ModelSelector.ts            # Auto-selects model tier per task
│   │   │   │   └── DeduplicationEngine.ts      # Avoids regenerating unchanged sections
│   │   │   │
│   │   │   ├── rag/
│   │   │   │   ├── EmbeddingService.ts         # Generates embeddings for code chunks
│   │   │   │   ├── VectorStore.ts              # pgvector integration
│   │   │   │   ├── RetrievalPipeline.ts        # Retrieves relevant context
│   │   │   │   └── RerankingStrategy.ts        # Reranks retrieved chunks by relevance
│   │   │   │
│   │   │   ├── templates/
│   │   │   │   ├── system-overview.prompt.md
│   │   │   │   ├── architecture.prompt.md
│   │   │   │   ├── api-docs.prompt.md
│   │   │   │   ├── database-schema.prompt.md
│   │   │   │   ├── service-docs.prompt.md
│   │   │   │   ├── workflow-docs.prompt.md
│   │   │   │   ├── adr.prompt.md
│   │   │   │   ├── runbook.prompt.md
│   │   │   │   └── changelog.prompt.md
│   │   │   │
│   │   │   └── index.ts
│   │   │
│   │   └── package.json
│   │
│   ├── @deepwiki/synthesis                # Document generation & assembly
│   │   ├── src/
│   │   │   ├── TemplateRenderer.ts             # Mustache/Handlebars template engine
│   │   │   ├── MarkdownGenerator.ts            # Generates well-formed markdown
│   │   │   ├── CrossReferenceLinker.ts         # Resolves [[links]] and anchors
│   │   │   ├── TableOfContentsBuilder.ts       # Auto-generates TOC
│   │   │   ├── DiagramGenerator.ts             # Generates Mermaid/PlantUML diagrams
│   │   │   ├── DocumentAssembler.ts            # Composes final wiki bundle
│   │   │   └── AssetManager.ts                 # Manages images, diagrams, static files
│   │   │
│   │   └── package.json
│   │
│   ├── @deepwiki/governance               # Validation, drift detection, approval
│   │   ├── src/
│   │   │   ├── DriftDetector.ts                # Compares code state vs doc state
│   │   │   ├── CompletenessValidator.ts        # Checks all required sections exist
│   │   │   ├── LinkValidator.ts                # Validates internal/external links
│   │   │   ├── SchemaValidator.ts              # Validates metadata schema compliance
│   │   │   ├── ApprovalWorkflow.ts             # Routes docs for human review
│   │   │   ├── QualityScorer.ts                # Scores documentation quality (0-100)
│   │   │   └── AuditLogger.ts                  # Immutable audit trail
│   │   │
│   │   └── package.json
│   │
│   ├── @deepwiki/ingestion                # Git event handling
│   │   ├── src/
│   │   │   ├── WebhookReceiver.ts              # Express handler for git webhooks
│   │   │   ├── PollingScheduler.ts             # Cron-based polling for non-webhook repos
│   │   │   ├── EventNormalizer.ts              # Normalizes provider-specific events
│   │   │   ├── EventQueue.ts                   # Durable queue (Redis Streams / SQS)
│   │   │   ├── IdempotencyGuard.ts             # Prevents duplicate processing
│   │   │   └── adapters/
│   │   │       ├── GitHubAdapter.ts
│   │   │       ├── GitLabAdapter.ts
│   │   │       ├── BitbucketAdapter.ts
│   │   │       └── AzureDevOpsAdapter.ts
│   │   │
│   │   └── package.json
│   │
│   ├── @deepwiki/server                   # API server & MCP server
│   │   ├── src/
│   │   │   ├── api/
│   │   │   │   ├── routes/
│   │   │   │   ├── controllers/
│   │   │   │   ├── middlewares/
│   │   │   │   └── validators/
│   │   │   ├── mcp/
│   │   │   │   ├── McpServer.ts                # MCP protocol server
│   │   │   │   ├── tools/                      # MCP tool definitions
│   │   │   │   └── resources/                  # MCP resource definitions
│   │   │   └── index.ts
│   │   │
│   │   └── package.json
│   │
│   ├── @deepwiki/cli                      # CLI interface
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── init.ts                     # Initialize DeepWiki for a project
│   │   │   │   ├── generate.ts                 # Full or incremental generation
│   │   │   │   ├── validate.ts                 # Run validation checks
│   │   │   │   ├── serve.ts                    # Local dev server
│   │   │   │   ├── diff.ts                     # Show doc drift
│   │   │   │   └── config.ts                   # Manage configuration
│   │   │   └── index.ts
│   │   │
│   │   └── package.json
│   │
│   └── @deepwiki/plugins                  # Plugin SDK
│       ├── src/
│       │   ├── IPlugin.ts                      # Plugin interface
│       │   ├── PluginManager.ts                # Lifecycle management
│       │   ├── HookRegistry.ts                 # Plugin hook points
│       │   └── built-in/
│       │       ├── OpenAPIPlugin.ts            # Swagger/OpenAPI enrichment
│       │       ├── DatabaseSchemaPlugin.ts     # SQL schema parsing
│       │       ├── TerraformPlugin.ts          # Infrastructure docs
│       │       ├── DockerPlugin.ts             # Container docs
│       │       └── KubernetesPlugin.ts         # K8s manifest docs
│       │
│       └── package.json
│
├── deepwiki.config.yaml                    # Project configuration
├── turbo.json                              # Monorepo build orchestration
└── package.json                            # Root workspace
```

---

## 2.2 Internal Service Contracts

### 2.2.1 Parser Contract

```typescript
/**
 * Every language parser must implement this interface.
 * The framework discovers parsers via the ParserRegistry.
 */
interface ILanguageParser {
  /** File extensions this parser handles */
  supportedExtensions: string[];

  /** Language identifier */
  language: string;

  /** Parse a single file into structured code entities */
  parseFile(content: string, filePath: string): ParseResult;

  /** Extract import/dependency declarations */
  extractDependencies(content: string, filePath: string): Dependency[];

  /** Extract exported symbols (public API surface) */
  extractExports(content: string, filePath: string): ExportedSymbol[];
}

interface ParseResult {
  filePath: string;
  language: string;
  entities: CodeEntity[];
  dependencies: Dependency[];
  exports: ExportedSymbol[];
  metadata: FileMetadata;
  errors: ParseError[];
}

interface CodeEntity {
  id: string;                          // Deterministic: hash(filePath + name + kind)
  name: string;
  kind: EntityKind;                    // function | class | interface | enum | type | variable | module
  filePath: string;
  startLine: number;
  endLine: number;
  signature: string;                   // Full type signature
  docComment?: string;                 // Existing JSDoc/docstring
  visibility: 'public' | 'private' | 'protected' | 'internal';
  decorators: string[];                // @injectable, @Controller, etc.
  parameters?: ParameterInfo[];        // For functions/methods
  returnType?: string;                 // For functions/methods
  parentEntity?: string;               // For methods → parent class
  children: string[];                  // For classes → methods
  complexity: number;                  // Cyclomatic complexity estimate
}

type EntityKind =
  | 'function'
  | 'class'
  | 'interface'
  | 'enum'
  | 'type_alias'
  | 'variable'
  | 'module'
  | 'namespace'
  | 'decorator'
  | 'middleware'
  | 'route'
  | 'entity'
  | 'migration'
  | 'test'
  | 'config';
```

### 2.2.2 Graph Builder Contract

```typescript
interface IGraphBuilder {
  /** Build complete graph from all parse results */
  buildGraph(parseResults: ParseResult[]): KnowledgeGraph;

  /** Incrementally update graph with changed files */
  updateGraph(
    existing: KnowledgeGraph,
    changedFiles: ParseResult[],
    removedFiles: string[]
  ): KnowledgeGraph;
}

interface KnowledgeGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  metadata: GraphMetadata;

  /** Query methods */
  getNode(id: string): GraphNode | undefined;
  getNeighbors(id: string, direction: 'in' | 'out' | 'both'): GraphNode[];
  getSubgraph(rootId: string, depth: number): KnowledgeGraph;
  findPaths(from: string, to: string): GraphPath[];
  getModules(): ModuleNode[];
  getEntryPoints(): GraphNode[];
}

interface GraphNode {
  id: string;
  entity: CodeEntity;
  module: string;                      // Logical module (derived from directory structure)
  layer: ArchitecturalLayer;           // controller | service | repository | entity | util | config
  tags: string[];                      // Auto-detected: ['auth', 'crud', 'validation']
  importance: number;                  // 0-1 score based on connectivity
}

type ArchitecturalLayer =
  | 'controller'
  | 'service'
  | 'repository'
  | 'entity'
  | 'dto'
  | 'middleware'
  | 'route'
  | 'config'
  | 'util'
  | 'test'
  | 'migration'
  | 'unknown';

interface GraphEdge {
  id: string;
  source: string;                      // Node ID
  target: string;                      // Node ID
  relationship: RelationshipType;
  metadata?: Record<string, unknown>;
}

type RelationshipType =
  | 'imports'
  | 'exports'
  | 'extends'
  | 'implements'
  | 'calls'
  | 'injects'                          // DI injection
  | 'uses_type'
  | 'has_method'
  | 'has_field'
  | 'routes_to'                        // HTTP route → controller
  | 'validates_with'                   // DTO validation
  | 'persists_to'                      // Entity → database
  | 'migrates';                        // Migration → entity
```

### 2.2.3 AI Orchestration Contract

```typescript
interface IPromptEngine {
  /** Build a complete prompt for a specific documentation section */
  buildPrompt(request: GenerationRequest): BuiltPrompt;
}

interface GenerationRequest {
  sectionType: WikiSectionType;
  targetModule: string;
  codeContext: CodeContext;
  existingDocs?: string;
  graphContext: SubgraphContext;
  projectMeta: ProjectMetadata;
  generationConfig: GenerationConfig;
}

interface BuiltPrompt {
  systemPrompt: string;
  userPrompt: string;
  estimatedTokens: number;
  model: ModelSelection;
  temperature: number;
  maxTokens: number;
  metadata: {
    templateId: string;
    templateVersion: string;
    contextChunks: number;
  };
}

interface CodeContext {
  primaryFiles: FileContent[];         // Files directly relevant
  supportingFiles: FileContent[];      // Files for cross-reference context
  dependencies: DependencyInfo[];
  totalTokens: number;
}

type WikiSectionType =
  | 'system_overview'
  | 'architecture'
  | 'api_reference'
  | 'database_schema'
  | 'service_docs'
  | 'workflow'
  | 'infrastructure'
  | 'security'
  | 'observability'
  | 'release_notes'
  | 'adr'
  | 'runbook'
  | 'developer_guide'
  | 'onboarding_guide';
```

---

## 2.3 Data Models

### 2.3.1 Project Configuration

```yaml
# deepwiki.config.yaml — lives in the project root
deepwiki:
  version: "1.0"

  project:
    name: "HR Admin Backend"
    type: "backend-api"                    # backend-api | frontend | fullstack | data-pipeline | library
    languages:
      - typescript
    framework: "express"
    description: "HR Administration System Backend API"

  source:
    provider: "github"
    owner: "org-name"
    repo: "hr-admin-backend"
    branch: "main"
    include:
      - "src/**"
    exclude:
      - "**/*.test.ts"
      - "**/*.spec.ts"
      - "dist/**"
      - "node_modules/**"

  output:
    format: "markdown"
    destination: "./docs/wiki"             # Or a separate wiki repo URL
    staticSite:
      enabled: true
      generator: "docusaurus"              # docusaurus | mkdocs | vitepress

  generation:
    mode: "incremental"                    # full | incremental
    trigger: "on-merge"                    # on-merge | on-push | manual | scheduled
    schedule: "0 2 * * 1"                  # Cron (for scheduled mode)
    sections:
      - system_overview
      - architecture
      - api_reference
      - database_schema
      - service_docs
      - workflow
      - security
      - developer_guide
      - onboarding_guide

  ai:
    provider: "anthropic"
    defaultModel: "claude-sonnet-4-5-20250929"
    modelOverrides:
      architecture: "claude-opus-4-6"
      adr: "claude-opus-4-6"
      database_schema: "claude-haiku-4-5-20251001"
    maxTokenBudget: 500000                 # Per generation run
    maxCostBudget: 10.00                   # USD per generation run
    cacheEnabled: true
    cacheTTL: "7d"

  governance:
    approvalRequired: false
    qualityThreshold: 70                   # Minimum quality score (0-100)
    driftDetection: true
    maxDriftDays: 7                        # Alert if docs are >7 days stale

  plugins:
    - name: "openapi"
      config:
        specPath: "src/swagger.json"
    - name: "database-schema"
      config:
        connectionString: "${DB_URL}"
```

### 2.3.2 Generation Run Record

```typescript
interface GenerationRun {
  id: string;                              // UUID
  projectId: string;
  triggeredBy: 'webhook' | 'schedule' | 'manual' | 'cli';
  triggerEvent: {
    sourceCommit: string;
    sourceBranch: string;
    changedFiles: string[];
    commitMessage: string;
    author: string;
  };
  status: 'queued' | 'analyzing' | 'generating' | 'validating' | 'publishing' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration_ms?: number;

  analysis: {
    filesAnalyzed: number;
    entitiesDiscovered: number;
    graphNodesUpdated: number;
    impactedSections: WikiSectionType[];
  };

  generation: {
    sectionsGenerated: number;
    sectionsSkipped: number;              // Unchanged sections
    sectionsCached: number;               // Cache hits
    aiCalls: Array<{
      sectionType: WikiSectionType;
      model: string;
      inputTokens: number;
      outputTokens: number;
      cachedTokens: number;
      latency_ms: number;
      cost_usd: number;
    }>;
    totalTokens: { input: number; output: number; cached: number };
    totalCost_usd: number;
  };

  validation: {
    passed: boolean;
    qualityScore: number;
    issues: ValidationIssue[];
  };

  output: {
    wikiCommit?: string;
    deploymentUrl?: string;
    artifactPath?: string;
  };

  error?: {
    code: string;
    message: string;
    stackTrace?: string;
    failedSection?: WikiSectionType;
  };
}
```

---

## 2.4 Metadata Schema

Every generated wiki page carries front-matter metadata:

```yaml
---
# DeepWiki Page Metadata
deepwiki:
  pageId: "api-reference-employees"
  sectionType: "api_reference"
  title: "Employee API Reference"
  generatedAt: "2026-02-11T14:30:00Z"
  sourceCommit: "abc123def456"
  generatorVersion: "1.0.0"
  aiModel: "claude-sonnet-4-5-20250929"
  qualityScore: 87
  tokenUsage:
    input: 4200
    output: 1800
  sourceFiles:
    - "src/controllers/EmployeeController.ts"
    - "src/routes/employee.routes.ts"
    - "src/dtos/employee/create-employee.dto.ts"
    - "src/services/EmployeeService.ts"
  dependencies:
    - "api-reference-departments"
    - "database-schema-employees"
  tags:
    - "api"
    - "crud"
    - "employees"
  lastValidated: "2026-02-11T14:35:00Z"
  driftStatus: "current"                    # current | stale | outdated
  approvalStatus: "auto-approved"           # auto-approved | pending | approved | rejected
---
```

---

## 2.5 API Definitions

### Public REST API

```yaml
openapi: "3.1.0"
info:
  title: DeepWiki Framework API
  version: "1.0.0"

paths:
  # ── Project Management ──
  /api/v1/projects:
    post:
      summary: Register a new project
      requestBody:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateProjectRequest"
      responses:
        "201":
          description: Project registered
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ProjectResponse"

    get:
      summary: List all registered projects
      parameters:
        - name: page
          in: query
          schema: { type: integer, default: 1 }
        - name: limit
          in: query
          schema: { type: integer, default: 20 }
      responses:
        "200":
          description: Project list

  /api/v1/projects/{projectId}:
    get:
      summary: Get project details
    put:
      summary: Update project configuration
    delete:
      summary: Unregister project

  # ── Generation ──
  /api/v1/projects/{projectId}/generate:
    post:
      summary: Trigger wiki generation
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                mode:
                  type: string
                  enum: [full, incremental]
                  default: incremental
                sections:
                  type: array
                  items:
                    type: string
                  description: Specific sections to regenerate (empty = all impacted)
                commitSha:
                  type: string
                  description: Specific commit to generate for (default = HEAD)
      responses:
        "202":
          description: Generation queued
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/GenerationRunResponse"

  /api/v1/projects/{projectId}/generations:
    get:
      summary: List generation runs
      parameters:
        - name: status
          in: query
          schema: { type: string, enum: [queued, analyzing, generating, completed, failed] }

  /api/v1/projects/{projectId}/generations/{runId}:
    get:
      summary: Get generation run details (includes cost, token usage, status)

  # ── Wiki Content ──
  /api/v1/projects/{projectId}/wiki:
    get:
      summary: Get wiki table of contents
      parameters:
        - name: version
          in: query
          schema: { type: string }
          description: Wiki version (default = latest)

  /api/v1/projects/{projectId}/wiki/{sectionPath}:
    get:
      summary: Get a specific wiki page
      parameters:
        - name: format
          in: query
          schema: { type: string, enum: [markdown, html, json] }
          default: markdown

  /api/v1/projects/{projectId}/wiki/search:
    get:
      summary: Search wiki content
      parameters:
        - name: q
          in: query
          required: true
          schema: { type: string }

  # ── Knowledge Graph ──
  /api/v1/projects/{projectId}/graph:
    get:
      summary: Get project knowledge graph summary

  /api/v1/projects/{projectId}/graph/query:
    post:
      summary: Query the knowledge graph
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                nodeId:
                  type: string
                depth:
                  type: integer
                  default: 2
                direction:
                  type: string
                  enum: [in, out, both]

  # ── Governance ──
  /api/v1/projects/{projectId}/drift:
    get:
      summary: Get documentation drift report

  /api/v1/projects/{projectId}/validate:
    post:
      summary: Run validation checks on current wiki

  # ── Webhooks ──
  /api/v1/webhooks/{provider}:
    post:
      summary: Receive git provider webhooks
      description: Endpoint for GitHub/GitLab/Bitbucket webhook delivery

components:
  schemas:
    CreateProjectRequest:
      type: object
      required: [name, provider, owner, repo]
      properties:
        name:
          type: string
          example: "HR Admin Backend"
        provider:
          type: string
          enum: [github, gitlab, bitbucket, azure_devops]
        owner:
          type: string
          example: "org-name"
        repo:
          type: string
          example: "hr-admin-backend"
        branch:
          type: string
          default: "main"
        config:
          $ref: "#/components/schemas/ProjectConfig"

    ProjectConfig:
      type: object
      properties:
        include:
          type: array
          items: { type: string }
        exclude:
          type: array
          items: { type: string }
        sections:
          type: array
          items: { type: string }
        aiModel:
          type: string
        maxTokenBudget:
          type: integer
        maxCostBudget:
          type: number

    ProjectResponse:
      type: object
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        provider: { type: string }
        fullName: { type: string }
        status: { type: string, enum: [active, generating, error] }
        lastGeneration: { type: string, format: date-time }
        wikiUrl: { type: string }
        createdAt: { type: string, format: date-time }

    GenerationRunResponse:
      type: object
      properties:
        runId: { type: string, format: uuid }
        status: { type: string }
        queuePosition: { type: integer }
        estimatedDuration: { type: string }
        statusUrl: { type: string }
```

---

## 2.6 Event-Driven Flows

The system uses an internal event bus for loose coupling between services:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EVENT BUS (Redis Streams / SQS)              │
│                                                                     │
│  Events:                                                            │
│  ┌────────────────────────┐                                        │
│  │ git.push.received      │ → Ingestion Gateway publishes          │
│  │ changeset.computed     │ → Analysis Engine publishes             │
│  │ impact.analyzed        │ → Analysis Engine publishes             │
│  │ graph.updated          │ → Analysis Engine publishes             │
│  │ context.assembled      │ → AI Orchestration publishes            │
│  │ section.generated      │ → AI Orchestration publishes (per sect) │
│  │ generation.completed   │ → AI Orchestration publishes            │
│  │ wiki.assembled         │ → Document Synthesis publishes          │
│  │ validation.completed   │ → Governance publishes                  │
│  │ wiki.published         │ → Delivery publishes                    │
│  │ drift.detected         │ → Governance publishes (async)          │
│  │ budget.exceeded        │ → Cost Tracker publishes                │
│  └────────────────────────┘                                        │
│                                                                     │
│  Consumers subscribe to relevant events:                            │
│  Analysis Engine  ← listens: git.push.received                     │
│  AI Orchestration ← listens: impact.analyzed                       │
│  Synthesis        ← listens: generation.completed                  │
│  Governance       ← listens: wiki.assembled                        │
│  Delivery         ← listens: validation.completed (if passed)      │
│  Notifications    ← listens: wiki.published, drift.detected,       │
│                      budget.exceeded, validation.completed (failed) │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Event Schema:**

```typescript
interface DeepWikiEvent<T = unknown> {
  eventId: string;                     // UUID v7 (time-ordered)
  eventType: string;                   // Dot-notation: "git.push.received"
  projectId: string;
  runId: string;                       // Generation run ID
  timestamp: string;                   // ISO 8601
  version: string;                     // Event schema version
  source: string;                      // Producing service
  correlationId: string;               // Traces across services
  payload: T;
}

// Example: section.generated event
interface SectionGeneratedPayload {
  sectionType: WikiSectionType;
  sectionPath: string;
  contentHash: string;
  tokenUsage: { input: number; output: number };
  model: string;
  cached: boolean;
  duration_ms: number;
}
```
