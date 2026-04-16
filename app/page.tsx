"use client"

import { useCallback } from "react"
import { useAppStore, apiJsonp, normalizeApiUrl } from "@/lib/store"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { LoadingOverlay } from "@/components/loading-overlay"
import { ToastNotification } from "@/components/toast-notification"
import { ConfigPage } from "@/components/config-page"
import { DashboardPage } from "@/components/dashboard-page"
import { SucursalesPage } from "@/components/sucursales-page"
import { EquiposPage } from "@/components/equipos-page"
import { TecnicosPage } from "@/components/tecnicos-page"
import { NuevoReportePage } from "@/components/nuevo-reporte-page"
import { ReportesPage } from "@/components/reportes-page"
import { CatalogoPage } from "@/components/catalogo-page"
import type { Database } from "@/lib/types"

export default function HomePage() {
  const {
    activeTab,
    apiUrl,
    setDb,
    setIsLoading,
    setLoadingMessage,
    showToast,
    setIsConnected,
  } = useAppStore()

  const handleRefresh = useCallback(async () => {
    const normalized = normalizeApiUrl(apiUrl)
    if (!normalized) {
      showToast("Configura la URL de la API primero", "error")
      return
    }

    setIsLoading(true)
    setLoadingMessage("Actualizando datos...")

    try {
      const result = await apiJsonp(normalized, { action: "getAllData" })
      if (result && result.ok && result.data) {
        setDb(result.data as Database)
        setIsConnected(true)
        showToast("Datos actualizados", "success")
      } else {
        throw new Error(
          (result as { error?: string })?.error || "Error del servidor"
        )
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Error al actualizar",
        "error"
      )
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl, setDb, setIsLoading, setLoadingMessage, showToast, setIsConnected])

  const renderPage = () => {
    switch (activeTab) {
      case "config":
        return <ConfigPage />
      case "panel":
        return <DashboardPage />
      case "sucursales":
        return <SucursalesPage />
      case "equipos":
        return <EquiposPage />
      case "tecnicos":
        return <TecnicosPage />
      case "reporte":
        return <NuevoReportePage />
      case "reportes":
        return <ReportesPage />
      case "errores":
        return <CatalogoPage />
      default:
        return <ConfigPage />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <LoadingOverlay />
      <ToastNotification />

      <div className="lg:pl-60">
        <Header onRefresh={activeTab !== "config" ? handleRefresh : undefined} />

        <main className="p-4 lg:p-6 max-w-7xl mx-auto">{renderPage()}</main>
      </div>
    </div>
  )
}
