// Mock data generator for telemetry system

import type { Fill, Cancel, Reject, LatencyMetric, Strategy, Anomaly } from "./types"

const STRATEGIES = [
  {
    id: "strat-001",
    name: "Market Making Alpha",
    description: "High-frequency market making strategy",
    status: "active" as const,
  },
  {
    id: "strat-002",
    name: "Momentum Trader",
    description: "Momentum-based trading strategy",
    status: "active" as const,
  },
  { id: "strat-003", name: "Arbitrage Bot", description: "Cross-venue arbitrage strategy", status: "paused" as const },
]

const SYMBOLS = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NVDA"]
const VENUES = ["NYSE", "NASDAQ", "BATS", "IEX"]
const REJECT_REASONS = ["Insufficient funds", "Invalid price", "Market closed", "Position limit exceeded"]
const CANCEL_REASONS = ["Timeout", "Manual cancel", "Strategy stop", "Risk limit"]

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(hoursAgo: number): Date {
  const now = new Date()
  const ms = hoursAgo * 60 * 60 * 1000
  return new Date(now.getTime() - Math.random() * ms)
}

export function generateMockFills(count = 100): Fill[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `fill-${i + 1}`,
    timestamp: randomDate(24),
    strategy_id: randomElement(STRATEGIES).id,
    symbol: randomElement(SYMBOLS),
    side: Math.random() > 0.5 ? "buy" : "sell",
    quantity: Math.floor(Math.random() * 1000) + 100,
    price: Math.random() * 500 + 50,
    venue: randomElement(VENUES),
    latency_ms: Math.random() * 100 + 5,
    order_id: `order-${i + 1}`,
  }))
}

export function generateMockCancels(count = 30): Cancel[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `cancel-${i + 1}`,
    timestamp: randomDate(24),
    strategy_id: randomElement(STRATEGIES).id,
    symbol: randomElement(SYMBOLS),
    order_id: `order-${i + 100}`,
    reason: randomElement(CANCEL_REASONS),
    latency_ms: Math.random() * 50 + 2,
  }))
}

export function generateMockRejects(count = 15): Reject[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `reject-${i + 1}`,
    timestamp: randomDate(24),
    strategy_id: randomElement(STRATEGIES).id,
    symbol: randomElement(SYMBOLS),
    order_id: `order-${i + 200}`,
    reason: randomElement(REJECT_REASONS),
    error_code: `ERR-${Math.floor(Math.random() * 9000) + 1000}`,
  }))
}

export function generateMockLatencyMetrics(count = 50): LatencyMetric[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `latency-${i + 1}`,
    timestamp: randomDate(24),
    strategy_id: randomElement(STRATEGIES).id,
    metric_type: randomElement(["order_to_fill", "market_data", "signal_to_order"] as const),
    latency_ms: Math.random() * 150 + 5,
    percentile_50: Math.random() * 50 + 10,
    percentile_95: Math.random() * 100 + 50,
    percentile_99: Math.random() * 150 + 100,
  }))
}

export function generateMockAnomalies(count = 5): Anomaly[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `anomaly-${i + 1}`,
    timestamp: randomDate(12),
    strategy_id: randomElement(STRATEGIES).id,
    anomaly_type: randomElement(["latency_spike", "high_reject_rate", "unusual_volume", "fill_rate_drop"] as const),
    severity: randomElement(["low", "medium", "high", "critical"] as const),
    description: "Detected abnormal pattern in trading metrics",
    metric_value: Math.random() * 200,
    threshold_value: Math.random() * 100,
    detected_at: randomDate(12),
  }))
}

export function getStrategies(): Strategy[] {
  return STRATEGIES.map((s) => ({
    ...s,
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  }))
}
