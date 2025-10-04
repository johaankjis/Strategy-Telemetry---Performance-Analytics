import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  trend?: "up" | "down" | "neutral"
}

export function MetricsCard({ title, value, change, changeLabel, icon, trend }: MetricsCardProps) {
  const getTrendColor = () => {
    if (!trend || trend === "neutral") return "text-muted-foreground"
    return trend === "up" ? "text-emerald-600" : "text-rose-600"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs mt-1", getTrendColor())}>
            {trend === "up" && <ArrowUpIcon className="h-3 w-3" />}
            {trend === "down" && <ArrowDownIcon className="h-3 w-3" />}
            <span>
              {change > 0 ? "+" : ""}
              {change}% {changeLabel || "from last period"}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
