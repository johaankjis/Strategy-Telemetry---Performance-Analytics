import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { WhatIfSimulator } from "@/lib/whatif/simulator"
import type { SimulationParameters } from "@/lib/whatif/simulator"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { strategy_id, scenarios } = body

    if (!strategy_id || !scenarios || !Array.isArray(scenarios)) {
      return NextResponse.json({ error: "strategy_id and scenarios array are required" }, { status: 400 })
    }

    // Fetch data for the strategy
    const fills = dataStore.getFills(strategy_id)
    const cancels = dataStore.getCancels(strategy_id)
    const rejects = dataStore.getRejects(strategy_id)
    const latencyMetrics = dataStore.getLatencyMetrics(strategy_id)

    // Run simulations for all scenarios
    const simulatedScenarios = scenarios.map((params: SimulationParameters) =>
      WhatIfSimulator.simulateScenario(strategy_id, fills, cancels, rejects, latencyMetrics, params),
    )

    // Compare scenarios
    const comparison = WhatIfSimulator.compareScenarios(simulatedScenarios)

    return NextResponse.json({ comparison })
  } catch (error) {
    console.error("[v0] Error comparing scenarios:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
