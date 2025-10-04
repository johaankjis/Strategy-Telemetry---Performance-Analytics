// In-memory data store for telemetry data

import type { Fill, Cancel, Reject, LatencyMetric, Anomaly, Strategy } from "./types"
import {
  generateMockFills,
  generateMockCancels,
  generateMockRejects,
  generateMockLatencyMetrics,
  generateMockAnomalies,
  getStrategies,
} from "./mock-data"

class TelemetryDataStore {
  private fills: Fill[] = []
  private cancels: Cancel[] = []
  private rejects: Reject[] = []
  private latencyMetrics: LatencyMetric[] = []
  private anomalies: Anomaly[] = []
  private strategies: Strategy[] = []

  constructor() {
    this.initialize()
  }

  private initialize() {
    this.fills = generateMockFills(200)
    this.cancels = generateMockCancels(50)
    this.rejects = generateMockRejects(25)
    this.latencyMetrics = generateMockLatencyMetrics(100)
    this.anomalies = generateMockAnomalies(8)
    this.strategies = getStrategies()
  }

  // Fills
  getFills(strategyId?: string, limit?: number): Fill[] {
    let data = strategyId ? this.fills.filter((f) => f.strategy_id === strategyId) : this.fills

    data = data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return limit ? data.slice(0, limit) : data
  }

  addFill(fill: Fill): void {
    this.fills.push(fill)
  }

  // Cancels
  getCancels(strategyId?: string, limit?: number): Cancel[] {
    let data = strategyId ? this.cancels.filter((c) => c.strategy_id === strategyId) : this.cancels

    data = data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return limit ? data.slice(0, limit) : data
  }

  addCancel(cancel: Cancel): void {
    this.cancels.push(cancel)
  }

  // Rejects
  getRejects(strategyId?: string, limit?: number): Reject[] {
    let data = strategyId ? this.rejects.filter((r) => r.strategy_id === strategyId) : this.rejects

    data = data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return limit ? data.slice(0, limit) : data
  }

  addReject(reject: Reject): void {
    this.rejects.push(reject)
  }

  // Latency Metrics
  getLatencyMetrics(strategyId?: string, limit?: number): LatencyMetric[] {
    let data = strategyId ? this.latencyMetrics.filter((l) => l.strategy_id === strategyId) : this.latencyMetrics

    data = data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return limit ? data.slice(0, limit) : data
  }

  addLatencyMetric(metric: LatencyMetric): void {
    this.latencyMetrics.push(metric)
  }

  // Anomalies
  getAnomalies(strategyId?: string, limit?: number): Anomaly[] {
    let data = strategyId ? this.anomalies.filter((a) => a.strategy_id === strategyId) : this.anomalies

    data = data.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    return limit ? data.slice(0, limit) : data
  }

  addAnomaly(anomaly: Anomaly): void {
    this.anomalies.push(anomaly)
  }

  // Strategies
  getStrategies(): Strategy[] {
    return this.strategies
  }

  getStrategy(id: string): Strategy | undefined {
    return this.strategies.find((s) => s.id === id)
  }

  // Refresh data (simulate new data coming in)
  refresh(): void {
    this.initialize()
  }
}

// Singleton instance
export const dataStore = new TelemetryDataStore()
