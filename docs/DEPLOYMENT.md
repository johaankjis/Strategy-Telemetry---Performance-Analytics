# Deployment Guide

Complete guide for deploying the Strategy Telemetry & Performance Analytics platform to production.

## Table of Contents

- [Deployment Options](#deployment-options)
- [Vercel Deployment](#vercel-deployment)
- [Docker Deployment](#docker-deployment)
- [Self-Hosted Deployment](#self-hosted-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Monitoring & Logging](#monitoring--logging)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Scaling Strategy](#scaling-strategy)
- [Troubleshooting](#troubleshooting)

## Deployment Options

### Recommended Platforms

1. **Vercel** (Easiest) - Optimized for Next.js
2. **Docker** (Flexible) - Works anywhere
3. **AWS/GCP/Azure** (Enterprise) - Full control
4. **Self-Hosted** (Custom) - Maximum control

## Vercel Deployment

### Prerequisites

- Vercel account (free tier available)
- GitHub repository

### Steps

#### 1. Connect Repository

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link
```

#### 2. Configure Project

Create `vercel.json`:
```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 3. Deploy

```bash
# Deploy to production
vercel --prod

# Or via GitHub integration
git push origin main  # Auto-deploys
```

#### 4. Configure Domain (Optional)

```bash
vercel domains add yourdomain.com
```

### Environment Variables

Set in Vercel dashboard or via CLI:
```bash
vercel env add DATABASE_URL production
vercel env add API_KEY production
```

### Vercel Advantages

✅ Zero-config deployment  
✅ Automatic HTTPS  
✅ Global CDN  
✅ Serverless functions  
✅ Preview deployments  
✅ Analytics included  

### Vercel Limitations

⚠️ Serverless function limits (10s default, 60s max)  
⚠️ Cold starts  
⚠️ Stateless (need external database)  

## Docker Deployment

### Prerequisites

- Docker installed
- Docker Compose (optional)

### Dockerfile

Create `Dockerfile`:
```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Set to production
ENV NODE_ENV=production

# Install pnpm
RUN npm install -g pnpm

# Copy built assets from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Start application
CMD ["pnpm", "start"]
```

### Docker Compose

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/telemetry
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=telemetry
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Build and Run

```bash
# Build image
docker build -t telemetry-app .

# Run container
docker run -p 3000:3000 telemetry-app

# Or with Docker Compose
docker-compose up -d
```

### Docker Advantages

✅ Consistent environments  
✅ Easy rollback  
✅ Resource isolation  
✅ Works anywhere  
✅ Include database  

## Self-Hosted Deployment

### Prerequisites

- Linux server (Ubuntu 22.04 LTS recommended)
- Node.js 18+
- Nginx or Caddy
- PostgreSQL (optional)
- PM2 process manager

### Setup Script

```bash
#!/bin/bash

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2
npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL (optional)
sudo apt install -y postgresql postgresql-contrib
```

### Application Setup

```bash
# Clone repository
cd /var/www
git clone https://github.com/yourusername/telemetry-app.git
cd telemetry-app

# Install dependencies
pnpm install

# Build application
pnpm build

# Start with PM2
pm2 start npm --name "telemetry" -- start
pm2 save
pm2 startup
```

### Nginx Configuration

Create `/etc/nginx/sites-available/telemetry`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/telemetry /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### PM2 Management

```bash
# View logs
pm2 logs telemetry

# Restart
pm2 restart telemetry

# Stop
pm2 stop telemetry

# Monitor
pm2 monit
```

## Environment Configuration

### Environment Variables

Create `.env.production`:
```bash
# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database (if using external DB)
DATABASE_URL=postgresql://user:password@host:5432/telemetry

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key-here
API_KEY=your-api-key-here

# Monitoring
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id

# Feature Flags
ENABLE_ANOMALY_DETECTION=true
ENABLE_WHATIF_SIMULATOR=true

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000
```

### Next.js Configuration

Update `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Docker
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Environment variables
  env: {
    API_URL: process.env.API_URL,
  }
}

export default nextConfig
```

## Database Setup

### PostgreSQL Schema

Create migration script `migrations/001_initial.sql`:
```sql
-- Strategies table
CREATE TABLE strategies (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fills table
CREATE TABLE fills (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    strategy_id VARCHAR(255) REFERENCES strategies(id),
    symbol VARCHAR(50) NOT NULL,
    side VARCHAR(10) NOT NULL,
    quantity DECIMAL(18, 8) NOT NULL,
    price DECIMAL(18, 8) NOT NULL,
    venue VARCHAR(100) NOT NULL,
    latency_ms INTEGER NOT NULL,
    order_id VARCHAR(255) NOT NULL
);

-- Cancels table
CREATE TABLE cancels (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    strategy_id VARCHAR(255) REFERENCES strategies(id),
    symbol VARCHAR(50) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    reason VARCHAR(255),
    latency_ms INTEGER NOT NULL
);

-- Rejects table
CREATE TABLE rejects (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    strategy_id VARCHAR(255) REFERENCES strategies(id),
    symbol VARCHAR(50) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    reason VARCHAR(255),
    error_code VARCHAR(100)
);

-- Latency metrics table
CREATE TABLE latency_metrics (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    strategy_id VARCHAR(255) REFERENCES strategies(id),
    metric_type VARCHAR(50) NOT NULL,
    latency_ms INTEGER NOT NULL,
    percentile_50 INTEGER,
    percentile_95 INTEGER,
    percentile_99 INTEGER
);

-- Anomalies table
CREATE TABLE anomalies (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    strategy_id VARCHAR(255) REFERENCES strategies(id),
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    metric_value DECIMAL(18, 8),
    threshold_value DECIMAL(18, 8),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_fills_strategy_timestamp ON fills(strategy_id, timestamp DESC);
CREATE INDEX idx_cancels_strategy_timestamp ON cancels(strategy_id, timestamp DESC);
CREATE INDEX idx_rejects_strategy_timestamp ON rejects(strategy_id, timestamp DESC);
CREATE INDEX idx_latency_strategy_timestamp ON latency_metrics(strategy_id, timestamp DESC);
CREATE INDEX idx_anomalies_strategy_timestamp ON anomalies(strategy_id, timestamp DESC);
```

Run migration:
```bash
psql -U user -d telemetry -f migrations/001_initial.sql
```

## Monitoring & Logging

### Application Monitoring

#### Option 1: Sentry (Errors)

```bash
npm install @sentry/nextjs
```

Configure `sentry.client.config.js`:
```javascript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

#### Option 2: New Relic (APM)

```bash
npm install newrelic
```

Create `newrelic.js`:
```javascript
exports.config = {
  app_name: ['Telemetry App'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: 'info'
  }
}
```

### Logging

#### Structured Logging with Winston

```bash
npm install winston
```

Create `lib/logger.ts`:
```typescript
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}
```

### Health Checks

Create `app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  // Check database connection
  const dbHealthy = await checkDatabase()
  
  // Check Redis connection
  const redisHealthy = await checkRedis()
  
  const healthy = dbHealthy && redisHealthy
  
  return NextResponse.json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbHealthy ? 'up' : 'down',
      redis: redisHealthy ? 'up' : 'down'
    }
  }, { status: healthy ? 200 : 503 })
}
```

## Security Considerations

### 1. Environment Variables

Never commit secrets:
```bash
# Add to .gitignore
.env
.env.local
.env.production
```

### 2. API Authentication

Add API key middleware:
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check for API key
  const apiKey = request.headers.get('x-api-key')
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*'
}
```

