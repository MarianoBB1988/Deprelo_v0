import { executeQuery } from '../database'
import { Cliente, CrearClienteDTO, ApiResponse } from '../types'

export class ClienteService {
  
  // Obtener todos los clientes del usuario
  static async obtenerTodos(userId: number): Promise<Cliente[]> {
    const query = `
      SELECT id, nombre, rut, email, telefono, direccion, ciudad, region, pais, 
             activo, fecha_creacion, fecha_actualizacion
      FROM clientes 
      WHERE activo = TRUE AND usuario_id = ?
      ORDER BY nombre
    `
    const result = await executeQuery(query, [userId])
    return result as Cliente[]
  }

  // Buscar clientes del usuario
  static async buscar(termino: string, userId: number): Promise<Cliente[]> {
    const query = `SELECT id, nombre, rut, email, telefono, direccion, ciudad, region, pais, 
             activo, fecha_creacion, fecha_actualizacion
      FROM clientes 
      WHERE activo = TRUE AND usuario_id = ?
      AND (nombre LIKE ? OR rut LIKE ? OR email LIKE ?)
      ORDER BY nombre
    `
    const searchTerm = `%${termino}%`
    const result = await executeQuery(query, [userId, searchTerm, searchTerm, searchTerm])
    return result as Cliente[]
  }

  // Obtener cliente por ID del usuario
  static async obtenerPorId(id: number, userId: number): Promise<Cliente | null> {
    const query = `
      SELECT id, nombre, rut, email, telefono, direccion, ciudad, region, pais, 
             activo, fecha_creacion, fecha_actualizacion
      FROM clientes 
      WHERE id = ? AND activo = TRUE AND usuario_id = ?
    `
    const result = await executeQuery(query, [id, userId])
    const clientes = result as Cliente[]
    return clientes.length > 0 ? clientes[0] : null
  }

  // Obtener cliente por RUT del usuario
  static async obtenerPorRut(rut: string, userId: number): Promise<Cliente | null> {
    const query = `
      SELECT id, nombre, rut, email, telefono, direccion, ciudad, region, pais, 
             activo, fecha_creacion, fecha_actualizacion
      FROM clientes 
      WHERE rut = ? AND activo = TRUE AND usuario_id = ?
    `
    const result = await executeQuery(query, [rut, userId])
    const clientes = result as Cliente[]
    return clientes.length > 0 ? clientes[0] : null
  }

