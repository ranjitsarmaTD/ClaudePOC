# DeepWiki Framework — Complete Architecture Blueprint

**Version**: 1.0.0
**Classification**: Enterprise Architecture Document
**Author**: Principal Architecture Team
**Date**: 2026-02-11

---

## Table of Contents

| # | Section | Document |
|---|---------|----------|
| 1 | [High-Level Architecture (HLD)](./01-HLD.md) | System boundaries, data flow, component map |
| 2 | [Low-Level Design (LLD)](./02-LLD.md) | Module breakdown, contracts, data models |
| 3 | [Core Engine Design](./03-CORE-ENGINE.md) | Parsing, knowledge graph, change detection |
| 4 | [Claude Integration Layer](./04-CLAUDE-INTEGRATION.md) | Prompt orchestration, RAG, cost optimization |
| 5 | [Template Structure](./05-TEMPLATE-STRUCTURE.md) | Generic wiki folder/document structure |
| 6 | [CI/CD & Automation](./06-CICD-AUTOMATION.md) | Pipeline design, hooks, caching |
| 7 | [Governance Model](./07-GOVERNANCE.md) | Versioning, validation, drift detection |
| 8 | [Scalability](./08-SCALABILITY.md) | Multi-repo, multi-tenant, monorepo |
| 9 | [Deployment Models](./09-DEPLOYMENT.md) | SaaS, self-hosted, serverless, K8s |
| 10 | [Extensibility](./10-EXTENSIBILITY.md) | Plugin architecture, adapters |
| 11 | [Reference Implementation](./11-REFERENCE-IMPLEMENTATION.md) | APIs, schemas, prompts, diagrams |
| 12 | [Adoption Roadmap](./12-ADOPTION-ROADMAP.md) | 3 adoption paths, onboarding guide, build order, cost estimates |

---

## Executive Summary

DeepWiki Framework is a **project-agnostic, AI-native documentation engine** that automatically generates, maintains, and validates living documentation for any software project. It treats documentation as a first-class artifact — version-controlled, CI-enforced, drift-detected, and continuously refined by an AI orchestration layer built on Claude.

### Core Thesis

> Code changes. Documentation rots. DeepWiki eliminates documentation drift by treating
> wiki generation as a **deterministic pipeline** — triggered by code changes, informed by
> static analysis, enriched by AI, and validated by governance rules.

### Design Principles

| Principle | Implication |
|-----------|-------------|
| **Code-first** | All documentation derives from source code as the single source of truth |
| **Incremental** | Only changed modules trigger regeneration — never full-repo reprocessing |
| **Deterministic** | Same code state + same config = same documentation output |
| **AI-augmented, not AI-dependent** | System functions without AI (structural docs); AI enriches explanations |
| **Language-agnostic** | Parser layer abstracts language specifics behind a universal AST contract |
| **Enterprise-grade** | RBAC, audit trails, approval workflows, multi-tenant isolation |
| **Cost-conscious** | Token budgets, caching, deduplication — AI calls are expensive, treat them as such |

---

## System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SYSTEMS                               │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │  GitHub   │  │  GitLab  │  │Bitbucket │  │  Azure   │  │  Local   │ │
│  │  Repos    │  │  Repos   │  │  Repos   │  │  DevOps  │  │  Git     │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │              │              │              │              │      │
│       └──────────────┴──────────────┴──────┬───────┴──────────────┘      │
│                                            │                            │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  │  ┌──────────┐             │
│  │  Claude  │  │  CI/CD   │  │  SSO /  │  │  │  Object  │             │
│  │  API     │  │ Runners  │  │  IAM    │  │  │  Storage │             │
│  └────┬─────┘  └────┬─────┘  └────┬────┘  │  └────┬─────┘             │
│       │              │              │       │       │                   │
└───────┼──────────────┼──────────────┼───────┼───────┼───────────────────┘
        │              │              │       │       │
        ▼              ▼              ▼       ▼       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                    ╔═══════════════════════════════╗                     │
│                    ║   DEEPWIKI FRAMEWORK CORE     ║                     │
│                    ╚═══════════════════════════════╝                     │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  Ingestion  │  │   Core      │  │   Claude     │  │  Governance  │  │
│  │  Gateway    │──│   Engine    │──│   Orchestr.  │──│  & Delivery  │  │
│  │             │  │             │  │              │  │              │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘  │
│         │                │                │                │            │
│         ▼                ▼                ▼                ▼            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    DATA & STORAGE LAYER                         │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │   │
│  │  │Knowledge │  │  Wiki    │  │  Cache   │  │  Audit   │       │   │
│  │  │  Graph   │  │  Store   │  │  Layer   │  │  Log     │       │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          CONSUMERS                                      │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Web UI  │  │  IDE     │  │  CLI     │  │  MCP     │              │
│  │  Portal  │  │  Plugin  │  │  Tool    │  │  Server  │              │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start (For Architects)

1. Start with **[HLD](./01-HLD.md)** to understand system boundaries
2. Dive into **[Core Engine](./03-CORE-ENGINE.md)** for the parsing/analysis pipeline
3. Review **[Claude Integration](./04-CLAUDE-INTEGRATION.md)** for AI layer design
4. Check **[Reference Implementation](./11-REFERENCE-IMPLEMENTATION.md)** for concrete APIs/schemas
5. Use **[Template Structure](./05-TEMPLATE-STRUCTURE.md)** as the output format spec
