"use client"

import { useState, useMemo } from "react"
import { useAppStore, apiJsonp, normalizeApiUrl } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Save, Trash2, Plus, X, ChevronDown, ChevronRight, AlertCircle, Wrench, Zap } from "lucide-react"
import type { PiezaCatalogo, Database } from "@/lib/types"

const emptyPieza: PiezaCatalogo = {
  Pieza: "",
  Categoria: "",
  Prioridad: "Media",
  Tipo: "Consumible",
  Funcion: "",
  FallasComunes: "",
  Activa: "Sí",
}

const prioColors: Record<string, string> = {
  Alta: "bg-red-500/20 text-red-400 border-red-500/30",
  "Media-Alta": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Media: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Baja: "bg-green-500/20 text-green-400 border-green-500/30",
}

const prioDot: Record<string, string> = {
  Alta: "bg-red-400",
  "Media-Alta": "bg-orange-400",
  Media: "bg-blue-400",
  Baja: "bg-green-400",
}

export function CatalogoPage() {
  const { db, setDb, apiUrl, showToast, setIsLoading, setLoadingMessage, setActiveTab } = useAppStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategoria, setFilterCategoria] = useState("todas")
  const [filterPrioridad, setFilterPrioridad] = useState("todas")
  const [selectedPieza, setSelectedPieza] = useState<string>("")
  const [formData, setFormData] = useState<PiezaCatalogo>(emptyPieza)
  const [deleteDialog, setDeleteDialog] = useState<PiezaCatalogo | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const categorias = useMemo(() => {
    const cats = [...new Set(db.piezas.map((p) => p.Categoria).filter(Boolean))]
    return cats.sort()
  }, [db.piezas])

  const filteredPiezas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return db.piezas.filter((p) => {
      const matchQuery = !query || [p.Pieza, p.Categoria, p.Prioridad, p.Tipo, p.FallasComunes, p.Funcion].some((v) => (v || "").toLowerCase().includes(query))
      const matchCat = filterCategoria === "todas" || p.Categoria === filterCategoria
      const matchPrio = filterPrioridad === "todas" || p.Prioridad === filterPrioridad
      return matchQuery && matchCat && matchPrio
    })
  }, [db.piezas, searchQuery, filterCategoria, filterPrioridad])

  const grouped = useMemo(() => {
    const map: Record<string, PiezaCatalogo[]> = {}
    filteredPiezas.forEach((p) => {
      const cat = p.Categoria || "Sin categoría"
      if (!map[cat]) map[cat] = []
      map[cat].push(p)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredPiezas])

  const selectedPiezaData = useMemo(() => db.piezas.find((p) => p.Pieza === selectedPieza) || null, [db.piezas, selectedPieza])

  const handleSelectPieza = (pieza: PiezaCatalogo) => {
    setSelectedPieza(pieza.Pieza)
    setFormData(pieza)
    setShowForm(false)
  }

  const handleNewPieza = () => {
    setSelectedPieza("")
    setFormData(emptyPieza)
    setShowForm(true)
  }

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat); else next.add(cat)
      return next
    })
  }

  const clearFilters = () => { setSearchQuery(""); setFilterCategoria("todas"); setFilterPrioridad("todas") }
  const hasFilters = searchQuery || filterCategoria !== "todas" || filterPrioridad !== "todas"

  const handleSave = async () => {
    if (!formData.Pieza) { showToast("El nombre de la pieza es obligatorio", "error"); return }
    const normalized = normalizeApiUrl(apiUrl)
    if (!normalized) { showToast("Configura la URL de la API primero", "error"); return }
    setIsLoading(true)
    setLoadingMessage("Guardando pieza...")
    try {
      await apiJsonp(normalized, { action: "savePieza", pieza: formData.Pieza, categoria: formData.Categoria, prioridad: formData.Prioridad, tipo: formData.Tipo, funcion: formData.Funcion || "", fallasComunes: formData.FallasComunes || "", activa: formData.Activa || "Sí" })
      const result = await apiJsonp(normalized, { action: "getAllData" })
      if (result && result.ok && result.data) setDb(result.data as Database)
      showToast("Pieza guardada correctamente", "success")
      setShowForm(false)
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error al guardar", "error")
    } finally { setIsLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteDialog) return
    const normalized = normalizeApiUrl(apiUrl)
    if (!normalized) return
    setIsLoading(true)
    setLoadingMessage("Eliminando pieza...")
    try {
      await apiJsonp(normalized, { action: "deletePieza", pieza: deleteDialog.Pieza })
      const result = await apiJsonp(normalized, { action: "getAllData" })
      if (result && result.ok && result.data) setDb(result.data as Database)
      setDeleteDialog(null); setSelectedPieza(""); setFormData(emptyPieza); setShowForm(false)
      showToast("Pieza eliminada", "success")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error al eliminar", "error")
    } finally { setIsLoading(false) }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nombre, falla, función..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-9" autoFocus />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Prioridad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="Alta">🔴 Alta</SelectItem>
                <SelectItem value="Media-Alta">🟠 Media-Alta</SelectItem>
                <SelectItem value="Media">🔵 Media</SelectItem>
                <SelectItem value="Baja">🟢 Baja</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground"><X className="h-3 w-3" /> Limpiar</Button>}
              <Button onClick={handleNewPieza} className="gap-2 whitespace-nowrap"><Plus className="h-4 w-4" />Nueva pieza</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{filteredPiezas.length} de {db.piezas.length} piezas{hasFilters && " (filtrado)"}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* List grouped by category */}
        <div className="lg:col-span-2 space-y-2">
          {grouped.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Sin resultados para tu búsqueda</p>
                {hasFilters && <Button variant="link" onClick={clearFilters} className="mt-2">Limpiar filtros</Button>}
              </CardContent>
            </Card>
          ) : grouped.map(([categoria, piezas]) => (
            <Card key={categoria} className="overflow-hidden">
              <button onClick={() => toggleCategory(categoria)} className="w-full flex items-center justify-between px-4 py-3 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{categoria}</span>
                  <Badge variant="secondary" className="text-xs">{piezas.length}</Badge>
                </div>
                {collapsedCategories.has(categoria) ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {!collapsedCategories.has(categoria) && (
                <div className="divide-y divide-border/50">
                  {piezas.map((p) => (
                    <button key={p.Pieza} onClick={() => handleSelectPieza(p)} className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-secondary/30 ${selectedPieza === p.Pieza ? "bg-primary/10 border-l-2 border-primary" : ""}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${prioDot[p.Prioridad] || "bg-gray-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.Pieza}</p>
                        {p.FallasComunes && (
                          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />{p.FallasComunes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`text-xs border ${prioColors[p.Prioridad] || ""}`}>{p.Prioridad}</Badge>
                        <Badge variant="secondary" className="text-xs hidden sm:inline-flex">{p.Tipo?.replace("Consumible ", "").replace("No consumible", "No cons.")}</Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {selectedPiezaData && !showForm && (
            <Card className="sticky top-20">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{selectedPiezaData.Pieza}</CardTitle>
                  <Badge variant="outline" className={`text-xs border flex-shrink-0 ${prioColors[selectedPiezaData.Prioridad] || ""}`}>{selectedPiezaData.Prioridad}</Badge>
                </div>
                <Badge variant="secondary" className="w-fit text-xs">{selectedPiezaData.Tipo}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Separator />
                <div><p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Categoría</p><p>{selectedPiezaData.Categoria || "—"}</p></div>
                {selectedPiezaData.Funcion && <div><p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Función</p><p>{selectedPiezaData.Funcion}</p></div>}
                {selectedPiezaData.FallasComunes && <div><p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Fallas comunes</p><p className="text-red-400">{selectedPiezaData.FallasComunes}</p></div>}
                <Separator />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 gap-1" onClick={() => setShowForm(true)}><Save className="h-3 w-3" /> Editar</Button>
                  <Button size="sm" variant="destructive" className="gap-1" onClick={() => setDeleteDialog(selectedPiezaData)}><Trash2 className="h-3 w-3" /></Button>
                </div>
                <Button size="sm" variant="secondary" className="w-full gap-1" onClick={() => { setActiveTab("reporte"); showToast(`Pieza: ${selectedPieza}`, "info") }}>
                  <Zap className="h-3 w-3" /> Usar en reporte
                </Button>
              </CardContent>
            </Card>
          )}

          {showForm && (
            <Card className="sticky top-20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{selectedPieza ? "Editar pieza" : "Nueva pieza"}</CardTitle>
                  <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre pieza *</Label>
                  <Input value={formData.Pieza} onChange={(e) => setFormData({ ...formData, Pieza: e.target.value })} placeholder="Ej: Lámparas" disabled={!!selectedPieza} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Categoría</Label>
                  <Input value={formData.Categoria} onChange={(e) => setFormData({ ...formData, Categoria: e.target.value })} placeholder="Ej: Consumibles principales" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Prioridad</Label>
                    <Select value={formData.Prioridad} onValueChange={(v: PiezaCatalogo["Prioridad"]) => setFormData({ ...formData, Prioridad: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Media-Alta">Media-Alta</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={formData.Tipo} onValueChange={(v: PiezaCatalogo["Tipo"]) => setFormData({ ...formData, Tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Consumible">Consumible</SelectItem>
                        <SelectItem value="Consumible técnico">Cons. técnico</SelectItem>
                        <SelectItem value="Consumible operativo">Cons. operativo</SelectItem>
                        <SelectItem value="No consumible">No consumible</SelectItem>
                        <SelectItem value="No consumible crítico">No cons. crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Función</Label>
                  <Input value={formData.Funcion || ""} onChange={(e) => setFormData({ ...formData, Funcion: e.target.value })} placeholder="¿Para qué sirve?" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fallas comunes</Label>
                  <Input value={formData.FallasComunes || ""} onChange={(e) => setFormData({ ...formData, FallasComunes: e.target.value })} placeholder="Ej: Error 12.1, bajo flujo" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handleSave} className="flex-1 gap-2"><Save className="h-4 w-4" /> Guardar</Button>
                  {selectedPieza && <Button variant="destructive" onClick={() => setDeleteDialog(selectedPiezaData!)} className="gap-2"><Trash2 className="h-4 w-4" /></Button>}
                </div>
              </CardContent>
            </Card>
          )}

          {!selectedPiezaData && !showForm && (
            <Card className="sticky top-20">
              <CardContent className="py-10 text-center text-muted-foreground">
                <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Selecciona una pieza para ver sus detalles</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar pieza</DialogTitle>
            <DialogDescription>¿Estás seguro de eliminar <strong>{deleteDialog?.Pieza}</strong>? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
