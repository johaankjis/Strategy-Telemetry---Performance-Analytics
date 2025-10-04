// Anomaly detection system for trading telemetry

import type { Fill, Cancel, Reject, LatencyMetric, Anomaly } from "../types"
import { MetricsCalculator, type TimeSeriesPoint } from "../metrics/calculator"

export interface AnomalyThresholds {
  latencySpike: number // milliseconds
  highRejectRate: number // percentage
  fillRateDrop: number // percentage
  volumeMultiplier: number // multiplier of average
}

export const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  latencySpike: 150, // 150ms
  highRejectRate: 0.15, // 15%
  fillRateDrop: 0.6, // 60% of normal
  volumeMultiplier: 3, // 3x average volume
}

export class AnomalyDetector {
  private thresholds: AnomalyThresholds

  constructor(thresholds: AnomalyThresholds = DEFAULT_THRESHOLDS) {
    this.thresholds = thresholds
  }

  // Detect latency spikes using moving average and standard deviation
  detectLatencySpikes(metrics: LatencyMetric[], windowSize = 20): Anomaly[] {
    if (metrics.length < windowSize) return []

    const anomalies: Anomaly[] = []
    const sortedMetrics = [...metrics].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    for (let i = windowSize; i < sortedMetrics.length; i++) {
      const window = sortedMetrics.slice(i - windowSize, i)
      const windowLatencies = window.map((m) => m.latency_ms)

      const mean = windowLatencies.reduce((sum, val) => sum + val, 0) / windowLatencies.length
      const variance = windowLatencies.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowLatencies.length
      const stdDev = Math.sqrt(variance)

      const currentLatency = sortedMetrics[i].latency_ms
      const zScore = (currentLatency - mean) / (stdDev || 1)

      // Detect spike if z-score > 3 (3 standard deviations) or exceeds absolute threshold
      if (zScore > 3 || currentLatency > this.thresholds.latencySpike) {
        const severity = this.calculateSeverity(zScore, [2, 3, 4])

        anomalies.push({
          id: `anomaly-latency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: sortedMetrics[i].timestamp,
          strategy_id: sortedMetrics[i].strategy_id,
          anomaly_type: "latency_spike",
          severity,
          description: `Latency spike detected: ${currentLatency.toFixed(2)}ms (${zScore.toFixed(2)} std devs above mean)`,
          metric_value: currentLatency,
          threshold_value: mean + 3 * stdDev,
          detected_at: new Date(),
        })
      }
    }

    return anomalies
  }

  // Detect high reject rates
  detectHighRejectRate(fills: Fill[], cancels: Cancel[], rejects: Reject[], windowMinutes = 60): Anomaly[] {
    const anomalies: Anomaly[] = []

    // Group by strategy and time window
    const strategyWindows = new Map<
      string,
      Map<number, { fills: number; cancels: number; rejects: number; timestamp: Date }>
    >()

    const addToWindow = (strategyId: string, timestamp: Date, type: "fill" | "cancel" | "reject") => {
      if (!strategyWindows.has(strategyId)) {
        strategyWindows.set(strategyId, new Map())
      }
      const windows = strategyWindows.get(strategyId)!
      const windowKey = Math.floor(timestamp.getTime() / (windowMinutes * 60 * 1000))

      if (!windows.has(windowKey)) {
        windows.set(windowKey, {
          fills: 0,
          cancels: 0,
          rejects: 0,
          timestamp: new Date(windowKey * windowMinutes * 60 * 1000),
        })
      }
      const window = windows.get(windowKey)!
      window[type === "fill" ? "fills" : type === "cancel" ? "cancels" : "rejects"]++
    }

    fills.forEach((f) => addToWindow(f.strategy_id, f.timestamp, "fill"))
    cancels.forEach((c) => addToWindow(c.strategy_id, c.timestamp, "cancel"))
    rejects.forEach((r) => addToWindow(r.strategy_id, r.timestamp, "reject"))

    // Check each window for high reject rate
    for (const [strategyId, windows] of strategyWindows) {
      for (const [, window] of windows) {
        const total = window.fills + window.cancels + window.rejects
        if (total < 5) continue // Skip windows with too few events

        const rejectRate = window.rejects / total

        if (rejectRate > this.thresholds.highRejectRate) {
          const severity = this.calculateSeverity(rejectRate, [0.1, 0.15, 0.25])

          anomalies.push({
            id: `anomaly-reject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: window.timestamp,
            strategy_id: strategyId,
            anomaly_type: "high_reject_rate",
            severity,
            description: `High reject rate detected: ${(rejectRate * 100).toFixed(1)}% (${window.rejects}/${total} orders)`,
            metric_value: rejectRate,
            threshold_value: this.thresholds.highRejectRate,
            detected_at: new Date(),
          })
        }
      }
    }

