import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { WhatIfSimulator } from "@/lib/whatif/simulator"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { strategy_id, parameters } = body

    if (!strategy_id) {
      return NextResponse.json({ error: "strategy_id is required" }, { status: 400 })
    }

    // Fetch data for the strategy
    const fills = dataStore.getFills(strategy_id)
    const cancels = dataStore.getCancels(strategy_id)
    const rejects = dataStore.getRejects(strategy_id)
    const latencyMetrics = dataStore.getLatencyMetrics(strategy_id)

    // Run simulation
    const scenario = WhatIfSimulator.simulateScenario(
      strategy_id,
      fills,
      cancels,
      rejects,
      latencyMetrics,
      parameters || {},
    )

    return NextResponse.json({ scenario })
  } catch (error) {
    console.error("[v0] Error simulating scenario:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
