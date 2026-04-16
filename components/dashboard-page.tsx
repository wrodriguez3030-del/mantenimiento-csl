"use client"

import { useMemo } from "react"
import { useAppStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard } from "@/components/kpi-card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Building2, Wrench, ClipboardList, Cog } from "lucide-react"
import type { PiezaIntervenida } from "@/lib/types"

function parsePiezas(json: string | undefined): PiezaIntervenida[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-"
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function DashboardPage() {
  const { db } = useAppStore()

  const stats = useMemo(() => {
    const countEq: Record<string, number> = {}
    const lastEq: Record<string, string> = {}
    const piezasCount: Record<string, { usos: number; reemplazos: number }> = {}

    db.reportes.forEach((r) => {
      // Equipment stats
      countEq[r.EquipoID] = (countEq[r.EquipoID] || 0) + 1
      if (!lastEq[r.EquipoID] || String(r.Fecha) > String(lastEq[r.EquipoID])) {
        lastEq[r.EquipoID] = r.Fecha
      }

      // Parts stats
      const piezas = parsePiezas(r.PiezasJSON)
      piezas.forEach((p) => {
        if (!piezasCount[p.pieza]) {
          piezasCount[p.pieza] = { usos: 0, reemplazos: 0 }
        }
        piezasCount[p.pieza].usos++
        if (p.reemplazo?.toLowerCase() === "si" || p.reemplazo === "Sí") {
          piezasCount[p.pieza].reemplazos++
        }
      })
    })

    const topEquipos = Object.entries(countEq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([equipoId, count]) => ({
        equipoId,
        count,
        lastDate: lastEq[equipoId],
      }))

    const topPiezas = Object.entries(piezasCount)
      .sort((a, b) => b[1].usos - a[1].usos)
      .slice(0, 8)
      .map(([pieza, stats]) => ({
        pieza,
        usos: stats.usos,
        reemplazos: stats.reemplazos,
      }))

    return { topEquipos, topPiezas }
  }, [db.reportes])

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Sucursales"
          value={db.sucursales.length}
          icon={Building2}
          variant="primary"
        />
        <KpiCard
          title="Equipos"
          value={db.equipos.length}
          icon={Wrench}
          variant="success"
        />
        <KpiCard
          title="Reportes"
          value={db.reportes.length}
          icon={ClipboardList}
          variant="warning"
        />
        <KpiCard
          title="Piezas catalogo"
          value={db.piezas.length}
          icon={Cog}
          variant="destructive"
        />
      </div>

      {/* Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Equipos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Equipos con mas mantenimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipo</TableHead>
                  <TableHead className="text-center">Reportes</TableHead>
                  <TableHead className="text-right">Ultima fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topEquipos.length > 0 ? (
                  stats.topEquipos.map((eq) => (
                    <TableRow key={eq.equipoId}>
                      <TableCell className="font-medium">
                        {eq.equipoId}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{eq.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(eq.lastDate)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin datos disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Piezas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top piezas mas usadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pieza</TableHead>
                  <TableHead className="text-center">Usos</TableHead>
                  <TableHead className="text-center">Reemplazos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topPiezas.length > 0 ? (
                  stats.topPiezas.map((p) => (
                    <TableRow key={p.pieza}>
                      <TableCell className="font-medium">{p.pieza}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{p.usos}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {p.reemplazos > 0 ? (
                          <Badge variant="outline" className="text-warning border-warning">
                            {p.reemplazos}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin datos disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
