# 10. Extensibility Model

## 10.1 Plugin Architecture

### Plugin Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLUGIN ARCHITECTURE                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 Plugin Manager                            │   │
│  │                                                           │   │
│  │  Lifecycle:                                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │ Discover │→│ Validate │→│ Register │→│ Execute  │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  │                                                           │   │
│  │  Discovery sources:                                       │   │
│  │  ├── Built-in plugins (bundled with DeepWiki)             │   │
│  │  ├── npm packages (@deepwiki/plugin-*)                    │   │
│  │  ├── Local plugins (./deepwiki-plugins/)                  │   │
│  │  └── Config-specified (deepwiki.config.yaml plugins:[])   │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 Hook Points                               │   │
│  │                                                           │   │
│  │  1. PARSE PHASE                                           │   │
│  │     ├── beforeParse(files)     → modify file list         │   │
│  │     ├── registerParser(reg)    → add custom parser        │   │
│  │     └── afterParse(results)    → enrich parse results     │   │
│  │                                                           │   │
│  │  2. GRAPH PHASE                                           │   │
│  │     ├── beforeGraphBuild(pr)   → inject extra nodes       │   │
│  │     ├── afterGraphBuild(graph) → post-process graph       │   │
│  │     └── registerEdgeType(type) → custom relationship      │   │
│  │                                                           │   │
│  │  3. CONTEXT PHASE                                         │   │
│  │     ├── enrichContext(ctx)     → add extra context         │   │
│  │     └── registerDataSource()  → external data for context │   │
│  │                                                           │   │
│  │  4. GENERATION PHASE                                      │   │
│  │     ├── beforeGenerate(req)   → modify generation request │   │
│  │     ├── registerTemplate(tpl) → add custom prompt template│   │
│  │     ├── registerSection(sec)  → add custom wiki section   │   │
│  │     └── afterGenerate(result) → post-process AI output    │   │
│  │                                                           │   │
│  │  5. VALIDATION PHASE                                      │   │
│  │     ├── registerValidator(v)  → add custom validation rule│   │
│  │     └── afterValidate(report) → modify validation report  │   │
│  │                                                           │   │
│  │  6. PUBLISH PHASE                                         │   │
│  │     ├── beforePublish(wiki)   → final modifications       │   │
│  │     ├── registerPublisher()   → custom publish target     │   │
│  │     └── afterPublish(receipt) → post-publish actions       │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Plugin Interface

```typescript
interface IDeepWikiPlugin {
  /** Plugin metadata */
  name: string;
  version: string;
  description: string;
  author: string;

  /** Which hooks this plugin uses */
  hooks: PluginHookRegistration[];

  /** Plugin lifecycle */
  initialize(context: PluginContext): Promise<void>;
  dispose(): Promise<void>;
}

interface PluginContext {
  /** Project configuration */
  config: ProjectConfig;

  /** Logging */
  logger: Logger;

  /** Access to the knowledge graph (read-only during most hooks) */
  graph: KnowledgeGraph;

  /** Plugin-specific persistent storage */
  storage: PluginStorage;

  /** Register custom capabilities */
  registerParser(parser: ILanguageParser): void;
  registerTemplate(template: PromptTemplate): void;
  registerSection(section: WikiSectionDefinition): void;
  registerValidator(rule: ValidationRule): void;
  registerPublisher(publisher: IPublisher): void;
}

interface PluginHookRegistration {
  hook: string;                        // e.g., "afterParse", "enrichContext"
  priority: number;                    // 0-100, lower = runs first
  handler: PluginHookHandler;
}

type PluginHookHandler = (payload: unknown, context: PluginContext) => Promise<unknown>;
```

### Example Plugin: OpenAPI Enrichment

