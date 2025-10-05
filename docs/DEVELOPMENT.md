# Development Guide

Complete guide for setting up, developing, and contributing to the Strategy Telemetry & Performance Analytics platform.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Prerequisites

### Required Software

- **Node.js**: Version 18.x or higher
- **Package Manager**: pnpm (recommended) or npm
- **Git**: For version control
- **Code Editor**: VS Code recommended with the following extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense

### Installation

#### Node.js
```bash
# Using nvm (recommended)
nvm install 18
nvm use 18

# Or download from https://nodejs.org/
```

#### pnpm
```bash
npm install -g pnpm
```

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/johaankjis/Strategy-Telemetry---Performance-Analytics.git
cd Strategy-Telemetry---Performance-Analytics
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

This will install all dependencies listed in `package.json`.

### 3. Verify Installation

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the dashboard with mock data.

### 4. Configure VS Code (Optional)

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Development Workflow

### Daily Development

1. **Start Development Server**
   ```bash
   pnpm dev
   ```
   - Hot reload enabled
   - Available at `http://localhost:3000`
   - API routes at `http://localhost:3000/api/*`

2. **Make Changes**
   - Edit files in `app/`, `components/`, or `lib/`
   - Changes auto-reload in browser
   - Check console for errors

3. **Lint Code**
   ```bash
   pnpm lint
   ```
   - Runs ESLint
   - Auto-fix with `pnpm lint --fix`

4. **Build for Production**
   ```bash
   pnpm build
   ```
   - Creates optimized production build
   - Output in `.next/` directory

5. **Test Production Build**
   ```bash
   pnpm start
   ```
   - Runs production server
   - Test at `http://localhost:3000`

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build/tooling changes

Examples:
```bash
git commit -m "feat: add latency spike detection"
git commit -m "fix: correct fill rate calculation"
git commit -m "docs: update API documentation"
```

## Project Structure

### Key Directories

```
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── sandbox/           # Sandbox page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── docs/                 # Documentation
├── lib/                  # Business logic
│   ├── anomaly/          # Anomaly detection
│   ├── etl/              # ETL utilities
│   ├── metrics/          # Metrics calculation
│   └── whatif/           # What-if simulation
├── public/               # Static files
└── styles/               # Additional styles
```

### Important Files

- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `next.config.mjs`: Next.js configuration
- `tailwind.config.ts`: Tailwind CSS configuration
- `components.json`: shadcn/ui configuration

## Code Standards

### TypeScript

**Always use strict typing:**
```typescript
// ✅ Good
function calculateMetrics(fills: Fill[]): PerformanceMetrics {
  // ...
}

// ❌ Bad
function calculateMetrics(fills: any): any {
  // ...
}
```

**Use interfaces for data models:**
```typescript
// ✅ Good
interface Strategy {
  id: string
  name: string
  status: "active" | "paused" | "stopped"
}

// ❌ Bad
const strategy = {
  id: "123",
  name: "Strategy",
  status: "active"
}
```

### React Components

**Use functional components with TypeScript:**
```typescript
// ✅ Good
interface MetricsCardProps {
  title: string
  value: string
  icon: React.ReactNode
}

export function MetricsCard({ title, value, icon }: MetricsCardProps) {
  return (
    <Card>
      {/* ... */}
    </Card>
  )
}
```

**Use client components only when needed:**
```typescript
// For components with interactivity
"use client"

import { useState } from "react"

export function InteractiveComponent() {
  const [state, setState] = useState(...)
  // ...
}
```

### File Naming

- **Components**: PascalCase (e.g., `MetricsCard.tsx`)
- **Utilities**: kebab-case (e.g., `data-store.ts`)
- **API Routes**: kebab-case (e.g., `route.ts`)
- **Types**: kebab-case (e.g., `types.ts`)

### Code Organization

**API Routes:**
```typescript
// app/api/resource/route.ts
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    // Logic here
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
```

**Business Logic:**
```typescript
// lib/module/class.ts
export class Calculator {
  static calculate(input: Input): Output {
    // Logic here
    return output
  }
}
```

### Styling

**Use Tailwind CSS classes:**
```tsx
<div className="flex items-center justify-between p-4 border rounded-lg">
  {/* ... */}
</div>
```

**Use shadcn/ui components:**
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

<Card>
  <CardHeader>Title</CardHeader>
  <CardContent>
    <Button>Click me</Button>
  </CardContent>
</Card>
```

### Error Handling

**Always handle errors:**
```typescript
try {
  const data = await fetchData()
  return NextResponse.json({ data })
} catch (error) {
  console.error("[Context] Error message:", error)
  return NextResponse.json(
    { error: "User-friendly error message" },
    { status: 500 }
  )
}
```

## Testing

### Unit Tests (Recommended Setup)

Install testing dependencies:
```bash
pnpm add -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
```

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
  },
})
```

Add test script to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

**Example Test:**
```typescript
// lib/metrics/__tests__/calculator.test.ts
import { describe, it, expect } from 'vitest'
import { MetricsCalculator } from '../calculator'

describe('MetricsCalculator', () => {
  it('calculates fill rate correctly', () => {
    const fills = [/* mock fills */]
    const cancels = [/* mock cancels */]
    const rejects = [/* mock rejects */]
    
    const metrics = MetricsCalculator.calculatePerformanceMetrics(
      fills, cancels, rejects, []
    )
    
    expect(metrics.fillRate).toBeCloseTo(0.85)
  })
})
```

