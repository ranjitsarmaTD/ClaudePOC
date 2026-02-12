# 3. DeepWiki Core Engine Design

## 3.1 Code Parsing Layer

### Architecture

The parsing layer uses a **strategy pattern** with a registry, allowing language-specific parsers to be registered at startup or loaded dynamically via plugins.

```
                    ┌──────────────────────┐
                    │   ParserRegistry     │
                    │                      │
                    │  register(parser)    │
                    │  getParser(ext)      │
                    │  parseProject(files) │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────┴──────┐  ┌─────┴──────┐  ┌─────┴──────────┐
    │ TypeScript     │  │  Python    │  │  Generic       │
    │ Parser         │  │  Parser    │  │  Parser        │
    │                │  │            │  │  (regex-based) │
    │ Uses: ts-morph │  │ Uses:      │  │  Handles:      │
    │ Handles: .ts,  │  │ tree-sitter│  │  unknown langs │
    │ .tsx, .js, .jsx│  │            │  │                │
    └────────────────┘  └────────────┘  └────────────────┘
```

### Parser Implementation Strategy

```typescript
class ParserRegistry {
  private parsers: Map<string, ILanguageParser> = new Map();
  private fallback: ILanguageParser;

  constructor() {
    this.fallback = new GenericParser();
  }

  register(parser: ILanguageParser): void {
    for (const ext of parser.supportedExtensions) {
      this.parsers.set(ext, parser);
    }
  }

  getParser(filePath: string): ILanguageParser {
    const ext = path.extname(filePath).toLowerCase();
    return this.parsers.get(ext) ?? this.fallback;
  }

  async parseProject(files: FileEntry[]): Promise<ParseResult[]> {
    const results: ParseResult[] = [];

    // Group files by parser for batch optimization
    const grouped = this.groupByParser(files);

    // Parse each group (parallelizable across parsers)
    for (const [parser, fileGroup] of grouped.entries()) {
      const groupResults = await Promise.all(
        fileGroup.map(file => parser.parseFile(file.content, file.path))
      );
      results.push(...groupResults);
    }

    return results;
  }

  private groupByParser(files: FileEntry[]): Map<ILanguageParser, FileEntry[]> {
    const grouped = new Map<ILanguageParser, FileEntry[]>();
    for (const file of files) {
      const parser = this.getParser(file.path);
      const existing = grouped.get(parser) ?? [];
      existing.push(file);
      grouped.set(parser, existing);
    }
    return grouped;
  }
}
```

### TypeScript Parser (Reference Implementation)

