# 4. Claude Integration Layer

## 4.1 Prompt Orchestration Engine

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   PROMPT ORCHESTRATION ENGINE                    │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Generation  │    │  Template    │    │  Context     │       │
│  │  Request     │───▶│  Registry    │───▶│  Assembler   │       │
│  │              │    │              │    │              │       │
│  │  - section   │    │  - lookup    │    │  - budget    │       │
│  │  - module    │    │  - version   │    │  - allocate  │       │
│  │  - config    │    │  - validate  │    │  - chunk     │       │
│  └──────────────┘    └──────────────┘    └──────┬───────┘       │
│                                                  │              │
│                                                  ▼              │
│                                          ┌──────────────┐       │
│                                          │  Prompt      │       │
│                                          │  Builder     │       │
│                                          │              │       │
│                                          │  - system    │       │
│                                          │  - user      │       │
│                                          │  - examples  │       │
│                                          └──────┬───────┘       │
│                                                  │              │
│                                                  ▼              │
│                                          ┌──────────────┐       │
│                                          │  Pre-flight  │       │
│                                          │  Validator   │       │
│                                          │              │       │
│                                          │  - tokens    │       │
│                                          │  - cost      │       │
│                                          │  - budget    │       │
│                                          └──────┬───────┘       │
│                                                  │              │
│                                                  ▼              │
│                                          ┌──────────────┐       │
│                                          │  BuiltPrompt │       │
│                                          │  (output)    │       │
│                                          └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Prompt Builder Implementation

```typescript
class PromptEngine implements IPromptEngine {
  constructor(
    private templateRegistry: PromptTemplateRegistry,
    private contextAssembler: ContextAssembler,
    private tokenCounter: TokenCounter,
    private modelSelector: ModelSelector,
    private costTracker: CostTracker,
  ) {}

  buildPrompt(request: GenerationRequest): BuiltPrompt {
    // 1. Select model based on section type and config
    const model = this.modelSelector.select(
      request.sectionType,
      request.generationConfig
    );

    // 2. Load template for this section type
    const template = this.templateRegistry.get(
      request.sectionType,
      request.generationConfig.templateVersion
    );

    // 3. Compute token budget
    const budget = this.computeBudget(model);

    // 4. Assemble context within budget
    const context = this.contextAssembler.assemble(
      request.codeContext,
      request.graphContext,
      request.projectMeta,
      budget
    );

    // 5. Build system prompt
    const systemPrompt = this.buildSystemPrompt(template, request.projectMeta);

    // 6. Build user prompt with context
    const userPrompt = this.buildUserPrompt(template, context, request);

    // 7. Estimate tokens
    const estimatedTokens = this.tokenCounter.estimate(systemPrompt + userPrompt);

    // 8. Pre-flight cost check
    const estimatedCost = this.costTracker.estimate(model, estimatedTokens);
    if (estimatedCost > request.generationConfig.maxCostPerSection) {
      throw new BudgetExceededError(
        `Estimated cost $${estimatedCost} exceeds per-section limit $${request.generationConfig.maxCostPerSection}`
      );
    }

    return {
      systemPrompt,
      userPrompt,
      estimatedTokens,
      model,
      temperature: template.temperature ?? 0.3,
      maxTokens: template.maxOutputTokens ?? 8192,
      metadata: {
        templateId: template.id,
        templateVersion: template.version,
        contextChunks: context.chunks.length,
      },
    };
  }

  private buildSystemPrompt(template: PromptTemplate, meta: ProjectMetadata): string {
    return template.systemTemplate
      .replace('{{PROJECT_NAME}}', meta.name)
      .replace('{{PROJECT_TYPE}}', meta.type)
      .replace('{{TECH_STACK}}', meta.techStack.join(', '))
      .replace('{{FRAMEWORK}}', meta.framework)
      .replace('{{ARCHITECTURE_PATTERN}}', meta.architecturePattern);
  }

  private buildUserPrompt(
    template: PromptTemplate,
    context: AssembledContext,
    request: GenerationRequest
  ): string {
    let prompt = template.userTemplate;

    // Inject code context
    prompt = prompt.replace('{{CODE_CONTEXT}}', context.formattedCode);

    // Inject graph context
    prompt = prompt.replace('{{DEPENDENCY_GRAPH}}', context.formattedGraph);

    // Inject existing docs (for incremental updates)
    if (request.existingDocs) {
      prompt = prompt.replace('{{EXISTING_DOCS}}', request.existingDocs);
      prompt = prompt.replace('{{UPDATE_MODE}}', 'UPDATE the existing documentation below');
    } else {
      prompt = prompt.replace('{{EXISTING_DOCS}}', '');
      prompt = prompt.replace('{{UPDATE_MODE}}', 'GENERATE new documentation');
    }

    // Inject module-specific info
    prompt = prompt.replace('{{TARGET_MODULE}}', request.targetModule);
    prompt = prompt.replace('{{SECTION_TYPE}}', request.sectionType);

    return prompt;
  }

  private computeBudget(model: ModelSelection): ContextBudget {
    const contextWindows: Record<string, number> = {
      'claude-opus-4-6': 200000,
      'claude-sonnet-4-5-20250929': 200000,
      'claude-haiku-4-5-20251001': 200000,
    };

    const totalTokens = contextWindows[model.modelId] ?? 200000;
    const reservedForOutput = model.maxOutputTokens;
    const reservedForSystem = 4000;
    const availableForContext = totalTokens - reservedForOutput - reservedForSystem;

    return {
      totalTokens,
      reservedForOutput,
      reservedForSystem,
      availableForContext,
      allocation: {
        primaryContext: Math.floor(availableForContext * 0.50),
        structuralContext: Math.floor(availableForContext * 0.25),
        behavioralContext: Math.floor(availableForContext * 0.15),
        projectContext: Math.floor(availableForContext * 0.10),
      },
    };
  }
}
```

