import db from '@/lib/database'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface ParametroAnual {
  id: number
  categoria_id: number
  categoria_nombre: string
  anio_fiscal: number
  vida_util_anos: number
  metodo_amortizacion: string
  valor_residual_porcentaje: number | string
  tasa_anual_porcentaje: number | string
  coeficiente_ajuste: number | string
  activo: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface CrearParametroAnual {
  categoria_id: number
  anio_fiscal: number
  vida_util_anos: number
  metodo_amortizacion: string
  valor_residual_porcentaje: number
  tasa_anual_porcentaje: number
  coeficiente_ajuste: number
}

export class ParametroAnualService {
  
  static async obtenerParametrosPorAño(año: number, userId: number): Promise<ParametroAnual[]> {
    const connection = await db.getConnection()
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT 
          cpa.id,
          cpa.categoria_id,
          c.nombre as categoria_nombre,
          cpa.anio_fiscal,
          cpa.vida_util_anos,
          cpa.metodo_amortizacion,
          cpa.valor_residual_porcentaje,
          cpa.tasa_anual_porcentaje,
          cpa.coeficiente_ajuste,
          cpa.activo,
          cpa.fecha_creacion,
          cpa.fecha_actualizacion
        FROM categoria_parametros_anuales cpa
        JOIN categorias c ON cpa.categoria_id = c.id
        WHERE cpa.anio_fiscal = ? AND cpa.activo = TRUE AND cpa.usuario_id = ?
        ORDER BY c.nombre`,
        [año, userId]
      )
      
      return rows as ParametroAnual[]
    } finally {
      connection.release()
    }
  }

  static async obtenerParametrosPorCategoria(categoriaId: number, año: number, userId: number): Promise<ParametroAnual | null> {
    const connection = await db.getConnection()
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT 
          cpa.id,
          cpa.categoria_id,
          c.nombre as categoria_nombre,
          cpa.anio_fiscal,
          cpa.vida_util_anos,
          cpa.metodo_amortizacion,
          cpa.valor_residual_porcentaje,
          cpa.tasa_anual_porcentaje,
          cpa.coeficiente_ajuste,
          cpa.activo,
          cpa.fecha_creacion,
          cpa.fecha_actualizacion
        FROM categoria_parametros_anuales cpa
        JOIN categorias c ON cpa.categoria_id = c.id
        WHERE cpa.categoria_id = ? 
        AND cpa.anio_fiscal = (
          SELECT MAX(anio_fiscal) 
          FROM categoria_parametros_anuales cpa2 
          WHERE cpa2.categoria_id = ? 
          AND cpa2.anio_fiscal <= ?
          AND cpa2.activo = TRUE
          AND cpa2.usuario_id = ?
        )
        AND cpa.activo = TRUE
        AND cpa.usuario_id = ?`,
        [categoriaId, categoriaId, año, userId, userId]
      )
      
      return rows.length > 0 ? rows[0] as ParametroAnual : null
    } finally {
      connection.release()
    }
  }

  static async crearParametro(parametro: CrearParametroAnual, userId: number): Promise<number> {
    const connection = await db.getConnection()
    
    try {
      // Verificar si ya existe un parámetro para esa categoría y año del usuario
      const [existing] = await connection.execute<RowDataPacket[]>(
        'SELECT id FROM categoria_parametros_anuales WHERE categoria_id = ? AND anio_fiscal = ? AND usuario_id = ?',
        [parametro.categoria_id, parametro.anio_fiscal, userId]
      )
      
      if (existing.length > 0) {
        throw new Error(`Ya existen parámetros para la categoría ${parametro.categoria_id} en el año ${parametro.anio_fiscal}`)
      }
      
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO categoria_parametros_anuales 
        (categoria_id, anio_fiscal, vida_util_anos, metodo_amortizacion, 
         valor_residual_porcentaje, tasa_anual_porcentaje, coeficiente_ajuste, usuario_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parametro.categoria_id,
          parametro.anio_fiscal,
          parametro.vida_util_anos,
          parametro.metodo_amortizacion,
          parametro.valor_residual_porcentaje,
          parametro.tasa_anual_porcentaje,
          parametro.coeficiente_ajuste,
          userId
        ]
      )
      
      return result.insertId
    } finally {
      connection.release()
    }
  }

  static async actualizarParametro(id: number, parametro: Partial<CrearParametroAnual>, userId: number): Promise<void> {
    const connection = await db.getConnection()
    
    try {
      const campos = []
      const valores = []
      
      if (parametro.vida_util_anos !== undefined) {
        campos.push('vida_util_anos = ?')
        valores.push(parametro.vida_util_anos)
      }
      
      if (parametro.metodo_amortizacion !== undefined) {
        campos.push('metodo_amortizacion = ?')
        valores.push(parametro.metodo_amortizacion)
      }
      
      if (parametro.valor_residual_porcentaje !== undefined) {
        campos.push('valor_residual_porcentaje = ?')
        valores.push(parametro.valor_residual_porcentaje)
      }
      
      if (parametro.tasa_anual_porcentaje !== undefined) {
        campos.push('tasa_anual_porcentaje = ?')
        valores.push(parametro.tasa_anual_porcentaje)
      }
      
      if (parametro.coeficiente_ajuste !== undefined) {
        campos.push('coeficiente_ajuste = ?')
        valores.push(parametro.coeficiente_ajuste)
      }
      
      if (campos.length === 0) {
        throw new Error('No hay campos para actualizar')
      }
      
      valores.push(id, userId)
      
      await connection.execute(
        `UPDATE categoria_parametros_anuales SET ${campos.join(', ')} WHERE id = ? AND usuario_id = ?`,
        valores
      )
    } finally {
      connection.release()
    }
  }

  static async eliminarParametro(id: number, userId: number): Promise<void> {
    const connection = await db.getConnection()
    
    try {
      await connection.execute(
        'UPDATE categoria_parametros_anuales SET activo = FALSE WHERE id = ? AND usuario_id = ?',
        [id, userId]
      )
    } finally {
      connection.release()
    }
  }

  static async copiarParametrosAño(añoOrigen: number, añoDestino: number, userId: number, coeficienteAjuste: number = 1.0): Promise<{ copiados: number }> {
    const connection = await db.getConnection()
    
    try {
      await connection.beginTransaction()
      
      // Verificar que no existan parámetros para el año destino del usuario
      const [existing] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM categoria_parametros_anuales WHERE anio_fiscal = ? AND activo = TRUE AND usuario_id = ?',
        [añoDestino, userId]
      )
      
      if (existing[0].count > 0) {
        throw new Error(`Ya existen parámetros para el año ${añoDestino}`)
      }
      
      // Copiar parámetros del año origen al año destino para el usuario
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO categoria_parametros_anuales 
        (categoria_id, anio_fiscal, vida_util_anos, metodo_amortizacion, 
         valor_residual_porcentaje, tasa_anual_porcentaje, coeficiente_ajuste, usuario_id)
        SELECT 
          categoria_id,
          ? as anio_fiscal,
          vida_util_anos,
          metodo_amortizacion,
          valor_residual_porcentaje,
          tasa_anual_porcentaje,
          coeficiente_ajuste * ?,
          usuario_id
        FROM categoria_parametros_anuales
        WHERE anio_fiscal = ? AND activo = TRUE AND usuario_id = ?`,
        [añoDestino, coeficienteAjuste, añoOrigen, userId]
      )
      
      await connection.commit()
      
      return { copiados: result.affectedRows || 0 }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async obtenerAñosDisponibles(userId: number): Promise<number[]> {
    const connection = await db.getConnection()
    
    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT DISTINCT anio_fiscal 
        FROM categoria_parametros_anuales 
        WHERE activo = TRUE AND usuario_id = ?
        ORDER BY anio_fiscal DESC`,
        [userId]
      )
      
      return rows.map((row: any) => row.anio_fiscal)
    } finally {
      connection.release()
    }
  }
}