```typescript
class TypeScriptParser implements ILanguageParser {
  supportedExtensions = ['.ts', '.tsx', '.js', '.jsx'];
  language = 'typescript';

  parseFile(content: string, filePath: string): ParseResult {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(filePath, content);

    const entities: CodeEntity[] = [];

    // Extract classes
    for (const cls of sourceFile.getClasses()) {
      const entity: CodeEntity = {
        id: this.computeId(filePath, cls.getName() ?? 'anonymous', 'class'),
        name: cls.getName() ?? 'anonymous',
        kind: 'class',
        filePath,
        startLine: cls.getStartLineNumber(),
        endLine: cls.getEndLineNumber(),
        signature: cls.getType().getText(),
        docComment: cls.getJsDocs().map(d => d.getDescription()).join('\n') || undefined,
        visibility: this.getVisibility(cls),
        decorators: cls.getDecorators().map(d => d.getName()),
        children: cls.getMethods().map(m =>
          this.computeId(filePath, `${cls.getName()}.${m.getName()}`, 'function')
        ),
        complexity: this.estimateComplexity(cls.getText()),
      };
      entities.push(entity);

      // Extract methods as child entities
      for (const method of cls.getMethods()) {
        entities.push({
          id: this.computeId(filePath, `${cls.getName()}.${method.getName()}`, 'function'),
          name: method.getName(),
          kind: 'function',
          filePath,
          startLine: method.getStartLineNumber(),
          endLine: method.getEndLineNumber(),
          signature: method.getSignature()?.getDeclaration().getText() ?? method.getText(),
          docComment: method.getJsDocs().map(d => d.getDescription()).join('\n') || undefined,
          visibility: this.getVisibility(method),
          decorators: method.getDecorators().map(d => d.getName()),
          parameters: method.getParameters().map(p => ({
            name: p.getName(),
            type: p.getType().getText(),
            optional: p.isOptional(),
            defaultValue: p.getInitializer()?.getText(),
          })),
          returnType: method.getReturnType().getText(),
          parentEntity: entity.id,
          children: [],
          complexity: this.estimateComplexity(method.getText()),
        });
      }
    }

    // Extract standalone functions
    for (const func of sourceFile.getFunctions()) {
      entities.push({
        id: this.computeId(filePath, func.getName() ?? 'anonymous', 'function'),
        name: func.getName() ?? 'anonymous',
        kind: 'function',
        filePath,
        startLine: func.getStartLineNumber(),
        endLine: func.getEndLineNumber(),
        signature: func.getText().split('{')[0].trim(),
        visibility: func.isExported() ? 'public' : 'private',
        decorators: func.getDecorators().map(d => d.getName()),
        parameters: func.getParameters().map(p => ({
          name: p.getName(),
          type: p.getType().getText(),
          optional: p.isOptional(),
        })),
        returnType: func.getReturnType().getText(),
        children: [],
        complexity: this.estimateComplexity(func.getText()),
      });
    }

    // Extract interfaces
    for (const iface of sourceFile.getInterfaces()) {
      entities.push({
        id: this.computeId(filePath, iface.getName(), 'interface'),
        name: iface.getName(),
        kind: 'interface',
        filePath,
        startLine: iface.getStartLineNumber(),
        endLine: iface.getEndLineNumber(),
        signature: iface.getText(),
        visibility: iface.isExported() ? 'public' : 'private',
        decorators: [],
        children: iface.getMethods().map(m =>
          this.computeId(filePath, `${iface.getName()}.${m.getName()}`, 'function')
        ),
        complexity: 0,
      });
    }

    // Extract dependencies (imports)
    const dependencies = this.extractDependencies(content, filePath);
    const exports = this.extractExports(content, filePath);

    return {
      filePath,
      language: this.language,
      entities,
      dependencies,
      exports,
      metadata: {
        lines: content.split('\n').length,
        size: content.length,
        hasTests: filePath.includes('.test.') || filePath.includes('.spec.'),
      },
      errors: [],
    };
  }

  extractDependencies(content: string, filePath: string): Dependency[] {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(filePath, content);
    const deps: Dependency[] = [];

    for (const imp of sourceFile.getImportDeclarations()) {
      deps.push({
        source: filePath,
        target: imp.getModuleSpecifierValue(),
        symbols: imp.getNamedImports().map(n => n.getName()),
        isExternal: !imp.getModuleSpecifierValue().startsWith('.'),
        kind: 'import',
      });
    }

    return deps;
  }

  extractExports(content: string, filePath: string): ExportedSymbol[] {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(filePath, content);
    const exports: ExportedSymbol[] = [];

    for (const exp of sourceFile.getExportedDeclarations()) {
      for (const [name, declarations] of exp) {
        exports.push({
          name,
          kind: declarations[0].getKindName() as EntityKind,
          filePath,
        });
      }
    }

    return exports;
  }

  private computeId(filePath: string, name: string, kind: string): string {
    return createHash('sha256').update(`${filePath}::${name}::${kind}`).digest('hex').slice(0, 16);
  }

  private estimateComplexity(code: string): number {
    // Simple cyclomatic complexity: count decision points
    const patterns = [/\bif\b/g, /\belse\b/g, /\bfor\b/g, /\bwhile\b/g, /\bswitch\b/g,
                      /\bcatch\b/g, /\?\?/g, /\?\./g, /&&/g, /\|\|/g, /\?[^.]/g];
    return patterns.reduce((sum, pat) => sum + (code.match(pat)?.length ?? 0), 1);
  }

  private getVisibility(node: any): 'public' | 'private' | 'protected' {
    if (node.hasModifier?.('private')) return 'private';
    if (node.hasModifier?.('protected')) return 'protected';
    return 'public';
  }
}
```

---

## 3.2 Context Extraction Strategy

Context extraction determines **what information the AI needs** to generate documentation for a specific section.

### Context Layers

