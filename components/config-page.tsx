"use client"

import { useState } from "react"
import { useAppStore, normalizeApiUrl, apiJsonp } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Link2,
  Plug,
  RefreshCw,
  Building2,
  Wrench,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import type { Database } from "@/lib/types"

export function ConfigPage() {
  const {
    apiUrl,
    setApiUrl,
    isConnected,
    setIsConnected,
    setDb,
    showToast,
    setIsLoading,
    setLoadingMessage,
  } = useAppStore()

  const [urlInput, setUrlInput] = useState(apiUrl)
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >(isConnected ? "success" : "idle")
  const [statusMessage, setStatusMessage] = useState("")

  const handleSaveUrl = () => {
    const normalized = normalizeApiUrl(urlInput)
    setUrlInput(normalized)
    setApiUrl(normalized)

    if (!normalized) {
      setConnectionStatus("error")
      setStatusMessage("URL vacia")
      showToast("Pega la URL de Apps Script", "error")
      return
    }

    setConnectionStatus("idle")
    setStatusMessage("URL guardada")
    showToast("URL guardada correctamente", "success")
  }

  const handleTestConnection = async () => {
    const normalized = normalizeApiUrl(urlInput)
    if (!normalized) {
      showToast("Guarda la URL primero", "error")
      return
    }

    setConnectionStatus("idle")
    setStatusMessage("Probando conexion...")

    try {
      const result = await apiJsonp(normalized, { action: "health" })
      if (result && result.ok) {
        setConnectionStatus("success")
        setStatusMessage(`Conectado v${(result as { version?: string }).version || ""}`)
        setIsConnected(true)
        showToast("Conexion exitosa", "success")
      } else {
        throw new Error("Respuesta invalida")
      }
    } catch (error) {
      setConnectionStatus("error")
      setStatusMessage(error instanceof Error ? error.message : "Error desconocido")
      setIsConnected(false)
      showToast("Error de conexion", "error")
    }
  }

  const handleLoadData = async () => {
    const normalized = normalizeApiUrl(urlInput || apiUrl)
    if (!normalized) {
      showToast("Guarda la URL primero", "error")
      return
    }

    setIsLoading(true)
    setLoadingMessage("Cargando datos del sistema...")

    try {
      const result = await apiJsonp(normalized, { action: "getAllData" })
      if (result && result.ok && result.data) {
        setDb(result.data as Database)
        setIsConnected(true)
        setConnectionStatus("success")
        const db = result.data as Database
        setStatusMessage(`Datos cargados (${db.reportes?.length || 0} reportes)`)
        showToast("Datos cargados correctamente", "success")
      } else {
        throw new Error((result as { error?: string })?.error || "Error del servidor")
      }
    } catch (error) {
      setConnectionStatus("error")
      setStatusMessage(error instanceof Error ? error.message : "Error desconocido")
      showToast(error instanceof Error ? error.message : "Error al cargar datos", "error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-5 w-5 text-primary" />
            Conexion API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="apiUrl">URL Apps Script</Label>
              <Input
                id="apiUrl"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <Button onClick={handleSaveUrl} className="gap-2">
                <Link2 className="h-4 w-4" />
                Guardar URL
              </Button>
              <Button variant="outline" onClick={handleTestConnection} className="gap-2">
                <Plug className="h-4 w-4" />
                Probar
              </Button>
              <Button variant="secondary" onClick={handleLoadData} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Cargar datos
              </Button>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`flex items-center gap-2 text-sm font-medium ${
                connectionStatus === "success"
                  ? "text-success"
                  : connectionStatus === "error"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {connectionStatus === "success" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : connectionStatus === "error" ? (
                <XCircle className="h-4 w-4" />
              ) : null}
              {statusMessage}
            </div>
          )}

          {connectionStatus === "error" && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-destructive">Verifica lo siguiente:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>El script debe estar <strong>Desplegado como aplicacion web</strong></li>
                    <li>En &quot;Quien tiene acceso&quot; selecciona <strong>Cualquier persona</strong></li>
                    <li>Copia la URL que termina en <code className="bg-secondary px-1 rounded">/exec</code></li>
                    <li>Si hiciste cambios, debes crear una <strong>Nueva implementacion</strong></li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-warning" />
            Como configurar Google Apps Script
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
            <li>Crea una nueva <strong>Hoja de Calculo de Google</strong></li>
            <li>Ve a <strong>Extensiones &gt; Apps Script</strong></li>
            <li>Borra el contenido y pega el codigo del archivo <code className="bg-secondary px-1 rounded">scripts/google-apps-script.js</code></li>
            <li>Guarda con <strong>Ctrl+S</strong></li>
            <li>Haz clic en <strong>Implementar &gt; Nueva implementacion</strong></li>
            <li>Selecciona <strong>Aplicacion web</strong></li>
            <li>En &quot;Quien tiene acceso&quot; elige <strong>Cualquier persona</strong></li>
            <li>Haz clic en <strong>Implementar</strong> y autoriza los permisos</li>
            <li>Copia la URL generada y pegala arriba</li>
          </ol>
          <div className="flex items-center gap-2 pt-2">
            <a 
              href="https://script.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Abrir Google Apps Script <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Acerca del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 text-center">
              <div className="p-3 rounded-full bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">3 Sucursales</p>
                <p className="text-xs text-muted-foreground">
                  Rafael Vidal, Los Jardines, Villa Olga
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 text-center">
              <div className="p-3 rounded-full bg-success/10">
                <Wrench className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-semibold">Candela GentleYAG</p>
                <p className="text-xs text-muted-foreground">
                  Equipos laser registrados
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/50 text-center">
              <div className="p-3 rounded-full bg-warning/10">
                <BarChart3 className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="font-semibold">Mantenimientos</p>
                <p className="text-xs text-muted-foreground">
                  Control tecnico completo
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
