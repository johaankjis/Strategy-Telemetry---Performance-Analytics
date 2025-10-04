import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get("strategy_id") || undefined
    const severity = searchParams.get("severity") as "low" | "medium" | "high" | "critical" | undefined
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : 50

    let anomalies = dataStore.getAnomalies(strategyId, limit)

    // Filter by severity if specified
    if (severity) {
      anomalies = anomalies.filter((a) => a.severity === severity)
    }

    return NextResponse.json({
      anomalies,
      count: anomalies.length,
    })
  } catch (error) {
    console.error("[v0] Error fetching anomalies:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
