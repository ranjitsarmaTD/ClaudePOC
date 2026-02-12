# 9. Deployment Models

## 9.1 SaaS Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEEPWIKI SaaS ARCHITECTURE                   │
│                                                                  │
│  Internet                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   CloudFront / CDN                        │   │
│  │                   (Static wiki serving)                    │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                  │                                               │
│  ┌───────────────▼──────────────────────────────────────────┐   │
│  │              API Gateway (AWS API Gateway / Kong)          │   │
│  │              ├── Rate limiting                             │   │
│  │              ├── API key validation                        │   │
│  │              ├── Request routing                           │   │
│  │              └── WAF protection                            │   │
│  └───────────────┬──────────────────────────────────────────┘   │
│                  │                                               │
│  ┌───────────────▼──────────────────────────────────────────┐   │
│  │              Application Layer (ECS / EKS)                │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │ API Server │  │ Webhook    │  │ Generation │         │   │
│  │  │ (3 tasks)  │  │ Receiver   │  │ Workers    │         │   │
│  │  │            │  │ (2 tasks)  │  │ (auto-scale│         │   │
│  │  │            │  │            │  │  0-20 tasks)│         │   │
│  │  └────────────┘  └────────────┘  └────────────┘         │   │
│  │                                                           │   │
│  └───────────────┬──────────────────────────────────────────┘   │
│                  │                                               │
│  ┌───────────────▼──────────────────────────────────────────┐   │
│  │              Data Layer                                   │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │ RDS        │  │ ElastiCache│  │ Neptune /  │         │   │
│  │  │ PostgreSQL │  │ Redis      │  │ Neo4j AMI  │         │   │
│  │  │ (Multi-AZ) │  │ (Cluster)  │  │ (Graph DB) │         │   │
│  │  └────────────┘  └────────────┘  └────────────┘         │   │
│  │                                                           │   │
│  │  ┌────────────┐  ┌────────────┐                          │   │
│  │  │ S3         │  │ SQS        │                          │   │
│  │  │ (Wikis,    │  │ (Event     │                          │   │
│  │  │  artifacts)│  │  Queues)   │                          │   │
│  │  └────────────┘  └────────────┘                          │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Pricing Tiers:                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  FREE:       3 public repos, 5 generations/month         │   │
│  │  TEAM ($49): 20 repos, 100 gen/month, private repos      │   │
│  │  ENTERPRISE: Unlimited, SSO, SLA, dedicated support      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9.2 Self-Hosted Model

### Docker Compose (Single Machine)

```yaml
# docker-compose.yml — Single-machine self-hosted deployment
version: '3.8'

services:
  deepwiki-api:
    image: deepwiki/server:latest
    ports:
      - "3100:3100"
    environment:
      - DATABASE_URL=postgresql://deepwiki:${DB_PASSWORD}@postgres:5432/deepwiki
      - REDIS_URL=redis://redis:6379
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DEEPWIKI_SECRET_KEY=${DEEPWIKI_SECRET_KEY}
      - WIKI_STORAGE_PATH=/data/wikis
      - LOG_LEVEL=info
    volumes:
      - wiki-data:/data/wikis
      - graph-data:/data/graph
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3100/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  deepwiki-worker:
    image: deepwiki/worker:latest
    environment:
      - DATABASE_URL=postgresql://deepwiki:${DB_PASSWORD}@postgres:5432/deepwiki
      - REDIS_URL=redis://redis:6379
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - WIKI_STORAGE_PATH=/data/wikis
      - MAX_CONCURRENT_GENERATIONS=2
      - LOG_LEVEL=info
    volumes:
      - wiki-data:/data/wikis
      - graph-data:/data/graph
      - git-cache:/data/git-cache
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      replicas: 2

  deepwiki-web:
    image: deepwiki/web:latest
    ports:
      - "3101:80"
    environment:
      - API_URL=http://deepwiki-api:3100
    depends_on:
      - deepwiki-api

  postgres:
    image: pgvector/pgvector:pg16
    environment:
      - POSTGRES_DB=deepwiki
      - POSTGRES_USER=deepwiki
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U deepwiki"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    command: redis-server --appendonly yes --maxmemory 1gb --maxmemory-policy allkeys-lru

volumes:
  postgres-data:
  redis-data:
  wiki-data:
  graph-data:
  git-cache:
```

### System Requirements (Self-Hosted)

