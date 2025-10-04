# Strategy Telemetry & Performance Analytics

A comprehensive real-time trading strategy monitoring and analytics platform built with Next.js, TypeScript, and React. This application provides live performance metrics, anomaly detection, and what-if scenario analysis for algorithmic trading strategies.

## 🚀 Features

### Real-Time Performance Monitoring
- **Live Metrics Dashboard**: Monitor key performance indicators including fill rates, latency, volume, and P&L
- **Strategy-Level Analytics**: Track individual strategy performance with detailed metrics
- **Time-Series Visualization**: Interactive charts for latency, volume, and P&L trends

### Anomaly Detection
- **Automated Detection**: Identify latency spikes, high reject rates, unusual volume, and fill rate drops
- **Severity Classification**: Anomalies categorized by severity (low, medium, high, critical)
- **Real-Time Alerts**: Get notified of performance issues as they occur

### What-If Scenario Analysis
- **Parameter Simulation**: Test strategy parameter changes without risking live trading
- **Comparative Analysis**: Compare multiple scenarios side-by-side
- **Risk Assessment**: Evaluate potential impacts on metrics like Sharpe ratio and max drawdown

### Telemetry Data Ingestion
- **REST API Endpoints**: Ingest fills, cancels, rejects, and latency metrics
- **Data Validation**: Built-in validators ensure data quality
- **Flexible Querying**: Filter by strategy, limit results, and more

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Development Guide](#development-guide)
- [Data Models](#data-models)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🏁 Quick Start

### Prerequisites

- Node.js 18+ or compatible runtime
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/johaankjis/Strategy-Telemetry---Performance-Analytics.git
cd Strategy-Telemetry---Performance-Analytics
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Run the development server:
```bash
pnpm dev
# or
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### First Steps

1. **Explore the Dashboard**: View overview metrics and strategy performance
2. **Run Anomaly Detection**: Click "Run Anomaly Detection" to identify issues
3. **Try What-If Sandbox**: Navigate to `/sandbox` to simulate parameter changes

## 🏗️ Architecture

The application follows a modern Next.js App Router architecture with the following components:

- **Frontend**: React components with shadcn/ui and Tailwind CSS
- **API Layer**: Next.js API routes for REST endpoints
- **Data Layer**: In-memory data store (easily replaceable with persistent storage)
- **Analytics Engine**: TypeScript-based metrics calculator and anomaly detector

For detailed architecture documentation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## 📚 Documentation

### Core Documentation

- [API Documentation](docs/API.md) - Complete API reference for all endpoints
- [Architecture Guide](docs/ARCHITECTURE.md) - System design and components
- [Development Guide](docs/DEVELOPMENT.md) - Setup, workflow, and contribution guidelines
- [Data Models](docs/DATA_MODELS.md) - TypeScript interfaces and data structures

### Feature Documentation

- [What-If Simulator](docs/WHATIF_SIMULATOR.md) - Scenario analysis and simulation
- [Anomaly Detection](docs/ANOMALY_DETECTION.md) - Detection algorithms and thresholds

### Deployment

- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment instructions

## 🔧 Technology Stack

- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 4
- **Charts**: Recharts
- **State Management**: React hooks
- **Package Manager**: pnpm

## 📊 Key Metrics Calculated

- **Fill Rate**: Percentage of orders successfully filled
- **Cancel Rate**: Percentage of orders cancelled
- **Reject Rate**: Percentage of orders rejected
- **Latency Metrics**: P50, P95, P99 latencies
- **Volume**: Total trading volume
- **P&L**: Profit and loss calculations
- **Sharpe Ratio**: Risk-adjusted return metric
- **Max Drawdown**: Maximum observed loss from peak

## 🔐 Data Ingestion

Send telemetry data to the platform via REST API:

```bash
# Ingest a fill
curl -X POST http://localhost:3000/api/ingest/fills \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_id": "momentum-btc",
    "symbol": "BTC-USD",
    "side": "buy",
    "quantity": 1.5,
    "price": 45000,
    "venue": "coinbase",
    "latency_ms": 25,
    "order_id": "order-123"
  }'
```

See [API Documentation](docs/API.md) for complete endpoint details.

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](docs/DEVELOPMENT.md) for:
- Code style guidelines
- Development workflow
- Testing requirements
- Pull request process

## 📝 License

This project is available under the MIT License.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for high-performance trading analytics.

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.
