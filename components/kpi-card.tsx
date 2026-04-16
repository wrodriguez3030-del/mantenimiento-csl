"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface KpiCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  variant?: "primary" | "success" | "warning" | "destructive"
  description?: string
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  variant = "primary",
  description,
}: KpiCardProps) {
  const variantStyles = {
    primary: "border-t-primary",
    success: "border-t-success",
    warning: "border-t-warning",
    destructive: "border-t-destructive",
  }

  const iconStyles = {
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
  }

  return (
    <Card
      className={cn("border-t-2 bg-card", variantStyles[variant])}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              {typeof value === "number" ? value.toLocaleString("es-DO") : value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("p-2.5 rounded-lg", iconStyles[variant])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
