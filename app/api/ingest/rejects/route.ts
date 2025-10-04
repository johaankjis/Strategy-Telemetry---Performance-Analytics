import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { validateReject } from "@/lib/etl/validators"
import type { Reject } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validation = validateReject(body)
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 })
    }

    const reject: Reject = {
      id: `reject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(body.timestamp || Date.now()),
      strategy_id: body.strategy_id,
      symbol: body.symbol,
      order_id: body.order_id,
      reason: body.reason,
      error_code: body.error_code,
    }

    dataStore.addReject(reject)

    return NextResponse.json({ success: true, reject }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error ingesting reject:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get("strategy_id") || undefined
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : undefined

    const rejects = dataStore.getRejects(strategyId, limit)

    return NextResponse.json({ rejects, count: rejects.length })
  } catch (error) {
    console.error("[v0] Error fetching rejects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
