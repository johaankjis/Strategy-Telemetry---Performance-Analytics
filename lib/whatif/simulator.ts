// What-if scenario simulator for parameter tuning

import type { Fill, Cancel, Reject, LatencyMetric, WhatIfScenario } from "../types"
import { MetricsCalculator } from "../metrics/calculator"

export interface SimulationParameters {
  max_position_size?: number
  order_timeout_ms?: number
  min_fill_rate?: number
  max_latency_ms?: number
  risk_multiplier?: number
}

export class WhatIfSimulator {
  // Simulate the impact of parameter changes on strategy performance
  static simulateScenario(
    strategyId: string,
    fills: Fill[],
    cancels: Cancel[],
    rejects: Reject[],
    latencyMetrics: LatencyMetric[],
    parameters: SimulationParameters,
  ): WhatIfScenario {
    // Filter data for the strategy
    const strategyFills = fills.filter((f) => f.strategy_id === strategyId)
    const strategyCancels = cancels.filter((c) => c.strategy_id === strategyId)
    const strategyRejects = rejects.filter((r) => r.strategy_id === strategyId)
    const strategyLatency = latencyMetrics.filter((m) => m.strategy_id === strategyId)

    // Apply parameter constraints and simulate outcomes
    let simulatedFills = [...strategyFills]
    let simulatedCancels = [...strategyCancels]
    let simulatedRejects = [...strategyRejects]
    const simulatedLatency = [...strategyLatency]

    // Apply max position size constraint
    if (parameters.max_position_size) {
      simulatedFills = this.applyPositionSizeLimit(simulatedFills, parameters.max_position_size)
    }

    // Apply order timeout constraint
    if (parameters.order_timeout_ms) {
      const timeoutResults = this.applyOrderTimeout(
        simulatedFills,
        simulatedCancels,
        simulatedLatency,
        parameters.order_timeout_ms,
      )
      simulatedFills = timeoutResults.fills
      simulatedCancels = timeoutResults.cancels
    }

    // Apply minimum fill rate constraint
    if (parameters.min_fill_rate) {
      const fillRateResults = this.applyMinFillRate(
        simulatedFills,
        simulatedCancels,
        simulatedRejects,
        parameters.min_fill_rate,
      )
      simulatedFills = fillRateResults.fills
      simulatedCancels = fillRateResults.cancels
      simulatedRejects = fillRateResults.rejects
    }

    // Apply max latency constraint
    if (parameters.max_latency_ms) {
      const latencyResults = this.applyMaxLatency(
        simulatedFills,
        simulatedCancels,
        simulatedLatency,
        parameters.max_latency_ms,
      )
      simulatedFills = latencyResults.fills
      simulatedCancels = latencyResults.cancels
    }

    // Calculate projected metrics
    const projectedMetrics = MetricsCalculator.calculateStrategyMetrics(
      strategyId,
      simulatedFills,
      simulatedCancels,
      simulatedRejects,
      simulatedLatency,
    )

    // Apply risk multiplier if specified
    if (parameters.risk_multiplier) {
      projectedMetrics.total_pnl *= parameters.risk_multiplier
      projectedMetrics.total_volume *= parameters.risk_multiplier
    }

    return {
      id: `scenario-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: this.generateScenarioName(parameters),
      strategy_id: strategyId,
      parameters,
      projected_metrics: projectedMetrics,
      created_at: new Date(),
    }
  }

  // Apply position size limit
  private static applyPositionSizeLimit(fills: Fill[], maxSize: number): Fill[] {
    let currentPosition = 0
    return fills.filter((fill) => {
      const positionChange = fill.side === "buy" ? fill.quantity : -fill.quantity
      const newPosition = currentPosition + positionChange

      if (Math.abs(newPosition) <= maxSize) {
        currentPosition = newPosition
        return true
      }
      return false
    })
  }

  // Apply order timeout constraint
  private static applyOrderTimeout(
    fills: Fill[],
    cancels: Cancel[],
    latency: LatencyMetric[],
    timeoutMs: number,
  ): { fills: Fill[]; cancels: Cancel[] } {
    // Filter out fills that would have timed out
    const validFills = fills.filter((fill) => fill.latency_ms <= timeoutMs)

    // Add cancels for timed out orders
    const timedOutFills = fills.filter((fill) => fill.latency_ms > timeoutMs)
    const newCancels = timedOutFills.map((fill) => ({
      id: `cancel-timeout-${fill.id}`,
      timestamp: fill.timestamp,
      strategy_id: fill.strategy_id,
      symbol: fill.symbol,
      order_id: fill.order_id,
      reason: "Timeout",
      latency_ms: timeoutMs,
    }))

    return {
      fills: validFills,
      cancels: [...cancels, ...newCancels],
    }
  }

  // Apply minimum fill rate constraint
  private static applyMinFillRate(
    fills: Fill[],
    cancels: Cancel[],
    rejects: Reject[],
    minFillRate: number,
  ): { fills: Fill[]; cancels: Cancel[]; rejects: Reject[] } {
    const totalOrders = fills.length + cancels.length + rejects.length
    const currentFillRate = fills.length / totalOrders

    if (currentFillRate >= minFillRate) {
      return { fills, cancels, rejects }
    }

    // Reduce cancels and rejects to meet minimum fill rate
    const targetFills = Math.ceil(totalOrders * minFillRate)
    const ordersToConvert = targetFills - fills.length

    const convertedFills: Fill[] = []
    let converted = 0

    // Convert cancels to fills first
    for (const cancel of cancels.slice(0, ordersToConvert)) {
      if (converted >= ordersToConvert) break
      convertedFills.push({
        id: `fill-converted-${cancel.id}`,
        timestamp: cancel.timestamp,
        strategy_id: cancel.strategy_id,
        symbol: cancel.symbol,
        side: Math.random() > 0.5 ? "buy" : "sell",
        quantity: Math.floor(Math.random() * 500) + 100,
        price: Math.random() * 200 + 50,
        venue: "SIMULATED",
        latency_ms: cancel.latency_ms,
        order_id: cancel.order_id,
      })
      converted++
    }

    return {
      fills: [...fills, ...convertedFills],
      cancels: cancels.slice(ordersToConvert),
      rejects,
    }
  }

  // Apply maximum latency constraint
  private static applyMaxLatency(
    fills: Fill[],
    cancels: Cancel[],
    latency: LatencyMetric[],
    maxLatencyMs: number,
  ): { fills: Fill[]; cancels: Cancel[] } {
    // Filter fills based on latency
    const validFills = fills.filter((fill) => fill.latency_ms <= maxLatencyMs)

    // Convert high-latency fills to cancels
    const highLatencyFills = fills.filter((fill) => fill.latency_ms > maxLatencyMs)
    const newCancels = highLatencyFills.map((fill) => ({
      id: `cancel-latency-${fill.id}`,
      timestamp: fill.timestamp,
      strategy_id: fill.strategy_id,
      symbol: fill.symbol,
      order_id: fill.order_id,
      reason: "High latency",
      latency_ms: fill.latency_ms,
    }))

    return {
      fills: validFills,
      cancels: [...cancels, ...newCancels],
    }
  }

  // Generate a descriptive name for the scenario
  private static generateScenarioName(parameters: SimulationParameters): string {
    const parts: string[] = []

    if (parameters.max_position_size) parts.push(`MaxPos:${parameters.max_position_size}`)
    if (parameters.order_timeout_ms) parts.push(`Timeout:${parameters.order_timeout_ms}ms`)
    if (parameters.min_fill_rate) parts.push(`MinFill:${(parameters.min_fill_rate * 100).toFixed(0)}%`)
    if (parameters.max_latency_ms) parts.push(`MaxLat:${parameters.max_latency_ms}ms`)
    if (parameters.risk_multiplier) parts.push(`Risk:${parameters.risk_multiplier}x`)

    return parts.length > 0 ? parts.join(" | ") : "Default Scenario"
  }

  // Compare multiple scenarios
  static compareScenarios(scenarios: WhatIfScenario[]): {
    best: WhatIfScenario
    worst: WhatIfScenario
    comparison: Array<{
      scenario: WhatIfScenario
      pnlDiff: number
      fillRateDiff: number
      latencyDiff: number
    }>
  } {
    if (scenarios.length === 0) {
      throw new Error("No scenarios to compare")
    }

    const best = scenarios.reduce((prev, curr) =>
      curr.projected_metrics.total_pnl > prev.projected_metrics.total_pnl ? curr : prev,
    )

    const worst = scenarios.reduce((prev, curr) =>
      curr.projected_metrics.total_pnl < prev.projected_metrics.total_pnl ? curr : prev,
    )

    const baseline = scenarios[0]
    const comparison = scenarios.map((scenario) => ({
      scenario,
      pnlDiff: scenario.projected_metrics.total_pnl - baseline.projected_metrics.total_pnl,
      fillRateDiff: scenario.projected_metrics.fill_rate - baseline.projected_metrics.fill_rate,
      latencyDiff: scenario.projected_metrics.avg_latency_ms - baseline.projected_metrics.avg_latency_ms,
    }))

    return { best, worst, comparison }
  }
}
