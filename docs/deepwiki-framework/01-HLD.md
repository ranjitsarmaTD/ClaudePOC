# 1. High-Level Architecture (HLD)

## 1.1 Core Components

The DeepWiki Framework is composed of **six primary bounded contexts**, each deployable independently:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEEPWIKI FRAMEWORK                               │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  1. INGESTION GATEWAY                         │  │
│  │                                                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │  Webhook   │  │  Polling   │  │  CLI       │             │  │
│  │  │  Receiver  │  │  Scheduler │  │  Trigger   │             │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │  │
│  │        └───────────────┼───────────────┘                     │  │
│  │                        ▼                                      │  │
│  │              ┌─────────────────┐                              │  │
│  │              │  Change Event   │                              │  │
│  │              │  Normalizer     │                              │  │
│  │              └────────┬────────┘                              │  │
│  └───────────────────────┼──────────────────────────────────────┘  │
│                          ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  2. ANALYSIS ENGINE                           │  │
│  │                                                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │  Language   │  │  Dependency │  │  Change   │             │  │
│  │  │  Parsers    │  │  Resolver   │  │  Detector │             │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │  │
│  │        └───────────────┼───────────────┘                     │  │
│  │                        ▼                                      │  │
│  │              ┌─────────────────┐                              │  │
│  │              │  Knowledge      │                              │  │
│  │              │  Graph Builder  │                              │  │
│  │              └────────┬────────┘                              │  │
│  └───────────────────────┼──────────────────────────────────────┘  │
│                          ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  3. AI ORCHESTRATION LAYER                    │  │
│  │                                                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │  Prompt    │  │  Context   │  │  RAG       │             │  │
│  │  │  Engine    │  │  Manager   │  │  Pipeline  │             │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │  │
│  │        └───────────────┼───────────────┘                     │  │
│  │                        ▼                                      │  │
│  │              ┌─────────────────┐                              │  │
│  │              │  Claude API     │                              │  │
│  │              │  Gateway        │                              │  │
│  │              └────────┬────────┘                              │  │
│  └───────────────────────┼──────────────────────────────────────┘  │
│                          ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  4. DOCUMENT SYNTHESIS                         │  │
│  │                                                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │  Template  │  │  Markdown  │  │  Cross-Ref │             │  │
│  │  │  Renderer  │  │  Generator │  │  Linker    │             │  │
│  │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │  │
│  │        └───────────────┼───────────────┘                     │  │
│  │                        ▼                                      │  │
│  │              ┌─────────────────┐                              │  │
│  │              │  Document       │                              │  │
│  │              │  Assembler      │                              │  │
│  │              └────────┬────────┘                              │  │
│  └───────────────────────┼──────────────────────────────────────┘  │
│                          ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  5. GOVERNANCE & VALIDATION                   │  │
│  │                                                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │  Drift     │  │  Approval  │  │  Quality   │             │  │
│  │  │  Detector  │  │  Workflow  │  │  Validator │             │  │
│  │  └────────────┘  └────────────┘  └────────────┘             │  │
│  └───────────────────────┼──────────────────────────────────────┘  │
│                          ▼                                         │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                  6. DELIVERY & SERVING                        │  │
│  │                                                               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐             │  │
│  │  │  Static    │  │  API       │  │  MCP       │             │  │
│  │  │  Site Gen  │  │  Server    │  │  Server    │             │  │
│  │  └────────────┘  └────────────┘  └────────────┘             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1.2 Service Boundaries

| Service | Responsibility | Scaling Model | State |
|---------|---------------|---------------|-------|
| **Ingestion Gateway** | Receives git events, normalizes change sets | Horizontal (event-driven) | Stateless |
| **Analysis Engine** | Parses code, builds AST, resolves dependencies, constructs knowledge graph | Horizontal (worker pool) | Stateless (reads from git) |
| **AI Orchestration** | Manages Claude interactions — prompt construction, context windowing, response parsing | Horizontal (queue-based) | Stateless (cache-backed) |
| **Document Synthesis** | Renders templates, generates markdown, links cross-references | Horizontal | Stateless |
| **Governance** | Validates output, detects drift, enforces approval workflows | Single-leader | Stateful (approval state) |
| **Delivery** | Serves generated wiki via static site, API, or MCP | Horizontal (CDN-backed) | Read-heavy, cacheable |

---

## 1.3 End-to-End Data Flow

