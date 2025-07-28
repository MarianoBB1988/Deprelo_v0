import { executeQuery, executeTransaction } from '../database'
import { Activo, CrearActivoDTO, ApiResponse } from '../types'

export class ActivoService {
  
  // Obtener todos los activos del usuario
  static async obtenerTodos(userId: number): Promise<any[]> {
    const query = `
      SELECT a.id, a.nombre, a.descripcion, a.categoria_id, a.cliente_id,
             a.valor_adquisicion, a.valor_residual, a.fecha_adquisicion, a.fecha_alta, 
             a.numero_serie, a.proveedor, a.ubicacion, a.estado, a.activo, 
             a.fecha_creacion, a.fecha_actualizacion,
             c.nombre as categoria_nombre,
             cl.nombre as cliente_nombre, cl.rut as cliente_rut
      FROM activos a
      INNER JOIN categorias c ON a.categoria_id = c.id AND c.usuario_id = ?
      INNER JOIN clientes cl ON a.cliente_id = cl.id AND cl.usuario_id = ?
      WHERE a.activo = TRUE AND a.usuario_id = ?
      ORDER BY a.fecha_adquisicion DESC, a.nombre
    `
    const result = await executeQuery(query, [userId, userId, userId])
    return result as any[]
  }

  // Obtener activo por ID del usuario
  static async obtenerPorId(id: number, userId: number): Promise<any | null> {
    const query = `
      SELECT a.id, a.nombre, a.descripcion, a.categoria_id, a.cliente_id,
             a.valor_adquisicion, a.valor_residual, a.fecha_adquisicion, a.fecha_alta,
             a.numero_serie, a.proveedor, a.ubicacion, a.estado, a.activo,
             a.fecha_creacion, a.fecha_actualizacion,
             c.nombre as categoria_nombre,
             cl.nombre as cliente_nombre, cl.rut as cliente_rut
      FROM activos a
      INNER JOIN categorias c ON a.categoria_id = c.id AND c.usuario_id = ?
      INNER JOIN clientes cl ON a.cliente_id = cl.id AND cl.usuario_id = ?
      WHERE a.id = ? AND a.activo = TRUE AND a.usuario_id = ?
    `
    const result = await executeQuery(query, [userId, userId, id, userId])
    const activos = result as any[]
    return activos.length > 0 ? activos[0] : null
  }