```
┌──────────────────────────────────────────────────────┐
│                   CONTEXT LAYERS                      │
│                                                       │
│  Layer 1: PRIMARY CONTEXT (always included)           │
│  ┌─────────────────────────────────────────────────┐ │
│  │ • Source code of the target module               │ │
│  │ • Existing documentation (if any)                │ │
│  │ • File-level metadata (path, lang, size)         │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  Layer 2: STRUCTURAL CONTEXT (graph-derived)          │
│  ┌─────────────────────────────────────────────────┐ │
│  │ • Dependency tree (imports/exports)              │ │
│  │ • Type definitions used by the module            │ │
│  │ • Interface contracts                            │ │
│  │ • Architectural layer classification             │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  Layer 3: BEHAVIORAL CONTEXT (analysis-derived)       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ • Call graph (who calls this, what does it call) │ │
│  │ • Data flow patterns                             │ │
│  │ • Error handling patterns                        │ │
│  │ • Configuration dependencies                     │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  Layer 4: PROJECT CONTEXT (global, compressed)        │
│  ┌─────────────────────────────────────────────────┐ │
│  │ • Project structure summary                      │ │
│  │ • Technology stack                               │ │
│  │ • Architectural patterns in use                  │ │
│  │ • Naming conventions                             │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Context Budget Allocation

```typescript
interface ContextBudget {
  totalTokens: number;                     // Model's context window
  reservedForOutput: number;               // Max tokens for generation
  reservedForSystem: number;               // System prompt + template
  availableForContext: number;             // What's left for code context

  allocation: {
    primaryContext: number;                // 50% of available
    structuralContext: number;             // 25% of available
    behavioralContext: number;             // 15% of available
    projectContext: number;                // 10% of available
  };
}

// For claude-sonnet-4-5 (200K context):
// totalTokens: 200000
// reservedForOutput: 8192
// reservedForSystem: 4000
// availableForContext: 187808
// allocation:
//   primary: 93904 tokens (~375K chars of code)
//   structural: 46952 tokens
//   behavioral: 28171 tokens
//   project: 18781 tokens
```

---

## 3.3 Dependency Graph Generation

### Graph Construction Pipeline

```
Source Files
     │
     ▼
┌──────────────┐
│ Parse all    │  Each file → ParseResult (entities + dependencies)
│ files        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Resolve      │  Relative imports → absolute paths
│ import paths │  External packages → package nodes
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Create       │  Each CodeEntity → GraphNode
│ nodes        │  Classify: layer, module, importance
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Create       │  Each Dependency → GraphEdge
│ edges        │  DI injections → injects edges
│              │  Route definitions → routes_to edges
│              │  Entity decorators → persists_to edges
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Compute      │  PageRank-like scoring for node importance
│ importance   │  Entry points get boosted
│ scores       │  Highly-connected nodes rank higher
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Detect       │  Identify modules (directory-based + import clusters)
│ modules      │  Identify architectural layers
│              │  Identify circular dependencies
└──────┬───────┘
       │
       ▼
   KnowledgeGraph
```

### Example Graph for HR Admin Backend

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KNOWLEDGE GRAPH (Simplified)                     │
│                                                                     │
│  MODULE: auth                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  [auth.routes] ──routes_to──▶ [AuthController]              │   │
│  │                                   │                          │   │
│  │                                injects                       │   │
│  │                                   │                          │   │
│  │  [LoginDto] ◀──validates──── [AuthService]                  │   │
│  │                                   │                          │   │
│  │                                injects                       │   │
│  │                                   │                          │   │
│  │  [JwtUtil] ◀──uses───────── [UserRepository]               │   │
│  │                                   │                          │   │
│  │                              persists_to                     │   │
│  │                                   │                          │   │
│  │                              [User Entity]                   │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  MODULE: employees                                                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  [employee.routes] ──routes_to──▶ [EmployeeController]      │   │
│  │                                        │                     │   │
│  │                                     injects                  │   │
│  │                                        │                     │   │
│  │  [CreateEmployeeDto] ◀─validates─ [EmployeeService]         │   │
│  │  [UpdateEmployeeDto] ◀─validates─     │                     │   │
│  │                                     injects                  │   │
│  │                                        │                     │   │
│  │                                  [EmployeeRepository]        │   │
│  │                                        │                     │   │
│  │                                   persists_to                │   │
│  │                                        │                     │   │
│  │                                  [Employee Entity]           │   │
│  │                                        │                     │   │
│  │                                   references                 │   │
│  │                                        ▼                     │   │
│  │                                  [Department Entity]         │   │
│  │                                                              │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CROSS-MODULE EDGES:                                                │
│  [AuthMiddleware] ──protects──▶ [employee.routes]                  │
│  [AuthMiddleware] ──protects──▶ [department.routes]                │
│  [Employee Entity] ──references──▶ [Department Entity]             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3.4 Knowledge Graph Model

### Node Types & Properties

```typescript
// Hierarchical node types
type NodeType =
  | 'project'          // Root node
  | 'module'           // Logical module (auth, employees, departments)
  | 'file'             // Source file
  | 'class'            // Class definition
  | 'interface'        // Interface definition
  | 'function'         // Function/method
  | 'type'             // Type alias
  | 'enum'             // Enumeration
  | 'route'            // HTTP route
  | 'entity'           // Database entity
  | 'dto'              // Data transfer object
  | 'config'           // Configuration
  | 'external_package' // npm/pip package
  | 'database_table';  // Physical table

