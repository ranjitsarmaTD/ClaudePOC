# 8. Scalability Considerations

## 8.1 Multi-Repo Support

### Architecture for Multi-Repo

```
┌─────────────────────────────────────────────────────────────────┐
│                   MULTI-REPO ORCHESTRATOR                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Project Registry                        │   │
│  │                                                           │   │
│  │  project-a (github/org/frontend)  ── config-a.yaml       │   │
│  │  project-b (github/org/api)       ── config-b.yaml       │   │
│  │  project-c (github/org/workers)   ── config-c.yaml       │   │
│  │  project-d (gitlab/team/ml-pipe)  ── config-d.yaml       │   │
│  │                                                           │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                  │                                               │
│  ┌───────────────▼──────────────────────────────────────────┐   │
│  │              Event Router                                 │   │
│  │                                                           │   │
│  │  Webhook received → match to registered project           │   │
│  │                   → route to project-specific queue        │   │
│  │                                                           │   │
│  │  Isolation: Each project has its own:                      │   │
│  │    • Event queue                                          │   │
│  │    • Knowledge graph                                      │   │
│  │    • Cache namespace                                      │   │
│  │    • Token budget                                         │   │
│  │    • Generation worker pool                               │   │
│  │                                                           │   │
│  └───────────────┬──────────────────────────────────────────┘   │
│                  │                                               │
│  ┌───────────────▼──────────────────────────────────────────┐   │
│  │              Worker Pool                                  │   │
│  │                                                           │   │
│  │  Workers are shared but work is project-isolated:         │   │
│  │                                                           │   │
│  │  Worker-1: ← project-a queue                              │   │
│  │  Worker-2: ← project-b queue                              │   │
│  │  Worker-3: ← project-a queue (high load)                  │   │
│  │  Worker-4: ← project-c queue                              │   │
│  │                                                           │   │
│  │  Scaling: Workers auto-scale based on queue depth         │   │
│  │  Fairness: Round-robin across projects to prevent         │   │
│  │            one project starving others                     │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Cross-Repo Documentation:                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Optional "system wiki" that aggregates across repos    │   │
│  │  • Cross-repo dependency mapping                          │   │
│  │  • Unified search across all project wikis                │   │
│  │  • Shared glossary and architecture overview              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Resource Isolation Per Project

```typescript
interface ProjectResources {
  projectId: string;

  compute: {
    maxConcurrentGenerations: number;    // Default: 1
    maxWorkers: number;                  // Default: 2
    queueMaxSize: number;               // Default: 100
    generationTimeout_ms: number;       // Default: 600_000 (10 min)
  };

  storage: {
    graphMaxNodes: number;               // Default: 100_000
    cacheMaxSize_mb: number;             // Default: 512
    embeddingMaxCount: number;           // Default: 50_000
    wikiMaxPages: number;                // Default: 500
  };