### 3. Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests'
})
```

### 4. CORS Configuration

```typescript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
        ]
      }
    ]
  }
}
```

### 5. HTTPS Only

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// Use Redis for caching
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function getCachedMetrics(strategyId: string) {
  const cached = await redis.get(`metrics:${strategyId}`)
  
  if (cached) {
    return JSON.parse(cached)
  }
  
  const metrics = await calculateMetrics(strategyId)
  await redis.setex(`metrics:${strategyId}`, 60, JSON.stringify(metrics))
  
  return metrics
}
```

### 2. Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_fills_strategy_timestamp ON fills(strategy_id, timestamp DESC);

-- Partition large tables
CREATE TABLE fills_2024_01 PARTITION OF fills
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 3. CDN for Static Assets

Configure in `next.config.mjs`:
```javascript
const nextConfig = {
  assetPrefix: process.env.CDN_URL,
}
```

### 4. Compression

```bash
npm install compression
```

Enable in Nginx:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

## Scaling Strategy

### Horizontal Scaling

```yaml
# Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: telemetry-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: telemetry
  template:
    metadata:
      labels:
        app: telemetry
    spec:
      containers:
      - name: app
        image: telemetry:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

### Load Balancing

```nginx
upstream telemetry_backend {
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;
}

server {
    location / {
        proxy_pass http://telemetry_backend;
    }
}
```

## Troubleshooting

### Common Issues

**Build fails:**
```bash
# Clear cache
rm -rf .next node_modules
pnpm install
pnpm build
```

**Port in use:**
```bash
# Find process
lsof -ti:3000 | xargs kill -9

# Use different port
PORT=3001 pnpm start
```

**Database connection:**
```bash
# Check connection
psql -U user -d telemetry -c "SELECT 1"

# Check environment variable
echo $DATABASE_URL
```

**High memory usage:**
```bash
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=4096 pnpm start
```

## Rollback Strategy

```bash
# Tag current version
git tag v1.0.0

# Deploy
./deploy.sh

# If issues, rollback
git checkout v0.9.0
./deploy.sh
```

## Backup Strategy

```bash
# Backup database
pg_dump -U user telemetry > backup_$(date +%Y%m%d).sql

# Restore
psql -U user -d telemetry < backup_20240115.sql

# Automated backups with cron
0 2 * * * /usr/local/bin/backup.sh
```

## Post-Deployment Checklist

- ✅ Application starts successfully
- ✅ Health check endpoint responds
- ✅ Database connection works
- ✅ HTTPS enabled
- ✅ Monitoring configured
- ✅ Logs being collected
- ✅ Backups scheduled
- ✅ DNS configured
- ✅ Rate limiting enabled
- ✅ Security headers set

## Support

For deployment issues:
1. Check logs: `pm2 logs` or `docker logs`
2. Review documentation
3. Check GitHub issues
4. Contact support

## Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
