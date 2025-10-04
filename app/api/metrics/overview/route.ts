import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { MetricsCalculator } from "@/lib/metrics/calculator"

export async function GET() {
  try {
    const strategies = dataStore.getStrategies()
    const allFills = dataStore.getFills()
    const allCancels = dataStore.getCancels()
    const allRejects = dataStore.getRejects()
    const allLatencyMetrics = dataStore.getLatencyMetrics()

    // Calculate metrics for each strategy
    const strategyMetrics = strategies.map((strategy) => {
      const fills = allFills.filter((f) => f.strategy_id === strategy.id)
      const cancels = allCancels.filter((c) => c.strategy_id === strategy.id)
      const rejects = allRejects.filter((r) => r.strategy_id === strategy.id)
      const latency = allLatencyMetrics.filter((m) => m.strategy_id === strategy.id)

      return {
        strategy,
        metrics: MetricsCalculator.calculateStrategyMetrics(strategy.id, fills, cancels, rejects, latency),
        performance: MetricsCalculator.calculatePerformanceMetrics(fills, cancels, rejects, latency),
      }
    })

    // Calculate overall metrics
    const overallMetrics = MetricsCalculator.calculatePerformanceMetrics(
      allFills,
      allCancels,
      allRejects,
      allLatencyMetrics,
    )

    return NextResponse.json({
      overall: overallMetrics,
      strategies: strategyMetrics,
      summary: {
        totalStrategies: strategies.length,
        activeStrategies: strategies.filter((s) => s.status === "active").length,
        totalFills: allFills.length,
        totalCancels: allCancels.length,
        totalRejects: allRejects.length,
      },
    })
  } catch (error) {
    console.error("[v0] Error calculating overview metrics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