---

## 4.2 Context Window Management Strategy

### The Sliding Context Window

For large projects where all relevant code exceeds the context window, we use a **priority-ranked sliding window**:

```
┌─────────────────────────────────────────────────────────────┐
│                 CONTEXT WINDOW MANAGEMENT                    │
│                                                              │
│  Step 1: RANK all context items by relevance                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Priority Score = weighted sum of:                    │    │
│  │   • Direct relevance (target file)           × 1.0  │    │
│  │   • Graph distance from target               × 0.8  │    │
│  │   • Architectural coupling (same layer)       × 0.3  │    │
│  │   • Recent change recency                     × 0.2  │    │
│  │   • Entity importance (PageRank)              × 0.2  │    │
│  │   • Has existing documentation                × 0.1  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Step 2: FILL context window by priority                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │  [SYSTEM PROMPT]          ~4,000 tokens (fixed)     │    │
│  │  ─────────────────────────────────────────────      │    │
│  │  [PROJECT CONTEXT]        ~18,000 tokens            │    │
│  │    - Project structure summary                      │    │
│  │    - Tech stack, patterns                           │    │
│  │  ─────────────────────────────────────────────      │    │
│  │  [PRIMARY FILES]          ~94,000 tokens            │    │
│  │    - Target source files (full content)             │    │
│  │    - Ranked by priority score                       │    │
│  │  ─────────────────────────────────────────────      │    │
│  │  [STRUCTURAL CONTEXT]     ~47,000 tokens            │    │
│  │    - Interface definitions                          │    │
│  │    - Type definitions                               │    │
│  │    - Import graph (summarized)                      │    │
│  │  ─────────────────────────────────────────────      │    │
│  │  [BEHAVIORAL CONTEXT]     ~28,000 tokens            │    │
│  │    - Call patterns                                  │    │
│  │    - Usage examples from tests                      │    │
│  │  ─────────────────────────────────────────────      │    │
│  │  [RESERVED FOR OUTPUT]    ~8,192 tokens             │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Step 3: OVERFLOW STRATEGY                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ If context exceeds budget:                          │    │
│  │   1. Summarize low-priority files (signature only)  │    │
│  │   2. Truncate method bodies, keep signatures        │    │
│  │   3. Drop behavioral context items by priority      │    │
│  │   4. If still over: split into multi-turn gen       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### File Summarization Levels

```typescript
enum SummarizationLevel {
  FULL = 'full',                   // Complete file content
  SIGNATURES_AND_DOCS = 'sigs',    // Only signatures + doc comments
  SIGNATURES_ONLY = 'sigs_only',   // Only signatures, no docs
  SUMMARY = 'summary',             // AI-generated summary (cached)
  REFERENCE = 'reference',         // Just name + path + type
}