```
Developer pushes code
        │
        ▼
┌──────────────────┐
│ 1. GIT EVENT     │  Webhook / polling / CLI trigger
│    RECEIVED      │  Input: commit SHA, branch, changed files list
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 2. CHANGE SET    │  Diff analysis: which files changed?
│    COMPUTED      │  Classify: code vs config vs docs vs infra
│                  │  Output: ChangeSet { files[], changeType, scope }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 3. IMPACT        │  Which wiki sections are affected?
│    ANALYSIS      │  Consult dependency graph + knowledge graph
│                  │  Output: ImpactMap { sections[], priority, depth }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 4. CONTEXT       │  Build AI context for each affected section
│    ASSEMBLY      │  Pull relevant code, existing docs, graph nodes
│                  │  Apply chunking strategy for large contexts
│                  │  Output: ContextBundle[] { code, docs, graph, meta }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. AI            │  Send to Claude with section-specific prompts
│    GENERATION    │  Apply prompt templates per document type
│                  │  Parse structured responses
│                  │  Output: GeneratedContent[] { markdown, metadata }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 6. SYNTHESIS &   │  Merge AI output with template structure
│    ASSEMBLY      │  Resolve cross-references and links
│                  │  Generate table of contents
│                  │  Output: WikiBundle { pages[], toc, assets }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 7. VALIDATION    │  Check completeness, broken links, schema compliance
│    & GOVERNANCE  │  Drift detection against previous version
│                  │  Route for approval if required
│                  │  Output: ValidationReport { pass/fail, issues[] }
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 8. PUBLISH       │  Commit to wiki repo / deploy static site
│    & DELIVER     │  Invalidate CDN cache
│                  │  Emit completion event
│                  │  Output: DeploymentReceipt { url, version, sha }
└──────────────────┘
```

---

## 1.4 Integration with Code Repositories

### Git Provider Abstraction

```
┌─────────────────────────────────────────────────────┐
│              GitProviderAdapter (Interface)           │
│                                                       │
│  + cloneRepo(url, branch, depth): LocalRepo          │
│  + fetchDiff(base, head): DiffResult                 │
│  + listFiles(path, ref): FileEntry[]                 │
│  + readFile(path, ref): FileContent                  │
│  + getCommitHistory(path, since): Commit[]           │
│  + registerWebhook(url, events): WebhookId           │
│  + getBranches(): Branch[]                           │
│  + getTags(): Tag[]                                  │
└──────────┬──────────┬──────────┬─────────────────────┘
           │          │          │
    ┌──────┴──┐ ┌─────┴───┐ ┌───┴────────┐
    │ GitHub  │ │ GitLab  │ │ Bitbucket  │  ... extensible
    │ Adapter │ │ Adapter │ │ Adapter    │
    └─────────┘ └─────────┘ └────────────┘
```

**Webhook Event Normalization:**

```typescript
// All git providers normalize to this canonical event
interface NormalizedGitEvent {
  eventId: string;                    // Idempotency key
  provider: 'github' | 'gitlab' | 'bitbucket' | 'azure_devops';
  repository: {
    owner: string;
    name: string;
    fullName: string;                 // "owner/name"
    defaultBranch: string;
    cloneUrl: string;
  };
  ref: string;                        // "refs/heads/main"
  before: string;                     // Previous commit SHA
  after: string;                      // Current commit SHA
  commits: Array<{
    sha: string;
    message: string;
    author: string;
    timestamp: string;
    added: string[];
    modified: string[];
    removed: string[];
  }>;
  sender: string;
  timestamp: string;
}
```

---

## 1.5 AI Interaction Layer (High-Level)

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI INTERACTION LAYER                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                 PROMPT ORCHESTRATION                      │   │
│  │                                                          │   │
│  │  ┌────────────┐     ┌────────────┐     ┌────────────┐   │   │
│  │  │  Template  │────▶│  Context   │────▶│  Prompt    │   │   │
│  │  │  Registry  │     │  Assembler │     │  Builder   │   │   │
│  │  └────────────┘     └────────────┘     └─────┬──────┘   │   │
│  │                                              │          │   │
│  └──────────────────────────────────────────────┼──────────┘   │
│                                                  │              │
│  ┌──────────────────────────────────────────────┼──────────┐   │
│  │                 EXECUTION ENGINE              │          │   │
│  │                                               ▼          │   │
│  │  ┌────────────┐     ┌────────────┐     ┌────────────┐   │   │
│  │  │  Rate      │────▶│  Claude    │────▶│  Response  │   │   │
│  │  │  Limiter   │     │  API Call  │     │  Parser    │   │   │
│  │  └────────────┘     └────────────┘     └─────┬──────┘   │   │
│  │                                              │          │   │
│  └──────────────────────────────────────────────┼──────────┘   │
│                                                  │              │
│  ┌──────────────────────────────────────────────┼──────────┐   │
│  │                 OPTIMIZATION                  │          │   │
│  │                                               ▼          │   │
│  │  ┌────────────┐     ┌────────────┐     ┌────────────┐   │   │
│  │  │  Cache     │     │  Token     │     │  Cost      │   │   │
│  │  │  Manager   │     │  Counter   │     │  Tracker   │   │   │
│  │  └────────────┘     └────────────┘     └────────────┘   │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Model Selection Strategy:**