interface GraphNode {
  id: string;
  type: NodeType;
  name: string;
  qualifiedName: string;               // Full path: "auth.AuthService.login"
  filePath: string;
  module: string;
  layer: ArchitecturalLayer;

  // Content
  signature?: string;
  documentation?: string;
  sourceCode?: string;                 // Stored only for key entities

  // Classification
  tags: string[];
  importance: number;                  // 0.0 - 1.0
  complexity: number;
  isEntryPoint: boolean;
  isPublicAPI: boolean;

  // Metadata
  createdAt: string;
  lastModified: string;
  lastModifiedCommit: string;
}

// Edge types with semantic meaning
type EdgeType =
  | 'imports'           // A imports B
  | 'exports'           // A exports B
  | 'extends'           // A extends B
  | 'implements'        // A implements B
  | 'calls'             // A calls B
  | 'injects'           // A is injected into B (DI)
  | 'uses_type'         // A references type B
  | 'has_member'        // A contains B (class → method)
  | 'routes_to'         // Route → Controller handler
  | 'validates_with'    // Endpoint validates with DTO
  | 'persists_to'       // Service/Repo → Entity
  | 'migrates'          // Migration → Entity
  | 'protects'          // Middleware protects route
  | 'configures'        // Config used by service
  | 'tests'             // Test tests target
  | 'belongs_to_module' // Entity → Module
  | 'depends_on';       // Module → Module

interface GraphEdge {
  id: string;
  type: EdgeType;
  source: string;
  target: string;
  weight: number;                      // Strength of relationship
  metadata: Record<string, unknown>;
}
```

### Graph Storage (Neo4j Cypher Schema)

```cypher
// Node constraints
CREATE CONSTRAINT node_id IF NOT EXISTS FOR (n:CodeEntity) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT module_name IF NOT EXISTS FOR (n:Module) REQUIRE n.name IS UNIQUE;

// Node labels follow NodeType enum
// :Project, :Module, :File, :Class, :Interface, :Function, :Route, :Entity, :DTO, :Config

// Example queries for context assembly:

// 1. Get full module context (for generating module documentation)
MATCH (m:Module {name: $moduleName})<-[:belongs_to_module]-(n)
OPTIONAL MATCH (n)-[r]->(target)
RETURN n, r, target
ORDER BY n.importance DESC;

// 2. Get impact of a changed file
MATCH (f:File {path: $filePath})<-[:belongs_to_module]-(n)
MATCH (n)<-[:imports|calls|uses_type*1..3]-(dependent)
RETURN DISTINCT dependent.module AS affectedModule,
       collect(dependent.name) AS affectedEntities;

