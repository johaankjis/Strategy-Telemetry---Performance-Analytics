// Core telemetry data types fo```typescript file="lib/types.ts"
// Core telemetry data types for trading strategy monitoring

export interface Fill {
  id: string
  timestamp: Date
  strategy_id: string
  symbol: string
  side: "buy" | "sell"
  quantity: number
  price: number
  venue: string
  latency_ms: number
  order_id: string
}

export interface Cancel {
  id: string
  timestamp: Date
  strategy_id: string
  symbol: string
  order_id: string
  reason: string
  latency_ms: number
}

export interface Reject {
  id: string
  timestamp: Date
  strategy_id: string
  symbol: string
  order_id: string
  reason: string
  error_code: string
}

export interface LatencyMetric {
  id: string
  timestamp: Date
  strategy_id: string
  metric_type: "order_to_fill" | "market_data" | "signal_to_order"
  latency_ms: number
  percentile_50?: number
  percentile_95?: number
  percentile_99?: number
}

export interface StrategyMetrics {
  strategy_id: string
  date: string
  total_fills: number
  total_cancels: number
  total_rejects: number
  fill_rate: number
  cancel_rate: number
  reject_rate: number
  avg_latency_ms: number
  p95_latency_ms: number
  p99_latency_ms: number
  total_volume: number
  total_pnl: number
}

export interface Anomaly {
  id: string
  timestamp: Date
  strategy_id: string
  anomaly_type: "latency_spike" | "high_reject_rate" | "unusual_volume" | "fill_rate_drop"
  severity: "low" | "medium" | "high" | "critical"
  description: string
  metric_value: number
  threshold_value: number
  detected_at: Date
}

export interface WhatIfScenario {
  id: string
  name: string
  strategy_id: string
  parameters: {
    max_position_size?: number
    order_timeout_ms?: number
    min_fill_rate?: number
    max_latency_ms?: number
  }
  projected_metrics: StrategyMetrics
  created_at: Date
}

export interface Strategy {
  id: string
  name: string
  description: string
  status: "active" | "paused" | "stopped"
  created_at: Date
}