  // Crear activo
  static async crear(datos: CrearActivoDTO): Promise<ApiResponse<any>> {
    try {
      const userId = datos.usuario_id
      if (!userId) {
        return {
          success: false,
          error: 'Usuario no válido'
        }
      }

      // Verificar que la categoría existe y pertenece al usuario
      const categoriaQuery = `
        SELECT id FROM categorias WHERE id = ? AND activo = TRUE AND usuario_id = ?
      `
      const categoriaResult = await executeQuery(categoriaQuery, [datos.categoria_id, userId])
      if ((categoriaResult as any[]).length === 0) {
        return {
          success: false,
          error: 'La categoría seleccionada no existe o no tienes acceso a ella'
        }
      }

      // Verificar que el cliente existe y pertenece al usuario
      const clienteQuery = `
        SELECT id FROM clientes WHERE id = ? AND activo = TRUE AND usuario_id = ?
      `
      const clienteResult = await executeQuery(clienteQuery, [datos.cliente_id, userId])
      if ((clienteResult as any[]).length === 0) {
        return {
          success: false,
          error: 'El cliente seleccionado no existe o no tienes acceso a él'
        }
      }

      // Verificar que no exista otro activo con el mismo número de serie (si se proporciona) para este usuario
      if (datos.numero_serie) {
        const serieQuery = `
          SELECT id FROM activos WHERE numero_serie = ? AND activo = TRUE AND usuario_id = ?
        `
        const serieResult = await executeQuery(serieQuery, [datos.numero_serie, userId])
        if ((serieResult as any[]).length > 0) {
          return {
            success: false,
            error: 'Ya existe un activo con este número de serie'
          }
        }
      }

      const insertQuery = `
        INSERT INTO activos (usuario_id, nombre, descripcion, categoria_id, cliente_id, valor_adquisicion, 
                            valor_residual, fecha_adquisicion, fecha_alta, numero_serie, 
                            proveedor, ubicacion, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      const result = await executeQuery(insertQuery, [
        userId,
        datos.nombre,
        datos.descripcion || null,
        datos.categoria_id,
        datos.cliente_id,
        datos.valor_adquisicion,
        datos.valor_residual,
        datos.fecha_adquisicion,
        datos.fecha_alta,
        datos.numero_serie || null,
        datos.proveedor || null,
        datos.ubicacion || null,
        datos.estado || 'en_uso'
      ])

      const insertResult = result as any
      const nuevoActivo = await this.obtenerPorId(insertResult.insertId, userId)

      return {
        success: true,
        data: nuevoActivo!,
        message: 'Activo creado exitosamente'
      }
    } catch (error) {
      console.error('Error creando activo:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Actualizar activo
  static async actualizar(id: number, datos: Partial<CrearActivoDTO>, userId: number): Promise<ApiResponse<any>> {
    try {
      // Verificar que el activo existe y pertenece al usuario
      const activoExistente = await this.obtenerPorId(id, userId)
      if (!activoExistente) {
        return {
          success: false,
          error: 'Activo no encontrado o no tienes acceso a él'
        }
      }

      const campos = []
      const valores = []

      if (datos.nombre) {
        campos.push('nombre = ?')
        valores.push(datos.nombre)
      }
      if (datos.descripcion !== undefined) {
        campos.push('descripcion = ?')
        valores.push(datos.descripcion)
      }
      if (datos.categoria_id) {
        // Verificar que la categoría existe y pertenece al usuario
        const categoriaQuery = `
          SELECT id FROM categorias WHERE id = ? AND activo = TRUE AND usuario_id = ?
        `
        const categoriaResult = await executeQuery(categoriaQuery, [datos.categoria_id, userId])
        if ((categoriaResult as any[]).length === 0) {
          return {
            success: false,
            error: 'La categoría seleccionada no existe o no tienes acceso a ella'
          }
        }
        campos.push('categoria_id = ?')
        valores.push(datos.categoria_id)
      }
      if (datos.cliente_id) {
        // Verificar que el cliente existe y pertenece al usuario
        const clienteQuery = `
          SELECT id FROM clientes WHERE id = ? AND activo = TRUE AND usuario_id = ?
        `
        const clienteResult = await executeQuery(clienteQuery, [datos.cliente_id, userId])
        if ((clienteResult as any[]).length === 0) {
          return {
            success: false,
            error: 'El cliente seleccionado no existe o no tienes acceso a él'
          }
        }
        campos.push('cliente_id = ?')
        valores.push(datos.cliente_id)
      }
      if (datos.valor_adquisicion) {
        campos.push('valor_adquisicion = ?')
        valores.push(datos.valor_adquisicion)
      }
      if (datos.estado) {
        campos.push('estado = ?')
        valores.push(datos.estado)
      }
      if (datos.valor_residual !== undefined) {
        campos.push('valor_residual = ?')
        valores.push(datos.valor_residual)
      }
      if (datos.fecha_adquisicion) {
        campos.push('fecha_adquisicion = ?')
        valores.push(datos.fecha_adquisicion)
      }
      if (datos.fecha_alta) {
        campos.push('fecha_alta = ?')
        valores.push(datos.fecha_alta)
      }
      if (datos.numero_serie !== undefined) {
        // Verificar que no exista otro activo con el mismo número de serie
        if (datos.numero_serie) {
          const serieQuery = `
            SELECT id FROM activos WHERE numero_serie = ? AND id != ? AND activo = TRUE
          `
          const serieResult = await executeQuery(serieQuery, [datos.numero_serie, id])
          if ((serieResult as any[]).length > 0) {
            return {
              success: false,
              error: 'Ya existe un activo con este número de serie'
            }
          }
        }
        campos.push('numero_serie = ?')
        valores.push(datos.numero_serie)
      }
      if (datos.proveedor !== undefined) {
        campos.push('proveedor = ?')
        valores.push(datos.proveedor)
      }
      if (datos.ubicacion !== undefined) {
        campos.push('ubicacion = ?')
        valores.push(datos.ubicacion)
      }

      if (campos.length === 0) {
        return {
          success: false,
          error: 'No hay campos para actualizar'
        }
      }

      valores.push(id)

      const query = `
        UPDATE activos 
        SET ${campos.join(', ')} 
        WHERE id = ? AND usuario_id = ?
      `
      await executeQuery(query, [...valores, userId])

      const activoActualizado = await this.obtenerPorId(id, userId)

      return {
        success: true,
        data: activoActualizado!,
        message: 'Activo actualizado exitosamente'
      }
    } catch (error) {
      console.error('Error actualizando activo:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Eliminar activo (soft delete)
  static async eliminar(id: number): Promise<ApiResponse<boolean>> {
    try {
      // Verificar si hay amortizaciones asociadas
      const amortizacionesQuery = `
        SELECT COUNT(*) as count FROM amortizaciones 
        WHERE activo_id = ?
      `
      const amortizacionesResult = await executeQuery(amortizacionesQuery, [id])
      const amortizacionesCount = (amortizacionesResult as any[])[0].count

      if (amortizacionesCount > 0) {
        return {
          success: false,
          error: 'No se puede eliminar el activo porque tiene amortizaciones asociadas'
        }
      }

      const query = `
        UPDATE activos 
        SET activo = FALSE 
        WHERE id = ?
      `
      await executeQuery(query, [id])

      return {
        success: true,
        data: true,
        message: 'Activo eliminado exitosamente'
      }
    } catch (error) {
      console.error('Error eliminando activo:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Obtener activos por cliente del usuario
  static async obtenerPorCliente(clienteId: number, userId: number): Promise<any[]> {
    const query = `
      SELECT a.id, a.nombre, a.descripcion, a.valor_adquisicion, a.valor_residual,
             a.fecha_adquisicion, a.fecha_alta, a.numero_serie, a.proveedor, 
             a.ubicacion, a.estado, a.activo, a.fecha_creacion, a.fecha_actualizacion,
             c.nombre as categoria_nombre
      FROM activos a
      INNER JOIN categorias c ON a.categoria_id = c.id AND c.usuario_id = ?
      INNER JOIN clientes cl ON a.cliente_id = cl.id AND cl.usuario_id = ?
      WHERE a.cliente_id = ? AND a.activo = TRUE AND a.usuario_id = ?
      ORDER BY a.fecha_adquisicion DESC, a.nombre
    `
    const result = await executeQuery(query, [userId, userId, clienteId, userId])
    return result as any[]
  }

  // Obtener activos por categoría del usuario
  static async obtenerPorCategoria(categoriaId: number, userId: number): Promise<any[]> {
    const query = `
      SELECT a.id, a.nombre, a.descripcion, a.valor_adquisicion, a.valor_residual,
             a.fecha_adquisicion, a.fecha_alta, a.numero_serie, a.proveedor, 
             a.ubicacion, a.estado, a.activo, a.fecha_creacion, a.fecha_actualizacion,
             cl.nombre as cliente_nombre, cl.rut as cliente_rut
      FROM activos a
      INNER JOIN clientes cl ON a.cliente_id = cl.id AND cl.usuario_id = ?
      INNER JOIN categorias c ON a.categoria_id = c.id AND c.usuario_id = ?
      WHERE a.categoria_id = ? AND a.activo = TRUE AND a.usuario_id = ?
      ORDER BY a.fecha_adquisicion DESC, a.nombre
    `
    const result = await executeQuery(query, [userId, userId, categoriaId, userId])
    return result as any[]
  }

  // Cambiar estado de activo
  static async cambiarEstado(id: number, estado: 'activo' | 'depreciado' | 'vendido' | 'desechado', userId: number): Promise<ApiResponse<any>> {
    try {
      // Verificar que el activo existe y pertenece al usuario
      const activoExistente = await this.obtenerPorId(id, userId)
      if (!activoExistente) {
        return {
          success: false,
          error: 'Activo no encontrado o no tienes acceso a él'
        }
      }

      const query = `
        UPDATE activos 
        SET estado = ? 
        WHERE id = ? AND usuario_id = ?
      `
      await executeQuery(query, [estado, id, userId])

      const activoActualizado = await this.obtenerPorId(id, userId)

      return {
        success: true,
        data: activoActualizado!,
        message: 'Estado del activo actualizado exitosamente'
      }
    } catch (error) {
      console.error('Error actualizando estado del activo:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Buscar activos del usuario
  static async buscar(termino: string, userId: number): Promise<any[]> {
    const query = `
      SELECT a.id, a.nombre, a.descripcion, a.valor_adquisicion, a.valor_residual,
             a.fecha_adquisicion, a.fecha_alta, a.numero_serie, a.proveedor, 
             a.ubicacion, a.estado, a.activo, a.fecha_creacion, a.fecha_actualizacion,
             c.nombre as categoria_nombre,
             cl.nombre as cliente_nombre, cl.rut as cliente_rut
      FROM activos a
      INNER JOIN categorias c ON a.categoria_id = c.id AND c.usuario_id = ?
      INNER JOIN clientes cl ON a.cliente_id = cl.id AND cl.usuario_id = ?
      WHERE a.activo = TRUE AND a.usuario_id = ?
      AND (a.nombre LIKE ? OR a.numero_serie LIKE ? OR a.descripcion LIKE ?)
      ORDER BY a.fecha_adquisicion DESC, a.nombre
    `
    const searchTerm = `%${termino}%`
    const result = await executeQuery(query, [userId, userId, userId, searchTerm, searchTerm, searchTerm])
    return result as any[]
  }

  // Obtener estadísticas generales del usuario
  static async obtenerEstadisticas(userId: number): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_activos,
        SUM(valor_adquisicion) as valor_total,
        SUM(valor_residual) as valor_residual_total,
        AVG(valor_adquisicion) as valor_promedio,
        MIN(fecha_adquisicion) as fecha_primera_adquisicion,
        MAX(fecha_adquisicion) as fecha_ultima_adquisicion,
        COUNT(DISTINCT cliente_id) as clientes_con_activos,
        COUNT(DISTINCT categoria_id) as categorias_con_activos
      FROM activos 
      WHERE activo = TRUE AND usuario_id = ?
    `
    const result = await executeQuery(query, [userId])
    const stats = result as any[]
    return stats.length > 0 ? stats[0] : null
  }
}
