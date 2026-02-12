# 7. Governance Model

## 7.1 Version Control

### Wiki Versioning Rules

```
Rule 1: Every generation produces a git commit
  └── Even "no changes" runs produce a manifest-only commit

Rule 2: Wiki versions are tagged at release boundaries
  └── When source repo tags v2.5.0, wiki tags wiki-v2.5.0-dw.N

Rule 3: Wiki branch strategy mirrors source
  └── main branch wiki = production docs
  └── feature branch wikis are ephemeral

Rule 4: Generation metadata is always committed alongside content
  └── .deepwiki/manifest.json updated on every run

Rule 5: Human edits are preserved
  └── Pages with manual edits are marked "human-curated"
  └── AI regeneration skips human-curated pages
  └── Conflict resolution: human edits always win
```

### Conflict Resolution Protocol

```
When AI generation conflicts with human edits:

1. DETECT:
   - Compare page's lastModifiedBy field
   - If "human" and source files unchanged → skip regeneration
   - If "human" and source files changed → flag for review

2. RESOLVE:
   - Option A: Human edit preserved, AI update deferred
   - Option B: AI update placed in staging, human reviewer merges
   - Option C: AI integrates changes around human-authored sections
     (identified by <!-- deepwiki:human-section --> markers)

3. MARKER SYSTEM:
   <!-- deepwiki:auto-start -->
   This content is auto-generated. Do not edit.
   <!-- deepwiki:auto-end -->

   <!-- deepwiki:human-start -->
   This content is maintained by humans. AI will not overwrite.
   <!-- deepwiki:human-end -->
```

---

## 7.2 Approval Workflows

### Approval Modes

```
┌──────────────────────────────────────────────────────────────┐
│                   APPROVAL MODES                              │
│                                                               │
│  Mode 1: AUTO-APPROVE (Default)                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ • All generated docs are published immediately           │ │
│  │ • Quality score must be ≥ threshold                      │ │
│  │ • No human review required                               │ │
│  │ • Best for: internal projects, fast-moving teams         │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  Mode 2: APPROVE-ON-CHANGE (Recommended)                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ • Auto-approve if only minor changes (< 20% content)     │ │
│  │ • Require review if:                                     │ │
│  │   - New sections created                                 │ │
│  │   - Architecture docs changed                            │ │
│  │   - Security docs changed                                │ │
│  │   - ADRs created                                         │ │
│  │ • Review via PR to wiki repo                             │ │
│  │ • Best for: regulated environments, public-facing docs   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  Mode 3: FULL-REVIEW                                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ • Every generation produces a PR                         │ │
│  │ • Designated reviewers must approve                      │ │
│  │ • CODEOWNERS file in wiki repo                           │ │
│  │ • Best for: compliance-heavy environments                │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Approval Workflow Implementation

```typescript
class ApprovalWorkflow {
  async evaluate(
    run: GenerationRun,
    config: GovernanceConfig,
    wikiDiff: WikiDiff
  ): Promise<ApprovalDecision> {

    switch (config.approvalMode) {
      case 'auto':
        return this.autoApprove(run);

      case 'approve-on-change':
        return this.conditionalApprove(run, wikiDiff, config);

      case 'full-review':
        return this.requireReview(run, config);
    }
  }

  private async conditionalApprove(
    run: GenerationRun,
    diff: WikiDiff,
    config: GovernanceConfig
  ): Promise<ApprovalDecision> {

    const requiresReview =
      diff.newSections.length > 0 ||
      diff.changedSections.some(s =>
        config.reviewRequiredSections.includes(s.sectionType)
      ) ||
      diff.changePercentage > config.autoApproveThreshold ||
      run.validation.qualityScore < config.qualityThreshold;

    if (requiresReview) {
      // Create PR in wiki repo
      const prUrl = await this.createReviewPR(run, diff);
      return {
        decision: 'pending_review',
        reason: this.buildReviewReason(diff, run),
        prUrl,
        reviewers: config.reviewers,
      };
    }

    return { decision: 'approved', reason: 'Within auto-approve thresholds' };
  }
}
```

---

## 7.3 Documentation Validation

### Validation Rules

```typescript
interface ValidationSuite {
  rules: ValidationRule[];
}

