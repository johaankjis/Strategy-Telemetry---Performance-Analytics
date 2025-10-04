import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { MetricsCalculator } from "@/lib/metrics/calculator"

export async function GET(request: Request, { params }: { params: { strategyId: string } }) {
  try {
    const strategyId = params.strategyId

    // Fetch all data for the strategy
    const fills = dataStore.getFills(strategyId)
    const cancels = dataStore.getCancels(strategyId)
    const rejects = dataStore.getRejects(strategyId)
    const latencyMetrics = dataStore.getLatencyMetrics(strategyId)

    // Calculate comprehensive metrics
    const metrics = MetricsCalculator.calculateStrategyMetrics(strategyId, fills, cancels, rejects, latencyMetrics)

    const performanceMetrics = MetricsCalculator.calculatePerformanceMetrics(fills, cancels, rejects, latencyMetrics)

    // Calculate time series data
    const fillRateTimeSeries = MetricsCalculator.calculateFillRateTimeSeries(fills, cancels, rejects, 60)
    const latencyTimeSeries = MetricsCalculator.calculateLatencyTimeSeries(latencyMetrics, 60)
    const volumeTimeSeries = MetricsCalculator.calculateVolumeTimeSeries(fills, 60)
    const pnlTimeSeries = MetricsCalculator.calculatePnLTimeSeries(fills, 60)

    return NextResponse.json({
      metrics,
      performance: performanceMetrics,
      timeSeries: {
        fillRate: fillRateTimeSeries,
        latency: latencyTimeSeries,
        volume: volumeTimeSeries,
        pnl: pnlTimeSeries,
      },
    })
  } catch (error) {
    console.error("[v0] Error calculating strategy metrics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