```
┌─────────────────────────────────────────────────────────────────┐
│                SELF-HOSTED REQUIREMENTS                         │
│                                                                  │
│  Small (< 10 projects, < 500 files each):                       │
│  ├── CPU:    4 cores                                            │
│  ├── RAM:    8 GB                                               │
│  ├── Disk:   50 GB SSD                                          │
│  ├── Workers: 2                                                  │
│  └── Estimated: $50-100/month cloud VM                          │
│                                                                  │
│  Medium (< 50 projects, < 2000 files each):                     │
│  ├── CPU:    8 cores                                            │
│  ├── RAM:    16 GB                                              │
│  ├── Disk:   200 GB SSD                                         │
│  ├── Workers: 4                                                  │
│  └── Estimated: $150-300/month cloud VM                         │
│                                                                  │
│  Large (50+ projects, enterprise):                               │
│  ├── CPU:    16+ cores                                          │
│  ├── RAM:    32+ GB                                             │
│  ├── Disk:   500+ GB SSD                                        │
│  ├── Workers: 8+ (auto-scaled)                                   │
│  ├── Dedicated PostgreSQL instance                               │
│  ├── Redis cluster                                               │
│  └── Kubernetes recommended                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9.3 Serverless Option

### AWS Lambda Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│               SERVERLESS DEEPWIKI (AWS)                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Gateway                                               │ │
│  │  └── Lambda: deepwiki-api                                  │ │
│  │      (REST API handler, 256MB, 30s timeout)                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Webhook Handler                                           │ │
│  │  └── Lambda: deepwiki-webhook                              │ │
│  │      (Receives webhooks, enqueues work, 128MB, 10s)        │ │
│  │      → Publishes to SQS                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Generation Pipeline (Step Functions)                      │ │
│  │                                                            │ │
│  │  SQS → Step Function Execution:                            │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │ Analyze  │→ │ Generate │→ │ Validate │→ │ Publish  │  │ │
│  │  │ Lambda   │  │ Lambda   │  │ Lambda   │  │ Lambda   │  │ │
│  │  │ 1GB      │  │ 2GB      │  │ 512MB    │  │ 512MB    │  │ │
│  │  │ 60s      │  │ 900s     │  │ 60s      │  │ 60s      │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  │                                                            │ │
│  │  Generate Lambda handles Claude API calls with streaming.  │ │
│  │  For large projects, Step Functions runs multiple Generate │ │
│  │  Lambdas in parallel (Map state).                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Data Layer                                                │ │
│  │  ├── DynamoDB: Project metadata, generation runs           │ │
│  │  ├── S3: Wiki content, git clones, artifacts               │ │
│  │  ├── ElastiCache Redis: Caching (Serverless tier)          │ │
│  │  └── Aurora Serverless v2: PostgreSQL (auto-scaling)       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Static Wiki Serving                                       │ │
│  │  └── S3 + CloudFront                                       │ │
│  │      (Generated wiki deployed as static site)              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Cost Estimate (pay-per-use):                                    │
│  ├── 100 generations/month: ~$5-15 (compute)                    │
│  ├── + Claude API costs (variable)                               │
│  ├── + Storage: ~$1-5/month                                      │
│  └── Total: ~$20-50/month for small teams (+ AI API costs)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9.4 Kubernetes Deployment

### Helm Chart Structure

```
deepwiki-helm/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── _helpers.tpl
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   │
│   ├── api/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── ingress.yaml
│   │
│   ├── worker/
│   │   ├── deployment.yaml
│   │   ├── hpa.yaml
│   │   └── pdb.yaml
│   │
│   ├── webhook/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   │
│   ├── web/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   │
│   ├── jobs/
│   │   ├── db-migrate.yaml
│   │   └── drift-check-cronjob.yaml
│   │
│   └── monitoring/
│       ├── servicemonitor.yaml
│       └── grafana-dashboard.yaml
│
└── charts/
    ├── postgresql/             # Bitnami subchart
    └── redis/                  # Bitnami subchart
```

### Key Kubernetes Resources

```yaml
# values.yaml (abbreviated)
global:
  imageRegistry: ghcr.io/deepwiki

api:
  replicaCount: 3
  image:
    repository: deepwiki/server
    tag: "1.0.0"
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilization: 70
  ingress:
    enabled: true
    className: nginx
    hosts:
      - host: api.deepwiki.example.com
        paths: ["/"]
    tls:
      - secretName: deepwiki-api-tls
        hosts: ["api.deepwiki.example.com"]

worker:
  replicaCount: 2
  image:
    repository: deepwiki/worker
    tag: "1.0.0"
  resources:
    requests:
      cpu: 1000m
      memory: 2Gi
    limits:
      cpu: 2000m
      memory: 4Gi
  autoscaling:
    enabled: true
    minReplicas: 1
    maxReplicas: 20
    # Scale based on queue depth (custom metric)
    metrics:
      - type: External
        external:
          metric:
            name: deepwiki_queue_depth
          target:
            type: AverageValue
            averageValue: 5
  env:
    MAX_CONCURRENT_GENERATIONS: "3"
    GIT_CACHE_SIZE_GB: "10"

  persistence:
    enabled: true
    storageClass: gp3
    size: 50Gi
    accessModes: [ReadWriteOnce]

webhook:
  replicaCount: 2
  resources:
    requests: { cpu: 250m, memory: 256Mi }
    limits: { cpu: 500m, memory: 512Mi }

web:
  replicaCount: 2
  resources:
    requests: { cpu: 100m, memory: 128Mi }
    limits: { cpu: 250m, memory: 256Mi }

postgresql:
  enabled: true
  auth:
    postgresPassword: ""            # From secret
    database: deepwiki
  primary:
    persistence:
      size: 50Gi
  extensions:
    - pgvector

redis:
  enabled: true
  architecture: replication
  master:
    persistence:
      size: 5Gi

driftCheck:
  schedule: "0 2 * * *"              # Daily at 2 AM
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5

monitoring:
  enabled: true
  serviceMonitor:
    interval: 30s
  grafanaDashboard:
    enabled: true
```
