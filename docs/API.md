# API Documentation

Complete reference for all REST API endpoints in the Strategy Telemetry & Performance Analytics platform.

## Table of Contents

- [Data Ingestion APIs](#data-ingestion-apis)
  - [Fills](#fills)
  - [Cancels](#cancels)
  - [Rejects](#rejects)
  - [Latency Metrics](#latency-metrics)
- [Metrics APIs](#metrics-apis)
  - [Overview Metrics](#overview-metrics)
  - [Strategy Metrics](#strategy-metrics)
- [Anomaly Detection APIs](#anomaly-detection-apis)
  - [Get Anomalies](#get-anomalies)
  - [Detect Anomalies](#detect-anomalies)
- [What-If Simulation APIs](#what-if-simulation-apis)
  - [Simulate Scenario](#simulate-scenario)
  - [Compare Scenarios](#compare-scenarios)

## Base URL

```
http://localhost:3000/api
```

---

## Data Ingestion APIs

### Fills

#### POST /api/ingest/fills

Ingest a trade fill event.

**Request Body:**
```json
{
  "strategy_id": "string (required)",
  "symbol": "string (required)",
  "side": "buy" | "sell" (required)",
  "quantity": "number (required, > 0)",
  "price": "number (required, > 0)",
  "venue": "string (required)",
  "latency_ms": "number (required, >= 0)",
  "order_id": "string (required)",
  "timestamp": "ISO 8601 string (optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "fill": {
    "id": "fill-1234567890-abc123",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "strategy_id": "momentum-btc",
    "symbol": "BTC-USD",
    "side": "buy",
    "quantity": 1.5,
    "price": 45000,
    "venue": "coinbase",
    "latency_ms": 25,
    "order_id": "order-123"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Validation failed",
  "details": [
    "Invalid quantity",
    "Missing venue"
  ]
}
```

#### GET /api/ingest/fills

Retrieve fills with optional filtering.

**Query Parameters:**
- `strategy_id` (optional): Filter by strategy ID
- `limit` (optional): Maximum number of results to return

**Response (200 OK):**
```json
{
  "fills": [
    {
      "id": "fill-1234567890-abc123",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "strategy_id": "momentum-btc",
      "symbol": "BTC-USD",
      "side": "buy",
      "quantity": 1.5,
      "price": 45000,
      "venue": "coinbase",
      "latency_ms": 25,
      "order_id": "order-123"
    }
  ],
  "count": 1
}
```

### Cancels

#### POST /api/ingest/cancels

Ingest an order cancellation event.

**Request Body:**
```json
{
  "strategy_id": "string (required)",
  "symbol": "string (required)",
  "order_id": "string (required)",
  "reason": "string (required)",
  "latency_ms": "number (required, >= 0)",
  "timestamp": "ISO 8601 string (optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "cancel": {
    "id": "cancel-1234567890-abc123",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "strategy_id": "momentum-btc",
    "symbol": "BTC-USD",
    "order_id": "order-123",
    "reason": "timeout",
    "latency_ms": 30
  }
}
```

#### GET /api/ingest/cancels

Retrieve cancels with optional filtering.

**Query Parameters:**
- `strategy_id` (optional): Filter by strategy ID
- `limit` (optional): Maximum number of results to return

**Response (200 OK):**
```json
{
  "cancels": [...],
  "count": 10
}
```

### Rejects

#### POST /api/ingest/rejects

Ingest an order rejection event.

**Request Body:**
```json
{
  "strategy_id": "string (required)",
  "symbol": "string (required)",
  "order_id": "string (required)",
  "reason": "string (required)",
  "error_code": "string (required)",
  "timestamp": "ISO 8601 string (optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "reject": {
    "id": "reject-1234567890-abc123",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "strategy_id": "momentum-btc",
    "symbol": "BTC-USD",
    "order_id": "order-123",
    "reason": "Insufficient margin",
    "error_code": "ERR_MARGIN"
  }
}
```

#### GET /api/ingest/rejects

Retrieve rejects with optional filtering.

**Query Parameters:**
- `strategy_id` (optional): Filter by strategy ID
- `limit` (optional): Maximum number of results to return

**Response (200 OK):**
```json
{
  "rejects": [...],
  "count": 5
}
```

### Latency Metrics

#### POST /api/ingest/latency

Ingest latency measurement data.

**Request Body:**
```json
{
  "strategy_id": "string (required)",
  "metric_type": "order_to_fill" | "market_data" | "signal_to_order" (required)",
  "latency_ms": "number (required, >= 0)",
  "percentile_50": "number (optional)",
  "percentile_95": "number (optional)",
  "percentile_99": "number (optional)",
  "timestamp": "ISO 8601 string (optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "metric": {
    "id": "latency-1234567890-abc123",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "strategy_id": "momentum-btc",
    "metric_type": "order_to_fill",
    "latency_ms": 25,
    "percentile_50": 20,
    "percentile_95": 45,
    "percentile_99": 60
  }
}
```

#### GET /api/ingest/latency

Retrieve latency metrics with optional filtering.

**Query Parameters:**
- `strategy_id` (optional): Filter by strategy ID
- `limit` (optional): Maximum number of results to return

**Response (200 OK):**
```json
{
  "metrics": [...],
  "count": 50
}
```

---

## Metrics APIs

### Overview Metrics

#### GET /api/metrics/overview

Get aggregated metrics across all strategies and overall performance.

**Response (200 OK):**
```json
{
  "overall": {
    "fillRate": 0.85,
    "cancelRate": 0.10,
    "rejectRate": 0.05,
    "avgLatency": 28.5,
    "p50Latency": 25,
    "p95Latency": 55,
    "p99Latency": 80,
    "totalVolume": 15000,
    "totalPnl": 2500.50,
    "sharpeRatio": 1.8,
    "maxDrawdown": -500.25
  },
  "strategies": [
    {
      "strategy": {
        "id": "momentum-btc",
        "name": "BTC Momentum Strategy",
        "description": "Momentum-based trading for Bitcoin",
        "status": "active",
        "created_at": "2024-01-01T00:00:00.000Z"
      },
      "metrics": {
        "strategy_id": "momentum-btc",
        "date": "2024-01-15",
        "total_fills": 100,
        "total_cancels": 10,
        "total_rejects": 5,
        "fill_rate": 0.87,
        "cancel_rate": 0.09,
        "reject_rate": 0.04,
        "avg_latency_ms": 25,
        "p95_latency_ms": 50,
        "p99_latency_ms": 75,
        "total_volume": 5000,
        "total_pnl": 800.25
      },
      "performance": {
        "fillRate": 0.87,
        "cancelRate": 0.09,
        "rejectRate": 0.04,
        "avgLatency": 25,
        "p50Latency": 22,
        "p95Latency": 50,
        "p99Latency": 75,
        "totalVolume": 5000,
        "totalPnl": 800.25,
        "sharpeRatio": 2.1,
        "maxDrawdown": -150.50
      }
    }
  ],
  "summary": {
    "totalStrategies": 3,
    "activeStrategies": 2,
    "totalFills": 200,
    "totalCancels": 20,
    "totalRejects": 10
  }
}
```

### Strategy Metrics

#### GET /api/metrics/strategy/[strategyId]

Get detailed metrics and time-series data for a specific strategy.

**Path Parameters:**
- `strategyId`: The unique identifier of the strategy

**Response (200 OK):**
```json
{
  "metrics": {
    "strategy_id": "momentum-btc",
    "date": "2024-01-15",
    "total_fills": 100,
    "total_cancels": 10,
    "total_rejects": 5,
    "fill_rate": 0.87,
    "cancel_rate": 0.09,
    "reject_rate": 0.04,
    "avg_latency_ms": 25,
    "p95_latency_ms": 50,
    "p99_latency_ms": 75,
    "total_volume": 5000,
    "total_pnl": 800.25
  },
  "performance": {
    "fillRate": 0.87,
    "cancelRate": 0.09,
    "rejectRate": 0.04,
    "avgLatency": 25,
    "p50Latency": 22,
    "p95Latency": 50,
    "p99Latency": 75,
    "totalVolume": 5000,
    "totalPnl": 800.25,
    "sharpeRatio": 2.1,
    "maxDrawdown": -150.50
  },
  "timeSeries": {
    "fillRate": [
      {
        "timestamp": "2024-01-15T10:00:00.000Z",
        "value": 0.85
      },
      {
        "timestamp": "2024-01-15T11:00:00.000Z",
        "value": 0.88
      }
    ],
    "latency": [
      {
        "timestamp": "2024-01-15T10:00:00.000Z",
        "value": 25
      }
    ],
    "volume": [
      {
        "timestamp": "2024-01-15T10:00:00.000Z",
        "value": 1000
      }
    ],
    "pnl": [
      {
        "timestamp": "2024-01-15T10:00:00.000Z",
        "value": 150.25
      }
    ]
  }
}
```

---

## Anomaly Detection APIs

### Get Anomalies

#### GET /api/anomalies

Retrieve detected anomalies with optional filtering.

**Query Parameters:**
- `strategy_id` (optional): Filter by strategy ID
- `limit` (optional): Maximum number of results to return

**Response (200 OK):**
```json
{
  "anomalies": [
    {
      "id": "anomaly-latency-1234567890-abc123",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "strategy_id": "momentum-btc",
      "anomaly_type": "latency_spike",
      "severity": "high",
      "description": "Latency spike detected: 150ms (3.5 std dev above normal)",
      "metric_value": 150,
      "threshold_value": 80,
      "detected_at": "2024-01-15T10:30:05.000Z"
    }
  ],
  "count": 1
}
```

### Detect Anomalies

#### POST /api/anomalies/detect

Trigger anomaly detection across all strategies.

**Request Body:**
```json
{
  "strategy_id": "string (optional)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "anomalies": [
    {
      "id": "anomaly-latency-1234567890-abc123",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "strategy_id": "momentum-btc",
      "anomaly_type": "latency_spike",
      "severity": "high",
      "description": "Latency spike detected: 150ms (3.5 std dev above normal)",
      "metric_value": 150,
      "threshold_value": 80,
      "detected_at": "2024-01-15T10:30:05.000Z"
    }
  ],
  "detected": 3
}
```

---

## What-If Simulation APIs

### Simulate Scenario

#### POST /api/whatif/simulate

Simulate the impact of parameter changes on strategy performance.

**Request Body:**
```json
{
  "strategy_id": "momentum-btc",
  "parameters": {
    "max_position_size": 100,
    "order_timeout_ms": 5000,
    "min_fill_rate": 0.8,
    "max_latency_ms": 50,
    "risk_multiplier": 1.5
  }
}
```

**Response (200 OK):**
```json
{
  "scenario": {
    "id": "scenario-1234567890-abc123",
    "name": "Simulated Scenario",
    "strategy_id": "momentum-btc",
    "parameters": {
      "max_position_size": 100,
      "order_timeout_ms": 5000,
      "min_fill_rate": 0.8,
      "max_latency_ms": 50,
      "risk_multiplier": 1.5
    },
    "projected_metrics": {
      "strategy_id": "momentum-btc",
      "date": "2024-01-15",
      "total_fills": 95,
      "total_cancels": 12,
      "total_rejects": 5,
      "fill_rate": 0.85,
      "cancel_rate": 0.11,
      "reject_rate": 0.04,
      "avg_latency_ms": 28,
      "p95_latency_ms": 48,
      "p99_latency_ms": 50,
      "total_volume": 4800,
      "total_pnl": 750.00
    },
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Compare Scenarios

#### POST /api/whatif/compare

Compare multiple what-if scenarios side-by-side.

**Request Body:**
```json
{
  "strategy_id": "momentum-btc",
  "scenarios": [
    {
      "max_position_size": 100,
      "order_timeout_ms": 5000
    },
    {
      "max_position_size": 150,
      "order_timeout_ms": 3000
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "comparison": {
    "scenarios": [
      {
        "id": "scenario-1234567890-abc123",
        "name": "Scenario 1",
        "parameters": {...},
        "projected_metrics": {...}
      },
      {
        "id": "scenario-1234567890-def456",
        "name": "Scenario 2",
        "parameters": {...},
        "projected_metrics": {...}
      }
    ],
    "bestScenario": {
      "id": "scenario-1234567890-abc123",
      "metric": "sharpeRatio",
      "value": 2.3
    },
    "comparison": {
      "fillRate": {
        "scenario_1": 0.85,
        "scenario_2": 0.82
      },
      "totalPnl": {
        "scenario_1": 750.00,
        "scenario_2": 680.00
      },
      "sharpeRatio": {
        "scenario_1": 2.3,
        "scenario_2": 1.9
      }
    }
  }
}
```

---

## Error Handling

All endpoints follow standard HTTP status codes:

- **200 OK**: Successful GET request
- **201 Created**: Successful POST request that creates a resource
- **400 Bad Request**: Invalid request body or parameters
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

Error responses include descriptive messages:

```json
{
  "error": "Error message",
  "details": ["Additional detail 1", "Additional detail 2"]
}
```

## Rate Limiting

Currently, there are no rate limits implemented. For production deployments, consider implementing rate limiting based on your requirements.

## Authentication

The current implementation does not include authentication. For production use, implement appropriate authentication and authorization mechanisms.
