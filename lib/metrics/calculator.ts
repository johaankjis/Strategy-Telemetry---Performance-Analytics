// Metrics computation engine for KPIs and performance indicators

import type { Fill, Cancel, Reject, LatencyMetric, StrategyMetrics } from "../types"

export interface TimeSeriesPoint {
  timestamp: Date
  value: number
}

export interface PerformanceMetrics {
  fillRate: number
  cancelRate: number
  rejectRate: number
  avgLatency: number
  p50Latency: number
  p95Latency: number
  p99Latency: number
  totalVolume: number
  totalPnl: number
  sharpeRatio: number
  maxDrawdown: number
}

export class MetricsCalculator {
  // Calculate fill rate over time
  static calculateFillRateTimeSeries(
    fills: Fill[],
    cancels: Cancel[],
    rejects: Reject[],
    intervalMinutes = 60,
  ): TimeSeriesPoint[] {
    const allEvents = [
      ...fills.map((f) => ({ timestamp: f.timestamp, type: "fill" })),
      ...cancels.map((c) => ({ timestamp: c.timestamp, type: "cancel" })),
      ...rejects.map((r) => ({ timestamp: r.timestamp, type: "reject" })),
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    const windows = new Map<number, { fills: number; total: number }>()

    for (const event of allEvents) {
      const windowKey = Math.floor(event.timestamp.getTime() / (intervalMinutes * 60 * 1000))
      if (!windows.has(windowKey)) {
        windows.set(windowKey, { fills: 0, total: 0 })
      }
      const window = windows.get(windowKey)!
      window.total++
      if (event.type === "fill") window.fills++
    }

    return Array.from(windows.entries())
      .map(([key, value]) => ({
        timestamp: new Date(key * intervalMinutes * 60 * 1000),
        value: value.total > 0 ? value.fills / value.total : 0,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  // Calculate latency percentiles
  static calculateLatencyPercentiles(metrics: LatencyMetric[]): {
    p50: number
    p95: number
    p99: number
    avg: number
  } {
    if (metrics.length === 0) {
      return { p50: 0, p95: 0, p99: 0, avg: 0 }
    }

    const latencies = metrics.map((m) => m.latency_ms).sort((a, b) => a - b)
    const avg = latencies.reduce((sum, val) => sum + val, 0) / latencies.length

    const getPercentile = (p: number) => {
      const index = Math.floor(latencies.length * p)
      return latencies[Math.min(index, latencies.length - 1)]
    }

    return {
      p50: getPercentile(0.5),
      p95: getPercentile(0.95),
      p99: getPercentile(0.99),
      avg,
    }
  }

  // Calculate latency over time
  static calculateLatencyTimeSeries(metrics: LatencyMetric[], intervalMinutes = 60): TimeSeriesPoint[] {
    const windows = new Map<number, number[]>()

    for (const metric of metrics) {
      const windowKey = Math.floor(metric.timestamp.getTime() / (intervalMinutes * 60 * 1000))
      if (!windows.has(windowKey)) {
        windows.set(windowKey, [])
      }
      windows.get(windowKey)!.push(metric.latency_ms)
    }

    return Array.from(windows.entries())
      .map(([key, latencies]) => ({
        timestamp: new Date(key * intervalMinutes * 60 * 1000),
        value: latencies.reduce((sum, val) => sum + val, 0) / latencies.length,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  // Calculate volume over time
  static calculateVolumeTimeSeries(fills: Fill[], intervalMinutes = 60): TimeSeriesPoint[] {
    const windows = new Map<number, number>()

    for (const fill of fills) {
      const windowKey = Math.floor(fill.timestamp.getTime() / (intervalMinutes * 60 * 1000))
      if (!windows.has(windowKey)) {
        windows.set(windowKey, 0)
      }
      windows.set(windowKey, windows.get(windowKey)! + fill.quantity)
    }

    return Array.from(windows.entries())
      .map(([key, volume]) => ({
        timestamp: new Date(key * intervalMinutes * 60 * 1000),
        value: volume,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  // Calculate PnL over time
  static calculatePnLTimeSeries(fills: Fill[], intervalMinutes = 60): TimeSeriesPoint[] {
    const windows = new Map<number, number>()

    for (const fill of fills) {
      const windowKey = Math.floor(fill.timestamp.getTime() / (intervalMinutes * 60 * 1000))
      if (!windows.has(windowKey)) {
        windows.set(windowKey, 0)
      }
      const pnl = (fill.side === "buy" ? -1 : 1) * fill.quantity * fill.price
      windows.set(windowKey, windows.get(windowKey)! + pnl)
    }

    // Calculate cumulative PnL
    let cumulative = 0
    return Array.from(windows.entries())
      .sort(([a], [b]) => a - b)
      .map(([key, pnl]) => {
        cumulative += pnl
        return {
          timestamp: new Date(key * intervalMinutes * 60 * 1000),
          value: cumulative,
        }
      })
  }

  // Calculate Sharpe ratio
  static calculateSharpeRatio(pnlSeries: TimeSeriesPoint[], riskFreeRate = 0.02): number {
    if (pnlSeries.length < 2) return 0

    const returns: number[] = []
    for (let i = 1; i < pnlSeries.length; i++) {
      const ret = (pnlSeries[i].value - pnlSeries[i - 1].value) / Math.abs(pnlSeries[i - 1].value || 1)
      returns.push(ret)
    }

    if (returns.length === 0) return 0

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    const stdDev = Math.sqrt(variance)

    if (stdDev === 0) return 0

    return (avgReturn - riskFreeRate / 252) / stdDev // Assuming daily returns
  }

  // Calculate maximum drawdown
  static calculateMaxDrawdown(pnlSeries: TimeSeriesPoint[]): number {
    if (pnlSeries.length === 0) return 0

    let maxDrawdown = 0
    let peak = pnlSeries[0].value

    for (const point of pnlSeries) {
      if (point.value > peak) {
        peak = point.value
      }
      const drawdown = (peak - point.value) / Math.abs(peak || 1)
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }

    return maxDrawdown
  }

  // Calculate comprehensive performance metrics
  static calculatePerformanceMetrics(
    fills: Fill[],
    cancels: Cancel[],
    rejects: Reject[],
    latencyMetrics: LatencyMetric[],
  ): PerformanceMetrics {
    const totalOrders = fills.length + cancels.length + rejects.length
    const fillRate = totalOrders > 0 ? fills.length / totalOrders : 0
    const cancelRate = totalOrders > 0 ? cancels.length / totalOrders : 0
    const rejectRate = totalOrders > 0 ? rejects.length / totalOrders : 0

    const latencyStats = this.calculateLatencyPercentiles(latencyMetrics)
    const totalVolume = fills.reduce((sum, fill) => sum + fill.quantity, 0)

    const pnlSeries = this.calculatePnLTimeSeries(fills, 60)
    const totalPnl = pnlSeries.length > 0 ? pnlSeries[pnlSeries.length - 1].value : 0
    const sharpeRatio = this.calculateSharpeRatio(pnlSeries)
    const maxDrawdown = this.calculateMaxDrawdown(pnlSeries)

    return {
      fillRate,
      cancelRate,
      rejectRate,
      avgLatency: latencyStats.avg,
      p50Latency: latencyStats.p50,
      p95Latency: latencyStats.p95,
      p99Latency: latencyStats.p99,
      totalVolume,
      totalPnl,
      sharpeRatio,
      maxDrawdown,
    }
  }

  // Calculate metrics by strategy
  static calculateStrategyMetrics(
    strategyId: string,
    fills: Fill[],
    cancels: Cancel[],
    rejects: Reject[],
    latencyMetrics: LatencyMetric[],
  ): StrategyMetrics {
    const strategyFills = fills.filter((f) => f.strategy_id === strategyId)
    const strategyCancels = cancels.filter((c) => c.strategy_id === strategyId)
    const strategyRejects = rejects.filter((r) => r.strategy_id === strategyId)
    const strategyLatency = latencyMetrics.filter((m) => m.strategy_id === strategyId)

    const perf = this.calculatePerformanceMetrics(strategyFills, strategyCancels, strategyRejects, strategyLatency)

    return {
      strategy_id: strategyId,
      date: new Date().toISOString().split("T")[0],
      total_fills: strategyFills.length,
      total_cancels: strategyCancels.length,
      total_rejects: strategyRejects.length,
      fill_rate: perf.fillRate,
      cancel_rate: perf.cancelRate,
      reject_rate: perf.rejectRate,
      avg_latency_ms: perf.avgLatency,
      p95_latency_ms: perf.p95Latency,
      p99_latency_ms: perf.p99Latency,
      total_volume: perf.totalVolume,
      total_pnl: perf.totalPnl,
    }
  }
}
