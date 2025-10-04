"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Strategy, StrategyMetrics } from "@/lib/types"

interface StrategyTableProps {
  strategies: Array<{
    strategy: Strategy
    metrics: StrategyMetrics
  }>
}

export function StrategyTable({ strategies }: StrategyTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800"
      case "paused":
        return "bg-amber-100 text-amber-800"
      case "stopped":
        return "bg-rose-100 text-rose-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Strategy</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Fill Rate</TableHead>
            <TableHead className="text-right">Avg Latency</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">PnL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {strategies.map(({ strategy, metrics }) => (
            <TableRow key={strategy.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{strategy.name}</div>
                  <div className="text-xs text-muted-foreground">{strategy.id}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(strategy.status)}>{strategy.status}</Badge>
              </TableCell>
              <TableCell className="text-right">{(metrics.fill_rate * 100).toFixed(1)}%</TableCell>
              <TableCell className="text-right">{metrics.avg_latency_ms.toFixed(1)}ms</TableCell>
              <TableCell className="text-right">{metrics.total_volume.toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <span className={metrics.total_pnl >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  ${metrics.total_pnl.toFixed(2)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
