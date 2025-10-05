# Architecture Documentation

This document provides a comprehensive overview of the Strategy Telemetry & Performance Analytics platform architecture.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Design Patterns](#design-patterns)
- [Scalability Considerations](#scalability-considerations)

## System Overview

The platform is built as a modern web application using Next.js with the App Router pattern. It provides real-time monitoring, analytics, and simulation capabilities for algorithmic trading strategies.

### Key Architectural Principles

1. **Component-Based Design**: Modular React components for reusability
2. **Type Safety**: Strict TypeScript throughout the codebase
3. **API-First**: REST API layer for data ingestion and retrieval
4. **Separation of Concerns**: Clear boundaries between UI, API, business logic, and data layers
5. **Real-Time Updates**: Client-side polling for near real-time metrics

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Dashboard  │  │   Sandbox    │  │   UI Components      │   │
│  │    Page     │  │     Page     │  │  (shadcn/ui + custom)│   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Ingestion  │  │   Metrics    │  │    What-If / Anomaly │  │
│  │  Endpoints   │  │  Endpoints   │  │      Endpoints       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Metrics    │  │   Anomaly    │  │    What-If           │  │
│  │  Calculator  │  │   Detector   │  │    Simulator         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │  Validators  │  │ Transformers │                            │
│  └──────────────┘  └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Data Layer                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               In-Memory Data Store                        │   │
│  │  - Fills      - Cancels     - Rejects                    │   │
│  │  - Latency    - Anomalies   - Strategies                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### Frontend Layer

#### Pages

**Dashboard (`app/page.tsx`)**
- Main landing page displaying overview metrics
- Strategy performance table
- Time-series charts (latency, volume, P&L)
- Recent anomaly alerts

**Sandbox (`app/sandbox/page.tsx`)**
- What-if scenario testing interface
- Parameter adjustment controls
- Comparative analysis visualization

#### Components

Located in `components/`:
- `metrics-card.tsx`: Displays individual KPI metrics
- `strategy-table.tsx`: Tabular view of strategy performance
- `latency-chart.tsx`: Latency time-series visualization
- `volume-chart.tsx`: Volume time-series visualization
- `pnl-chart.tsx`: P&L time-series visualization
- `anomaly-alert.tsx`: Anomaly notification component
- `whatif-sandbox.tsx`: What-if simulation interface
- `ui/`: shadcn/ui primitives (buttons, cards, tables, etc.)

### API Layer

All API routes are located in `app/api/` and follow Next.js App Router conventions.

#### Ingestion Endpoints

**`app/api/ingest/`**
- `fills/route.ts`: POST/GET for trade fills
- `cancels/route.ts`: POST/GET for order cancellations
- `rejects/route.ts`: POST/GET for order rejections
- `latency/route.ts`: POST/GET for latency metrics

Each endpoint:
1. Validates incoming data using validators
2. Stores data in the data store
3. Returns success/error response

#### Metrics Endpoints

**`app/api/metrics/`**
- `overview/route.ts`: Aggregated metrics across all strategies
- `strategy/[strategyId]/route.ts`: Detailed metrics for specific strategy

Responsibilities:
- Fetch data from data store
- Calculate metrics using MetricsCalculator
- Return formatted JSON response

#### Anomaly Endpoints

**`app/api/anomalies/`**
- `route.ts`: GET anomalies with filtering
- `detect/route.ts`: POST to trigger detection

#### What-If Endpoints

**`app/api/whatif/`**
- `simulate/route.ts`: POST to simulate single scenario
- `compare/route.ts`: POST to compare multiple scenarios

### Business Logic Layer

#### Metrics Calculator (`lib/metrics/calculator.ts`)

Core analytics engine that computes:
- Fill, cancel, and reject rates
- Latency percentiles (P50, P95, P99)
- Volume and P&L calculations
- Sharpe ratio and max drawdown
- Time-series data aggregation

Key methods:
```typescript
class MetricsCalculator {
  static calculatePerformanceMetrics(): PerformanceMetrics
  static calculateStrategyMetrics(): StrategyMetrics
  static calculateLatencyPercentiles()
  static calculateSharpeRatio()
  static calculateMaxDrawdown()
  static calculateFillRateTimeSeries()
  static calculateLatencyTimeSeries()
  static calculateVolumeTimeSeries()
  static calculatePnLTimeSeries()
}
```

#### Anomaly Detector (`lib/anomaly/detector.ts`)

Statistical anomaly detection using:
- Z-score analysis for latency spikes
- Rate threshold monitoring
- Moving window averages
- Configurable thresholds

Detection types:
- `latency_spike`: Unusual latency increases
- `high_reject_rate`: Elevated rejection rates
- `fill_rate_drop`: Decreased fill rates
- `unusual_volume`: Volume anomalies

#### What-If Simulator (`lib/whatif/simulator.ts`)

Scenario simulation engine that:
- Applies parameter constraints to historical data
- Projects metrics under different configurations
- Compares scenarios
- Identifies optimal parameters

Simulation parameters:
- `max_position_size`: Position size limits
- `order_timeout_ms`: Order timeout constraints
- `min_fill_rate`: Minimum acceptable fill rate
- `max_latency_ms`: Maximum latency threshold
- `risk_multiplier`: Risk adjustment factor

#### ETL Components (`lib/etl/`)

**Validators (`validators.ts`)**
- Input data validation
- Type checking
- Business rule enforcement

**Transformers (`transformers.ts`)**
- Data normalization
- Format conversions
- Enrichment logic

### Data Layer

#### Data Store (`lib/data-store.ts`)

In-memory singleton managing all telemetry data:

```typescript
class TelemetryDataStore {
  private fills: Fill[]
  private cancels: Cancel[]
  private rejects: Reject[]
  private latencyMetrics: LatencyMetric[]
  private anomalies: Anomaly[]
  private strategies: Strategy[]
  
  // CRUD operations for each entity
  getFills(strategyId?, limit?): Fill[]
  addFill(fill: Fill): void
  // ... similar for other entities
}
```

**Current Implementation**: In-memory arrays with sorting and filtering
**Future Considerations**: Can be replaced with database (PostgreSQL, MongoDB, etc.)

#### Type Definitions (`lib/types.ts`)

TypeScript interfaces defining core data models:
- `Fill`: Trade execution data
- `Cancel`: Order cancellation data
- `Reject`: Order rejection data
- `LatencyMetric`: Latency measurements
- `Anomaly`: Detected anomalies
- `Strategy`: Trading strategy metadata
- `StrategyMetrics`: Computed metrics
- `WhatIfScenario`: Simulation scenarios

## Data Flow

### Ingestion Flow

```
External System → POST /api/ingest/{type} → Validator → Data Store → Success Response
                                                 ↓
                                            Error Response
```

### Metrics Flow

```
Frontend → GET /api/metrics/overview → Data Store → MetricsCalculator → JSON Response
                                                           ↓
                                                    Aggregate & Format
```

### Anomaly Detection Flow

```
User Trigger → POST /api/anomalies/detect → Data Store → AnomalyDetector → Store Anomalies
                                                                 ↓
                                                          Return Detected
```

### What-If Simulation Flow

```
User Input → POST /api/whatif/simulate → WhatIfSimulator → Apply Parameters
                                                 ↓
                                          Calculate Metrics → Return Scenario
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4 (App Router)
- **UI Library**: React 19
- **Component Library**: shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Mono

### Backend
- **Runtime**: Next.js API Routes
- **Language**: TypeScript 5
- **Data Storage**: In-memory (TelemetryDataStore)
- **Validation**: Custom validators

### Development
- **Package Manager**: pnpm
- **Build Tool**: Next.js built-in
- **Type Checking**: TypeScript compiler
- **Linting**: ESLint (Next.js config)

### Analytics & Monitoring
- **Analytics**: Vercel Analytics

## Directory Structure

```
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── anomalies/        # Anomaly detection endpoints
│   │   ├── ingest/           # Data ingestion endpoints
│   │   ├── metrics/          # Metrics endpoints
│   │   └── whatif/           # What-if simulation endpoints
│   ├── sandbox/              # Sandbox page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Dashboard page
├── components/               # React components
│   ├── ui/                   # shadcn/ui components
│   ├── anomaly-alert.tsx     # Anomaly display
│   ├── latency-chart.tsx     # Charts
│   ├── metrics-card.tsx      # Metric cards
│   ├── strategy-table.tsx    # Strategy table
│   └── whatif-sandbox.tsx    # Simulation UI
├── docs/                     # Documentation
├── hooks/                    # Custom React hooks
├── lib/                      # Business logic & utilities
│   ├── anomaly/              # Anomaly detection
│   ├── etl/                  # ETL utilities
│   ├── metrics/              # Metrics calculation
│   ├── whatif/               # What-if simulation
│   ├── data-store.ts         # Data layer
│   ├── mock-data.ts          # Mock data generator
│   ├── types.ts              # TypeScript types
│   └── utils.ts              # Utility functions
├── public/                   # Static assets
├── styles/                   # Additional styles
└── package.json              # Dependencies
```

## Design Patterns

### 1. Singleton Pattern
**Data Store**: Single instance managing all data
```typescript
export const dataStore = new TelemetryDataStore()
```

### 2. Static Factory Pattern
**Metrics Calculator**: Static methods for metric calculations
```typescript
MetricsCalculator.calculatePerformanceMetrics(...)
```

### 3. Validator Pattern
**ETL Validators**: Standardized validation with consistent return type
```typescript
validateFill(data): ValidationResult
```

### 4. Repository Pattern
**Data Store**: Abstracted data access methods
```typescript
dataStore.getFills(strategyId?, limit?)
```

### 5. Strategy Pattern
**Anomaly Detection**: Different detection strategies for different anomaly types

## Scalability Considerations

### Current Limitations

1. **In-Memory Storage**: Limited by server memory
2. **Single Instance**: No horizontal scaling
3. **No Caching**: Repeated calculations for same data
4. **Client Polling**: Inefficient for real-time updates

### Recommended Improvements

#### For Production Scale

1. **Database Integration**
   - Replace in-memory store with PostgreSQL/TimescaleDB
   - Implement proper indexing on strategy_id and timestamp
   - Use connection pooling

2. **Caching Layer**
   - Add Redis for frequently accessed metrics
   - Cache calculated metrics with TTL
   - Implement cache invalidation on new data

3. **Real-Time Updates**
   - Replace polling with WebSockets or Server-Sent Events
   - Push updates to clients on data changes

4. **Background Processing**
   - Move metric calculations to background jobs
   - Use message queue (RabbitMQ, Redis Pub/Sub)
   - Implement worker processes

5. **API Optimizations**
   - Add pagination for large result sets
   - Implement field selection (GraphQL or sparse fieldsets)
   - Add compression (gzip)

6. **Monitoring & Observability**
   - Add application performance monitoring (APM)
   - Implement structured logging
   - Add metrics collection (Prometheus)

7. **Security**
   - Add authentication/authorization
   - Implement rate limiting
   - Add input sanitization
   - Enable CORS properly

8. **Horizontal Scaling**
   - Containerize application (Docker)
   - Deploy to Kubernetes or similar
   - Implement load balancing
   - Use stateless architecture

## Performance Characteristics

### Current Performance

- **Metric Calculations**: O(n) where n is number of data points
- **Time-Series Aggregation**: O(n log n) due to sorting
- **Anomaly Detection**: O(n*w) where w is window size
- **Data Retrieval**: O(n) with filtering

### Optimization Opportunities

1. **Memoization**: Cache expensive calculations
2. **Lazy Loading**: Load data on demand
3. **Incremental Updates**: Update metrics incrementally instead of full recalculation
4. **Indexed Data Structures**: Use maps/sets for faster lookups
5. **Stream Processing**: Process data in streams for large datasets

## Security Considerations

### Current State
- No authentication/authorization
- No rate limiting
- No input sanitization beyond validation
- No encryption at rest or in transit (HTTPS only)

### Recommendations
1. Implement JWT-based authentication
2. Add role-based access control (RBAC)
3. Enable rate limiting per API key/user
4. Sanitize all inputs
5. Add audit logging
6. Implement API key rotation
7. Use environment variables for sensitive config

## Testing Strategy

### Recommended Test Structure

```
tests/
├── unit/
│   ├── lib/metrics/calculator.test.ts
│   ├── lib/anomaly/detector.test.ts
│   ├── lib/etl/validators.test.ts
│   └── lib/whatif/simulator.test.ts
├── integration/
│   ├── api/ingest.test.ts
│   ├── api/metrics.test.ts
│   └── api/whatif.test.ts
└── e2e/
    ├── dashboard.test.ts
    └── sandbox.test.ts
```

### Testing Tools
- **Unit Tests**: Jest or Vitest
- **Integration Tests**: Supertest with Next.js
- **E2E Tests**: Playwright or Cypress
- **Coverage**: NYC or c8

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for development workflow and contribution guidelines.
