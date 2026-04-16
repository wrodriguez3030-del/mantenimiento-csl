"use client"

import { useAppStore } from "@/lib/store"
import { Menu, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TabId } from "@/lib/types"

const pageTitles: Record<TabId, string> = {
  config: "Configuracion",
  panel: "Dashboard",
  sucursales: "Sucursales",
  equipos: "Equipos",
  tecnicos: "Tecnicos",
  reporte: "Nuevo Reporte",
  reportes: "Lista de Reportes",
  errores: "Errores y Piezas",
}

const pageDescriptions: Record<TabId, string> = {
  config: "Conecta el sistema con Google Apps Script",
  panel: "Estadisticas y metricas del sistema",
  sucursales: "Gestion de sedes activas e inactivas",
  equipos: "Registro y control tecnico de equipos laser",
  tecnicos: "Gestion de personal tecnico",
  reporte: "Registra intervenciones y mantenimientos tecnicos",
  reportes: "Historial tecnico de todos los mantenimientos",
  errores: "Catalogo tecnico de componentes y fallas",
}

interface HeaderProps {
  onRefresh?: () => void
}

export function Header({ onRefresh }: HeaderProps) {
  const { activeTab, setSidebarOpen, isLoading } = useAppStore()

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center gap-4 px-4 py-3 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>

        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground">
            {pageTitles[activeTab]}
          </h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {pageDescriptions[activeTab]}
          </p>
        </div>

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
        )}
      </div>
    </header>
  )
}
