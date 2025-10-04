// ETL transformers for data aggregation and enrichment

import type { Fill, Cancel, Reject, LatencyMetric, StrategyMetrics } from "../types"

export interface AggregatedData {
  fills: Fill[]
  cancels: Cancel[]
  rejects: Reject[]
  latencyMetrics: LatencyMetric[]
}

export function aggregateByStrategy(data: AggregatedData): Map<string, StrategyMetrics> {
  const metricsMap = new Map<string, StrategyMetrics>()

  // Group data by strategy
  const strategyGroups = new Map<string, AggregatedData>()

  for (const fill of data.fills) {
    if (!strategyGroups.has(fill.strategy_id)) {
      strategyGroups.set(fill.strategy_id, { fills: [], cancels: [], rejects: [], latencyMetrics: [] })
    }
    strategyGroups.get(fill.strategy_id)!.fills.push(fill)
  }

  for (const cancel of data.cancels) {
    if (!strategyGroups.has(cancel.strategy_id)) {
      strategyGroups.set(cancel.strategy_id, { fills: [], cancels: [], rejects: [], latencyMetrics: [] })
    }
    strategyGroups.get(cancel.strategy_id)!.cancels.push(cancel)
  }

  for (const reject of data.rejects) {
    if (!strategyGroups.has(reject.strategy_id)) {
      strategyGroups.set(reject.strategy_id, { fills: [], cancels: [], rejects: [], latencyMetrics: [] })
    }
    strategyGroups.get(reject.strategy_id)!.rejects.push(reject)
  }

  for (const metric of data.latencyMetrics) {
    if (!strategyGroups.has(metric.strategy_id)) {
      strategyGroups.set(metric.strategy_id, { fills: [], cancels: [], rejects: [], latencyMetrics: [] })
    }
    strategyGroups.get(metric.strategy_id)!.latencyMetrics.push(metric)
  }

  // Calculate metrics for each strategy
  for (const [strategyId, strategyData] of strategyGroups) {
    const totalFills = strategyData.fills.length
    const totalCancels = strategyData.cancels.length
    const totalRejects = strategyData.rejects.length
    const totalOrders = totalFills + totalCancels + totalRejects

    const fillRate = totalOrders > 0 ? totalFills / totalOrders : 0
    const cancelRate = totalOrders > 0 ? totalCancels / totalOrders : 0
    const rejectRate = totalOrders > 0 ? totalRejects / totalOrders : 0

    const latencies = strategyData.latencyMetrics.map((m) => m.latency_ms)
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0

    const sortedLatencies = [...latencies].sort((a, b) => a - b)
    const p95Index = Math.floor(sortedLatencies.length * 0.95)
    const p99Index = Math.floor(sortedLatencies.length * 0.99)
    const p95Latency = sortedLatencies[p95Index] || 0
    const p99Latency = sortedLatencies[p99Index] || 0

    const totalVolume = strategyData.fills.reduce((sum, fill) => sum + fill.quantity, 0)
    const totalPnl = strategyData.fills.reduce((sum, fill) => {
      return sum + (fill.side === "buy" ? -1 : 1) * fill.quantity * fill.price
    }, 0)

    metricsMap.set(strategyId, {
      strategy_id: strategyId,
      date: new Date().toISOString().split("T")[0],
      total_fills: totalFills,
      total_cancels: totalCancels,
      total_rejects: totalRejects,
      fill_rate: fillRate,
      cancel_rate: cancelRate,
      reject_rate: rejectRate,
      avg_latency_ms: avgLatency,
      p95_latency_ms: p95Latency,
      p99_latency_ms: p99Latency,
      total_volume: totalVolume,
      total_pnl: totalPnl,
    })
  }

  return metricsMap
}

export function aggregateByTimeWindow(data: AggregatedData, windowMinutes: number): Map<string, AggregatedData> {
  const windows = new Map<string, AggregatedData>()

  const getWindowKey = (timestamp: Date): string => {
    const windowStart = new Date(
      Math.floor(timestamp.getTime() / (windowMinutes * 60 * 1000)) * windowMinutes * 60 * 1000,
    )
    return windowStart.toISOString()
  }

  for (const fill of data.fills) {
    const key = getWindowKey(fill.timestamp)
    if (!windows.has(key)) {
      windows.set(key, { fills: [], cancels: [], rejects: [], latencyMetrics: [] })
    }
    windows.get(key)!.fills.push(fill)
  }

  for (const cancel of data.cancels) {
    const key = getWindowKey(cancel.timestamp)
    if (!windows.has(key)) {
      windows.set(key, { fills: [], cancels: [], rejects: [], latencyMetrics: [] })
    }
    windows.get(key)!.cancels.push(cancel)
  }

  for (const reject of data.rejects) {
    const key = getWindowKey(reject.timestamp)
    if (!windows.has(key)) {
      windows.set(key, { fills: [], cancels: [], rejects: [], latencyMetrics: [] })
    }
    windows.get(key)!.rejects.push(reject)
  }

  for (const metric of data.latencyMetrics) {
    const key = getWindowKey(metric.timestamp)
    if (!windows.has(key)) {
      windows.set(key, { fills: [], cancels: [], rejects: [], latencyMetrics: [] })
    }
    windows.get(key)!.latencyMetrics.push(metric)
  }

  return windows
}

export function enrichWithMetadata<T extends { timestamp: Date }>(
  records: T[],
): (T & { hour: number; dayOfWeek: number })[] {
  return records.map((record) => ({
    ...record,
    hour: record.timestamp.getHours(),
    dayOfWeek: record.timestamp.getDay(),
  }))
}
