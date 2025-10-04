# Anomaly Detection Documentation

Complete guide to the automated anomaly detection system for identifying performance issues in trading strategies.

## Table of Contents

- [Overview](#overview)
- [Detection Methods](#detection-methods)
- [Anomaly Types](#anomaly-types)
- [Configuration](#configuration)
- [Detection Algorithms](#detection-algorithms)
- [API Usage](#api-usage)
- [Best Practices](#best-practices)
- [Tuning Guidelines](#tuning-guidelines)
- [Examples](#examples)

## Overview

The Anomaly Detection system automatically identifies unusual patterns and performance issues in strategy telemetry data using statistical methods.

### Key Features

- ✨ Automated detection across multiple metrics
- 📊 Statistical significance testing
- 🎯 Configurable thresholds
- 🔔 Severity classification
- 📈 Real-time monitoring

### Why Anomaly Detection?

Manual monitoring of trading strategies is:
- Time-consuming
- Error-prone
- Not scalable
- Reactive rather than proactive

Automated detection provides:
- **Early Warning**: Identify issues before they become critical
- **Pattern Recognition**: Detect subtle changes humans might miss
- **Consistency**: Same standards applied across all strategies
- **Scalability**: Monitor dozens of strategies simultaneously

## Detection Methods

### Statistical Approaches

1. **Z-Score Analysis**: Measures standard deviations from mean
2. **Moving Window**: Compares recent data to historical baseline
3. **Threshold-Based**: Fixed limits for critical metrics
4. **Rate Monitoring**: Tracks percentage-based metrics

## Anomaly Types

### 1. Latency Spike

**Description**: Unusually high execution latency  
**Detection**: Z-score > 3 or absolute threshold exceeded  
**Severity**: Based on standard deviations above normal

```typescript
{
  anomaly_type: "latency_spike",
  description: "Latency spike detected: 150ms (3.5 std dev above normal)",
  metric_value: 150,
  threshold_value: 80,
  severity: "high"
}
```

**Common Causes**:
- Network congestion
- Venue performance issues
- System overload
- Market data delays

**Recommended Actions**:
- Check network connectivity
- Monitor venue status
- Review system resources
- Consider fallback venues

### 2. High Reject Rate

**Description**: Order rejection rate exceeds acceptable threshold  
**Detection**: Reject rate > configured threshold (default 15%)  
**Severity**: Based on how much threshold is exceeded

```typescript
{
  anomaly_type: "high_reject_rate",
  description: "High reject rate: 18.5% (threshold: 15.0%)",
  metric_value: 0.185,
  threshold_value: 0.15,
  severity: "medium"
}
```

**Common Causes**:
- Insufficient margin/capital
- Risk limit breaches
- Invalid order parameters
- Venue-specific restrictions

**Recommended Actions**:
- Review margin requirements
- Check risk limits
- Validate order parameters
- Review venue rules

### 3. Fill Rate Drop

**Description**: Fill rate significantly lower than normal  
**Detection**: Fill rate < threshold * normal rate (default 60%)  
**Severity**: Based on deviation from normal

```typescript
{
  anomaly_type: "fill_rate_drop",
  description: "Fill rate drop: 45.2% (normal: 85.0%)",
  metric_value: 0.452,
  threshold_value: 0.51,  // 60% of 85%
  severity: "critical"
}
```

**Common Causes**:
- Market illiquidity
- Aggressive pricing
- Venue connectivity issues
- Order timeout too short

**Recommended Actions**:
- Adjust pricing strategy
- Increase order timeout
- Check venue connectivity
- Review liquidity conditions

### 4. Unusual Volume

**Description**: Trading volume significantly differs from average  
**Detection**: Volume > mean * multiplier or < mean / multiplier  
**Severity**: Based on deviation magnitude

```typescript
{
  anomaly_type: "unusual_volume",
  description: "Unusual volume spike: 4500 (3.5x normal)",
  metric_value: 4500,
  threshold_value: 1285,  // mean * 3
  severity: "medium"
}
```

**Common Causes**:
- Market event/news
- Strategy parameter change
- Duplicate orders
- System malfunction

**Recommended Actions**:
- Review recent changes
- Check for duplicate orders
- Verify strategy logic
- Monitor for news events

## Configuration

### Default Thresholds

```typescript
const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  latencySpike: 150,        // 150ms
  highRejectRate: 0.15,     // 15%
  fillRateDrop: 0.6,        // 60% of normal
  volumeMultiplier: 3       // 3x average volume
}
```

### Custom Configuration

```typescript
import { AnomalyDetector } from '@/lib/anomaly/detector'

const customThresholds = {
  latencySpike: 100,         // More sensitive: 100ms
  highRejectRate: 0.10,      // More strict: 10%
  fillRateDrop: 0.7,         // Less sensitive: 70%
  volumeMultiplier: 2.5      // More sensitive: 2.5x
}

const detector = new AnomalyDetector(customThresholds)
```

### Severity Levels

Severity is calculated based on deviation magnitude:

```typescript
function calculateSeverity(zScore: number, thresholds: number[]): string {
  if (zScore < thresholds[0]) return 'low'
  if (zScore < thresholds[1]) return 'medium'
  if (zScore < thresholds[2]) return 'high'
  return 'critical'
}

// Default thresholds: [2, 3, 4]
// zScore < 2: low
// zScore 2-3: medium
// zScore 3-4: high
// zScore > 4: critical
```

## Detection Algorithms

### Latency Spike Detection

Uses moving window with z-score analysis:

```typescript
function detectLatencySpikes(
  metrics: LatencyMetric[],
  windowSize = 20
): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  // Sort by timestamp
  const sorted = metrics.sort((a, b) => 
    a.timestamp.getTime() - b.timestamp.getTime()
  )
  
  for (let i = windowSize; i < sorted.length; i++) {
    // Get historical window
    const window = sorted.slice(i - windowSize, i)
    const values = window.map(m => m.latency_ms)
    
    // Calculate statistics
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length
    const variance = values.reduce((sum, v) => 
      sum + Math.pow(v - mean, 2), 0
    ) / values.length
    const stdDev = Math.sqrt(variance)
    
    // Calculate z-score for current point
    const current = sorted[i].latency_ms
    const zScore = (current - mean) / (stdDev || 1)
    
    // Detect anomaly
    if (zScore > 3 || current > threshold) {
      const severity = calculateSeverity(zScore, [2, 3, 4])
      
      anomalies.push({
        id: generateId('anomaly-latency'),
        timestamp: sorted[i].timestamp,
        strategy_id: sorted[i].strategy_id,
        anomaly_type: 'latency_spike',
        severity,
        description: `Latency spike: ${current}ms (${zScore.toFixed(1)} std dev)`,
        metric_value: current,
        threshold_value: threshold,
        detected_at: new Date()
      })
    }
  }
  
  return anomalies
}
```

### High Reject Rate Detection

Uses rolling window to calculate reject rates:

```typescript
function detectHighRejectRate(
  fills: Fill[],
  cancels: Cancel[],
  rejects: Reject[],
  windowMinutes = 60
): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  // Group by strategy and time window
  const strategies = new Set([
    ...fills.map(f => f.strategy_id),
    ...rejects.map(r => r.strategy_id)
  ])
  
  for (const strategyId of strategies) {
    const strategyFills = fills.filter(f => f.strategy_id === strategyId)
    const strategyCancels = cancels.filter(c => c.strategy_id === strategyId)
    const strategyRejects = rejects.filter(r => r.strategy_id === strategyId)
    
    const total = strategyFills.length + strategyCancels.length + strategyRejects.length
    const rejectRate = strategyRejects.length / total
    
    if (rejectRate > threshold) {
      const severity = calculateRejectSeverity(rejectRate, threshold)
      
      anomalies.push({
        id: generateId('anomaly-reject'),
        timestamp: new Date(),
        strategy_id: strategyId,
        anomaly_type: 'high_reject_rate',
        severity,
        description: `High reject rate: ${(rejectRate * 100).toFixed(1)}% (threshold: ${(threshold * 100).toFixed(1)}%)`,
        metric_value: rejectRate,
        threshold_value: threshold,
        detected_at: new Date()
      })
    }
  }
  
  return anomalies
}
```

### Fill Rate Drop Detection

Compares current fill rate to historical baseline:

```typescript
function detectFillRateDrop(
  fills: Fill[],
  cancels: Cancel[],
  rejects: Reject[],
  windowMinutes = 60
): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  // Calculate current fill rate
  const total = fills.length + cancels.length + rejects.length
  const currentFillRate = fills.length / total
  
  // Calculate historical baseline
  const historicalFillRate = calculateHistoricalFillRate()
  const dropThreshold = historicalFillRate * threshold  // e.g., 60%
  
  if (currentFillRate < dropThreshold) {
    const severity = calculateFillRateSeverity(currentFillRate, dropThreshold)
    
    anomalies.push({
      id: generateId('anomaly-fillrate'),
      timestamp: new Date(),
      strategy_id: strategyId,
      anomaly_type: 'fill_rate_drop',
      severity,
      description: `Fill rate drop: ${(currentFillRate * 100).toFixed(1)}% (normal: ${(historicalFillRate * 100).toFixed(1)}%)`,
      metric_value: currentFillRate,
      threshold_value: dropThreshold,
      detected_at: new Date()
    })
  }
  
  return anomalies
}
```

### Unusual Volume Detection

Detects volume spikes or drops:

```typescript
function detectUnusualVolume(
  fills: Fill[],
  windowMinutes = 60
): Anomaly[] {
  const anomalies: Anomaly[] = []
  
  // Calculate current volume
  const currentVolume = fills.reduce((sum, f) => sum + f.quantity, 0)
  
  // Calculate historical average
  const historicalAvg = calculateHistoricalAverage()
  const upperBound = historicalAvg * multiplier
  const lowerBound = historicalAvg / multiplier
  
  if (currentVolume > upperBound || currentVolume < lowerBound) {
    const ratio = currentVolume / historicalAvg
    const severity = calculateVolumeSeverity(ratio, multiplier)
    
    anomalies.push({
      id: generateId('anomaly-volume'),
      timestamp: new Date(),
      strategy_id: strategyId,
      anomaly_type: 'unusual_volume',
      severity,
      description: `Unusual volume: ${currentVolume} (${ratio.toFixed(1)}x normal)`,
      metric_value: currentVolume,
      threshold_value: upperBound,
      detected_at: new Date()
    })
  }
  
  return anomalies
}
```

## API Usage

### Get Anomalies

**Endpoint**: `GET /api/anomalies`

```bash
# Get all anomalies
curl http://localhost:3000/api/anomalies

# Filter by strategy
curl http://localhost:3000/api/anomalies?strategy_id=momentum-btc

# Limit results
curl http://localhost:3000/api/anomalies?limit=10
```

**Response**:
```json
{
  "anomalies": [
    {
      "id": "anomaly-latency-1234567890-abc123",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "strategy_id": "momentum-btc",
      "anomaly_type": "latency_spike",
      "severity": "high",
      "description": "Latency spike detected: 150ms (3.5 std dev above normal)",
      "metric_value": 150,
      "threshold_value": 80,
      "detected_at": "2024-01-15T10:30:05.000Z"
    }
  ],
  "count": 1
}
```

### Trigger Detection

**Endpoint**: `POST /api/anomalies/detect`

```bash
# Detect for all strategies
curl -X POST http://localhost:3000/api/anomalies/detect \
  -H "Content-Type: application/json" \
  -d '{}'

# Detect for specific strategy
curl -X POST http://localhost:3000/api/anomalies/detect \
  -H "Content-Type: application/json" \
  -d '{"strategy_id": "momentum-btc"}'
```

**Response**:
```json
{
  "success": true,
  "anomalies": [...],
  "detected": 3
}
```

## Best Practices

### 1. Regular Detection Schedule

Run detection periodically:
```typescript
// Every 5 minutes
setInterval(async () => {
  await fetch('/api/anomalies/detect', { method: 'POST' })
}, 5 * 60 * 1000)
```

### 2. Adjust Thresholds by Strategy

Different strategies may need different thresholds:
```typescript
const thresholds = {
  'momentum-btc': { latencySpike: 100 },      // Low-latency strategy
  'swing-eth': { latencySpike: 200 },         // More tolerant
  'scalper': { highRejectRate: 0.05 }         // Very sensitive
}
```

### 3. Monitor Severity Distribution

Track severity over time:
```typescript
const severityCounts = {
  low: anomalies.filter(a => a.severity === 'low').length,
  medium: anomalies.filter(a => a.severity === 'medium').length,
  high: anomalies.filter(a => a.severity === 'high').length,
  critical: anomalies.filter(a => a.severity === 'critical').length
}
```

### 4. Alert on Critical Anomalies

Send notifications for critical issues:
```typescript
const criticalAnomalies = anomalies.filter(a => 
  a.severity === 'critical'
)

if (criticalAnomalies.length > 0) {
  await sendAlert(criticalAnomalies)
}
```

### 5. Correlate with Market Events

Check if anomalies coincide with market events:
```typescript
function correlateWithEvents(anomaly: Anomaly) {
  const marketEvents = getMarketEvents(anomaly.timestamp)
  if (marketEvents.length > 0) {
    console.log('Anomaly may be related to:', marketEvents)
  }
}
```

## Tuning Guidelines

### Reducing False Positives

If getting too many false alarms:

1. **Increase window size**: More data for better baseline
   ```typescript
   detectLatencySpikes(metrics, 30)  // Instead of 20
   ```

2. **Raise thresholds**: Less sensitive
   ```typescript
   { latencySpike: 200 }  // Instead of 150
   ```

3. **Increase z-score threshold**: Require more deviation
   ```typescript
   if (zScore > 4)  // Instead of 3
   ```

### Reducing False Negatives

If missing real issues:

1. **Decrease window size**: More reactive
   ```typescript
   detectLatencySpikes(metrics, 10)
   ```

2. **Lower thresholds**: More sensitive
   ```typescript
   { latencySpike: 100 }
   ```

3. **Decrease z-score threshold**: Catch smaller deviations
   ```typescript
   if (zScore > 2)
   ```

### Balancing Sensitivity

Find the sweet spot:
```typescript
// Test different configurations
const configs = [
  { windowSize: 10, zScore: 2 },
  { windowSize: 20, zScore: 3 },
  { windowSize: 30, zScore: 4 }
]

for (const config of configs) {
  const anomalies = detect(config)
  const truePositives = validate(anomalies)
  const precision = truePositives / anomalies.length
  console.log(`Config ${config}: Precision = ${precision}`)
}
```

## Examples

### Example 1: Custom Detection

```typescript
import { AnomalyDetector } from '@/lib/anomaly/detector'

const detector = new AnomalyDetector({
  latencySpike: 80,
  highRejectRate: 0.10,
  fillRateDrop: 0.7,
  volumeMultiplier: 2.5
})

const fills = dataStore.getFills('momentum-btc')
const cancels = dataStore.getCancels('momentum-btc')
const rejects = dataStore.getRejects('momentum-btc')
const latency = dataStore.getLatencyMetrics('momentum-btc')

const anomalies = detector.detectAllAnomalies(
  'momentum-btc',
  fills,
  cancels,
  rejects,
  latency
)

console.log(`Found ${anomalies.length} anomalies`)
```

### Example 2: Real-Time Monitoring

```typescript
async function monitorStrategy(strategyId: string) {
  const detector = new AnomalyDetector()
  
  setInterval(async () => {
    const fills = dataStore.getFills(strategyId)
    const cancels = dataStore.getCancels(strategyId)
    const rejects = dataStore.getRejects(strategyId)
    const latency = dataStore.getLatencyMetrics(strategyId)
    
    const anomalies = detector.detectAllAnomalies(
      strategyId,
      fills,
      cancels,
      rejects,
      latency
    )
    
    const critical = anomalies.filter(a => a.severity === 'critical')
    
    if (critical.length > 0) {
      await sendAlert({
        strategyId,
        anomalies: critical,
        message: `${critical.length} critical anomalies detected!`
      })
    }
  }, 60000)  // Check every minute
}
```

### Example 3: Dashboard Integration

```tsx
function AnomalyDashboard() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  
  useEffect(() => {
    const fetchAnomalies = async () => {
      const response = await fetch('/api/anomalies?limit=10')
      const data = await response.json()
      setAnomalies(data.anomalies)
    }
    
    fetchAnomalies()
    const interval = setInterval(fetchAnomalies, 30000)
    
    return () => clearInterval(interval)
  }, [])
  
  const bySeverity = {
    critical: anomalies.filter(a => a.severity === 'critical'),
    high: anomalies.filter(a => a.severity === 'high'),
    medium: anomalies.filter(a => a.severity === 'medium'),
    low: anomalies.filter(a => a.severity === 'low')
  }
  
  return (
    <div>
      <h2>Anomalies ({anomalies.length})</h2>
      {bySeverity.critical.length > 0 && (
        <Alert variant="destructive">
          {bySeverity.critical.length} critical anomalies!
        </Alert>
      )}
      <AnomalyList anomalies={anomalies} />
    </div>
  )
}
```

## Advanced Topics

### Machine Learning Integration

Future enhancement: Use ML for smarter detection:
```typescript
// Train on historical data
const model = trainAnomalyModel(historicalData)

// Predict anomalies
const prediction = model.predict(currentMetrics)
if (prediction.probability > 0.8) {
  // Anomaly detected
}
```

### Multi-Metric Correlation

Detect correlated anomalies:
```typescript
function detectCorrelatedAnomalies(anomalies: Anomaly[]): AnomalyCluster[] {
  // Group anomalies by time window
  const clusters = groupByTimeWindow(anomalies, 300000)  // 5 minutes
  
  return clusters.filter(c => 
    c.anomalies.length >= 2 &&  // Multiple anomalies
    c.uniqueTypes.size >= 2      // Different types
  )
}
```

### Adaptive Thresholds

Automatically adjust thresholds:
```typescript
function adaptThresholds(
  anomalies: Anomaly[],
  falsePositiveRate: number
): AnomalyThresholds {
  if (falsePositiveRate > 0.2) {
    // Too many false positives - increase thresholds
    return increaseThresholds(currentThresholds, 1.2)
  } else if (falsePositiveRate < 0.05) {
    // Too few detections - decrease thresholds
    return decreaseThresholds(currentThresholds, 0.9)
  }
  return currentThresholds
}
```

## Conclusion

The Anomaly Detection system provides automated monitoring and early warning for strategy performance issues. Key takeaways:

- ✅ Use appropriate thresholds for your strategies
- ✅ Monitor multiple anomaly types
- ✅ Review and tune regularly
- ✅ Correlate with market events
- ✅ Act on critical anomalies promptly

Remember: Anomaly detection is a tool to assist decision-making, not replace human judgment. Always investigate anomalies in context.
