// Tipos para la base de datos
export interface Usuario {
  id: number
  email: string
  password: string
  rol: 'admin' | 'contador'
  nombre: string
  apellido: string
  activo: boolean
  fecha_creacion: Date
  fecha_actualizacion: Date
}

export interface Categoria {
  id: number
  usuario_id: number
  nombre: string
  descripcion?: string
  activo: boolean
  fecha_creacion: Date
  fecha_actualizacion: Date
}

export interface Cliente {
  id: number
  usuario_id: number
  nombre: string
  rut: string
  email: string
  telefono?: string
  direccion?: string
  ciudad?: string
  region?: string
  pais: string
  activo: boolean
  fecha_creacion: Date
  fecha_actualizacion: Date
}

export interface Activo {
  id: number
  usuario_id: number
  nombre: string
  descripcion?: string
  categoria_id: number
  cliente_id: number
  valor_adquisicion: number
  valor_residual: number
  fecha_adquisicion: Date
  fecha_alta: Date
  numero_serie?: string
  proveedor?: string
  ubicacion?: string
  estado: 'activo' | 'depreciado' | 'vendido' | 'desechado'
  activo: boolean
  fecha_creacion: Date
  fecha_actualizacion: Date
}

export interface Amortizacion {
  id: number
  usuario_id: number
  activo_id: number
  periodo_año: number
  periodo_mes: number
  valor_inicial: number
  cuota_amortizacion: number
  valor_final: number
  metodo_aplicado: 'lineal' | 'decreciente' | 'acelerada'
  calculado_automaticamente: boolean
  observaciones?: string
  fecha_calculo: Date
  fecha_actualizacion: Date
}

export interface Reporte {
  id: number
  tipo_reporte: 'amortizacion_mensual' | 'amortizacion_anual' | 'activos_por_cliente' | 'resumen_general'
  nombre: string
  parametros: any
  usuario_id: number
  fecha_generacion: Date
  archivo_generado?: string
}

export interface Auditoria {
  id: number
  tabla_afectada: string
  registro_id: number
  accion: 'INSERT' | 'UPDATE' | 'DELETE'
  datos_anteriores?: any
  datos_nuevos?: any
  usuario_id?: number
  fecha_accion: Date
  ip_address?: string
  user_agent?: string
}

// Tipos para las vistas
export interface VistaActivosCliente {
  cliente_id: number
  cliente_nombre: string
  cliente_rut: string
  total_activos: number
  valor_total_activos: number
  valor_residual_total: number
}

export interface VistaAmortizacionesAnuales {
  periodo_año: number
  activo_nombre: string
  categoria_nombre: string
  cliente_nombre: string
  total_amortizacion_anual: number
  valor_adquisicion: number
  valor_final_año: number
}

export interface VistaDashboard {
  total_activos: number
  total_clientes: number
  total_categorias: number
  valor_total_activos: number
  amortizacion_anual_actual: number
}

// Tipos para formularios (DTOs)
export interface CrearUsuarioDTO {
  email: string
  password: string
  rol: 'admin' | 'contador'
  nombre: string
  apellido: string
}

export interface CrearCategoriaDTO {
  usuario_id?: number
  nombre: string
  descripcion?: string
}

export interface CrearClienteDTO {
  usuario_id?: number
  nombre: string
  rut: string
  email: string
  telefono?: string
  direccion?: string
  ciudad?: string
  region?: string
  pais?: string
}

export interface CrearActivoDTO {
  usuario_id?: number
  estado?: string
  nombre: string
  descripcion?: string
  categoria_id: number
  cliente_id: number
  valor_adquisicion: number
  valor_residual: number
  fecha_adquisicion: Date
  fecha_alta: Date
  numero_serie?: string
  proveedor?: string
  ubicacion?: string
}

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
