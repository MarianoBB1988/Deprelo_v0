// ============================================
// IMPLEMENTACIÓN MULTI-TENANT EN SERVICIOS
// Actualización de lib/services para soportar multi-tenancy
// ============================================

import { Connection } from 'mysql2/promise'
import { connection } from '@/lib/database'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-secreta-muy-segura'

// ============================================
// SERVICIO BASE CON MULTI-TENANCY
// ============================================

export abstract class BaseService {
  protected static async getUserFromSession(): Promise<number> {
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get('auth-token')

      if (!token?.value) {
        throw new Error('Usuario no autenticado')
      }

      const decoded = jwt.verify(token.value, JWT_SECRET) as any
      
      if (!decoded.userId) {
        throw new Error('Token inválido')
      }

      return decoded.userId
    } catch (error) {
      console.error('Error obteniendo usuario desde sesión:', error)
      throw new Error('Usuario no autenticado')
    }
  }

  protected static async executeQuery(
    query: string, 
    params: any[] = [],
    userId?: number
  ): Promise<any> {
    const userIdToUse = userId || await this.getUserFromSession()
    
    // Establecer el usuario actual en la sesión MySQL
    await connection.execute('SET @current_user_id = ?', [userIdToUse])
    
    const [rows] = await connection.execute(query, params)
    return rows
  }
}

// ============================================
// ACTIVO SERVICE ACTUALIZADO
// ============================================

export class ActivoService extends BaseService {
  static async obtenerTodos(userId?: number): Promise<any[]> {
    const query = `
      SELECT 
        a.*,
        c.nombre as categoria_nombre,
        cl.nombre as cliente_nombre,
        cl.rut as cliente_rut
      FROM activos a
      LEFT JOIN categorias c ON a.categoria_id = c.id
      LEFT JOIN clientes cl ON a.cliente_id = cl.id
      WHERE a.activo = TRUE 
        AND a.usuario_id = ?
        AND (c.usuario_id = ? OR c.usuario_id IS NULL)
        AND (cl.usuario_id = ? OR cl.usuario_id IS NULL)
      ORDER BY a.nombre ASC
    `
    
    const userIdToUse = userId || await this.getUserFromSession()
    return await this.executeQuery(query, [userIdToUse, userIdToUse, userIdToUse], userIdToUse)
  }

  static async obtenerPorId(id: number, userId?: number): Promise<any> {
    const query = `
      SELECT 
        a.*,
        c.nombre as categoria_nombre,
        cl.nombre as cliente_nombre,
        cl.rut as cliente_rut
      FROM activos a
      LEFT JOIN categorias c ON a.categoria_id = c.id
      LEFT JOIN clientes cl ON a.cliente_id = cl.id
      WHERE a.id = ? 
        AND a.usuario_id = ?
    `
    
    const userIdToUse = userId || await this.getUserFromSession()
    const rows = await this.executeQuery(query, [id, userIdToUse], userIdToUse)
    return rows[0] || null
  }

