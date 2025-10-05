# Data Models Documentation

This document provides comprehensive documentation of all TypeScript interfaces and data models used in the Strategy Telemetry & Performance Analytics platform.

## Table of Contents

- [Core Telemetry Types](#core-telemetry-types)
- [Metrics Types](#metrics-types)
- [Anomaly Types](#anomaly-types)
- [What-If Types](#what-if-types)
- [Validation Types](#validation-types)
- [Time Series Types](#time-series-types)

## Core Telemetry Types

### Fill

Represents a successfully executed trade.

```typescript
interface Fill {
  id: string                    // Unique identifier (e.g., "fill-1234567890-abc123")
  timestamp: Date               // When the fill occurred
  strategy_id: string           // Strategy that generated this fill
  symbol: string                // Trading symbol (e.g., "BTC-USD", "AAPL")
  side: "buy" | "sell"          // Order side
  quantity: number              // Number of units filled (must be > 0)
  price: number                 // Fill price (must be > 0)
  venue: string                 // Execution venue (e.g., "coinbase", "binance")
  latency_ms: number            // Order-to-fill latency in milliseconds (>= 0)
  order_id: string              // Originating order identifier
}
```

**Example:**
```json
{
  "id": "fill-1705320600000-a1b2c3",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "strategy_id": "momentum-btc",
  "symbol": "BTC-USD",
  "side": "buy",
  "quantity": 1.5,
  "price": 45000.00,
  "venue": "coinbase",
  "latency_ms": 25,
  "order_id": "order-123456"
}
```

### Cancel

Represents a cancelled order.

```typescript
interface Cancel {
  id: string                    // Unique identifier
  timestamp: Date               // When the cancellation occurred
  strategy_id: string           // Strategy that generated this cancel
  symbol: string                // Trading symbol
  order_id: string              // Cancelled order identifier
  reason: string                // Cancellation reason (e.g., "timeout", "user_requested")
  latency_ms: number            // Cancel request latency in milliseconds (>= 0)
}
```

**Example:**
```json
{
  "id": "cancel-1705320600000-d4e5f6",
  "timestamp": "2024-01-15T10:31:00.000Z",
  "strategy_id": "momentum-btc",
  "symbol": "BTC-USD",
  "order_id": "order-123457",
  "reason": "timeout",
  "latency_ms": 30
}
```

### Reject

Represents a rejected order.

```typescript
interface Reject {
  id: string                    // Unique identifier
  timestamp: Date               // When the rejection occurred
  strategy_id: string           // Strategy that generated this reject
  symbol: string                // Trading symbol
  order_id: string              // Rejected order identifier
  reason: string                // Rejection reason (human-readable)
  error_code: string            // Machine-readable error code
}
```

**Example:**
```json
{
  "id": "reject-1705320600000-g7h8i9",
  "timestamp": "2024-01-15T10:32:00.000Z",
  "strategy_id": "momentum-btc",
  "symbol": "BTC-USD",
  "order_id": "order-123458",
  "reason": "Insufficient margin",
  "error_code": "ERR_MARGIN"
}
```

### LatencyMetric

Represents latency measurements for various system components.

```typescript
interface LatencyMetric {
  id: string                                                    // Unique identifier
  timestamp: Date                                               // When the measurement was taken
  strategy_id: string                                           // Associated strategy
  metric_type: "order_to_fill" | "market_data" | "signal_to_order"  // Type of latency being measured
  latency_ms: number                                            // Measured latency in milliseconds (>= 0)
  percentile_50?: number                                        // Optional: 50th percentile (median)
  percentile_95?: number                                        // Optional: 95th percentile
  percentile_99?: number                                        // Optional: 99th percentile
}
```

**Metric Types:**
- `order_to_fill`: Time from order submission to fill confirmation
- `market_data`: Time from market data generation to receipt
- `signal_to_order`: Time from signal generation to order submission

**Example:**
```json
{
  "id": "latency-1705320600000-j0k1l2",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "strategy_id": "momentum-btc",
  "metric_type": "order_to_fill",
  "latency_ms": 25,
  "percentile_50": 20,
  "percentile_95": 45,
  "percentile_99": 60
}
```

### Strategy

Represents a trading strategy configuration.

```typescript
interface Strategy {
  id: string                                    // Unique identifier
  name: string                                  // Human-readable name
  description: string                           // Strategy description
  status: "active" | "paused" | "stopped"       // Current operational status
  created_at: Date                              // When the strategy was created
}
```

**Example:**
```json
{
  "id": "momentum-btc",
  "name": "BTC Momentum Strategy",
  "description": "Momentum-based trading strategy for Bitcoin",
  "status": "active",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## Metrics Types

### StrategyMetrics

Aggregated metrics for a specific strategy over a time period.

```typescript
interface StrategyMetrics {
  strategy_id: string           // Strategy identifier
  date: string                  // Date of metrics (ISO 8601 date string)
  total_fills: number           // Total number of fills
  total_cancels: number         // Total number of cancels
  total_rejects: number         // Total number of rejects
  fill_rate: number             // Percentage of orders filled (0.0 to 1.0)
  cancel_rate: number           // Percentage of orders cancelled (0.0 to 1.0)
  reject_rate: number           // Percentage of orders rejected (0.0 to 1.0)
  avg_latency_ms: number        // Average latency in milliseconds
  p95_latency_ms: number        // 95th percentile latency
  p99_latency_ms: number        // 99th percentile latency
  total_volume: number          // Total volume traded
  total_pnl: number             // Total profit and loss
}
```

**Calculations:**
- `fill_rate = fills / (fills + cancels + rejects)`
- `cancel_rate = cancels / (fills + cancels + rejects)`
- `reject_rate = rejects / (fills + cancels + rejects)`

**Example:**
```json
{
  "strategy_id": "momentum-btc",
  "date": "2024-01-15",
  "total_fills": 100,
  "total_cancels": 10,
  "total_rejects": 5,
  "fill_rate": 0.87,
  "cancel_rate": 0.09,
  "reject_rate": 0.04,
  "avg_latency_ms": 25.5,
  "p95_latency_ms": 50,
  "p99_latency_ms": 75,
  "total_volume": 5000,
  "total_pnl": 800.25
}
```

### PerformanceMetrics

Extended performance metrics including risk-adjusted measures.

```typescript
interface PerformanceMetrics {
  fillRate: number              // Fill rate (0.0 to 1.0)
  cancelRate: number            // Cancel rate (0.0 to 1.0)
  rejectRate: number            // Reject rate (0.0 to 1.0)
  avgLatency: number            // Average latency in milliseconds
  p50Latency: number            // Median latency
  p95Latency: number            // 95th percentile latency
  p99Latency: number            // 99th percentile latency
  totalVolume: number           // Total volume traded
  totalPnl: number              // Total profit and loss
  sharpeRatio: number           // Risk-adjusted return (annualized)
  maxDrawdown: number           // Maximum drawdown from peak
}
```

**Advanced Metrics:**
- `sharpeRatio`: (Average Return - Risk-Free Rate) / Standard Deviation of Returns
- `maxDrawdown`: Maximum observed loss from a peak to a trough

**Example:**
```json
{
  "fillRate": 0.87,
  "cancelRate": 0.09,
  "rejectRate": 0.04,
  "avgLatency": 25.5,
  "p50Latency": 22,
  "p95Latency": 50,
  "p99Latency": 75,
  "totalVolume": 5000,
  "totalPnl": 800.25,
  "sharpeRatio": 2.1,
  "maxDrawdown": -150.50
}
```

## Anomaly Types

### Anomaly

Represents a detected anomaly in strategy performance.

```typescript
interface Anomaly {
  id: string                                                                            // Unique identifier
  timestamp: Date                                                                       // When the anomaly occurred
  strategy_id: string                                                                   // Affected strategy
  anomaly_type: "latency_spike" | "high_reject_rate" | "unusual_volume" | "fill_rate_drop"  // Type of anomaly
  severity: "low" | "medium" | "high" | "critical"                                     // Severity level
  description: string                                                                   // Human-readable description
  metric_value: number                                                                  // Observed metric value
  threshold_value: number                                                               // Threshold that was exceeded
  detected_at: Date                                                                     // When the anomaly was detected
}
```

**Anomaly Types:**
- `latency_spike`: Latency significantly higher than normal
- `high_reject_rate`: Reject rate exceeds threshold
- `unusual_volume`: Volume significantly differs from average
- `fill_rate_drop`: Fill rate significantly lower than normal

**Severity Levels:**
- `low`: Minor deviation, monitoring recommended
- `medium`: Moderate deviation, attention needed
- `high`: Significant deviation, action recommended
- `critical`: Severe deviation, immediate action required

**Example:**
```json
{
  "id": "anomaly-latency-1705320600000-m3n4o5",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "strategy_id": "momentum-btc",
  "anomaly_type": "latency_spike",
  "severity": "high",
  "description": "Latency spike detected: 150ms (3.5 std dev above normal)",
  "metric_value": 150,
  "threshold_value": 80,
  "detected_at": "2024-01-15T10:30:05.000Z"
}
```

### AnomalyThresholds

Configuration for anomaly detection thresholds.

```typescript
interface AnomalyThresholds {
  latencySpike: number          // Latency threshold in milliseconds
  highRejectRate: number        // Reject rate threshold (0.0 to 1.0)
  fillRateDrop: number          // Fill rate drop threshold (0.0 to 1.0)
  volumeMultiplier: number      // Volume deviation multiplier
}
```

**Default Values:**
```typescript
const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  latencySpike: 150,           // 150ms
  highRejectRate: 0.15,        // 15%
  fillRateDrop: 0.6,           // 60% of normal
  volumeMultiplier: 3          // 3x average volume
}
```

## What-If Types

### WhatIfScenario

Represents a simulated scenario with parameter changes.

```typescript
interface WhatIfScenario {
  id: string                    // Unique identifier
  name: string                  // Scenario name
  strategy_id: string           // Strategy being simulated
  parameters: {                 // Simulation parameters
    max_position_size?: number      // Maximum position size
    order_timeout_ms?: number       // Order timeout in milliseconds
    min_fill_rate?: number          // Minimum acceptable fill rate
    max_latency_ms?: number         // Maximum acceptable latency
  }
  projected_metrics: StrategyMetrics  // Projected metrics under these parameters
  created_at: Date              // When the scenario was created
}
```

**Example:**
```json
{
  "id": "scenario-1705320600000-p6q7r8",
  "name": "Conservative Risk Profile",
  "strategy_id": "momentum-btc",
  "parameters": {
    "max_position_size": 100,
    "order_timeout_ms": 5000,
    "min_fill_rate": 0.8,
    "max_latency_ms": 50
  },
  "projected_metrics": {
    "strategy_id": "momentum-btc",
    "date": "2024-01-15",
    "total_fills": 95,
    "total_cancels": 12,
    "total_rejects": 5,
    "fill_rate": 0.85,
    "cancel_rate": 0.11,
    "reject_rate": 0.04,
    "avg_latency_ms": 28,
    "p95_latency_ms": 48,
    "p99_latency_ms": 50,
    "total_volume": 4800,
    "total_pnl": 750.00
  },
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### SimulationParameters

Parameters for what-if simulation.

```typescript
interface SimulationParameters {
  max_position_size?: number    // Maximum position size constraint
  order_timeout_ms?: number     // Order timeout constraint in milliseconds
  min_fill_rate?: number        // Minimum fill rate constraint (0.0 to 1.0)
  max_latency_ms?: number       // Maximum latency constraint in milliseconds
  risk_multiplier?: number      // Risk adjustment multiplier (e.g., 1.5 = 50% more risk)
}
```

**Usage:**
- All parameters are optional
- Simulation applies constraints to historical data
- Results show how metrics would have changed under constraints

## Validation Types

### ValidationResult

Result of data validation.

```typescript
interface ValidationResult {
  valid: boolean                // Whether validation passed
  errors: string[]              // Array of error messages (empty if valid)
}
```

**Example (Valid):**
```json
{
  "valid": true,
  "errors": []
}
```

**Example (Invalid):**
```json
{
  "valid": false,
  "errors": [
    "Missing strategy_id",
    "Invalid quantity",
    "Missing venue"
  ]
}
```

## Time Series Types

### TimeSeriesPoint

Represents a single point in a time series.

```typescript
interface TimeSeriesPoint {
  timestamp: Date               // Time point
  value: number                 // Metric value at this time
}
```

**Example:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "value": 25.5
}
```

**Usage:**
Time series are arrays of `TimeSeriesPoint`:
```typescript
const latencyTimeSeries: TimeSeriesPoint[] = [
  { timestamp: new Date('2024-01-15T10:00:00Z'), value: 23 },
  { timestamp: new Date('2024-01-15T10:01:00Z'), value: 25 },
  { timestamp: new Date('2024-01-15T10:02:00Z'), value: 22 }
]
```

## Type Relationships

```
Strategy
   ↓ (1:N)
Fill, Cancel, Reject, LatencyMetric
   ↓ (N:1)
StrategyMetrics
   ↓ (includes)
PerformanceMetrics

Strategy
   ↓ (1:N)
Anomaly

Strategy
   ↓ (1:N)
WhatIfScenario
   ↓ (includes)
SimulationParameters
   ↓ (projects)
StrategyMetrics
```

## Validation Rules

### Fill Validation
- ✅ `strategy_id` must be present
- ✅ `symbol` must be present
- ✅ `side` must be "buy" or "sell"
- ✅ `quantity` must be a number > 0
- ✅ `price` must be a number > 0
- ✅ `venue` must be present
- ✅ `latency_ms` must be a number >= 0
- ✅ `order_id` must be present

### Cancel Validation
- ✅ `strategy_id` must be present
- ✅ `symbol` must be present
- ✅ `order_id` must be present
- ✅ `reason` must be present
- ✅ `latency_ms` must be a number >= 0

### Reject Validation
- ✅ `strategy_id` must be present
- ✅ `symbol` must be present
- ✅ `order_id` must be present
- ✅ `reason` must be present
- ✅ `error_code` must be present

### LatencyMetric Validation
- ✅ `strategy_id` must be present
- ✅ `metric_type` must be one of: "order_to_fill", "market_data", "signal_to_order"
- ✅ `latency_ms` must be a number >= 0
- ✅ Optional percentiles must be numbers >= 0 if provided

## Best Practices

### Working with Dates
Always use ISO 8601 format for timestamps:
```typescript
const timestamp = new Date().toISOString()  // "2024-01-15T10:30:00.000Z"
```

### Working with Rates
Rates are expressed as decimals (0.0 to 1.0), not percentages:
```typescript
const fillRate = 0.85    // Represents 85%
const displayRate = (fillRate * 100).toFixed(1) + '%'  // "85.0%"
```

### Working with P&L
P&L is expressed in currency units (dollars, not cents):
```typescript
const pnl = 800.25  // $800.25
```

### Working with Latency
Latency is always in milliseconds:
```typescript
const latency_ms = 25  // 25 milliseconds
```

### ID Generation
Use consistent ID format:
```typescript
const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
// Example: "fill-1705320600000-a1b2c3"
```

## Type Guards

Useful type guards for runtime validation:

```typescript
function isFill(obj: any): obj is Fill {
  return obj &&
    typeof obj.id === 'string' &&
    obj.timestamp instanceof Date &&
    typeof obj.strategy_id === 'string' &&
    typeof obj.symbol === 'string' &&
    ['buy', 'sell'].includes(obj.side) &&
    typeof obj.quantity === 'number' &&
    typeof obj.price === 'number' &&
    typeof obj.venue === 'string' &&
    typeof obj.latency_ms === 'number' &&
    typeof obj.order_id === 'string'
}

function isValidSide(side: string): side is "buy" | "sell" {
  return side === "buy" || side === "sell"
}

function isValidMetricType(type: string): type is "order_to_fill" | "market_data" | "signal_to_order" {
  return ["order_to_fill", "market_data", "signal_to_order"].includes(type)
}
```

## Migration Notes

If you need to add persistent storage (e.g., PostgreSQL), maintain the same TypeScript interfaces and update the data store implementation. The interface contracts ensure compatibility across the entire application.