class ContextAssembler {
  assemble(
    code: CodeContext,
    graph: SubgraphContext,
    meta: ProjectMetadata,
    budget: ContextBudget
  ): AssembledContext {
    const chunks: ContextChunk[] = [];
    let tokensUsed = 0;

    // 1. Always include project context (compressed)
    const projectChunk = this.formatProjectContext(meta);
    chunks.push(projectChunk);
    tokensUsed += projectChunk.tokens;

    // 2. Add primary files at full detail
    for (const file of code.primaryFiles) {
      const chunk = this.formatFile(file, SummarizationLevel.FULL);
      if (tokensUsed + chunk.tokens <= budget.allocation.primaryContext) {
        chunks.push(chunk);
        tokensUsed += chunk.tokens;
      } else {
        // Downgrade to signatures
        const reduced = this.formatFile(file, SummarizationLevel.SIGNATURES_AND_DOCS);
        chunks.push(reduced);
        tokensUsed += reduced.tokens;
      }
    }

    // 3. Add structural context (interfaces, types)
    const structuralBudget = budget.allocation.structuralContext;
    const structuralFiles = this.rankByRelevance(code.supportingFiles);
    for (const file of structuralFiles) {
      const remainingBudget = structuralBudget - (tokensUsed - budget.allocation.primaryContext);
      if (remainingBudget <= 0) break;

      const level = remainingBudget > 5000
        ? SummarizationLevel.SIGNATURES_AND_DOCS
        : SummarizationLevel.SIGNATURES_ONLY;
      const chunk = this.formatFile(file, level);
      chunks.push(chunk);
      tokensUsed += chunk.tokens;
    }

    // 4. Add graph context
    const graphChunk = this.formatGraphContext(graph, budget.allocation.behavioralContext);
    chunks.push(graphChunk);
    tokensUsed += graphChunk.tokens;

    return {
      chunks,
      totalTokens: tokensUsed,
      formattedCode: chunks
        .filter(c => c.type === 'code')
        .map(c => c.content)
        .join('\n\n---\n\n'),
      formattedGraph: chunks
        .filter(c => c.type === 'graph')
        .map(c => c.content)
        .join('\n'),
    };
  }
}
```

---

## 4.3 Chunking Strategy for Large Repos

### Module-Based Chunking

```
Large Repository (1000+ files)
│
├── Step 1: Module Discovery
│   └── Identify logical modules from directory structure + import clusters
│       Result: 15 modules identified
│
├── Step 2: Module-Level Generation (parallel)
│   ├── Module A: auth (12 files, ~3K lines) → Single context window
│   ├── Module B: employees (18 files, ~5K lines) → Single context window
│   ├── Module C: reporting (45 files, ~15K lines) → Split into 3 chunks
│   └── Module D: data-pipeline (100 files, ~30K lines) → Split into 8 chunks
│
├── Step 3: Cross-Module Documentation
│   └── Use module summaries (not full code) to generate:
│       ├── System Overview
│       ├── Architecture (inter-module relationships)
│       └── Workflow documentation
│
└── Step 4: Assembly
    └── Merge all module docs + cross-module docs into final wiki
```

### Chunk Size Targets

```typescript
const CHUNKING_CONFIG = {
  // Target chunk size (in tokens of code context)
  targetChunkSize: 80_000,           // ~320K characters
  maxChunkSize: 150_000,             // Absolute max before forced split
  minChunkSize: 5_000,               // Don't create tiny chunks

  // Splitting strategy
  splitBoundary: 'module',           // Split at module boundaries first
  fallbackSplit: 'file',             // Then at file boundaries
  lastResort: 'function',            // Then at function boundaries

  // Multi-turn threshold
  multiTurnThreshold: 180_000,       // If context > this, use multi-turn
};
```

### Multi-Turn Generation (for extremely large modules)

```
Turn 1: Generate documentation skeleton
  Input: Module structure + signatures only (~20K tokens)
  Output: Section outline with placeholders

Turn 2-N: Fill in each section
  Input: Skeleton + relevant code for one section (~80K tokens each)
  Output: Completed section content

Final Turn: Review and cross-reference
  Input: All generated sections + cross-module summary
  Output: Final documentation with corrected cross-references
```

---

## 4.4 Embedding Strategy

### When to Use Embeddings

Embeddings are used **exclusively for the RAG retrieval step**, not for generation:

```
┌──────────────────────────────────────────────────────┐
│              EMBEDDING PIPELINE                       │
│                                                       │
│  Source Code ──┐                                      │
│                │     ┌──────────────┐                 │
│  Chunk at     ─┼────▶│  Embed via   │                 │
│  function      │     │  Claude API  │                 │
│  level         │     │  (voyage-3)  │                 │
│                │     └──────┬───────┘                 │
│  Comments  ────┘            │                         │
│                             ▼                         │
│                    ┌──────────────┐                    │
│                    │  pgvector    │                    │
│                    │  Store       │                    │
│                    └──────┬───────┘                    │
│                           │                           │
│       ┌───────────────────┼───────────────────┐       │
│       │                   │                   │       │
│       ▼                   ▼                   ▼       │
│  ┌─────────┐      ┌─────────────┐     ┌──────────┐  │
│  │ Semantic │      │ "How does   │     │ Drift    │  │
│  │ Search   │      │  auth work?"│     │ Detection│  │
│  │ for RAG  │      │  queries    │     │ compare  │  │
│  └─────────┘      └─────────────┘     └──────────┘  │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Embedding Granularity

