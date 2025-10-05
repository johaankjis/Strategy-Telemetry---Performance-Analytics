# What-If Simulator Documentation

Complete guide to the What-If Scenario Simulator for testing strategy parameter changes without risking live trading.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Parameter Types](#parameter-types)
- [Simulation Algorithm](#simulation-algorithm)
- [API Usage](#api-usage)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)
- [Limitations](#limitations)
- [Examples](#examples)

## Overview

The What-If Simulator allows traders and strategy developers to:
- **Test parameter changes** without risking capital
- **Compare multiple scenarios** side-by-side
- **Optimize strategy parameters** based on historical data
- **Understand trade-offs** between different configurations

### Key Features

- ✨ Real-time parameter adjustment
- 📊 Instant metric recalculation
- 🔄 Scenario comparison
- 📈 Risk-adjusted performance metrics
- 🎯 Optimization recommendations

## How It Works

The simulator takes historical telemetry data (fills, cancels, rejects, latency) and applies parameter constraints to project how the strategy would have performed under different settings.

### Workflow

```
Historical Data → Apply Parameter Constraints → Recalculate Metrics → Compare Results
```

1. **Fetch Historical Data**: Retrieve fills, cancels, rejects, and latency metrics for a strategy
2. **Apply Constraints**: Filter and adjust data based on simulation parameters
3. **Calculate Metrics**: Compute performance metrics on the constrained data
4. **Return Projections**: Provide projected metrics and comparisons

## Parameter Types

### 1. Max Position Size

**Type**: `number`  
**Description**: Maximum position size allowed per trade  
**Effect**: Filters out fills exceeding this quantity

```typescript
max_position_size: 100
```

**Impact:**
- Reduces volume
- May reduce P&L
- Potentially reduces risk
- Limits drawdown

**Example:**
```json
{
  "max_position_size": 100
}
```

If a historical fill had `quantity: 150`, it would be:
- Filtered out entirely, OR
- Split into multiple fills of 100 (depending on implementation)

### 2. Order Timeout

**Type**: `number` (milliseconds)  
**Description**: Maximum time to wait for order fill before cancellation  
**Effect**: Converts fills with high latency to cancels

```typescript
order_timeout_ms: 5000  // 5 seconds
```

**Impact:**
- May increase cancel rate
- May decrease fill rate
- Reduces exposure to slow fills
- May reduce latency metrics

**Example:**
```json
{
  "order_timeout_ms": 5000
}
```

Fills with `latency_ms > 5000` become cancels.

### 3. Minimum Fill Rate

**Type**: `number` (0.0 to 1.0)  
**Description**: Minimum acceptable fill rate threshold  
**Effect**: Projects more aggressive order placement or venue changes

```typescript
min_fill_rate: 0.8  // 80%
```

**Impact:**
- May reduce cancel rate
- May increase reject rate initially
- Optimizes for execution
- May increase costs

**Example:**
```json
{
  "min_fill_rate": 0.8
}
```

If current fill rate is 70%, simulator adjusts orders to achieve 80%.

### 4. Maximum Latency

**Type**: `number` (milliseconds)  
**Description**: Maximum acceptable latency before order cancellation  
**Effect**: Filters out high-latency fills

```typescript
max_latency_ms: 50
```

**Impact:**
- Reduces average latency
- May reduce fill rate
- Improves execution quality
- May reduce volume

**Example:**
```json
{
  "max_latency_ms": 50
}
```

Fills with `latency_ms > 50` are converted to cancels.

### 5. Risk Multiplier

**Type**: `number`  
**Description**: Risk adjustment factor for position sizing  
**Effect**: Scales position sizes and P&L proportionally

```typescript
risk_multiplier: 1.5  // 50% more aggressive
```

**Impact:**
- Scales volume up/down
- Scales P&L up/down
- Changes max drawdown
- Affects Sharpe ratio

**Example:**
```json
{
  "risk_multiplier": 1.5
}
```

All position sizes multiplied by 1.5, increasing risk and potential returns.

## Simulation Algorithm

### Core Logic

```typescript
function simulateScenario(
  fills: Fill[],
  cancels: Cancel[],
  rejects: Reject[],
  latency: LatencyMetric[],
  parameters: SimulationParameters
): WhatIfScenario {
  // 1. Clone historical data
  let simFills = [...fills]
  let simCancels = [...cancels]
  let simRejects = [...rejects]
  
  // 2. Apply position size limit
  if (parameters.max_position_size) {
    simFills = applyPositionSizeLimit(simFills, parameters.max_position_size)
  }
  
  // 3. Apply order timeout
  if (parameters.order_timeout_ms) {
    const result = applyOrderTimeout(simFills, simCancels, parameters.order_timeout_ms)
    simFills = result.fills
    simCancels = result.cancels
  }
  
  // 4. Apply minimum fill rate
  if (parameters.min_fill_rate) {
    const result = applyMinFillRate(simFills, simCancels, simRejects, parameters.min_fill_rate)
    simFills = result.fills
    simCancels = result.cancels
  }
  
  // 5. Apply max latency
  if (parameters.max_latency_ms) {
    const result = applyMaxLatency(simFills, simCancels, parameters.max_latency_ms)
    simFills = result.fills
    simCancels = result.cancels
  }
  
  // 6. Apply risk multiplier
  if (parameters.risk_multiplier) {
    simFills = applyRiskMultiplier(simFills, parameters.risk_multiplier)
  }
  
  // 7. Calculate projected metrics
  const metrics = MetricsCalculator.calculatePerformanceMetrics(
    simFills,
    simCancels,
    simRejects,
    latency
  )
  
  return {
    parameters,
    projected_metrics: metrics
  }
}
```

### Position Size Limit

```typescript
function applyPositionSizeLimit(fills: Fill[], maxSize: number): Fill[] {
  return fills.filter(fill => fill.quantity <= maxSize)
}
```

### Order Timeout

```typescript
function applyOrderTimeout(
  fills: Fill[],
  cancels: Cancel[],
  timeoutMs: number
): { fills: Fill[], cancels: Cancel[] } {
  const newFills: Fill[] = []
  const newCancels: Cancel[] = [...cancels]
  
  fills.forEach(fill => {
    if (fill.latency_ms <= timeoutMs) {
      newFills.push(fill)
    } else {
      // Convert to cancel
      newCancels.push({
        id: `cancel-timeout-${fill.id}`,
        timestamp: fill.timestamp,
        strategy_id: fill.strategy_id,
        symbol: fill.symbol,
        order_id: fill.order_id,
        reason: 'timeout',
        latency_ms: timeoutMs
      })
    }
  })
  
  return { fills: newFills, cancels: newCancels }
}
```

### Maximum Latency

```typescript
function applyMaxLatency(
  fills: Fill[],
  cancels: Cancel[],
  maxLatency: number
): { fills: Fill[], cancels: Cancel[] } {
  // Similar to order timeout
  return applyOrderTimeout(fills, cancels, maxLatency)
}
```

### Risk Multiplier

```typescript
function applyRiskMultiplier(fills: Fill[], multiplier: number): Fill[] {
  return fills.map(fill => ({
    ...fill,
    quantity: fill.quantity * multiplier
  }))
}
```

## API Usage

### Simulate Single Scenario

**Endpoint**: `POST /api/whatif/simulate`

**Request:**
```json
{
  "strategy_id": "momentum-btc",
  "parameters": {
    "max_position_size": 100,
    "order_timeout_ms": 5000,
    "min_fill_rate": 0.8,
    "max_latency_ms": 50,
    "risk_multiplier": 1.2
  }
}
```

**Response:**
```json
{
  "scenario": {
    "id": "scenario-1234567890-abc123",
    "name": "Simulated Scenario",
    "strategy_id": "momentum-btc",
    "parameters": {
      "max_position_size": 100,
      "order_timeout_ms": 5000,
      "min_fill_rate": 0.8,
      "max_latency_ms": 50,
      "risk_multiplier": 1.2
    },
    "projected_metrics": {
      "fillRate": 0.82,
      "cancelRate": 0.13,
      "rejectRate": 0.05,
      "avgLatency": 35.2,
      "p50Latency": 30,
      "p95Latency": 48,
      "p99Latency": 50,
      "totalVolume": 4500,
      "totalPnl": 720.00,
      "sharpeRatio": 2.0,
      "maxDrawdown": -180.00
    },
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Compare Multiple Scenarios

**Endpoint**: `POST /api/whatif/compare`

**Request:**
```json
{
  "strategy_id": "momentum-btc",
  "scenarios": [
    {
      "max_position_size": 100,
      "order_timeout_ms": 5000
    },
    {
      "max_position_size": 150,
      "order_timeout_ms": 3000
    },
    {
      "max_position_size": 75,
      "order_timeout_ms": 7000
    }
  ]
}
```

**Response:**
```json
{
  "comparison": {
    "scenarios": [
      {
        "id": "scenario-1",
        "parameters": { "max_position_size": 100, "order_timeout_ms": 5000 },
        "projected_metrics": { "fillRate": 0.82, "totalPnl": 720.00, "sharpeRatio": 2.0 }
      },
      {
        "id": "scenario-2",
        "parameters": { "max_position_size": 150, "order_timeout_ms": 3000 },
        "projected_metrics": { "fillRate": 0.78, "totalPnl": 850.00, "sharpeRatio": 1.8 }
      },
      {
        "id": "scenario-3",
        "parameters": { "max_position_size": 75, "order_timeout_ms": 7000 },
        "projected_metrics": { "fillRate": 0.85, "totalPnl": 620.00, "sharpeRatio": 2.2 }
      }
    ],
    "bestScenario": {
      "id": "scenario-3",
      "metric": "sharpeRatio",
      "value": 2.2
    }
  }
}
```

## Use Cases

### 1. Risk Management Optimization

**Goal**: Reduce maximum drawdown while maintaining profitability

**Strategy**:
```json
{
  "max_position_size": 75,
  "risk_multiplier": 0.8
}
```

**Expected Results**:
- Lower max drawdown
- Lower total volume
- Lower total P&L
- Higher Sharpe ratio (better risk-adjusted returns)

### 2. Execution Quality Improvement

**Goal**: Improve fill rate and reduce latency

**Strategy**:
```json
{
  "order_timeout_ms": 3000,
  "max_latency_ms": 40,
  "min_fill_rate": 0.85
}
```

**Expected Results**:
- Higher fill rate
- Lower average latency
- More cancels initially
- Better execution quality

### 3. Aggressive Growth Testing

**Goal**: Test higher risk tolerance

**Strategy**:
```json
{
  "max_position_size": 200,
  "risk_multiplier": 1.5
}
```

**Expected Results**:
- Higher total volume
- Higher total P&L
- Higher max drawdown
- Potentially lower Sharpe ratio

### 4. Conservative Approach

**Goal**: Minimize risk, prioritize stability

**Strategy**:
```json
{
  "max_position_size": 50,
  "order_timeout_ms": 10000,
  "risk_multiplier": 0.6
}
```

**Expected Results**:
- Lower total volume
- Lower total P&L
- Lower max drawdown
- Higher Sharpe ratio

## Best Practices

### 1. Start with Baseline

Always compare simulations against baseline (no parameters):
```typescript
// Baseline
const baseline = await simulate(strategyId, {})

// Test scenario
const scenario = await simulate(strategyId, { max_position_size: 100 })

// Compare
const improvement = scenario.sharpeRatio - baseline.sharpeRatio
```

### 2. Test Multiple Scenarios

Don't rely on single scenario:
```typescript
const scenarios = [
  { max_position_size: 75 },
  { max_position_size: 100 },
  { max_position_size: 125 },
  { max_position_size: 150 }
]

const results = await compareScenarios(strategyId, scenarios)
const optimal = results.bestScenario
```

### 3. Consider Multiple Metrics

Don't optimize for single metric:
```typescript
// ❌ Bad: Only looking at P&L
if (scenario.totalPnl > baseline.totalPnl) {
  // Deploy
}

// ✅ Good: Consider risk-adjusted returns
if (scenario.sharpeRatio > baseline.sharpeRatio && 
    scenario.maxDrawdown > baseline.maxDrawdown * 0.8) {
  // Deploy
}
```

### 4. Use Historical Context

Simulate over different time periods:
```typescript
const q1Data = getHistoricalData('2024-01-01', '2024-03-31')
const q2Data = getHistoricalData('2024-04-01', '2024-06-30')

const q1Result = simulate(q1Data, parameters)
const q2Result = simulate(q2Data, parameters)

// Check consistency
if (q1Result.sharpeRatio > 1.5 && q2Result.sharpeRatio > 1.5) {
  // Consistent performance
}
```

### 5. Account for Market Conditions

Simulations based on historical data may not reflect future conditions:
- Test on different market regimes (bull, bear, sideways)
- Consider regime changes
- Add safety margins

## Limitations

### 1. Historical Bias

Simulations use historical data, which may not represent future conditions.

**Mitigation**: Test on multiple time periods and market conditions.

### 2. Order Execution Assumptions

Simulator assumes perfect execution within constraints.

**Reality**: Real execution may differ due to:
- Slippage
- Liquidity constraints
- Market impact
- Venue availability

### 3. No Look-Ahead

Simulator cannot predict future market movements.

**Note**: Results show what *would have* happened, not what *will* happen.

### 4. Simplified Logic

Current implementation uses simple filtering logic.

**Future Improvements**:
- Model order placement strategies
- Simulate market impact
- Account for trading costs
- Model slippage

### 5. Data Dependency

Results are only as good as the input data.

**Requirements**:
- Sufficient historical data
- High-quality data
- Representative time period

## Examples

### Example 1: Find Optimal Position Size

```typescript
// Test different position sizes
const sizes = [50, 75, 100, 125, 150]
const results = []

for (const size of sizes) {
  const result = await simulate('momentum-btc', {
    max_position_size: size
  })
  results.push({
    size,
    sharpeRatio: result.sharpeRatio,
    maxDrawdown: result.maxDrawdown,
    totalPnl: result.totalPnl
  })
}

// Find best Sharpe ratio
const optimal = results.reduce((best, curr) => 
  curr.sharpeRatio > best.sharpeRatio ? curr : best
)

console.log(`Optimal position size: ${optimal.size}`)
```

### Example 2: Balance Fill Rate and Latency

```typescript
// Test different timeout values
const timeouts = [3000, 5000, 7000, 10000]
const results = []

for (const timeout of timeouts) {
  const result = await simulate('momentum-btc', {
    order_timeout_ms: timeout
  })
  results.push({
    timeout,
    fillRate: result.fillRate,
    avgLatency: result.avgLatency,
    totalPnl: result.totalPnl
  })
}

// Find sweet spot
const balanced = results.find(r => 
  r.fillRate > 0.80 && r.avgLatency < 40
)

console.log(`Balanced timeout: ${balanced.timeout}ms`)
```

### Example 3: UI Integration

```tsx
// React component for What-If Sandbox
function WhatIfSandbox({ strategyId }) {
  const [params, setParams] = useState({
    max_position_size: 100,
    order_timeout_ms: 5000
  })
  const [result, setResult] = useState(null)
  
  const runSimulation = async () => {
    const response = await fetch('/api/whatif/simulate', {
      method: 'POST',
      body: JSON.stringify({ strategy_id: strategyId, parameters: params })
    })
    const data = await response.json()
    setResult(data.scenario)
  }
  
  return (
    <div>
      <Slider 
        value={params.max_position_size}
        onChange={(v) => setParams({...params, max_position_size: v})}
      />
      <Button onClick={runSimulation}>Run Simulation</Button>
      {result && <MetricsDisplay metrics={result.projected_metrics} />}
    </div>
  )
}
```

## Future Enhancements

Planned improvements:
1. **Grid Search**: Automatic parameter optimization
2. **Genetic Algorithms**: Evolutionary parameter tuning
3. **Monte Carlo**: Probabilistic scenario analysis
4. **Walk-Forward**: Time-series validation
5. **Cost Modeling**: Include transaction costs and fees
6. **Market Impact**: Model price impact of large orders
7. **Regime Detection**: Adapt parameters to market conditions

## Conclusion

The What-If Simulator is a powerful tool for strategy optimization and risk management. Use it to:
- Test parameter changes safely
- Optimize risk-adjusted returns
- Understand strategy behavior
- Make data-driven decisions

Remember: Past performance does not guarantee future results. Always validate simulations with forward testing before deploying to live trading.