  static async crear(datos: any, userId?: number): Promise<any> {
    const userIdToUse = userId || await this.getUserFromSession()
    
    const query = `
      INSERT INTO activos (
        nombre, descripcion, categoria_id, cliente_id, 
        valor_adquisicion, valor_residual, fecha_adquisicion, 
        fecha_alta, numero_serie, proveedor, ubicacion, estado, usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const params = [
      datos.nombre,
      datos.descripcion,
      datos.categoria_id,
      datos.cliente_id,
      datos.valor_adquisicion,
      datos.valor_residual,
      datos.fecha_adquisicion,
      datos.fecha_alta || new Date().toISOString().split('T')[0],
      datos.numero_serie,
      datos.proveedor,
      datos.ubicacion,
      datos.estado || 'en_uso',
      userIdToUse
    ]
    
    const result = await this.executeQuery(query, params, userIdToUse)
    return result.insertId
  }

  static async actualizar(id: number, datos: any, userId?: number): Promise<boolean> {
    const userIdToUse = userId || await this.getUserFromSession()
    
    const query = `
      UPDATE activos SET
        nombre = ?, descripcion = ?, categoria_id = ?, cliente_id = ?,
        valor_adquisicion = ?, valor_residual = ?, fecha_adquisicion = ?,
        numero_serie = ?, proveedor = ?, ubicacion = ?, estado = ?
      WHERE id = ? AND usuario_id = ?
    `
    
    const params = [
      datos.nombre,
      datos.descripcion,
      datos.categoria_id,
      datos.cliente_id,
      datos.valor_adquisicion,
      datos.valor_residual,
      datos.fecha_adquisicion,
      datos.numero_serie,
      datos.proveedor,
      datos.ubicacion,
      datos.estado,
      id,
      userIdToUse
    ]
    
    const result = await this.executeQuery(query, params, userIdToUse)
    return result.affectedRows > 0
  }

  static async eliminar(id: number, userId?: number): Promise<boolean> {
    const userIdToUse = userId || await this.getUserFromSession()
    
    const query = 'UPDATE activos SET activo = FALSE WHERE id = ? AND usuario_id = ?'
    const result = await this.executeQuery(query, [id, userIdToUse], userIdToUse)
    return result.affectedRows > 0
  }
}

// ============================================
// CLIENTE SERVICE ACTUALIZADO
// ============================================

export class ClienteService extends BaseService {
  static async obtenerTodos(userId?: number): Promise<any[]> {
    const userIdToUse = userId || await this.getUserFromSession()
    const query = 'SELECT * FROM clientes WHERE activo = TRUE AND usuario_id = ? ORDER BY nombre ASC'
    return await this.executeQuery(query, [userIdToUse], userIdToUse)
  }

  static async crear(datos: any, userId?: number): Promise<any> {
    const userIdToUse = userId || await this.getUserFromSession()
    
    const query = `
      INSERT INTO clientes (nombre, rut, email, telefono, direccion, ciudad, region, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const params = [
      datos.nombre,
      datos.rut,
      datos.email,
      datos.telefono,
      datos.direccion,
      datos.ciudad,
      datos.region,
      userIdToUse
    ]
    
    const result = await this.executeQuery(query, params, userIdToUse)
    return result.insertId
  }

  // ... resto de métodos con el mismo patrón
}

// ============================================
// CATEGORIA SERVICE ACTUALIZADO
// ============================================

export class CategoriaService extends BaseService {
  static async obtenerTodas(userId?: number): Promise<any[]> {
    const userIdToUse = userId || await this.getUserFromSession()
    const query = 'SELECT * FROM categorias WHERE activo = TRUE AND usuario_id = ? ORDER BY nombre ASC'
    return await this.executeQuery(query, [userIdToUse], userIdToUse)
  }

  static async crear(datos: any, userId?: number): Promise<any> {
    const userIdToUse = userId || await this.getUserFromSession()
    
    const query = 'INSERT INTO categorias (nombre, descripcion, usuario_id) VALUES (?, ?, ?)'
    const params = [datos.nombre, datos.descripcion, userIdToUse]
    
    const result = await this.executeQuery(query, params, userIdToUse)
    return result.insertId
  }

  // ... resto de métodos
}

// ============================================
// AMORTIZACIÓN SERVICE ACTUALIZADO
// ============================================

export class AmortizacionService extends BaseService {
  static async obtenerPorActivo(activoId: number, userId?: number): Promise<any[]> {
    const userIdToUse = userId || await this.getUserFromSession()
    
    const query = `
      SELECT 
        am.*,
        a.nombre as activo_nombre,
        c.nombre as categoria_nombre,
        cl.nombre as cliente_nombre
      FROM amortizaciones am
      JOIN activos a ON am.activo_id = a.id
      LEFT JOIN categorias c ON a.categoria_id = c.id
      LEFT JOIN clientes cl ON a.cliente_id = cl.id
      WHERE am.activo_id = ? 
        AND am.usuario_id = ?
        AND a.usuario_id = ?
      ORDER BY am.periodo_año DESC, am.periodo_mes DESC
    `
    
    return await this.executeQuery(query, [activoId, userIdToUse, userIdToUse], userIdToUse)
  }