const DEFAULT_VALIDATION_RULES: ValidationRule[] = [
  // Structural validations
  {
    id: 'required-sections',
    severity: 'error',
    check: (wiki) => {
      const required = ['system_overview', 'architecture', 'api_reference'];
      const missing = required.filter(s => !wiki.hasSection(s));
      return missing.length === 0
        ? { pass: true }
        : { pass: false, message: `Missing required sections: ${missing.join(', ')}` };
    },
  },

  // Metadata validations
  {
    id: 'valid-metadata',
    severity: 'error',
    check: (wiki) => {
      for (const page of wiki.pages) {
        if (!page.metadata?.deepwiki?.pageId) {
          return { pass: false, message: `Page missing deepwiki metadata: ${page.path}` };
        }
        if (!page.metadata?.deepwiki?.sourceCommit) {
          return { pass: false, message: `Page missing sourceCommit: ${page.path}` };
        }
      }
      return { pass: true };
    },
  },

  // Content validations
  {
    id: 'no-broken-links',
    severity: 'warning',
    check: (wiki) => {
      const brokenLinks = wiki.findBrokenInternalLinks();
      return brokenLinks.length === 0
        ? { pass: true }
        : { pass: false, message: `${brokenLinks.length} broken links found`, details: brokenLinks };
    },
  },

  {
    id: 'no-empty-sections',
    severity: 'warning',
    check: (wiki) => {
      const empty = wiki.pages.filter(p => p.contentLength < 100);
      return empty.length === 0
        ? { pass: true }
        : { pass: false, message: `${empty.length} near-empty pages`, details: empty.map(p => p.path) };
    },
  },

  {
    id: 'no-placeholder-content',
    severity: 'error',
    check: (wiki) => {
      const placeholders = ['TODO', 'FIXME', 'TBD', '{{', '}}', 'PLACEHOLDER'];
      for (const page of wiki.pages) {
        for (const marker of placeholders) {
          if (page.content.includes(marker)) {
            return { pass: false, message: `Placeholder found in ${page.path}: "${marker}"` };
          }
        }
      }
      return { pass: true };
    },
  },

  // Quality validations
  {
    id: 'minimum-quality-score',
    severity: 'error',
    check: (wiki, config) => {
      const threshold = config.qualityThreshold ?? 70;
      for (const page of wiki.pages) {
        if (page.metadata.deepwiki.qualityScore < threshold) {
          return {
            pass: false,
            message: `Page ${page.path} quality score ${page.metadata.deepwiki.qualityScore} < threshold ${threshold}`,
          };
        }
      }
      return { pass: true };
    },
  },
];
```

### Quality Scoring Algorithm

```typescript
class QualityScorer {
  score(page: WikiPage, context: ScoringContext): number {
    const weights = {
      completeness: 0.30,
      accuracy: 0.25,
      clarity: 0.20,
      structure: 0.15,
      freshness: 0.10,
    };

    const scores = {
      // Does it cover all expected subsections?
      completeness: this.scoreCompleteness(page, context),

      // Are code references valid? Do described APIs match actual code?
      accuracy: this.scoreAccuracy(page, context),

      // Readability metrics: sentence length, jargon density, heading structure
      clarity: this.scoreClarity(page),

      // Well-formed markdown, proper heading hierarchy, consistent formatting
      structure: this.scoreStructure(page),

      // How recently was this generated relative to source changes?
      freshness: this.scoreFreshness(page, context),
    };

    return Object.entries(weights).reduce(
      (total, [key, weight]) => total + scores[key as keyof typeof scores] * weight * 100,
      0
    );
  }

  private scoreCompleteness(page: WikiPage, context: ScoringContext): number {
    const expectedSubsections = context.templateRequirements[page.sectionType];
    if (!expectedSubsections) return 1.0;

    const headings = page.extractHeadings();
    const covered = expectedSubsections.filter(sub =>
      headings.some(h => h.toLowerCase().includes(sub.toLowerCase()))
    );

    return covered.length / expectedSubsections.length;
  }

  private scoreAccuracy(page: WikiPage, context: ScoringContext): number {
    let score = 1.0;

    // Check that referenced file paths exist
    const referencedFiles = page.extractCodeReferences();
    for (const ref of referencedFiles) {
      if (!context.sourceFiles.includes(ref)) {
        score -= 0.1;
      }
    }

    // Check that described function names exist in the code
    const mentionedFunctions = page.extractFunctionMentions();
    for (const func of mentionedFunctions) {
      if (!context.knownEntities.has(func)) {
        score -= 0.05;
      }
    }

    return Math.max(0, score);
  }

  private scoreClarity(page: WikiPage): number {
    const text = page.plainTextContent();
    const sentences = text.split(/[.!?]+/).filter(Boolean);

    // Average sentence length (target: 15-25 words)
    const avgLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    const lengthScore = avgLength >= 10 && avgLength <= 30 ? 1.0 : 0.7;

    // Has code examples
    const hasExamples = page.content.includes('```') ? 1.0 : 0.8;

    // Heading density (1 heading per ~300 words is good)
    const wordCount = text.split(/\s+/).length;
    const headingCount = page.extractHeadings().length;
    const headingDensity = headingCount > 0 ? Math.min(1, (wordCount / headingCount) / 500) : 0.5;

    return (lengthScore + hasExamples + headingDensity) / 3;
  }