// 3. Get architectural layer view
MATCH (n:CodeEntity)
WHERE n.layer IN ['controller', 'service', 'repository', 'entity']
OPTIONAL MATCH (n)-[r:calls|injects|persists_to]->(target)
RETURN n.layer, n.name, type(r), target.layer, target.name;
```

---

## 3.5 Incremental Update Strategy

### Decision Tree

```
On Git Event Received:
│
├── Compute changed files (git diff base..head)
│
├── Classify each changed file:
│   ├── Source code (.ts, .py, .go, ...) → PARSE & ANALYZE
│   ├── Configuration (.yaml, .json, .env) → PARSE CONFIG
│   ├── Documentation (.md) → SKIP (human-written)
│   ├── Test files (.test.ts, .spec.py) → SKIP (unless test doc section enabled)
│   ├── Build/CI (.github/, Dockerfile) → INFRASTRUCTURE SECTION ONLY
│   └── Package manifest (package.json) → DEPENDENCY SECTION ONLY
│
├── For each changed source file:
│   ├── Re-parse the file → new ParseResult
│   ├── Diff against previous ParseResult:
│   │   ├── New entities → ADD to graph
│   │   ├── Removed entities → REMOVE from graph
│   │   ├── Modified entities → UPDATE in graph
│   │   └── Unchanged entities → SKIP
│   │
│   ├── Compute impacted graph neighborhood:
│   │   └── All nodes within depth=2 of changed nodes
│   │
│   └── Map impacted nodes → wiki sections
│
├── Determine sections to regenerate:
│   ├── ALWAYS regenerate:
│   │   └── Sections whose primary source files changed
│   ├── CONDITIONALLY regenerate:
│   │   └── Sections whose dependency graph changed (interface modified, etc.)
│   ├── NEVER regenerate:
│   │   └── Sections with no impacted graph nodes
│   │
│   └── Check cache:
│       ├── Cache HIT (same code hash + same config) → SKIP
│       └── Cache MISS → QUEUE for generation
│
└── Execute generation only for queued sections
```

### Content-Addressed Caching

```typescript
interface CacheKey {
  sectionType: WikiSectionType;
  // Hash of: source files content + graph subgraph + prompt template version + model
  contentHash: string;
}

function computeCacheKey(request: GenerationRequest): string {
  const hashInput = JSON.stringify({
    sourceFilesHash: hashFiles(request.codeContext.primaryFiles),
    graphHash: hashSubgraph(request.graphContext),
    templateVersion: request.generationConfig.templateVersion,
    model: request.generationConfig.model,
    configHash: hashConfig(request.generationConfig),
  });
  return createHash('sha256').update(hashInput).digest('hex');
}

// Cache hit rate expectations:
// - Full regeneration: 0% (everything is new)
// - Typical PR (5-10 files changed): 70-85% cache hit
// - Refactoring PR (many files, same logic): 40-60% cache hit
// - Config-only change: 90-95% cache hit
```

---

## 3.6 Change Detection Mechanism (Git-Based)

### Diff Analysis Pipeline

```typescript
class GitDiffAnalyzer {
  /**
   * Analyzes a git diff and produces a structured ChangeSet
   */
  async analyze(repoPath: string, baseRef: string, headRef: string): Promise<ChangeSet> {
    // 1. Get raw diff
    const diffOutput = await execGit(repoPath, ['diff', '--name-status', baseRef, headRef]);

    // 2. Parse into structured changes
    const fileChanges: FileChange[] = diffOutput.split('\n')
      .filter(Boolean)
      .map(line => {
        const [status, ...pathParts] = line.split('\t');
        const filePath = pathParts.join('\t');
        return {
          filePath,
          status: this.parseStatus(status),     // added | modified | deleted | renamed
          oldPath: status.startsWith('R') ? pathParts[0] : undefined,
        };
      });

    // 3. Classify each change
    const classified = fileChanges.map(fc => ({
      ...fc,
      classification: this.classifyFile(fc.filePath),
    }));

    // 4. For modified files, get detailed diff (function-level)
    const detailedChanges = await Promise.all(
      classified
        .filter(c => c.status === 'modified' && c.classification === 'source')
        .map(async c => {
          const diff = await execGit(repoPath, [
            'diff', baseRef, headRef, '--', c.filePath
          ]);
          return {
            ...c,
            hunks: this.parseHunks(diff),
            changedFunctions: await this.identifyChangedFunctions(
              repoPath, c.filePath, baseRef, headRef
            ),
          };
        })
    );

    // 5. Compute change scope
    const scope = this.computeScope(classified);

    return {
      baseRef,
      headRef,
      files: classified,
      detailedChanges,
      scope,
      statistics: {
        totalFiles: classified.length,
        sourceFiles: classified.filter(c => c.classification === 'source').length,
        configFiles: classified.filter(c => c.classification === 'config').length,
        docFiles: classified.filter(c => c.classification === 'docs').length,
        testFiles: classified.filter(c => c.classification === 'test').length,
        infraFiles: classified.filter(c => c.classification === 'infra').length,
      },
    };
  }

