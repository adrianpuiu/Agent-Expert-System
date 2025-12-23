import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Brain, 
  Activity, 
  Sparkles, 
  Github, 
  BookOpen, 
  Database,
  ArrowUpRight, 
  Clock,
  Zap,
  Users,
  Plus,
  Bot,
  Network,
  Swords,
  Headset,
  Globe
} from 'lucide-react';
import ExpertCard from './components/ExpertCard';
import ExpertiseModal from './components/ExpertiseModal';
import ChatModal from './components/ChatModal';
import MetaActionModal, { MetaActionType } from './components/MetaActionModal';
import CreateExpertModal from './components/CreateExpertModal';
import TrainExpertModal from './components/TrainExpertModal';
import WarRoomModal from './components/WarRoomModal';
import VoiceCallModal from './components/VoiceCallModal';
import TaskQueueWidget from './components/TaskQueueWidget';
import { Expert, ExpertStatus, ExpertType, LogEntry, ChatMessage, ExpertiseHistory, AgentTask, TaskPriority, TaskStatus } from './types';
import { chatWithExpert, selfImproveExpert, trainExpert as trainExpertService } from './services/geminiService';

// Mock Initial Data (Used only if localStorage is empty)
const INITIAL_EXPERTS: Expert[] = [
  {
    id: '12',
    name: 'Shadcn/UI Meta Architect',
    type: ExpertType.META,
    description: 'A deep agent meta-expert that dynamically generates specialized subagents, tools, and workflows matching your shadcn/ui factory pattern.',
    status: ExpertStatus.IDLE,
    learnings: 42,
    lastUpdated: new Date().toISOString(),
    version: 1,
    history: [],
    expertise: `architecture:
  framework: LangGraph Deep Agent
  role: Meta-Orchestrator
  persistence: Checkpointer (TTL 30 days)
  memory: /memories/shadcn-v2-updates

core_mindset:
  - "Transform UI drudgery into factories"
  - "Regular dev: npx shadcn@latest add button ×15 -> 2 weeks"
  - "YOU: shadcn-meta generate --preset enterprise-dashboard -> 30min"

workflow_engine:
  1_parse: "Input Spec -> write_file(/spec.json)"
  2_plan: "write_todos (10 goals workflow)"
  3_delegate: "task(subagent_name, payload)"
  4_assemble: "write_file(/output/registry.json)"

subagents:
  component_factory:
    role: "CVA Factory Expert"
    input: "DesignTokens JSON"
    output_artifacts:
      - "button.tsx (75 combinations: 5 sizes × 5 intents × 3 states)"
      - "cva.ts config"
      - "button.stories.tsx"
      - "button.test.tsx (a11y + keyboard)"
  
  design_system_builder:
    role: "Design System Factory"
    input: "BrandSpec (Colors, Typography, Spacing)"
    output_artifacts:
      - "components/ui/ (40 components pre-themed)"
      - "theme/tokens.css (CSS vars)"
      - "tailwind.config.ts"
      - "registry.json (shadcn format)"

  dashboard_factory:
    role: "SaaS Dashboard Generator"
    input: "YAML Configuration"
    output_artifacts:
      - "app/(dashboard)/layout.tsx (sidebar shell)"
      - "app/(dashboard)/page.tsx (overview grid)"
      - "components/dashboard/ (stat-card, chart-widget)"

  form_generator:
    role: "Form Factory"
    input: "Zod Schema"
    logic: "Field mapping: enum->Select, date->DatePicker, array->multi-select"
    features: "Two-column responsive layout + error announcements"

  a11y_engine:
    role: "Compliance & Remediation"
    standards: "WCAG 2.1 AA"
    tasks:
      - "Missing aria-labels -> context inference"
      - "Contrast violations -> safe alternatives"
      - "Focus traps -> management hooks"

cli_interface_simulation:
  generate_preset: "shadcn-meta generate --preset <name>"
  create_theme: "shadcn-meta theme create --brand <json>"
  create_dashboard: "shadcn-meta dashboard create --config <yaml>"
  upgrade_system: "shadcn-meta upgrade --all"

tech_stack:
  frontend: "React 19, Next.js 14+, TailwindCSS"
  validation: "Zod, React Hook Form"
  tools: "Lucide React, Recharts"
  testing: "Vitest, Playwright, axe-core"`
  },
  {
    id: '1',
    name: 'Database Architect',
    type: ExpertType.DATABASE,
    description: 'Maintains the source of truth for data schemas, indexing strategies, and query performance optimization.',
    status: ExpertStatus.ACTIVE,
    learnings: 12,
    lastUpdated: new Date().toISOString(),
    version: 3,
    history: [],
    expertise: `identity:
  role: Principal Database Engineer
  philosophy: "Data integrity is non-negotiable; performance is engineered, not accidental."

core_technology:
  engine: PostgreSQL 16.2
  extensions:
    - pg_stat_statements: "Query performance monitoring"
    - postgis: "Geospatial data handling"
    - pg_trgm: "Fuzzy string matching"
    - pgcrypto: "hashing/encryption within DB"
    - citus: "Distributed tables (future scale)"

architecture_topology:
  cluster_configuration:
    primary: 1 (Write/Read)
    replicas: 3 (Read-only, Async Streaming)
    sync_standby: 1 (High Durability candidate)
  
  connection_pooling:
    layer: PgBouncer
    mode: transaction
    max_client_conn: 10000
    default_pool_size: 20
    query_timeout: 15s

schema_design_patterns:
  primary_keys: UUIDv7 (Time-sortable, avoids fragmentation)
  audit_strategy: 
    method: Trigger-based (PL/pgSQL)
    target: audit.record_changes table
    fields: [user_id, operation, old_val, new_val, timestamp]
  
  partitioning_strategy:
    time_series_data: DECLARATIVE PARTITIONING BY RANGE (created_at)
    retention_policy: "Detach partition > 1 year -> Archive to S3 -> Drop"

indexing_strategy:
  rules:
    - "Index all Foreign Keys"
    - "Use Partial Indexes for status flags (e.g., WHERE status != 'archived')"
    - "Use BRIN indexes for high-velocity append-only timestamps"
    - "Covering Indexes for frequent read-only queries (INCLUDE clause)"

performance_tuning:
  shared_buffers: "25% of RAM"
  effective_cache_size: "75% of RAM"
  work_mem: "16MB (monitoring temp file usage)"
  maintenance_work_mem: "1GB"
  autovacuum:
    scale_factor: 0.02 (Aggressive for high churn)
    naptime: 1min
    vacuum_cost_limit: 2000

operational_playbooks:
  slow_query_analysis:
    1: "Check pg_stat_statements for calls > 100ms"
    2: "EXPLAIN (ANALYZE, BUFFERS) specific query"
    3: "Check for Seq Scans vs Index Scans"
    4: "Verify statistics freshness (ANALYZE table_name)"
  
  bloat_management:
    detection: "pgstattuple extension"
    remediation: "pg_repack (online) or VACUUM FULL (maintenance window)"`
  },
  {
    id: '2',
    name: 'API Gateway Lead',
    type: ExpertType.API,
    description: 'Governs the interface contract, authentication flows, rate limiting, and request validation standards.',
    status: ExpertStatus.ACTIVE,
    learnings: 8,
    lastUpdated: new Date().toISOString(),
    version: 2,
    history: [],
    expertise: `identity:
  role: API Platform Architect
  philosophy: "The API is the product. Consistency, predictability, and safety are paramount."

governance_framework:
  style_guide: Zalando RESTful Guidelines
  versioning:
    strategy: URI Path (v1, v2)
    deprecation_policy: "Sunset header + 6 month notice"
  documentation:
    spec: OpenAPI 3.1
    portal: Backstage.io
    linting: Spectral (OAS linter)

traffic_management:
  ingress_controller: Kong / Nginx
  rate_limiting:
    global: 10,000 req/s
    per_ip: 60 req/min (Anonymous)
    per_user: 1000 req/min (Authenticated)
    strategy: Sliding Window implementation via Redis
    headers:
      - X-RateLimit-Limit
      - X-RateLimit-Remaining
      - X-RateLimit-Reset

security_perimeter:
  authentication:
    protocol: OAuth 2.1 / OIDC
    flow: Authorization Code with PKCE
    token_validation: JWT (Stateless) + JWKS caching
  
  authorization:
    model: ABAC (Attribute-Based) over RBAC
    policy_engine: Open Policy Agent (OPA)
    scopes: granular (resource:action)

resilience_patterns:
  circuit_breaking:
    threshold: 50% error rate over 10s
    recovery: Half-Open state after 30s
  
  timeouts:
    gateway: 29s (Hard limit)
    upstream: 5s (Default)
  
  caching:
    public_get: Cache-Control: s-maxage=60, stale-while-revalidate=30
    private_data: No-Store

request_lifecycle:
  1_identification: Correlation-ID injection
  2_sanitization: Strip X-Powered-By, standard headers
  3_validation: JSON Schema enforcement (Zod)
  4_routing: Upstream mapping via Service Discovery
  5_response: Transform errors to RFC 7807 Problem Details`
  },
  {
    id: '5',
    name: 'Backend Core',
    type: ExpertType.BACKEND,
    description: 'Orchestrates microservices, background workers, and core business logic execution.',
    status: ExpertStatus.ACTIVE,
    learnings: 15,
    lastUpdated: new Date().toISOString(),
    version: 4,
    history: [],
    expertise: `identity:
  role: Distributed Systems Engineer
  philosophy: "Build for failure. Decouple everything. State is the enemy of scale."

architectural_patterns:
  style: Event-Driven Microservices
  communication:
    synchronous: gRPC (Internal, high-perf)
    asynchronous: RabbitMQ (Task distribution) / Kafka (Data streaming)
  consistency_model: Eventual Consistency (Saga Pattern for distributed tx)

tech_stack:
  runtime: Node.js 22 (LTS) / Go 1.22
  frameworks: 
    node: NestJS (Structured DDD)
    go: Echo/Gin
  orm: Prisma (Typesafe) or raw SQL via Kysely

concurrency_model:
  node: Event Loop + Worker Threads for CPU intensive tasks
  go