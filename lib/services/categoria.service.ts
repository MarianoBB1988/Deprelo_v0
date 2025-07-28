import { executeQuery } from '../database'
import { Categoria, CrearCategoriaDTO, ApiResponse } from '../types'

export class CategoriaService {
  
  // Obtener todas las categorías del usuario
  static async obtenerTodas(userId: number): Promise<Categoria[]> {
    const query = `
      SELECT id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion
      FROM categorias 
      WHERE activo = TRUE AND usuario_id = ?
      ORDER BY nombre
    `
    const result = await executeQuery(query, [userId])
    return result as Categoria[]
  }

  // Obtener categoría por ID del usuario
  static async obtenerPorId(id: number, userId: number): Promise<Categoria | null> {
    const query = `
      SELECT id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion
      FROM categorias 
      WHERE id = ? AND activo = TRUE AND usuario_id = ?
    `
    const result = await executeQuery(query, [id, userId])
    const categorias = result as Categoria[]
    return categorias.length > 0 ? categorias[0] : null
  }

  // Crear categoría
  static async crear(datos: CrearCategoriaDTO): Promise<ApiResponse<Categoria>> {
    try {
      const userId = datos.usuario_id
      if (!userId) {
        return {
          success: false,
          error: 'Usuario no válido'
        }
      }

      // Verificar si el nombre ya existe para este usuario
      const query = `
        SELECT id FROM categorias WHERE nombre = ? AND activo = TRUE AND usuario_id = ?
      `
      const existente = await executeQuery(query, [datos.nombre, userId])
      
      if ((existente as any[]).length > 0) {
        return {
          success: false,
          error: 'Ya existe una categoría con este nombre'
        }
      }

      const insertQuery = `
        INSERT INTO categorias (usuario_id, nombre, descripcion)
        VALUES (?, ?, ?)
      `
      const result = await executeQuery(insertQuery, [
        userId,
        datos.nombre, 
        datos.descripcion || null
      ])
      
      const insertResult = result as any
      const nuevaCategoria = await this.obtenerPorId(insertResult.insertId, userId)

      return {
        success: true,
        data: nuevaCategoria!,
        message: 'Categoría creada exitosamente'
      }
    } catch (error) {
      console.error('Error creando categoría:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Actualizar categoría
  static async actualizar(id: number, datos: Partial<CrearCategoriaDTO>, userId: number): Promise<ApiResponse<Categoria>> {
    try {
      // Verificar que la categoría existe y pertenece al usuario
      const categoriaExistente = await this.obtenerPorId(id, userId)
      if (!categoriaExistente) {
        return {
          success: false,
          error: 'Categoría no encontrada o no tienes acceso a ella'
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

      if (campos.length === 0) {
        return {
          success: false,
          error: 'No hay campos para actualizar'
        }
      }

      valores.push(id, userId)

      const query = `
        UPDATE categorias 
        SET ${campos.join(', ')} 
        WHERE id = ? AND usuario_id = ?
      `
      await executeQuery(query, valores)

      const categoriaActualizada = await this.obtenerPorId(id, userId)

      return {
        success: true,
        data: categoriaActualizada!,
        message: 'Categoría actualizada exitosamente'
      }
    } catch (error) {
      console.error('Error actualizando categoría:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Eliminar categoría (soft delete)
  static async eliminar(id: number): Promise<ApiResponse<boolean>> {
    try {
      // Verificar si hay activos asociados
      const activosQuery = `
        SELECT COUNT(*) as count FROM activos 
        WHERE categoria_id = ? AND activo = TRUE
      `
      const activosResult = await executeQuery(activosQuery, [id])
      const activosCount = (activosResult as any[])[0].count

      if (activosCount > 0) {
        return {
          success: false,
          error: 'No se puede eliminar la categoría porque tiene activos asociados'
        }
      }

      const query = `
        UPDATE categorias 
        SET activo = FALSE 
        WHERE id = ?
      `
      await executeQuery(query, [id])

      return {
        success: true,
        data: true,
        message: 'Categoría eliminada exitosamente'
      }
    } catch (error) {
      console.error('Error eliminando categoría:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Obtener categorías con conteo de activos
  static async obtenerConActivos(): Promise<any[]> {
    const query = `
      SELECT c.*, COUNT(a.id) as total_activos
      FROM categorias c
      LEFT JOIN activos a ON c.id = a.categoria_id AND a.activo = TRUE
      WHERE c.activo = TRUE
      GROUP BY c.id
      ORDER BY c.nombre
    `
    const result = await executeQuery(query)
    return result as any[]
  }
}