```typescript
interface EmbeddingUnit {
  id: string;                          // Same as graph node ID
  type: 'function' | 'class' | 'module_summary' | 'doc_section';
  content: string;                     // What gets embedded
  metadata: {
    filePath: string;
    module: string;
    layer: ArchitecturalLayer;
    lastModified: string;
  };
  vector: number[];                    // 1024-dim embedding
}

// Embedding content construction:
// For a function, we embed:
//   "[function signature]\n[doc comment if exists]\n[first 500 chars of body]"
//
// For a class, we embed:
//   "[class name]\n[doc comment]\n[list of method signatures]"
//
// For a module, we embed:
//   "[module name]\n[list of exported symbols]\n[purpose summary if exists]"
```

---

## 4.5 Retrieval-Augmented Generation (RAG) Model

### RAG Pipeline

```
User Query / Generation Request
          │
          ▼
┌───────────────────────┐
│  1. QUERY FORMATION   │
│                       │
│  Transform section    │
│  type + module into   │
│  semantic queries     │
│                       │
│  Example:             │
│  section: api_reference│
│  module: employees     │
│  →                    │
│  queries: [           │
│    "employee API      │
│     endpoints",       │
│    "employee CRUD     │
│     operations",      │
│    "employee request  │
│     validation"       │
│  ]                    │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│  2. RETRIEVAL         │
│                       │
│  For each query:      │
│  • Vector similarity  │
│    search (top-20)    │
│  • Graph traversal    │
│    (depth-2 neighbors)│
│  • Keyword match      │
│    (BM25 fallback)    │
│                       │
│  Union all results    │
│  Deduplicate by ID    │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│  3. RERANKING         │
│                       │
│  Score each result:   │
│  • Vector similarity  │
│    score (0-1)   × 0.4│
│  • Graph distance     │
│    score (0-1)   × 0.3│
│  • Recency score      │
│    (0-1)         × 0.2│
│  • Importance score   │
│    (PageRank)    × 0.1│
│                       │
│  Take top-K within    │
│  token budget         │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────┐
│  4. CONTEXT ASSEMBLY  │
│                       │
│  Format retrieved     │
│  chunks with:         │
│  • File path headers  │
│  • Language markers   │
│  • Relevance notes    │
│  • Truncation if over │
│    budget             │
└──────────┬────────────┘
           │
           ▼
     [To Prompt Builder]
```

---

## 4.6 Version-Aware Prompting

The prompting system is aware of **what has changed** and instructs Claude accordingly:

```typescript
interface VersionAwareContext {
  // What existed before
  previousDocs?: string;
  previousCodeHash?: string;

  // What changed
  changeType: 'new' | 'modified' | 'restructured';
  changedEntities: Array<{
    name: string;
    changeType: 'added' | 'modified' | 'deleted' | 'signature_changed';
    oldSignature?: string;
    newSignature?: string;
  }>;

  // Instructions based on change type
  updateInstructions: string;
}

function buildUpdateInstructions(context: VersionAwareContext): string {
  switch (context.changeType) {
    case 'new':
      return `Generate complete documentation for this NEW module. No previous documentation exists.`;

    case 'modified':
      return [
        `UPDATE the existing documentation below. The following changes were made:`,
        ...context.changedEntities.map(e => {
          switch (e.changeType) {
            case 'added':
              return `- ADDED: ${e.name} (document this new addition)`;
            case 'deleted':
              return `- REMOVED: ${e.name} (remove from documentation)`;
            case 'signature_changed':
              return `- SIGNATURE CHANGED: ${e.name}\n  Old: ${e.oldSignature}\n  New: ${e.newSignature}`;
            case 'modified':
              return `- MODIFIED: ${e.name} (update description if behavior changed)`;
          }
        }),
        `\nPreserve all documentation for unchanged parts. Only modify sections affected by the changes above.`,
      ].join('\n');

    case 'restructured':
      return `The module has been significantly restructured. Regenerate documentation from scratch using the current code, but preserve the tone and style of the existing documentation below.`;
  }
}
```

