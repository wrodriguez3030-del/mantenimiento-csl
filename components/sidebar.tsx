"use client"

import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"
import type { TabId } from "@/lib/types"
import {
  Settings,
  LayoutDashboard,
  Building2,
  Wrench,
  Users,
  FileText,
  ClipboardList,
  Cog,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavItem {
  id: TabId
  label: string
  icon: React.ReactNode
  section?: string
}

const navItems: NavItem[] = [
  {
    id: "panel",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    section: "Sistema",
  },
  {
    id: "sucursales",
    label: "Sucursales",
    icon: <Building2 className="h-4 w-4" />,
    section: "Gestion",
  },
  { id: "equipos", label: "Equipos", icon: <Wrench className="h-4 w-4" /> },
  { id: "tecnicos", label: "Tecnicos", icon: <Users className="h-4 w-4" /> },
  {
    id: "reporte",
    label: "Nuevo Reporte",
    icon: <FileText className="h-4 w-4" />,
    section: "Reportes",
  },
  {
    id: "reportes",
    label: "Lista de Reportes",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    id: "errores",
    label: "Errores y Piezas",
    icon: <Cog className="h-4 w-4" />,
    section: "Catalogo",
  },
  {
    id: "config",
    label: "Configuracion",
    icon: <Settings className="h-4 w-4" />,
    section: "Sistema",
  },
]

export function Sidebar() {
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen } = useAppStore()

  const handleNavClick = (id: TabId) => {
    setActiveTab(id)
    setSidebarOpen(false)
  }

  let currentSection = ""

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-60 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                CSL
              </span>
            </div>
            <div>
              <h1 className="font-semibold text-sidebar-foreground text-sm">
                Cibao Spa Laser
              </h1>
              <p className="text-xs text-muted-foreground">Mantenimientos</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => {
            const showSection = item.section && item.section !== currentSection
            if (item.section) currentSection = item.section

            return (
              <div key={item.id}>
                {showSection && (
                  <div className="px-4 py-2 mt-4 first:mt-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {item.section}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors relative",
                    activeTab === item.id
                      ? "text-primary bg-sidebar-accent"
                      : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  {activeTab === item.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
                  )}
                  {item.icon}
                  {item.label}
                </button>
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground/50">
            v21.0 - Cibao Spa Laser
          </p>
        </div>
      </aside>
    </>
  )
}