  private classifyFile(filePath: string): FileClassification {
    const ext = path.extname(filePath);
    const dir = path.dirname(filePath);

    // Test files
    if (filePath.match(/\.(test|spec)\.(ts|js|py|go|java)$/)) return 'test';
    if (dir.includes('__tests__') || dir.includes('test/')) return 'test';

    // Infrastructure
    if (filePath.match(/Dockerfile|docker-compose|\.github\//)) return 'infra';
    if (filePath.match(/terraform|\.tf$|kubernetes|k8s/)) return 'infra';

    // Configuration
    if (filePath.match(/\.(yaml|yml|json|toml|ini|env)$/)) return 'config';
    if (filePath.match(/tsconfig|jest\.config|\.eslint|\.prettier/)) return 'config';

    // Documentation
    if (ext === '.md' || dir.includes('docs/')) return 'docs';

    // Source code
    if (['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs', '.rb'].includes(ext)) {
      return 'source';
    }

    return 'other';
  }

  /**
   * Identifies which functions/methods changed within a file
   * by comparing ASTs between base and head versions
   */
  private async identifyChangedFunctions(
    repoPath: string,
    filePath: string,
    baseRef: string,
    headRef: string
  ): Promise<ChangedFunction[]> {
    const baseContent = await execGit(repoPath, ['show', `${baseRef}:${filePath}`]);
    const headContent = await execGit(repoPath, ['show', `${headRef}:${filePath}`]);

    const parser = this.parserRegistry.getParser(filePath);
    const baseParsed = parser.parseFile(baseContent, filePath);
    const headParsed = parser.parseFile(headContent, filePath);

    const baseEntities = new Map(baseParsed.entities.map(e => [e.id, e]));
    const headEntities = new Map(headParsed.entities.map(e => [e.id, e]));

    const changed: ChangedFunction[] = [];

    // Find modified and added entities
    for (const [id, entity] of headEntities) {
      const baseEntity = baseEntities.get(id);
      if (!baseEntity) {
        changed.push({ entity, changeType: 'added' });
      } else if (baseEntity.signature !== entity.signature) {
        changed.push({ entity, changeType: 'signature_changed' });
      } else {
        // Compare body hash to detect implementation changes
        const baseHash = createHash('md5').update(baseContent.slice(
          baseEntity.startLine, baseEntity.endLine
        )).digest('hex');
        const headHash = createHash('md5').update(headContent.slice(
          entity.startLine, entity.endLine
        )).digest('hex');
        if (baseHash !== headHash) {
          changed.push({ entity, changeType: 'body_changed' });
        }
      }
    }

    // Find deleted entities
    for (const [id, entity] of baseEntities) {
      if (!headEntities.has(id)) {
        changed.push({ entity, changeType: 'deleted' });
      }
    }

    return changed;
  }
}
```

### Change-to-Section Mapping

```typescript
const CHANGE_TO_SECTION_MAP: Record<FileClassification, WikiSectionType[]> = {
  source: [
    'architecture',
    'api_reference',
    'service_docs',
    'developer_guide',
  ],
  config: [
    'infrastructure',
    'developer_guide',
    'onboarding_guide',
  ],
  infra: [
    'infrastructure',
    'runbook',
  ],
  test: [
    'developer_guide',
  ],
  docs: [],          // Human docs — don't overwrite
  other: [],
};

// Refined mapping based on architectural layer
const LAYER_TO_SECTION_MAP: Record<ArchitecturalLayer, WikiSectionType[]> = {
  controller: ['api_reference'],
  service: ['service_docs', 'workflow'],
  repository: ['database_schema', 'service_docs'],
  entity: ['database_schema'],
  dto: ['api_reference'],
  middleware: ['security', 'api_reference'],
  route: ['api_reference'],
  config: ['infrastructure', 'onboarding_guide'],
  util: ['developer_guide'],
  test: ['developer_guide'],
  migration: ['database_schema', 'release_notes'],
  unknown: ['system_overview'],
};
```
