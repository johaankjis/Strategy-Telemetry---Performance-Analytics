import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangleIcon, AlertCircleIcon, InfoIcon, XCircleIcon } from "lucide-react"
import type { Anomaly } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AnomalyAlertProps {
  anomaly: Anomaly
}

export function AnomalyAlert({ anomaly }: AnomalyAlertProps) {
  const getSeverityConfig = () => {
    switch (anomaly.severity) {
      case "critical":
        return {
          icon: <XCircleIcon className="h-4 w-4" />,
          className: "border-rose-600 bg-rose-50 text-rose-900",
        }
      case "high":
        return {
          icon: <AlertCircleIcon className="h-4 w-4" />,
          className: "border-orange-600 bg-orange-50 text-orange-900",
        }
      case "medium":
        return {
          icon: <AlertTriangleIcon className="h-4 w-4" />,
          className: "border-amber-600 bg-amber-50 text-amber-900",
        }
      case "low":
        return {
          icon: <InfoIcon className="h-4 w-4" />,
          className: "border-blue-600 bg-blue-50 text-blue-900",
        }
    }
  }

  const config = getSeverityConfig()

  return (
    <Alert className={cn(config.className)}>
      {config.icon}
      <AlertTitle className="font-semibold">
        {anomaly.anomaly_type.replace(/_/g, " ").toUpperCase()} - {anomaly.severity.toUpperCase()}
      </AlertTitle>
      <AlertDescription>
        <div className="text-sm mt-1">{anomaly.description}</div>
        <div className="text-xs mt-2 opacity-75">
          Strategy: {anomaly.strategy_id} • {new Date(anomaly.timestamp).toLocaleString()}
        </div>
      </AlertDescription>
    </Alert>
  )
}
