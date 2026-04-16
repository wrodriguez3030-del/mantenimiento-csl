"use client"

import { useState, useEffect } from "react"
import { useAppStore, apiJsonp, normalizeApiUrl } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import type { Tecnico, Database } from "@/lib/types"

const emptyTecnico: Tecnico = {
  Codigo: "",
  Nombre: "",
  Telefono: "",
  Correo: "",
  Estado: "Activo",
  Notas: "",
}

export function TecnicosPage() {
  const {
    db,
    setDb,
    apiUrl,
    showToast,
    setIsLoading,
    setLoadingMessage,
    editingTecnico,
    setEditingTecnico,
  } = useAppStore()

  const [formData, setFormData] = useState<Tecnico>(emptyTecnico)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<Tecnico | null>(null)

  useEffect(() => {
    if (editingTecnico) {
      setFormData(editingTecnico)
      setIsFormOpen(true)
    }
  }, [editingTecnico])

  const handleSubmit = async () => {
    if (!formData.Codigo || !formData.Nombre) {
      showToast("Codigo y nombre son obligatorios", "error")
      return
    }

    const normalized = normalizeApiUrl(apiUrl)
    if (!normalized) {
      showToast("Configura la URL de la API primero", "error")
      return
    }

    setIsLoading(true)
    setLoadingMessage("Guardando tecnico...")

    try {
      await apiJsonp(normalized, {
        action: "saveTecnico",
        codigo: formData.Codigo,
        nombre: formData.Nombre,
        telefono: formData.Telefono || "",
        correo: formData.Correo || "",
        estado: formData.Estado,
        notas: formData.Notas || "",
      })

      const result = await apiJsonp(normalized, { action: "getAllData" })
      if (result && result.ok && result.data) {
        setDb(result.data as Database)
      }

      setFormData(emptyTecnico)
      setEditingTecnico(null)
      setIsFormOpen(false)
      showToast("Tecnico guardado correctamente", "success")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Error al guardar",
        "error"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (tecnico: Tecnico) => {
    const normalized = normalizeApiUrl(apiUrl)
    if (!normalized) return

    setIsLoading(true)
    setLoadingMessage("Actualizando estado...")

    try {
      const newStatus = tecnico.Estado === "Activo" ? "Inactivo" : "Activo"
      await apiJsonp(normalized, {
        action: "setTecnicoEstado",
        rowNum: tecnico._rowNum || "",
        codigo: tecnico.Codigo,
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
    setLoadingMessage("Eliminando tecnico...")

    const normalized = normalizeApiUrl(apiUrl)

    try {
      // Si hay API configurada, intentar eliminar en el servidor
      if (normalized) {
        try {
          await apiJsonp(normalized, {
            action: "deleteTecnico",
            rowNum: deleteDialog._rowNum || "",
            codigo: deleteDialog.Codigo,
          })

          const result = await apiJsonp(normalized, { action: "getAllData" })
          if (result && result.ok && result.data) {
            setDb(result.data as Database)
            setDeleteDialog(null)
            showToast("Tecnico eliminado", "success")
            return
          }
        } catch {
          // Si falla la API, eliminar localmente
        }
      }

      // Eliminar localmente
      const updatedTecnicos = db.tecnicos.filter(
        (t) => t.Codigo !== deleteDialog.Codigo
      )
      setDb({ ...db, tecnicos: updatedTecnicos })
      setDeleteDialog(null)
      showToast("Tecnico eliminado localmente", "success")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Error al eliminar",
        "error"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (tecnico: Tecnico) => {
    setFormData(tecnico)
    setEditingTecnico(tecnico)
    setIsFormOpen(true)
  }

  const handleCancel = () => {
    setFormData(emptyTecnico)
    setEditingTecnico(null)
    setIsFormOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            {editingTecnico
              ? `Editar: ${editingTecnico.Nombre}`
              : "Nuevo Tecnico"}
          </CardTitle>
          {!isFormOpen && (
            <Button
              size="sm"
              onClick={() => setIsFormOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          )}
        </CardHeader>
        {isFormOpen && (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="codigo">Codigo</Label>
                <Input
                  id="codigo"
                  placeholder="TEC-001"
                  value={formData.Codigo}
                  onChange={(e) =>
                    setFormData({ ...formData, Codigo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  placeholder="Juan Perez"
                  value={formData.Nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, Nombre: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Telefono</Label>
                <Input
                  id="telefono"
                  placeholder="809-555-1234"
                  value={formData.Telefono || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Telefono: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correo">Correo</Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  value={formData.Correo || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Correo: e.target.value })
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
                <Label htmlFor="notas">Notas</Label>
                <Input
                  id="notas"
                  placeholder="Notas adicionales"
                  value={formData.Notas || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, Notas: e.target.value })
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
          <CardTitle className="text-base">Lista de tecnicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Telefono</TableHead>
                  <TableHead className="hidden lg:table-cell">Correo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden xl:table-cell">Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {db.tecnicos.length > 0 ? (
                  db.tecnicos.map((t) => (
                    <TableRow key={t.Codigo}>
                      <TableCell className="font-medium">{t.Codigo}</TableCell>
                      <TableCell>{t.Nombre}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {t.Telefono || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {t.Correo || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.Estado === "Activo" ? "default" : "secondary"
                          }
                          className={
                            t.Estado === "Activo"
                              ? "bg-success/20 text-success hover:bg-success/30"
                              : ""
                          }
                        >
                          {t.Estado || "Activo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground">
                        {t.Notas || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(t)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(t)}
                          >
                            {t.Estado === "Activo" ? (
                              <PowerOff className="h-4 w-4 text-warning" />
                            ) : (
                              <Power className="h-4 w-4 text-success" />
                            )}
                            <span className="sr-only">Cambiar estado</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialog(t)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Sin tecnicos registrados.
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
            <DialogTitle>Eliminar tecnico</DialogTitle>
            <DialogDescription>
              {`¿Estas seguro de eliminar al tecnico ${deleteDialog?.Nombre}? Esta accion no se puede deshacer.`}
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