  private scoreStructure(page: WikiPage): number {
    let score = 1.0;

    // Valid markdown (no rendering errors)
    const markdownErrors = page.validateMarkdown();
    score -= markdownErrors.length * 0.1;

    // Proper heading hierarchy (no skipped levels)
    const headings = page.extractHeadingsWithLevel();
    for (let i = 1; i < headings.length; i++) {
      if (headings[i].level - headings[i - 1].level > 1) {
        score -= 0.1; // Skipped heading level
      }
    }

    // Has front-matter metadata
    if (!page.metadata?.deepwiki) score -= 0.2;

    return Math.max(0, score);
  }

  private scoreFreshness(page: WikiPage, context: ScoringContext): number {
    const pageAge = Date.now() - new Date(page.metadata.deepwiki.generatedAt).getTime();
    const maxAge = context.config.maxDriftDays * 24 * 60 * 60 * 1000;

    if (pageAge <= maxAge) return 1.0;
    if (pageAge <= maxAge * 2) return 0.7;
    return 0.4;
  }
}
```

---

## 7.4 Drift Detection

### How Drift Detection Works

```
┌────────────────────────────────────────────────────────────────┐
│                    DRIFT DETECTION ENGINE                       │
│                                                                │
│  Runs: On schedule (daily) OR on-demand via CLI/API            │
│                                                                │
│  For each wiki page:                                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  1. Read page metadata → sourceCommit, sourceFiles       │  │
│  │                                                          │  │
│  │  2. Check if sourceFiles have changed since sourceCommit │  │
│  │     git log --oneline sourceCommit..HEAD -- sourceFiles   │  │
│  │                                                          │  │
│  │  3. If changes found:                                    │  │
│  │     ├── Classify change severity:                        │  │
│  │     │   ├── Signature change → HIGH drift                │  │
│  │     │   ├── Implementation change → MEDIUM drift         │  │
│  │     │   ├── Comment/format change → LOW drift            │  │
│  │     │   └── Unrelated file change → NO drift             │  │
│  │     │                                                    │  │
│  │     └── Update drift status in page metadata:            │  │
│  │         ├── "current" → no changes since last generation │  │
│  │         ├── "stale" → minor changes detected             │  │
│  │         └── "outdated" → significant changes detected    │  │
│  │                                                          │  │
│  │  4. Compute project-wide drift score:                    │  │
│  │     driftScore = outdatedPages / totalPages              │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Outputs:                                                      │
│  ├── DriftReport { pages[], score, recommendations }           │
│  ├── Alert (if driftScore > threshold)                         │
│  └── Badge status update (green/yellow/red)                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Drift Report Schema

```typescript
interface DriftReport {
  projectId: string;
  generatedAt: string;
  sourceHead: string;
  wikiHead: string;

  summary: {
    totalPages: number;
    currentPages: number;
    stalePages: number;
    outdatedPages: number;
    driftScore: number;              // 0 (all current) to 1 (all outdated)
    recommendation: 'none' | 'incremental' | 'full';
  };

  pages: Array<{
    path: string;
    sectionType: WikiSectionType;
    status: 'current' | 'stale' | 'outdated';
    lastGenerated: string;
    sourceLastModified: string;
    commitsBehind: number;
    changedEntities: string[];
    severity: 'none' | 'low' | 'medium' | 'high';
  }>;

  recommendations: Array<{
    action: 'regenerate' | 'review' | 'ignore';
    sections: WikiSectionType[];
    reason: string;
    estimatedCost: number;
  }>;
}
```

---

## 7.5 Access Control

### RBAC Model

```
┌────────────────────────────────────────────────────────────────┐
│                    ACCESS CONTROL MODEL                        │
│                                                                │
│  Roles:                                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  ADMIN                                                   │  │
│  │  ├── Manage projects (create, delete, configure)         │  │
│  │  ├── Manage users and roles                              │  │
│  │  ├── Override approval workflows                         │  │
│  │  ├── View all cost reports                               │  │
│  │  └── Configure global settings                           │  │
│  │                                                          │  │
│  │  PROJECT_OWNER                                           │  │
│  │  ├── Configure project settings                          │  │
│  │  ├── Trigger generation (full or incremental)            │  │
│  │  ├── Approve/reject documentation changes                │  │
│  │  ├── View project cost reports                           │  │
│  │  ├── Manage project-level plugins                        │  │
│  │  └── Rollback documentation versions                     │  │
│  │                                                          │  │
│  │  CONTRIBUTOR                                             │  │
│  │  ├── Trigger incremental generation                      │  │
│  │  ├── View generated documentation                        │  │
│  │  ├── Submit documentation edits for review               │  │
│  │  └── View generation history                             │  │
│  │                                                          │  │
│  │  VIEWER                                                  │  │
│  │  ├── View generated documentation                        │  │
│  │  ├── Search wiki content                                 │  │
│  │  └── View drift reports                                  │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  Multi-tenant isolation:                                       │
│  ├── Each tenant has isolated projects, users, and budgets     │
│  ├── API keys are scoped to tenant                             │
│  ├── No cross-tenant data access                               │
│  └── Separate AI cost tracking per tenant                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```
