"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  Database,
  Sucursal,
  Equipo,
  Tecnico,
  Reporte,
  PiezaCatalogo,
  TabId,
  PiezaIntervenida,
} from "./types"

interface AppState {
  // API Connection
  apiUrl: string
  setApiUrl: (url: string) => void
  isConnected: boolean
  setIsConnected: (connected: boolean) => void

  // Loading state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  loadingMessage: string
  setLoadingMessage: (message: string) => void

  // Navigation
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Data
  db: Database
  setDb: (db: Database) => void

  // Report form state
  piezasReporte: PiezaIntervenida[]
  setPiezasReporte: (piezas: PiezaIntervenida[]) => void
  addPiezaReporte: (pieza: PiezaIntervenida) => void
  removePiezaReporte: (index: number) => void
  clearPiezasReporte: () => void

  // Edit states
  editingSucursal: Sucursal | null
  setEditingSucursal: (sucursal: Sucursal | null) => void
  editingEquipo: Equipo | null
  setEditingEquipo: (equipo: Equipo | null) => void
  editingTecnico: Tecnico | null
  setEditingTecnico: (tecnico: Tecnico | null) => void
  editingReporte: Reporte | null
  setEditingReporte: (reporte: Reporte | null) => void

  // Toast
  toast: { message: string; type: "success" | "error" | "info" } | null
  showToast: (message: string, type?: "success" | "error" | "info") => void
  hideToast: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // API Connection
      apiUrl: "",
      setApiUrl: (url) => set({ apiUrl: url }),
      isConnected: false,
      setIsConnected: (connected) => set({ isConnected: connected }),

      // Loading state
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
      loadingMessage: "Cargando datos...",
      setLoadingMessage: (message) => set({ loadingMessage: message }),

      // Navigation
      activeTab: "config",
      setActiveTab: (tab) => set({ activeTab: tab }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Data
      db: {
        sucursales: [],
        equipos: [],
        reportes: [],
        piezas: [],
        tecnicos: [],
      },
      setDb: (db) => set({ db }),

      // Report form state
      piezasReporte: [],
      setPiezasReporte: (piezas) => set({ piezasReporte: piezas }),
      addPiezaReporte: (pieza) =>
        set((state) => ({ piezasReporte: [...state.piezasReporte, pieza] })),
      removePiezaReporte: (index) =>
        set((state) => ({
          piezasReporte: state.piezasReporte.filter((_, i) => i !== index),
        })),
      clearPiezasReporte: () => set({ piezasReporte: [] }),

      // Edit states
      editingSucursal: null,
      setEditingSucursal: (sucursal) => set({ editingSucursal: sucursal }),
      editingEquipo: null,
      setEditingEquipo: (equipo) => set({ editingEquipo: equipo }),
      editingTecnico: null,
      setEditingTecnico: (tecnico) => set({ editingTecnico: tecnico }),
      editingReporte: null,
      setEditingReporte: (reporte) => set({ editingReporte: reporte }),

      // Toast
      toast: null,
      showToast: (message, type = "info") => {
        set({ toast: { message, type } })
        setTimeout(() => set({ toast: null }), 3000)
      },
      hideToast: () => set({ toast: null }),
    }),
    {
      name: "csl-maintenance-storage",
      partialize: (state) => ({
        apiUrl: state.apiUrl,
        activeTab: state.activeTab,
      }),
    }
  )
)

// Helper to normalize API URL
export function normalizeApiUrl(url: string): string {
  let normalized = (url || "").trim()
  if (!normalized) return ""
  normalized = normalized.replace(/\/+$/, "")
  if (normalized.includes("/dev"))
    normalized = normalized.replace("/dev", "/exec")
  if (!normalized.endsWith("/exec") && /\/macros\/s\//.test(normalized))
    normalized += "/exec"
  return normalized
}

// API helper - tries fetch first, then JSONP fallback
export async function apiJsonp(
  apiUrl: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  if (!apiUrl) throw new Error("Guarda la URL de Apps Script primero")

  // Try fetch with POST first (works if CORS is properly configured)
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(params),
    })
    
    if (response.ok) {
      const text = await response.text()
      try {
        return JSON.parse(text)
      } catch {
        // If response is not JSON, continue to JSONP
      }
    }
  } catch {
    // Fetch failed, try JSONP
    console.log("[v0] Fetch failed, trying JSONP...")
  }

  // Fallback to JSONP
  return new Promise((resolve, reject) => {
    const cb = `__csl_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    const script = document.createElement("script")

    const cleanup = () => {
      try {
        delete (window as Record<string, unknown>)[cb]
      } catch {
        // ignore
      }
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    const timer = setTimeout(() => {
      cleanup()
      reject(new Error("Timeout - Verifica que el script este desplegado correctamente"))
    }, 20000)

    ;(window as Record<string, unknown>)[cb] = (data: Record<string, unknown>) => {
      clearTimeout(timer)
      cleanup()
      resolve(data)
    }

    const q = new URLSearchParams({ ...params, callback: cb }).toString()
    script.src = `${apiUrl}?${q}`
    script.onerror = () => {
      clearTimeout(timer)
      cleanup()
      reject(new Error("Error de conexion - Verifica la URL y permisos del script"))
    }
    document.body.appendChild(script)
  })
}