  ai: {
    maxTokenBudgetPerRun: number;        // Default: 500_000
    maxCostPerRun_usd: number;           // Default: 10.00
    maxCostPerDay_usd: number;           // Default: 50.00
    maxCostPerMonth_usd: number;         // Default: 500.00
    allowedModels: string[];             // Default: all models
  };
}
```

---

## 8.2 Multi-Tenant Support

```
┌─────────────────────────────────────────────────────────────────┐
│                   MULTI-TENANT ARCHITECTURE                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API GATEWAY                            │   │
│  │                                                           │   │
│  │  Request → Extract tenant from:                           │   │
│  │    • API key prefix (dwk_tenant1_xxx)                     │   │
│  │    • JWT claim (tenant_id)                                │   │
│  │    • Subdomain (tenant1.deepwiki.io)                      │   │
│  │                                                           │   │
│  │  Middleware injects tenant context into every request      │   │
│  │                                                           │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                  │                                               │
│  ┌───────────────▼──────────────────────────────────────────┐   │
│  │               TENANT ISOLATION LAYER                      │   │
│  │                                                           │   │
│  │  Data isolation strategy: SCHEMA-PER-TENANT               │   │
│  │                                                           │   │
│  │  PostgreSQL:                                              │   │
│  │  ├── Schema: tenant_acme     (projects, runs, metadata)   │   │
│  │  ├── Schema: tenant_globex   (projects, runs, metadata)   │   │
│  │  └── Schema: tenant_initech  (projects, runs, metadata)   │   │
│  │                                                           │   │
│  │  Redis:                                                   │   │
│  │  ├── Namespace: acme:cache:*                              │   │
│  │  ├── Namespace: globex:cache:*                            │   │
│  │  └── Namespace: initech:cache:*                           │   │
│  │                                                           │   │
│  │  Neo4j:                                                   │   │
│  │  ├── Database: tenant_acme                                │   │
│  │  ├── Database: tenant_globex                              │   │
│  │  └── Database: tenant_initech                             │   │
│  │                                                           │   │
│  │  Object Storage:                                          │   │
│  │  ├── Bucket: deepwiki-acme/                               │   │
│  │  ├── Bucket: deepwiki-globex/                             │   │
│  │  └── Bucket: deepwiki-initech/                            │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Tenant Configuration:                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  interface TenantConfig {                                 │   │
│  │    id: string;                                            │   │
│  │    name: string;                                          │   │
│  │    plan: 'free' | 'team' | 'enterprise';                 │   │
│  │    limits: {                                              │   │
│  │      maxProjects: number;        // free: 3, team: 20     │   │
│  │      maxGenerationsPerDay: number;                        │   │
│  │      maxCostPerMonth_usd: number;                         │   │
│  │      maxStorageGB: number;                                │   │
│  │      allowedModels: string[];                             │   │
│  │    };                                                     │   │
│  │    sso?: { provider: string; config: object };            │   │
│  │    apiKeys: string[];                                     │   │
│  │  }                                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8.3 Microservices Environments

### Documentation Strategy for Microservices

```
┌─────────────────────────────────────────────────────────────────┐
│            MICROSERVICES DOCUMENTATION MODEL                    │
│                                                                  │
│  Level 1: SYSTEM-LEVEL WIKI (cross-service)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Generated from: All service configs + API contracts      │   │
│  │                                                           │   │
│  │  Contains:                                                │   │
│  │  • System architecture overview                           │   │
│  │  • Service catalog (name, purpose, owner, endpoints)      │   │
│  │  • Inter-service communication map                        │   │
│  │  • Event bus / message queue topology                     │   │
│  │  • Shared libraries documentation                         │   │
│  │  • Cross-cutting concerns (auth, logging, tracing)        │   │
│  │                                                           │   │
│  │  Data sources:                                            │   │
│  │  • Service registry (Consul, K8s service discovery)       │   │
│  │  • OpenAPI specs from each service                        │   │
│  │  • Proto/gRPC definitions                                 │   │
│  │  • AsyncAPI specs (event schemas)                         │   │
│  │  • Docker compose / K8s manifests                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Level 2: SERVICE-LEVEL WIKI (per-service)                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Each microservice gets its own DeepWiki instance:        │   │
│  │                                                           │   │
│  │  service-a/docs/wiki/   (standard DeepWiki structure)     │   │
│  │  service-b/docs/wiki/                                     │   │
│  │  service-c/docs/wiki/                                     │   │
│  │                                                           │   │
│  │  Each includes:                                           │   │
│  │  • Service-specific API reference                         │   │
│  │  • Internal architecture                                  │   │
│  │  • Database schema (service's own DB)                     │   │
│  │  • Dependencies on other services                         │   │
│  │  • Runbooks specific to this service                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Cross-Referencing:                                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Links between system wiki and service wikis:             │   │
│  │                                                           │   │
│  │  system-wiki/service-catalog.md →                         │   │
│  │    links to → service-a/docs/wiki/api-reference/          │   │
│  │                                                           │   │
│  │  service-a/docs/wiki/dependencies.md →                    │   │
│  │    links to → service-b/docs/wiki/api-reference/          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8.4 Monorepo Compatibility

### Monorepo-Aware Module Discovery

```typescript
interface MonorepoConfig {
  // How to discover packages/services within the monorepo
  discovery: {
    strategy: 'workspace' | 'directory' | 'config';

    // For workspace strategy (npm/yarn/pnpm workspaces, Lerna)
    workspace?: {
      packageManager: 'npm' | 'yarn' | 'pnpm';
      // Auto-discovers from package.json workspaces field
    };

    // For directory strategy (each subdirectory is a package)
    directory?: {
      roots: string[];                   // e.g., ["packages/*", "services/*", "libs/*"]
      identifiers: string[];            // Files that identify a package: ["package.json", "Cargo.toml"]
    };

    // For config strategy (explicit listing)
    config?: {
      packages: Array<{
        name: string;
        path: string;
        type: 'service' | 'library' | 'app' | 'tool';
      }>;
    };
  };

