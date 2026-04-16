export interface Sucursal {
  _rowNum?: string
  Codigo: string
  Nombre: string
  Ciudad: string
  Direccion?: string
  Estado: "Activa" | "Inactiva"
  Notas?: string
  Correo?: string
}

export interface Equipo {
  _rowNum?: string
  EquipoID: string
  Sucursal: string
  Empresa: string
  Domicilio?: string
  Modelo: string
  Serie?: string
  Numero?: string
  P_Cabeza?: number
  P_Totales?: number
  Max_Cabeza?: number
  Estado: "Activo" | "Inactivo"
  Observaciones?: string
}

export interface Tecnico {
  _rowNum?: string
  Codigo: string
  Nombre: string
  Telefono?: string
  Correo?: string
  Estado: "Activo" | "Inactivo"
  Notas?: string
}

export interface PiezaIntervenida {
  pieza: string
  categoria: string
  accion: string
  estado: string
  desgaste?: number
  reemplazo: "Sí" | "No"
  costo?: number
  pulsos?: number
  observaciones?: string
}

export interface Reporte {
  _rowNum?: string
  ID: string
  Fecha: string
  EquipoID: string
  Sucursal: string
  Empresa?: string
  Cliente?: string
  Domicilio?: string
  Ciudad?: string
  Modelo?: string
  Serie?: string
  Numero?: string
  Tipo: "Preventivo" | "Correctivo" | "Garantía" | "Pago por servicio"
  EstadoEquipo: "Operativo" | "Observación" | "Fuera de servicio"
  Prioridad: "Baja" | "Media" | "Alta"
  Problema?: string
  Correccion?: string
  Observaciones?: string
  Checklist?: string
  P_Cabeza?: number
  P_Totales?: number
  Atendio: string
  PiezasJSON?: string
  PartesTexto?: string
}

export interface PiezaCatalogo {
  _rowNum?: string
  Pieza: string
  Categoria: string
  Prioridad: "Alta" | "Media-Alta" | "Media" | "Baja"
  Tipo: "Consumible" | "Consumible técnico" | "Consumible operativo" | "No consumible" | "No consumible crítico"
  Funcion?: string
  FallasComunes?: string
  Activa?: "Sí" | "No"
}

export interface Database {
  sucursales: Sucursal[]
  equipos: Equipo[]
  reportes: Reporte[]
  piezas: PiezaCatalogo[]
  tecnicos: Tecnico[]
}

export type TabId =
  | "config"
  | "panel"
  | "sucursales"
  | "equipos"
  | "tecnicos"
  | "reporte"
  | "reportes"
  | "errores"