```typescript
const OpenAPIPlugin: IDeepWikiPlugin = {
  name: '@deepwiki/plugin-openapi',
  version: '1.0.0',
  description: 'Enriches API documentation with OpenAPI/Swagger spec data',
  author: 'DeepWiki Team',

  hooks: [
    {
      hook: 'enrichContext',
      priority: 10,
      handler: async (payload: ContextEnrichmentPayload, ctx: PluginContext) => {
        if (payload.sectionType !== 'api_reference') return payload;

        const specPath = ctx.config.plugins?.openapi?.specPath;
        if (!specPath) return payload;

        // Load and parse OpenAPI spec
        const spec = await loadOpenAPISpec(specPath);

        // Add parsed spec as additional context
        payload.additionalContext.push({
          type: 'openapi_spec',
          content: formatOpenAPIForContext(spec),
          priority: 0.9,
        });

        return payload;
      },
    },
    {
      hook: 'afterGraphBuild',
      priority: 20,
      handler: async (graph: KnowledgeGraph, ctx: PluginContext) => {
        const specPath = ctx.config.plugins?.openapi?.specPath;
        if (!specPath) return graph;

        const spec = await loadOpenAPISpec(specPath);

        // Add API endpoint nodes to the knowledge graph
        for (const [path, methods] of Object.entries(spec.paths)) {
          for (const [method, operation] of Object.entries(methods)) {
            graph.addNode({
              id: `openapi:${method}:${path}`,
              type: 'route',
              name: `${method.toUpperCase()} ${path}`,
              qualifiedName: `api.${operation.operationId}`,
              tags: operation.tags ?? [],
              metadata: {
                summary: operation.summary,
                parameters: operation.parameters,
                requestBody: operation.requestBody,
                responses: operation.responses,
              },
            });
          }
        }

        return graph;
      },
    },
  ],

  async initialize(ctx: PluginContext) {
    ctx.logger.info('OpenAPI plugin initialized');
  },

  async dispose() {
    // Cleanup
  },
};
```

---

## 10.2 Custom Documentation Templates

### Template SDK

```typescript
interface WikiSectionDefinition {
  /** Unique identifier for this section */
  id: string;

  /** Display name */
  name: string;

  /** Where in the wiki structure this section appears */
  position: number;                    // Sort order

  /** Output directory name */
  directory: string;

  /** When this section should be regenerated */
  triggers: {
    filePatterns: string[];             // Glob patterns
    layers: ArchitecturalLayer[];       // Architectural layers
    onChange: 'always' | 'api_surface' | 'implementation';
  };

  /** Prompt template for AI generation */
  promptTemplate: {
    system: string;
    user: string;
    temperature: number;
    model: 'opus' | 'sonnet' | 'haiku' | 'auto';
    maxOutputTokens: number;
  };

  /** Context requirements */
  context: {
    primaryFiles: string[];             // Glob patterns for primary context
    supportingFiles: string[];          // Additional context
    graphQuery?: string;                // Custom graph query
    includeExistingDocs: boolean;
  };

  /** Output pages */
  pages: Array<{
    id: string;
    filename: string;
    title: string;
  }>;

  /** Validation rules specific to this section */
  validation?: ValidationRule[];
}

// Example: Custom "Data Pipeline" section for data engineering projects
const dataPipelineSection: WikiSectionDefinition = {
  id: 'data_pipeline',
  name: 'Data Pipeline Documentation',
  position: 6,
  directory: '06-data-pipelines',
  triggers: {
    filePatterns: ['**/pipelines/**', '**/dags/**', '**/etl/**', '**/transformations/**'],
    layers: ['service', 'config'],
    onChange: 'always',
  },
  promptTemplate: {
    system: `You are a data engineering documentation expert. Generate comprehensive
             documentation for data pipelines including DAG structure, data lineage,
             transformation logic, scheduling, and monitoring.`,
    user: `Document the following data pipeline code. Include:
           1. Pipeline overview and purpose
           2. DAG structure (with Mermaid diagram)
           3. Data sources and sinks
           4. Transformation steps
           5. Scheduling and triggers
           6. Error handling and retry logic
           7. Data quality checks
           8. Monitoring and alerting

           Code context:
           {{CODE_CONTEXT}}

           Dependencies:
           {{DEPENDENCY_GRAPH}}`,
    temperature: 0.3,
    model: 'sonnet',
    maxOutputTokens: 8192,
  },
  context: {
    primaryFiles: ['**/pipelines/**', '**/dags/**'],
    supportingFiles: ['**/schemas/**', '**/models/**', '**/config/**'],
    includeExistingDocs: true,
  },
  pages: [
    { id: 'pipeline-overview', filename: 'index.md', title: 'Data Pipeline Overview' },
    { id: 'dag-structure', filename: 'dag-structure.md', title: 'DAG Structure' },
    { id: 'data-lineage', filename: 'data-lineage.md', title: 'Data Lineage' },
    { id: 'transformations', filename: 'transformations.md', title: 'Transformations' },
  ],
};
```

---

## 10.3 Domain-Specific Adapters

### Adapter Registry

