import { NextResponse } from "next/server"
import { dataStore } from "@/lib/data-store"
import { validateFill } from "@/lib/etl/validators"
import type { Fill } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate the fill data
    const validation = validateFill(body)
    if (!validation.valid) {
      return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 })
    }

    // Create fill record
    const fill: Fill = {
      id: `fill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(body.timestamp || Date.now()),
      strategy_id: body.strategy_id,
      symbol: body.symbol,
      side: body.side,
      quantity: body.quantity,
      price: body.price,
      venue: body.venue,
      latency_ms: body.latency_ms,
      order_id: body.order_id,
    }

    // Store the fill
    dataStore.addFill(fill)

    return NextResponse.json({ success: true, fill }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error ingesting fill:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const strategyId = searchParams.get("strategy_id") || undefined
    const limit = searchParams.get("limit") ? Number.parseInt(searchParams.get("limit")!) : undefined

    const fills = dataStore.getFills(strategyId, limit)

    return NextResponse.json({ fills, count: fills.length })
  } catch (error) {
    console.error("[v0] Error fetching fills:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
