// Data quality validation for telemetry ingestion

import type { Fill, Cancel, Reject, LatencyMetric } from "../types"

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateFill(fill: Partial<Fill>): ValidationResult {
  const errors: string[] = []

  if (!fill.strategy_id) errors.push("Missing strategy_id")
  if (!fill.symbol) errors.push("Missing symbol")
  if (!fill.side || !["buy", "sell"].includes(fill.side)) errors.push("Invalid side")
  if (typeof fill.quantity !== "number" || fill.quantity <= 0) errors.push("Invalid quantity")
  if (typeof fill.price !== "number" || fill.price <= 0) errors.push("Invalid price")
  if (!fill.venue) errors.push("Missing venue")
  if (typeof fill.latency_ms !== "number" || fill.latency_ms < 0) errors.push("Invalid latency")
  if (!fill.order_id) errors.push("Missing order_id")

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateCancel(cancel: Partial<Cancel>): ValidationResult {
  const errors: string[] = []

  if (!cancel.strategy_id) errors.push("Missing strategy_id")
  if (!cancel.symbol) errors.push("Missing symbol")
  if (!cancel.order_id) errors.push("Missing order_id")
  if (!cancel.reason) errors.push("Missing reason")
  if (typeof cancel.latency_ms !== "number" || cancel.latency_ms < 0) errors.push("Invalid latency")

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateReject(reject: Partial<Reject>): ValidationResult {
  const errors: string[] = []

  if (!reject.strategy_id) errors.push("Missing strategy_id")
  if (!reject.symbol) errors.push("Missing symbol")
  if (!reject.order_id) errors.push("Missing order_id")
  if (!reject.reason) errors.push("Missing reason")
  if (!reject.error_code) errors.push("Missing error_code")

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function validateLatencyMetric(metric: Partial<LatencyMetric>): ValidationResult {
  const errors: string[] = []

  if (!metric.strategy_id) errors.push("Missing strategy_id")
  if (!metric.metric_type || !["order_to_fill", "market_data", "signal_to_order"].includes(metric.metric_type)) {
    errors.push("Invalid metric_type")
  }
  if (typeof metric.latency_ms !== "number" || metric.latency_ms < 0) errors.push("Invalid latency")

  return {
    valid: errors.length === 0,
    errors,
  }
}