    return anomalies
  }

  // Detect unusual volume patterns
  detectUnusualVolume(fills: Fill[], windowMinutes = 60): Anomaly[] {
    const anomalies: Anomaly[] = []

    // Calculate volume time series by strategy
    const strategyVolumes = new Map<string, TimeSeriesPoint[]>()

    for (const fill of fills) {
      if (!strategyVolumes.has(fill.strategy_id)) {
        strategyVolumes.set(fill.strategy_id, [])
      }
    }

    for (const [strategyId, _] of strategyVolumes) {
      const strategyFills = fills.filter((f) => f.strategy_id === strategyId)
      const volumeSeries = MetricsCalculator.calculateVolumeTimeSeries(strategyFills, windowMinutes)

      if (volumeSeries.length < 5) continue

      const volumes = volumeSeries.map((v) => v.value)
      const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length

      // Check recent windows for unusual volume
      const recentWindows = volumeSeries.slice(-5)
      for (const window of recentWindows) {
        if (window.value > avgVolume * this.thresholds.volumeMultiplier) {
          const multiplier = window.value / avgVolume

          const severity = this.calculateSeverity(multiplier, [2, 3, 5])

          anomalies.push({
            id: `anomaly-volume-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: window.timestamp,
            strategy_id: strategyId,
            anomaly_type: "unusual_volume",
            severity,
            description: `Unusual volume spike: ${window.value.toFixed(0)} (${multiplier.toFixed(1)}x average)`,
            metric_value: window.value,
            threshold_value: avgVolume * this.thresholds.volumeMultiplier,
            detected_at: new Date(),
          })
        }
      }
    }

    return anomalies
  }

  // Detect fill rate drops
  detectFillRateDrop(fills: Fill[], cancels: Cancel[], rejects: Reject[], windowMinutes = 60): Anomaly[] {
    const anomalies: Anomaly[] = []

    // Calculate fill rate time series by strategy
    const strategyIds = new Set([...fills.map((f) => f.strategy_id), ...cancels.map((c) => c.strategy_id)])

    for (const strategyId of strategyIds) {
      const strategyFills = fills.filter((f) => f.strategy_id === strategyId)
      const strategyCancels = cancels.filter((c) => c.strategy_id === strategyId)
      const strategyRejects = rejects.filter((r) => r.strategy_id === strategyId)

      const fillRateSeries = MetricsCalculator.calculateFillRateTimeSeries(
        strategyFills,
        strategyCancels,
        strategyRejects,
        windowMinutes,
      )

      if (fillRateSeries.length < 5) continue

      const fillRates = fillRateSeries.map((f) => f.value)
      const avgFillRate = fillRates.reduce((sum, r) => sum + r, 0) / fillRates.length

      // Check recent windows for fill rate drops
      const recentWindows = fillRateSeries.slice(-5)
      for (const window of recentWindows) {
        if (window.value < avgFillRate * this.thresholds.fillRateDrop && avgFillRate > 0.5) {
          const dropPercentage = ((avgFillRate - window.value) / avgFillRate) * 100

          const severity = this.calculateSeverity(dropPercentage, [20, 40, 60])

          anomalies.push({
            id: `anomaly-fillrate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: window.timestamp,
            strategy_id: strategyId,
            anomaly_type: "fill_rate_drop",
            severity,
            description: `Fill rate drop detected: ${(window.value * 100).toFixed(1)}% (down ${dropPercentage.toFixed(1)}% from average)`,
            metric_value: window.value,
            threshold_value: avgFillRate * this.thresholds.fillRateDrop,
            detected_at: new Date(),
          })
        }
      }
    }

    return anomalies
  }

  // Run all anomaly detection algorithms
  detectAll(fills: Fill[], cancels: Cancel[], rejects: Reject[], latencyMetrics: LatencyMetric[]): Anomaly[] {
    const latencyAnomalies = this.detectLatencySpikes(latencyMetrics)
    const rejectAnomalies = this.detectHighRejectRate(fills, cancels, rejects)
    const volumeAnomalies = this.detectUnusualVolume(fills)
    const fillRateAnomalies = this.detectFillRateDrop(fills, cancels, rejects)

    return [...latencyAnomalies, ...rejectAnomalies, ...volumeAnomalies, ...fillRateAnomalies].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    )
  }

  // Helper to calculate severity based on thresholds
  private calculateSeverity(
    value: number,
    thresholds: [number, number, number],
  ): "low" | "medium" | "high" | "critical" {
    if (value < thresholds[0]) return "low"
    if (value < thresholds[1]) return "medium"
    if (value < thresholds[2]) return "high"
    return "critical"
  }
}
