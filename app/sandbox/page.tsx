"use client"

import { useEffect, useState } from "react"
import { WhatIfSandbox } from "@/components/whatif-sandbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Strategy } from "@/lib/types"

export default function SandboxPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [selectedStrategy, setSelectedStrategy] = useState<string>("")
  const [baselineMetrics, setBaselineMetrics] = useState<any>(null)

  useEffect(() => {
    fetchStrategies()
  }, [])

  useEffect(() => {
    if (selectedStrategy) {
      fetchBaselineMetrics(selectedStrategy)
    }
  }, [selectedStrategy])

  const fetchStrategies = async () => {
    try {
      const response = await fetch("/api/metrics/overview")
      const data = await response.json()
      setStrategies(data.strategies.map((s: any) => s.strategy))
      if (data.strategies.length > 0) {
        setSelectedStrategy(data.strategies[0].strategy.id)
      }
    } catch (error) {
      console.error("[v0] Error fetching strategies:", error)
    }
  }

  const fetchBaselineMetrics = async (strategyId: string) => {
    try {
      const response = await fetch(`/api/metrics/strategy/${strategyId}`)
      const data = await response.json()
      setBaselineMetrics(data.performance)
    } catch (error) {
      console.error("[v0] Error fetching baseline metrics:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold">What-If Parameter Sandbox</h1>
          <p className="text-muted-foreground mt-1">Simulate and optimize trading strategy parameters</p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategies.map((strategy) => (
                  <SelectItem key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedStrategy && <WhatIfSandbox strategyId={selectedStrategy} baselineMetrics={baselineMetrics} />}
      </div>
    </div>
  )
}
