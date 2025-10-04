import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { AnomalyDetector } from "@/lib/anomaly/detector"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const strategyId = body.strategy_id

    // Fetch data
    const fills = dataStore.getFills(strategyId)
    const cancels = dataStore.getCancels(strategyId)
    const rejects = dataStore.getRejects(strategyId)
    const latencyMetrics = dataStore.getLatencyMetrics(strategyId)

    // Run anomaly detection
    const detector = new AnomalyDetector()
    const anomalies = detector.detectAll(fills, cancels, rejects, latencyMetrics)

    // Store detected anomalies
    for (const anomaly of anomalies) {
      dataStore.addAnomaly(anomaly)
    }

    return NextResponse.json({
      success: true,
      detected: anomalies.length,
      anomalies: anomalies.slice(0, 20), // Return top 20
    })
  } catch (error) {
    console.error("[v0] Error detecting anomalies:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