  // Crear nuevo cliente para el usuario
  static async crear(datos: CrearClienteDTO, userId: number): Promise<ApiResponse<Cliente>> {
    try {
      // Verificar si el RUT ya existe para este usuario
      const clienteExistente = await this.obtenerPorRut(datos.rut, userId)
      if (clienteExistente) {
        return {
          success: false,
          error: 'Ya existe un cliente con este RUT'
        }
      }

      const query = `
        INSERT INTO clientes (nombre, rut, email, telefono, direccion, ciudad, region, pais, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      const result = await executeQuery(query, [
        datos.nombre,
        datos.rut,
        datos.email || null,
        datos.telefono || null,
        datos.direccion || null,
        datos.ciudad || null,
        datos.region || null,
        datos.pais || null,
        userId
      ])

      // Obtener el cliente recién creado
      const clienteCreado = await this.obtenerPorId((result as any).insertId, userId)
      
      return {
        success: true,
        data: clienteCreado!,
        message: 'Cliente creado exitosamente'
      }
    } catch (error) {
      console.error('Error creando cliente:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Actualizar cliente del usuario
  static async actualizar(id: number, datos: Partial<CrearClienteDTO>, userId: number): Promise<ApiResponse<Cliente>> {
    try {
      // Verificar que el cliente pertenece al usuario
      const clienteExistente = await this.obtenerPorId(id, userId)
      if (!clienteExistente) {
        return {
          success: false,
          error: 'Cliente no encontrado'
        }
      }

      // Si se está actualizando el RUT, verificar que no exista otro cliente con ese RUT
      if (datos.rut && datos.rut !== clienteExistente.rut) {
        const clienteConRut = await this.obtenerPorRut(datos.rut, userId)
        if (clienteConRut && clienteConRut.id !== id) {
          return {
            success: false,
            error: 'Ya existe otro cliente con este RUT'
          }
        }
      }

      const campos = []
      const valores = []

      if (datos.nombre !== undefined) {
        campos.push('nombre = ?')
        valores.push(datos.nombre)
      }
      if (datos.rut !== undefined) {
        campos.push('rut = ?')
        valores.push(datos.rut)
      }
      if (datos.email !== undefined) {
        campos.push('email = ?')
        valores.push(datos.email)
      }
      if (datos.telefono !== undefined) {
        campos.push('telefono = ?')
        valores.push(datos.telefono)
      }
      if (datos.direccion !== undefined) {
        campos.push('direccion = ?')
        valores.push(datos.direccion)
      }
      if (datos.ciudad !== undefined) {
        campos.push('ciudad = ?')
        valores.push(datos.ciudad)
      }
      if (datos.region !== undefined) {
        campos.push('region = ?')
        valores.push(datos.region)
      }
      if (datos.pais !== undefined) {
        campos.push('pais = ?')
        valores.push(datos.pais)
      }

      if (campos.length === 0) {
        return {
          success: false,
          error: 'No se proporcionaron datos para actualizar'
        }
      }

      campos.push('fecha_actualizacion = CURRENT_TIMESTAMP')
      valores.push(id, userId)

      const query = `
        UPDATE clientes 
        SET ${campos.join(', ')}
        WHERE id = ? AND usuario_id = ?
      `

      await executeQuery(query, valores)

      // Obtener el cliente actualizado
      const clienteActualizado = await this.obtenerPorId(id, userId)

      return {
        success: true,
        data: clienteActualizado!,
        message: 'Cliente actualizado exitosamente'
      }
    } catch (error) {
      console.error('Error actualizando cliente:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Eliminar (desactivar) cliente del usuario
  static async eliminar(id: number, userId: number): Promise<ApiResponse<void>> {
    try {
      // Verificar que el cliente pertenece al usuario
      const clienteExistente = await this.obtenerPorId(id, userId)
      if (!clienteExistente) {
        return {
          success: false,
          error: 'Cliente no encontrado'
        }
      }

      // Verificar si el cliente tiene activos asociados
      const activosQuery = `
        SELECT COUNT(*) as count
        FROM activos 
        WHERE cliente_id = ? AND activo = TRUE AND usuario_id = ?
      `
      const activosResult = await executeQuery(activosQuery, [id, userId])
      const cantidadActivos = (activosResult as any[])[0].count

      if (cantidadActivos > 0) {
        return {
          success: false,
          error: `No se puede eliminar el cliente porque tiene ${cantidadActivos} activo(s) asociado(s)`
        }
      }

      const query = `
        UPDATE clientes 
        SET activo = FALSE, fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id = ? AND usuario_id = ?
      `
      await executeQuery(query, [id, userId])

      return {
        success: true,
        message: 'Cliente eliminado exitosamente'
      }
    } catch (error) {
      console.error('Error eliminando cliente:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Obtener clientes con sus activos asociados del usuario
  static async obtenerConActivos(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        c.id,
        c.nombre,
        c.rut,
        c.email,
        c.telefono,
        c.direccion,
        c.ciudad,
        c.region,
        c.pais,
        COUNT(a.id) as total_activos,
        COALESCE(SUM(a.valor_adquisicion), 0) as valor_total_activos
      FROM clientes c
      LEFT JOIN activos a ON c.id = a.cliente_id AND a.activo = TRUE AND a.usuario_id = ?
      WHERE c.activo = TRUE AND c.usuario_id = ?
      GROUP BY c.id, c.nombre, c.rut, c.email, c.telefono, c.direccion, c.ciudad, c.region, c.pais
      ORDER BY c.nombre
    `
    const result = await executeQuery(query, [userId, userId])
    return result as any[]
  }

  // Obtener estadísticas de clientes del usuario
  static async obtenerEstadisticas(userId: number): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_clientes,
        COUNT(CASE WHEN telefono IS NOT NULL AND telefono != '' THEN 1 END) as con_telefono,
        COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as con_email,
        COUNT(CASE WHEN direccion IS NOT NULL AND direccion != '' THEN 1 END) as con_direccion
      FROM clientes 
      WHERE activo = TRUE AND usuario_id = ?
    `
    const result = await executeQuery(query, [userId])
    const estadisticas = result as any[]
    return estadisticas[0]
  }
}
