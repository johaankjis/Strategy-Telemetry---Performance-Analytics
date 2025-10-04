import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { validateLatencyMetric } from "@/lib/etl/validators"
import type { LatencyMetric } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validation = validateLatencyMetric(body)
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 })
    }

    const metric: LatencyMetric = {
      id: `latency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(body.timestamp || Date.now()),
      strategy_id: body.strategy_id,
      metric_type: body.metric_type,
      latency_ms: body.latency_ms,
      percentile_50: body.percentile_50,
      percentile_95: body.percentile_95,
      percentile_99: body.percentile_99,
    }

    dataStore.addLatencyMetric(metric)

    return NextResponse.json({ success: true, metric }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error ingesting latency metric:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get("strategy_id") || undefined
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : undefined

    const metrics = dataStore.getLatencyMetrics(strategyId, limit)

    return NextResponse.json({ metrics, count: metrics.length })
  } catch (error) {
    console.error("[v0] Error fetching latency metrics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