  // How to handle shared code
  shared: {
    paths: string[];                     // e.g., ["shared/*", "common/*"]
    documentAs: 'library';               // Treated as internal libraries
  };

  // Wiki output strategy
  output: {
    strategy: 'unified' | 'per-package' | 'hybrid';

    // unified: One wiki for entire monorepo
    // per-package: Separate wiki per package
    // hybrid: System wiki + per-package wikis
  };
}
```

### Change Impact in Monorepos

```
Monorepo change impact is wider than single-repo:

packages/
├── shared/utils/           ← If this changes...
├── service-a/              ← ...these may be impacted
├── service-b/              ← ...because they depend on shared/utils
└── service-c/              ← ...transitively

Detection Strategy:
1. Parse all workspace package.json files
2. Build inter-package dependency graph
3. On change to shared/utils:
   a. Find all packages that depend on shared/utils
   b. Regenerate documentation for each impacted package
   c. Update system-level dependency documentation

Optimization:
- Only regenerate if the shared change affects the public API
- Use hash of exported symbols to detect API surface changes
- Internal implementation changes in shared code do NOT trigger
  downstream documentation regeneration
```

---

## 8.5 Performance Targets

```
┌─────────────────────────────────────────────────────────────────┐
│                 PERFORMANCE TARGETS (SLOs)                      │
│                                                                  │
│  Metric                          │ Target    │ Max Acceptable   │
│  ────────────────────────────────│───────────│─────────────────  │
│  Webhook-to-start latency        │ < 5s      │ < 30s            │
│  Small change (<5 files):        │           │                  │
│    Analysis time                 │ < 10s     │ < 30s            │
│    Generation time (per section) │ < 30s     │ < 120s           │
│    Total pipeline time           │ < 3 min   │ < 10 min         │
│                                  │           │                  │
│  Medium change (5-50 files):     │           │                  │
│    Analysis time                 │ < 30s     │ < 120s           │
│    Generation time (total)       │ < 5 min   │ < 15 min         │
│    Total pipeline time           │ < 8 min   │ < 20 min         │
│                                  │           │                  │
│  Full regeneration:              │           │                  │
│    Small project (<100 files)    │ < 5 min   │ < 15 min         │
│    Medium project (<1000 files)  │ < 15 min  │ < 45 min         │
│    Large project (1000+ files)   │ < 30 min  │ < 90 min         │
│                                  │           │                  │
│  Cache hit rate (incremental)    │ > 70%     │ > 50%            │
│  API availability                │ 99.9%     │ 99.5%            │
│  Wiki serving latency (P95)      │ < 200ms   │ < 500ms          │
│                                  │           │                  │
└─────────────────────────────────────────────────────────────────┘
```
