"use client"

import { useEffect, useState } from "react"
import { ActivityIcon, TrendingUpIcon, ZapIcon, AlertTriangleIcon } from "lucide-react"
import { MetricsCard } from "@/components/metrics-card"
import { AnomalyAlert } from "@/components/anomaly-alert"
import { StrategyTable } from "@/components/strategy-table"
import { LatencyChart } from "@/components/latency-chart"
import { VolumeChart } from "@/components/volume-chart"
import { PnLChart } from "@/components/pnl-chart"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Anomaly } from "@/lib/types"
import Link from "next/link"

export default function DashboardPage() {
  const [overviewData, setOverviewData] = useState<any>(null)
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)
  const [strategyData, setStrategyData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOverviewData()
    fetchAnomalies()
  }, [])

  useEffect(() => {
    if (selectedStrategy) {
      fetchStrategyData(selectedStrategy)
    }
  }, [selectedStrategy])

  const fetchOverviewData = async () => {
    try {
      const response = await fetch("/api/metrics/overview")
      const data = await response.json()
      setOverviewData(data)
      if (data.strategies.length > 0) {
        setSelectedStrategy(data.strategies[0].strategy.id)
      }
    } catch (error) {
      console.error("[v0] Error fetching overview:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnomalies = async () => {
    try {
      const response = await fetch("/api/anomalies?limit=5")
      const data = await response.json()
      setAnomalies(data.anomalies)
    } catch (error) {
      console.error("[v0] Error fetching anomalies:", error)
    }
  }

  const fetchStrategyData = async (strategyId: string) => {
    try {
      const response = await fetch(`/api/metrics/strategy/${strategyId}`)
      const data = await response.json()
      setStrategyData(data)
    } catch (error) {
      console.error("[v0] Error fetching strategy data:", error)
    }
  }

  const runAnomalyDetection = async () => {
    try {
      await fetch("/api/anomalies/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      fetchAnomalies()
    } catch (error) {
      console.error("[v0] Error running anomaly detection:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-muted-foreground">Loading telemetry data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Trading Telemetry Dashboard</h1>
              <p className="text-muted-foreground mt-1">Real-time performance monitoring and analytics</p>
            </div>
            <div className="flex gap-2">
              <Link href="/sandbox">
                <Button variant="outline">What-If Sandbox</Button>
              </Link>
              <Button onClick={runAnomalyDetection} variant="outline">
                <AlertTriangleIcon className="h-4 w-4 mr-2" />
                Run Anomaly Detection
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricsCard
            title="Fill Rate"
            value={`${((overviewData?.overall?.fillRate || 0) * 100).toFixed(1)}%`}
            icon={<ActivityIcon className="h-4 w-4" />}
            trend="up"
            change={5.2}
          />
          <MetricsCard
            title="Avg Latency"
            value={`${(overviewData?.overall?.avgLatency || 0).toFixed(1)}ms`}
            icon={<ZapIcon className="h-4 w-4" />}
            trend="down"
            change={-3.1}
          />
          <MetricsCard
            title="Total Volume"
            value={(overviewData?.overall?.totalVolume || 0).toLocaleString()}
            icon={<TrendingUpIcon className="h-4 w-4" />}
            trend="up"
            change={12.5}
          />
          <MetricsCard
            title="Total PnL"
            value={`$${(overviewData?.overall?.totalPnl || 0).toFixed(2)}`}
            icon={<TrendingUpIcon className="h-4 w-4" />}
            trend={overviewData?.overall?.totalPnl >= 0 ? "up" : "down"}
          />
        </div>

        {anomalies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Recent Anomalies</h2>
            <div className="space-y-3">
              {anomalies.slice(0, 3).map((anomaly) => (
                <AnomalyAlert key={anomaly.id} anomaly={anomaly} />
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Strategy Performance</h2>
          <StrategyTable strategies={overviewData?.strategies || []} />
        </div>

        {strategyData && (
          <Tabs defaultValue="latency" className="mb-8">
            <TabsList>
              <TabsTrigger value="latency">Latency</TabsTrigger>
              <TabsTrigger value="volume">Volume</TabsTrigger>
              <TabsTrigger value="pnl">PnL</TabsTrigger>
            </TabsList>
            <TabsContent value="latency" className="mt-6">
              <LatencyChart data={strategyData.timeSeries.latency} />
            </TabsContent>
            <TabsContent value="volume" className="mt-6">
              <VolumeChart data={strategyData.timeSeries.volume} />
            </TabsContent>
            <TabsContent value="pnl" className="mt-6">
              <PnLChart data={strategyData.timeSeries.pnl} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
