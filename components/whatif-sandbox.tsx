"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { PlayIcon } from "lucide-react"
import type { WhatIfScenario } from "@/lib/types"
import type { SimulationParameters } from "@/lib/whatif/simulator"

interface WhatIfSandboxProps {
  strategyId: string
  baselineMetrics?: any
}

export function WhatIfSandbox({ strategyId, baselineMetrics }: WhatIfSandboxProps) {
  const [parameters, setParameters] = useState<SimulationParameters>({})
  const [scenario, setScenario] = useState<WhatIfScenario | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSimulate = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/whatif/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategy_id: strategyId,
          parameters,
        }),
      })
      const data = await response.json()
      setScenario(data.scenario)
    } catch (error) {
      console.error("[v0] Error simulating scenario:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDiff = (current: number, baseline: number) => {
    if (!baseline) return 0
    return ((current - baseline) / baseline) * 100
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Parameter Configuration</CardTitle>
          <CardDescription>Adjust parameters to simulate different trading scenarios</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPosition">Max Position Size</Label>
              <Input
                id="maxPosition"
                type="number"
                placeholder="e.g., 10000"
                value={parameters.max_position_size || ""}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    max_position_size: e.target.value ? Number.parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderTimeout">Order Timeout (ms)</Label>
              <Input
                id="orderTimeout"
                type="number"
                placeholder="e.g., 100"
                value={parameters.order_timeout_ms || ""}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    order_timeout_ms: e.target.value ? Number.parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minFillRate">Min Fill Rate (%)</Label>
              <Input
                id="minFillRate"
                type="number"
                placeholder="e.g., 75"
                min="0"
                max="100"
                value={parameters.min_fill_rate ? parameters.min_fill_rate * 100 : ""}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    min_fill_rate: e.target.value ? Number.parseFloat(e.target.value) / 100 : undefined,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLatency">Max Latency (ms)</Label>
              <Input
                id="maxLatency"
                type="number"
                placeholder="e.g., 50"
                value={parameters.max_latency_ms || ""}
                onChange={(e) =>
                  setParameters({
                    ...parameters,
                    max_latency_ms: e.target.value ? Number.parseInt(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          <Button onClick={handleSimulate} disabled={loading} className="w-full">
            <PlayIcon className="h-4 w-4 mr-2" />
            {loading ? "Simulating..." : "Run Simulation"}
          </Button>
        </CardContent>
      </Card>

      {scenario && (
        <Card>
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
            <CardDescription>{scenario.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Fill Rate</div>
                <div className="text-2xl font-bold">{(scenario.projected_metrics.fill_rate * 100).toFixed(1)}%</div>
                {baselineMetrics && (
                  <Badge variant="outline" className="text-xs">
                    {calculateDiff(scenario.projected_metrics.fill_rate, baselineMetrics.fill_rate).toFixed(1)}%
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Avg Latency</div>
                <div className="text-2xl font-bold">{scenario.projected_metrics.avg_latency_ms.toFixed(1)}ms</div>
                {baselineMetrics && (
                  <Badge variant="outline" className="text-xs">
                    {calculateDiff(scenario.projected_metrics.avg_latency_ms, baselineMetrics.avg_latency_ms).toFixed(
                      1,
                    )}
                    %
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Volume</div>
                <div className="text-2xl font-bold">{scenario.projected_metrics.total_volume.toLocaleString()}</div>
                {baselineMetrics && (
                  <Badge variant="outline" className="text-xs">
                    {calculateDiff(scenario.projected_metrics.total_volume, baselineMetrics.total_volume).toFixed(1)}%
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total PnL</div>
                <div
                  className={`text-2xl font-bold ${scenario.projected_metrics.total_pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                >
                  ${scenario.projected_metrics.total_pnl.toFixed(2)}
                </div>
                {baselineMetrics && (
                  <Badge variant="outline" className="text-xs">
                    {calculateDiff(scenario.projected_metrics.total_pnl, baselineMetrics.total_pnl).toFixed(1)}%
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Fills</div>
                <div className="text-2xl font-bold">{scenario.projected_metrics.total_fills}</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Total Cancels</div>
                <div className="text-2xl font-bold">{scenario.projected_metrics.total_cancels}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