  static async obtenerPorPeriodo(año: number, mes?: number, userId?: number): Promise<any[]> {
    const userIdToUse = userId || await this.getUserFromSession()
    
    let query = `
      SELECT 
        am.*,
        a.nombre as activo_nombre,
        c.nombre as categoria_nombre,
        cl.nombre as cliente_nombre,
        cl.rut as cliente_rut
      FROM amortizaciones am
      JOIN activos a ON am.activo_id = a.id
      LEFT JOIN categorias c ON a.categoria_id = c.id
      LEFT JOIN clientes cl ON a.cliente_id = cl.id
      WHERE am.periodo_año = ? 
        AND am.usuario_id = ?
        AND a.usuario_id = ?
    `
    
    const params = [año, userIdToUse, userIdToUse]
    
    if (mes) {
      query += ' AND am.periodo_mes = ?'
      params.push(mes)
    }
    
    query += ' ORDER BY am.periodo_mes ASC, a.nombre ASC'
    
    return await this.executeQuery(query, params, userIdToUse)
  }

  // ... resto de métodos
}

// ============================================
// DASHBOARD SERVICE ACTUALIZADO
// ============================================

export class DashboardService extends BaseService {
  static async obtenerEstadisticasGenerales(userId?: number): Promise<any> {
    const userIdToUse = userId || await this.getUserFromSession()
    
    const query = `
      SELECT 
        COUNT(DISTINCT a.id) as total_activos,
        COUNT(DISTINCT c.id) as total_clientes,
        COUNT(DISTINCT cat.id) as total_categorias,
        COALESCE(SUM(a.valor_adquisicion), 0) as valor_total_activos,
        COALESCE(SUM(CASE WHEN am.periodo_año = YEAR(CURDATE()) THEN am.cuota_amortizacion ELSE 0 END), 0) as amortizacion_anual_actual
      FROM usuarios u
      LEFT JOIN activos a ON u.id = a.usuario_id AND a.activo = TRUE
      LEFT JOIN clientes c ON u.id = c.usuario_id AND c.activo = TRUE
      LEFT JOIN categorias cat ON u.id = cat.usuario_id AND cat.activo = TRUE
      LEFT JOIN amortizaciones am ON u.id = am.usuario_id
      WHERE u.id = ?
      GROUP BY u.id
    `
    
    const rows = await this.executeQuery(query, [userIdToUse], userIdToUse)
    return rows[0] || {
      total_activos: 0,
      total_clientes: 0,
      total_categorias: 0,
      valor_total_activos: 0,
      amortizacion_anual_actual: 0
    }
  }
}

// ============================================
// UTILIDADES PARA AUTENTICACIÓN
// ============================================

export class AuthService {
  static async crearNuevoUsuario(datos: {
    email: string
    password: string
    nombre: string
    apellido: string
    crearDatosEjemplo?: boolean
  }): Promise<any> {
    const query = 'CALL crear_nuevo_tenant(?, ?, ?, ?, ?)'
    const params = [
      datos.email,
      datos.password,
      datos.nombre,
      datos.apellido,
      datos.crearDatosEjemplo || false
    ]
    
    const [rows] = await connection.execute(query, params)
    return rows[0]
  }

  static async obtenerUsuarioPorEmail(email: string): Promise<any> {
    const query = 'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE'
    const [rows] = await connection.execute(query, [email])
    return (rows as any[])[0] || null
  }
}

// ============================================
// MIDDLEWARE PARA OBTENER USUARIO DE JWT
// ============================================

/*
IMPLEMENTACIÓN EN TUS APIs:

// app/api/activos/route.ts
export async function GET(request: NextRequest) {
  try {
    // Obtener usuario del JWT
    const userId = await getUserIdFromJWT(request)
    
    // Usar en el servicio
    const activos = await ActivoService.obtenerTodos(userId)
    
    return NextResponse.json({ success: true, data: activos })
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Función helper para obtener userId del JWT
async function getUserIdFromJWT(request: NextRequest): Promise<number> {
  const token = request.cookies.get('auth-token')?.value
  
  if (!token) {
    throw new Error('Token de autenticación requerido')
  }
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET) as any
  return decoded.userId
}
*/