### Integration Tests

Test API endpoints:
```typescript
// app/api/__tests__/ingest.test.ts
import { describe, it, expect } from 'vitest'

describe('POST /api/ingest/fills', () => {
  it('accepts valid fill data', async () => {
    const response = await fetch('http://localhost:3000/api/ingest/fills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        strategy_id: 'test',
        symbol: 'BTC-USD',
        side: 'buy',
        quantity: 1,
        price: 45000,
        venue: 'test',
        latency_ms: 25,
        order_id: 'test-order'
      })
    })
    
    expect(response.status).toBe(201)
  })
})
```

### E2E Tests (Recommended Setup)

Install Playwright:
```bash
pnpm create playwright
```

**Example E2E Test:**
```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test'

test('dashboard loads and displays metrics', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  await expect(page.locator('h1')).toContainText('Trading Telemetry Dashboard')
  await expect(page.locator('[data-testid="fill-rate"]')).toBeVisible()
})
```

## Debugging

### Browser DevTools

1. Open Chrome DevTools (F12)
2. Check Console for errors
3. Use Network tab for API requests
4. Use React DevTools extension

### VS Code Debugging

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Logging

Add debug logs:
```typescript
console.log('[Component] State:', state)
console.error('[API] Error:', error)
console.warn('[Metrics] Unusual value:', value)
```

## Common Tasks

### Adding a New API Endpoint

1. Create route file:
   ```bash
   mkdir -p app/api/resource
   touch app/api/resource/route.ts
   ```

2. Implement handler:
   ```typescript
   import { NextResponse } from "next/server"
   
   export async function GET(request: Request) {
     // Implementation
     return NextResponse.json({ data })
   }
   ```

3. Test endpoint:
   ```bash
   curl http://localhost:3000/api/resource
   ```

### Adding a New Component

1. Create component file:
   ```bash
   touch components/my-component.tsx
   ```

2. Implement component:
   ```typescript
   interface MyComponentProps {
     prop: string
   }
   
   export function MyComponent({ prop }: MyComponentProps) {
     return <div>{prop}</div>
   }
   ```

3. Export and use:
   ```typescript
   import { MyComponent } from "@/components/my-component"
   
   <MyComponent prop="value" />
   ```

### Adding a shadcn/ui Component

```bash
pnpm dlx shadcn-ui@latest add dialog
```

This adds the Dialog component to `components/ui/`.

### Updating Dependencies

```bash
# Update all dependencies
pnpm update

# Update specific package
pnpm update react react-dom

# Check for outdated packages
pnpm outdated
```

### Database Integration (Future)

To replace in-memory storage:

1. Install database client:
   ```bash
   pnpm add pg
   pnpm add -D @types/pg
   ```

2. Update `data-store.ts`:
   ```typescript
   import { Pool } from 'pg'
   
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL
   })
   
   class TelemetryDataStore {
     async getFills(strategyId?: string) {
       const result = await pool.query(
         'SELECT * FROM fills WHERE strategy_id = $1',
         [strategyId]
       )
       return result.rows
     }
   }
   ```

3. Keep interface contracts the same for compatibility

## Troubleshooting

### Common Issues

**Port 3000 already in use:**
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm dev
```

**Module not found:**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
```

**Type errors:**
```bash
# Check TypeScript
pnpm tsc --noEmit

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

**Build errors:**
```bash
# Clear Next.js cache
rm -rf .next
pnpm build
```

### Getting Help

1. Check existing issues on GitHub
2. Review documentation in `/docs`
3. Check Next.js documentation: https://nextjs.org/docs
4. Check shadcn/ui documentation: https://ui.shadcn.com
5. Open new issue with details

## Contributing

### Before Submitting PR

1. ✅ Code follows style guidelines
2. ✅ All tests pass
3. ✅ Linting passes
4. ✅ Build succeeds
5. ✅ Documentation updated
6. ✅ Commit messages follow convention

### PR Process

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Update documentation
6. Submit PR with description
7. Address review feedback

### Code Review Guidelines

Reviewers will check:
- Code quality and style
- Type safety
- Error handling
- Performance implications
- Security considerations
- Documentation completeness

## Performance Tips

### Optimizations

1. **Use React.memo for expensive components:**
   ```typescript
   export const ExpensiveComponent = React.memo(({ data }) => {
     // ...
   })
   ```

2. **Lazy load heavy components:**
   ```typescript
   const HeavyChart = dynamic(() => import('./heavy-chart'), {
     ssr: false
   })
   ```

3. **Debounce API calls:**
   ```typescript
   import { useDebounce } from '@/hooks/use-debounce'
   
   const debouncedValue = useDebounce(inputValue, 300)
   ```

4. **Use Next.js Image component:**
   ```typescript
   import Image from 'next/image'
   
   <Image src="/logo.png" width={100} height={100} alt="Logo" />
   ```

## Security Best Practices

1. Never commit secrets or API keys
2. Validate all user inputs
3. Sanitize data before display
4. Use environment variables for config
5. Keep dependencies updated
6. Follow OWASP guidelines

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## License

This project is available under the MIT License.