| Document Type | Model | Reasoning |
|--------------|-------|-----------|
| Architecture overviews | `claude-opus-4-6` | Requires deep reasoning, cross-system understanding |
| API documentation | `claude-sonnet-4-5-20250929` | Structured, pattern-based — Sonnet excels |
| Code comments / inline docs | `claude-haiku-4-5-20251001` | High volume, low complexity — cost optimize |
| ADR generation | `claude-opus-4-6` | Requires architectural judgment |
| Changelog / release notes | `claude-sonnet-4-5-20250929` | Summarization task |
| Schema documentation | `claude-haiku-4-5-20251001` | Mechanical transformation |

---

## 1.6 Storage Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                      STORAGE ARCHITECTURE                        │
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │   PRIMARY STORES     │     │   DERIVED STORES     │           │
│  │                      │     │                      │           │
│  │  ┌────────────────┐ │     │  ┌────────────────┐  │           │
│  │  │ Knowledge Graph │ │     │  │ Search Index   │  │           │
│  │  │ (Neo4j / Dgraph)│ │     │  │ (Elasticsearch)│  │           │
│  │  └────────────────┘ │     │  └────────────────┘  │           │
│  │                      │     │                      │           │
│  │  ┌────────────────┐ │     │  ┌────────────────┐  │           │
│  │  │ Wiki Content   │ │     │  │ Static Site    │  │           │
│  │  │ (Git Repo)     │ │     │  │ (CDN / S3)     │  │           │
│  │  └────────────────┘ │     │  └────────────────┘  │           │
│  │                      │     │                      │           │
│  │  ┌────────────────┐ │     │  ┌────────────────┐  │           │
│  │  │ Metadata DB    │ │     │  │ Embedding Store│  │           │
│  │  │ (PostgreSQL)   │ │     │  │ (pgvector)     │  │           │
│  │  └────────────────┘ │     │  └────────────────┘  │           │
│  │                      │     │                      │           │
│  │  ┌────────────────┐ │     │  ┌────────────────┐  │           │
│  │  │ Cache Layer    │ │     │  │ Audit Log      │  │           │
│  │  │ (Redis)        │ │     │  │ (Append-only)  │  │           │
│  │  └────────────────┘ │     │  └────────────────┘  │           │
│  │                      │     │                      │           │
│  └─────────────────────┘     └─────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Storage Decision Matrix:**

| Data | Store | Why |
|------|-------|-----|
| Knowledge graph (entities, relationships) | Neo4j / Dgraph | Native graph queries for dependency traversal |
| Generated wiki content | Git repository | Version control, diff, merge, branch — native to docs |
| Project metadata, configs, run history | PostgreSQL | Relational queries, ACID, mature ecosystem |
| AI response cache | Redis | Fast lookup, TTL-based expiration, low latency |
| Embeddings for RAG | pgvector (PostgreSQL extension) | Co-located with metadata, avoids separate vector DB |
| Search index | Elasticsearch / Meilisearch | Full-text search across generated documentation |
| Audit trail | Append-only log (PostgreSQL / S3) | Immutable record of all generation events |
| Static site artifacts | S3 / CDN | Fast global delivery of rendered documentation |

---

## 1.7 Versioning Mechanism

DeepWiki versions documentation using a **dual-versioning** strategy:

### Document Version (Semantic)

```
wiki-version := <project-version>-dw.<generation-sequence>

Example: 2.4.1-dw.37
         │       │
         │       └── 37th DeepWiki generation for this project version
         └────────── Project's own semantic version
```

### Content-Addressable Version (Git SHA)

Every wiki generation produces a git commit in the wiki repository:

```
wiki-repo/
├── .deepwiki/
│   ├── manifest.json          # Maps source SHA → wiki SHA
│   ├── generation-log.json    # Full history of all generations
│   └── config.yaml            # DeepWiki configuration at generation time
├── docs/
│   ├── ...generated content...
└── .deepwiki-version          # Current wiki version string
```

**Manifest Schema:**

```json
{
  "projectRepo": "github.com/org/project",
  "wikiVersion": "2.4.1-dw.37",
  "sourceCommit": "abc123def456",
  "sourceBranch": "main",
  "generatedAt": "2026-02-11T14:30:00Z",
  "generatorVersion": "1.0.0",
  "sectionsUpdated": ["api/employees", "architecture/overview"],
  "aiModel": "claude-sonnet-4-5-20250929",
  "tokenUsage": {
    "input": 45230,
    "output": 12840,
    "cached": 31000,
    "cost_usd": 0.42
  },
  "previousWikiCommit": "def789abc012",
  "changeSetHash": "sha256:a1b2c3..."
}
```

### Branch Strategy for Wiki Repo

```
wiki-repo branches:
│
├── main                    ← Production wiki (auto-published)
├── staging                 ← Pre-publish validation
├── generation/<source-sha> ← Ephemeral branch per generation run
└── archive/<version>       ← Tagged snapshots at release boundaries
```