---

## 4.7 Cost Optimization Strategy

### Token Cost Model

```typescript
interface CostModel {
  // Per-model pricing (per million tokens, as of 2026)
  pricing: {
    'claude-opus-4-6': { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },
    'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 },
    'claude-haiku-4-5-20251001': { input: 0.80, output: 4.00, cacheRead: 0.08, cacheWrite: 1.00 },
  };
}
```

### Cost Optimization Techniques

```
┌─────────────────────────────────────────────────────────────────┐
│                 COST OPTIMIZATION STACK                          │
│                                                                  │
│  Layer 1: AVOID GENERATION                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • Content-addressed caching (same code = same docs)       │  │
│  │ • Incremental updates (only regenerate changed sections)  │  │
│  │ • Deduplication (don't document the same pattern twice)   │  │
│  │                                                            │  │
│  │ Expected savings: 60-80% of total API calls               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 2: RIGHT-SIZE THE MODEL                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • Use Haiku for mechanical docs (schema, config)          │  │
│  │ • Use Sonnet for standard docs (API, services)            │  │
│  │ • Reserve Opus for complex docs (architecture, ADRs)      │  │
│  │                                                            │  │
│  │ Expected savings: 40-60% vs using Opus for everything     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 3: MINIMIZE TOKENS                                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • Prompt caching (reuse system prompts across sections)   │  │
│  │ • Context compression (signatures vs full code)           │  │
│  │ • Smart chunking (avoid redundant context across chunks)  │  │
│  │                                                            │  │
│  │ Expected savings: 20-40% of input tokens per call         │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 4: BUDGET ENFORCEMENT                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ • Per-project daily/monthly budgets                       │  │
│  │ • Per-generation-run cost caps                            │  │
│  │ • Alert thresholds at 50%, 80%, 100% of budget            │  │
│  │ • Automatic downgrade to cheaper model on budget pressure │  │
│  │                                                            │  │
│  │ Prevents: runaway costs from misconfiguration             │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Prompt Caching Strategy

```typescript
class PromptCacheManager {
  /**
   * Prompt caching works by keeping the system prompt + project context
   * stable across multiple API calls within a generation run.
   *
   * Claude's prompt caching gives 90% discount on cached input tokens.
   */

  private buildCacheablePrompt(
    systemPrompt: string,
    projectContext: string,
    sectionSpecificContent: string
  ): ClaudeMessage[] {
    return [
      {
        role: 'system',
        content: [
          {
            type: 'text',
            text: systemPrompt,
            // This block is cached across all section generations
            cache_control: { type: 'ephemeral' },
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: projectContext,
            // Project context is also cached (shared across sections)
            cache_control: { type: 'ephemeral' },
          },
          {
            type: 'text',
            text: sectionSpecificContent,
            // This varies per section — not cached
          },
        ],
      },
    ];
  }
}

// Cost example for a 15-section generation:
//
// Without caching:
//   System prompt (4K tokens) × 15 calls = 60K input tokens
//   Project context (18K tokens) × 15 calls = 270K input tokens
//   Section context (avg 80K) × 15 calls = 1,200K input tokens
//   Total input: 1,530K tokens × $3/M = $4.59
//
// With caching:
//   System prompt: 4K × $3/M + 14 × 4K × $0.30/M = $0.03
//   Project context: 18K × $3/M + 14 × 18K × $0.30/M = $0.13
//   Section context: 1,200K × $3/M = $3.60
//   Total input: $3.76 (18% savings on input alone)
```

### Cost Dashboard Schema

```typescript
interface CostReport {
  projectId: string;
  period: { start: string; end: string };

  summary: {
    totalRuns: number;
    totalCost_usd: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCachedTokens: number;
    cacheHitRate: number;             // 0-1
    avgCostPerRun: number;
    avgCostPerSection: number;
  };

  byModel: Array<{
    model: string;
    calls: number;
    inputTokens: number;
    outputTokens: number;
    cost_usd: number;
    percentage: number;               // % of total cost
  }>;

  bySection: Array<{
    sectionType: WikiSectionType;
    generations: number;
    cacheHits: number;
    avgTokens: number;
    totalCost_usd: number;
  }>;

  savings: {
    fromCaching: number;              // USD saved via caching
    fromIncremental: number;          // USD saved via incremental updates
    fromModelSelection: number;       // USD saved vs all-Opus baseline
    totalSaved: number;
  };
}
```
