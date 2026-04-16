"use client"

import { useState, useEffect } from "react"
import { useAppStore, apiJsonp, normalizeApiUrl } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Power, PowerOff, Save, X } from "lucide-react"
import type { Equipo, Database } from "@/lib/types"

const emptyEquipo: Equipo = {
  EquipoID: "",
  Sucursal: "",
  Empresa: "CIBAO SPA LASER, CSL, S.R.L.",
  Domicilio: "",
  Modelo: "",
  Serie: "",
  Numero: "",
  P_Cabeza: 0,
  P_Totales: 0,
  Max_Cabeza: 50000,
  Estado: "Activo",
  Observaciones: "",
}

export function EquiposPage() {
  const {
    db,
    setDb,
    apiUrl,
    showToast,
    setIsLoading,
    setLoadingMessage,
    editingEquipo,
    setEditingEquipo,
  } = useAppStore()

  const [formData, setFormData] = useState<Equipo>(emptyEquipo)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<Equipo | null>(null)

  const activeSucursales = db.sucursales.filter(
    (s) => s.Estado?.toLowerCase() !== "inactiva"
  )

  useEffect(() => {
    if (editingEquipo) {
      setFormData(editingEquipo)
      setIsFormOpen(true)
    }
  }, [editingEquipo])

  useEffect(() => {
    if (activeSucursales.length > 0 && !formData.Sucursal) {
      setFormData((prev) => ({ ...prev, Sucursal: activeSucursales[0].Nombre }))
    }
  }, [activeSucursales, formData.Sucursal])

  const handleSubmit = async () => {
    if (!formData.EquipoID) {
      showToast("El ID del equipo es obligatorio", "error")
      return
    }

    const normalized = normalizeApiUrl(apiUrl)
    if (!normalized) {
      showToast("Configura la URL de la API primero", "error")
      return
    }

    setIsLoading(true)
    setLoadingMessage("Guardando equipo...")

    try {
      await apiJsonp(normalized, {
        action: "saveEquipo",
        equipoId: formData.EquipoID,
        sucursal: formData.Sucursal,
        empresa: formData.Empresa,
        domicilio: formData.Domicilio || "",
        modelo: formData.Modelo,
        serie: formData.Serie || "",
        numero: formData.Numero || "",
        pcabeza: String(formData.P_Cabeza || 0),
        ptotales: String(formData.P_Totales || 0),
        maxCabeza: String(formData.Max_Cabeza || 50000),
        estado: formData.Estado,
        observaciones: formData.Observaciones || "",
      })

      const result = await apiJsonp(normalized, { action: "getAllData" })
      if (result && result.ok && result.data) {
        setDb(result.data as Database)
      }

      setFormData(emptyEquipo)
      setEditingEquipo(null)
      setIsFormOpen(false)
      showToast("Equipo guardado correctamente", "success")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Error al guardar",
        "error"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (equipo: Equipo) => {
    const normalized = normalizeApiUrl(apiUrl)
    if (!normalized) return

    setIsLoading(true)
    setLoadingMessage("Actualizando estado...")

    try {
      const newStatus = equipo.Estado === "Activo" ? "Inactivo" : "Activo"
      await apiJsonp(normalized, {
        action: "setEquipoEstado",
        rowNum: equipo._rowNum || "",
        equipoId: equipo.EquipoID,
        estado: newStatus,
      })

      const result = await apiJsonp(normalized, { action: "getAllData" })
      if (result && result.ok && result.data) {
        setDb(result.data as Database)
      }

      showToast("Estado actualizado", "success")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Error al actualizar",
        "error"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog) return

    setIsLoading(true)
    setLoadingMessage("Eliminando equipo...")

    const normalized = normalizeApiUrl(apiUrl)
    
    try {
      // Si hay API configurada, intentar eliminar en el servidor
      if (normalized) {
        try {
          await apiJsonp(normalized, {
            action: "deleteEquipo",
            rowNum: deleteDialog._rowNum || "",
            equipoId: deleteDialog.EquipoID,
          })

          const result = await apiJsonp(normalized, { action: "getAllData" })
          if (result && result.ok && result.data) {
            setDb(result.data as Database)
            setDeleteDialog(null)
            showToast("Equipo eliminado", "success")
            return
          }
        } catch {
          // Si falla la API, eliminar localmente
          console.log("[v0] API delete failed, falling back to local delete")
        }
      }

      // Eliminar localmente
      const updatedEquipos = db.equipos.filter(
        (eq) => eq.EquipoID !== deleteDialog.EquipoID
      )
      setDb({ ...db, equipos: updatedEquipos })
      setDeleteDialog(null)
      showToast("Equipo eliminado localmente", "success")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Error al eliminar",
        "error"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (equipo: Equipo) => {
    setFormData(equipo)
    setEditingEquipo(equipo)
    setIsFormOpen(true)
  }

  const handleCancel = () => {
    setFormData(emptyEquipo)
    setEditingEquipo(null)
    setIsFormOpen(false)
  }

  const getPulsePercentage = (equipo: Equipo) => {
    const current = Number(String(equipo.P_Cabeza || 0).replace(/,/g, ""))
    const max = Number(String(equipo.Max_Cabeza || 50000).replace(/,/g, ""))
    return Math.min(100, Math.round((current / max) * 100))
  }

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {editingEquipo ? `Editar: ${editingEquipo.EquipoID}` : "Nuevo Equipo"}
          </CardTitle>
          {!isFormOpen && (
            <Button size="sm" onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          )}
        </CardHeader>
        {isFormOpen && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="equipoId">ID Equipo</Label>
                <Input
                  id="equipoId"
                  placeholder="CSL-RV01"
                  value={formData.EquipoID}
                  onChange={(e) =>
                    setFormData({ ...formData, EquipoID: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sucursal">Sucursal</Label>
                <Select
                  value={formData.Sucursal}
                  onValueChange={(value) =>
                    setFormData({ ...formData, Sucursal: value })
                  }
                >
                  <SelectTrigger id="sucursal">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSucursales.map((s) => (
                      <SelectItem key={s.Codigo} value={s.Nombre}>
                        {s.Nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  value={formData.Empresa}
                  onChange={(e) =>
                    setFormData({ ...formData, Empresa: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domicilio">Domicilio</Label>
                <Input
                  id="domicilio"
                  value={formData.Domicilio || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Domicilio: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  placeholder="Candela GentleYAG"
                  value={formData.Modelo}
                  onChange={(e) =>
                    setFormData({ ...formData, Modelo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serie">Serie</Label>
                <Input
                  id="serie"
                  value={formData.Serie || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Serie: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Numero</Label>
                <Input
                  id="numero"
                  value={formData.Numero || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Numero: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.Estado}
                  onValueChange={(value: "Activo" | "Inactivo") =>
                    setFormData({ ...formData, Estado: value })
                  }
                >
                  <SelectTrigger id="estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pcabeza">Pulsos cabeza</Label>
                <Input
                  id="pcabeza"
                  type="number"
                  value={formData.P_Cabeza || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      P_Cabeza: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ptotales">Pulsos totales</Label>
                <Input
                  id="ptotales"
                  type="number"
                  value={formData.P_Totales || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      P_Totales: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxcabeza">Max. cabeza</Label>
                <Input
                  id="maxcabeza"
                  type="number"
                  value={formData.Max_Cabeza || 50000}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      Max_Cabeza: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input
                  id="observaciones"
                  value={formData.Observaciones || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Observaciones: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} className="gap-2">
                <Save className="h-4 w-4" />
                Guardar
              </Button>
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de equipos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="hidden md:table-cell">Serie</TableHead>
                  <TableHead>Pulsos cabeza</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Pulsos totales
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {db.equipos.length > 0 ? (
                  db.equipos.map((eq) => {
                    const pct = getPulsePercentage(eq)
                    return (
                      <TableRow key={eq.EquipoID}>
                        <TableCell className="font-medium">
                          {eq.EquipoID}
                        </TableCell>
                        <TableCell>{eq.Sucursal}</TableCell>
                        <TableCell>{eq.Modelo}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {eq.Serie || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm tabular-nums">
                              {Number(
                                String(eq.P_Cabeza || 0).replace(/,/g, "")
                              ).toLocaleString()}
                            </span>
                            <div className="w-16 hidden sm:block">
                              <Progress
                                value={pct}
                                className={`h-1.5 ${
                                  pct >= 90
                                    ? "[&>div]:bg-destructive"
                                    : pct >= 70
                                    ? "[&>div]:bg-warning"
                                    : "[&>div]:bg-success"
                                }`}
                              />
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                pct >= 90
                                  ? "border-destructive text-destructive"
                                  : pct >= 70
                                  ? "border-warning text-warning"
                                  : "border-success text-success"
                              }`}
                            >
                              {pct}%
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell tabular-nums">
                          {Number(
                            String(eq.P_Totales || 0).replace(/,/g, "")
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              eq.Estado === "Activo" ? "default" : "secondary"
                            }
                            className={
                              eq.Estado === "Activo"
                                ? "bg-success/20 text-success hover:bg-success/30"
                                : ""
                            }
                          >
                            {eq.Estado || "Activo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(eq)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleStatus(eq)}
                            >
                              {eq.Estado === "Activo" ? (
                                <PowerOff className="h-4 w-4 text-warning" />
                              ) : (
                                <Power className="h-4 w-4 text-success" />
                              )}
                              <span className="sr-only">Cambiar estado</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteDialog(eq)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                              <span className="sr-only">Eliminar</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin equipos registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar equipo</DialogTitle>
            <DialogDescription>
              {`¿Estas seguro de eliminar el equipo ${deleteDialog?.EquipoID}? Esta accion no se puede deshacer.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