```
┌─────────────────────────────────────────────────────────────────┐
│                DOMAIN-SPECIFIC ADAPTERS                         │
│                                                                  │
│  Built-in Adapters:                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  ┌────────────────┐  Extracts: API routes, controllers,  │   │
│  │  │ REST API       │  DTOs, middleware chains, auth config │   │
│  │  │ Adapter        │  Generates: API reference, endpoint   │   │
│  │  │                │  catalog, request/response schemas    │   │
│  │  └────────────────┘                                      │   │
│  │                                                          │   │
│  │  ┌────────────────┐  Extracts: gRPC services, messages,  │   │
│  │  │ gRPC           │  streaming patterns                   │   │
│  │  │ Adapter        │  Generates: Service reference,        │   │
│  │  │                │  message schemas, streaming docs      │   │
│  │  └────────────────┘                                      │   │
│  │                                                          │   │
│  │  ┌────────────────┐  Extracts: GraphQL types, queries,   │   │
│  │  │ GraphQL        │  mutations, subscriptions, resolvers  │   │
│  │  │ Adapter        │  Generates: Schema docs, query guide, │   │
│  │  │                │  resolver documentation               │   │
│  │  └────────────────┘                                      │   │
│  │                                                          │   │
│  │  ┌────────────────┐  Extracts: Event schemas, handlers,  │   │
│  │  │ Event-Driven   │  topics/queues, consumer groups       │   │
│  │  │ Adapter        │  Generates: Event catalog, flow       │   │
│  │  │                │  diagrams, handler documentation      │   │
│  │  └────────────────┘                                      │   │
│  │                                                          │   │
│  │  ┌────────────────┐  Extracts: React components, hooks,  │   │
│  │  │ Frontend       │  state management, routing            │   │
│  │  │ Adapter        │  Generates: Component catalog, state  │   │
│  │  │ (React/Vue/etc)│  flow, routing documentation          │   │
│  │  └────────────────┘                                      │   │
│  │                                                          │   │
│  │  ┌────────────────┐  Extracts: DAGs, transformations,    │   │
│  │  │ Data Pipeline  │  schemas, schedules                   │   │
│  │  │ Adapter        │  Generates: Pipeline docs, lineage,   │   │
│  │  │ (Airflow/Spark)│  transformation reference             │   │
│  │  └────────────────┘                                      │   │
│  │                                                          │   │
│  │  ┌────────────────┐  Extracts: Terraform resources,      │   │
│  │  │ Infrastructure │  modules, variables, outputs          │   │
│  │  │ Adapter        │  Generates: Resource inventory,       │   │
│  │  │ (Terraform/K8s)│  module reference, variable guide     │   │
│  │  └────────────────┘                                      │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Adapter Interface

```typescript
interface IDomainAdapter {
  /** Domain this adapter handles */
  domain: string;                      // e.g., "rest-api", "grpc", "react", "airflow"

  /** Auto-detection: can this adapter handle this project? */
  detect(project: ProjectStructure): DetectionResult;

  /** Enrich the knowledge graph with domain-specific nodes */
  enrichGraph(graph: KnowledgeGraph, project: ProjectStructure): Promise<KnowledgeGraph>;

  /** Provide domain-specific wiki sections */
  getSections(): WikiSectionDefinition[];

  /** Provide domain-specific prompt context */
  getContextEnrichment(section: WikiSectionType): ContextEnrichment[];

  /** Domain-specific validation rules */
  getValidationRules(): ValidationRule[];
}

interface DetectionResult {
  detected: boolean;
  confidence: number;                  // 0-1
  indicators: string[];                // What triggered detection
  // e.g., ["Found express routes", "Has swagger config", "Controllers use decorators"]
}

// Example detection for Express REST API:
class RestApiAdapter implements IDomainAdapter {
  domain = 'rest-api';

  detect(project: ProjectStructure): DetectionResult {
    const indicators: string[] = [];
    let confidence = 0;

    if (project.hasFile('**/routes/**')) {
      indicators.push('Route directory found');
      confidence += 0.3;
    }
    if (project.hasDependency('express')) {
      indicators.push('Express.js dependency');
      confidence += 0.3;
    }
    if (project.hasFile('**/controllers/**')) {
      indicators.push('Controller directory found');
      confidence += 0.2;
    }
    if (project.hasFile('**/swagger*') || project.hasFile('**/openapi*')) {
      indicators.push('OpenAPI spec found');
      confidence += 0.2;
    }

    return {
      detected: confidence >= 0.5,
      confidence: Math.min(1, confidence),
      indicators,
    };
  }

  // ... rest of implementation
}
```
