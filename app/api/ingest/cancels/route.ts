import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { validateCancel } from "@/lib/etl/validators"
import type { Cancel } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validation = validateCancel(body)
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 })
    }

    const cancel: Cancel = {
      id: `cancel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(body.timestamp || Date.now()),
      strategy_id: body.strategy_id,
      symbol: body.symbol,
      order_id: body.order_id,
      reason: body.reason,
      latency_ms: body.latency_ms,
    }

    dataStore.addCancel(cancel)

    return NextResponse.json({ success: true, cancel }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error ingesting cancel:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get("strategy_id") || undefined
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : undefined

    const cancels = dataStore.getCancels(strategyId, limit)

    return NextResponse.json({ cancels, count: cancels.length })
  } catch (error) {
    console.error("[v0] Error fetching cancels:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
