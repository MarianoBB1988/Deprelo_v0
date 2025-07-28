import { executeQuery, executeTransaction } from '../database'
import { Amortizacion, ApiResponse } from '../types'
import { ParametroAnualService } from './parametro-anual.service'

export class AmortizacionService {
  
  // Obtener todas las amortizaciones
  static async obtenerTodas(userId: number): Promise<any[]> {
    const query = `
      SELECT am.id, am.activo_id, am.periodo_año, am.periodo_mes, am.valor_inicial,
             am.cuota_amortizacion, am.valor_final, am.metodo_aplicado,
             am.calculado_automaticamente, am.observaciones, am.fecha_calculo,
             am.fecha_actualizacion,
             a.nombre as activo_nombre, a.numero_serie,
             c.nombre as categoria_nombre,
             cl.nombre as cliente_nombre, cl.rut as cliente_rut
      FROM amortizaciones am
      INNER JOIN activos a ON am.activo_id = a.id
      INNER JOIN categorias c ON a.categoria_id = c.id
      INNER JOIN clientes cl ON a.cliente_id = cl.id
      WHERE a.usuario_id = ?
      ORDER BY am.periodo_año DESC, am.periodo_mes DESC, cl.nombre, a.nombre
    `
    const result = await executeQuery(query, [userId])
    return result as any[]
  }

  // Obtener amortizaciones por activo
  static async obtenerPorActivo(activoId: number, userId: number): Promise<any[]> {
    const query = `
      SELECT am.id, am.activo_id, am.periodo_año, am.periodo_mes, am.valor_inicial,
             am.cuota_amortizacion, am.valor_final, am.metodo_aplicado,
             am.calculado_automaticamente, am.observaciones, am.fecha_calculo,
             am.fecha_actualizacion,
             a.nombre as activo_nombre, a.numero_serie,
             c.nombre as categoria_nombre,
             cl.nombre as cliente_nombre, cl.rut as cliente_rut
      FROM amortizaciones am
      INNER JOIN activos a ON am.activo_id = a.id
      INNER JOIN categorias c ON a.categoria_id = c.id
      INNER JOIN clientes cl ON a.cliente_id = cl.id
      WHERE am.activo_id = ? AND a.usuario_id = ?
      ORDER BY am.periodo_año, am.periodo_mes
    `
    const result = await executeQuery(query, [activoId, userId])
    return result as any[]
  }

  // Obtener amortizaciones por período
  static async obtenerPorPeriodo(año: number, userId: number, mes?: number): Promise<any[]> {
    let query = `
      SELECT am.id, am.activo_id, am.periodo_año, am.periodo_mes, am.valor_inicial,
             am.cuota_amortizacion, am.valor_final, am.metodo_aplicado,
             am.calculado_automaticamente, am.observaciones, am.fecha_calculo,
             am.fecha_actualizacion,
             a.nombre as activo_nombre, a.numero_serie,
             c.nombre as categoria_nombre,
             cl.nombre as cliente_nombre, cl.rut as cliente_rut
      FROM amortizaciones am
      INNER JOIN activos a ON am.activo_id = a.id
      INNER JOIN categorias c ON a.categoria_id = c.id
      INNER JOIN clientes cl ON a.cliente_id = cl.id
      WHERE am.periodo_año = ? AND a.usuario_id = ?
    `
    const params = [año, userId]

    if (mes) {
      query += ` AND am.periodo_mes = ?`
      params.push(mes)
    }

    query += ` ORDER BY am.periodo_mes, cl.nombre, a.nombre`

    const result = await executeQuery(query, params)
    return result as any[]
  }

  // Obtener amortizaciones por cliente
  static async obtenerPorCliente(clienteId: number, userId: number, año?: number): Promise<any[]> {
    let query = `
      SELECT am.id, am.activo_id, am.periodo_año, am.periodo_mes, am.valor_inicial,
             am.cuota_amortizacion, am.valor_final, am.metodo_aplicado,
             am.calculado_automaticamente, am.observaciones, am.fecha_calculo,
             am.fecha_actualizacion,
             a.nombre as activo_nombre, a.numero_serie,
             c.nombre as categoria_nombre,
             cl.nombre as cliente_nombre, cl.rut as cliente_rut
      FROM amortizaciones am
      INNER JOIN activos a ON am.activo_id = a.id
      INNER JOIN categorias c ON a.categoria_id = c.id
      INNER JOIN clientes cl ON a.cliente_id = cl.id
      WHERE cl.id = ? AND a.usuario_id = ?
    `
    const params = [clienteId, userId]

    if (año) {
      query += ` AND am.periodo_año = ?`
      params.push(año)
    }

    query += ` ORDER BY am.periodo_año DESC, am.periodo_mes DESC, a.nombre`

    const result = await executeQuery(query, params)
    return result as any[]
  }

  // Calcular amortizaciones para un activo específico usando parámetros anuales
  static async calcularAmortizaciones(activoId: number, año: number, userId: number): Promise<ApiResponse<any[]>> {
    try {
      // Obtener datos del activo
      const activoQuery = `
        SELECT a.id, a.nombre, a.valor_adquisicion, a.valor_residual, a.fecha_adquisicion,
               a.categoria_id, c.nombre as categoria_nombre
        FROM activos a
        INNER JOIN categorias c ON a.categoria_id = c.id
        WHERE a.id = ? AND a.activo = TRUE AND a.usuario_id = ?
      `
      const activoResult = await executeQuery(activoQuery, [activoId, userId])
      
      if ((activoResult as any[]).length === 0) {
        return {
          success: false,
          error: 'Activo no encontrado'
        }
      }

      const activo = (activoResult as any[])[0]
      
      // Obtener parámetros fiscales para el año especificado
      const parametros = await ParametroAnualService.obtenerParametrosPorCategoria(activo.categoria_id, año, userId)
      
      if (!parametros) {
        return {
          success: false,
          error: `No se encontraron parámetros fiscales para la categoría ${activo.categoria_nombre} en el año ${año}`
        }
      }

      // Limpiar amortizaciones existentes para ese año
      const deleteQuery = `DELETE FROM amortizaciones WHERE activo_id = ? AND periodo_año = ?`
      await executeQuery(deleteQuery, [activoId, año])

      // Calcular amortizaciones usando los parámetros anuales
      const amortizaciones = this.calcularAmortizacionesLogicaConParametros(activo, parametros, año)
      
      // Insertar nuevas amortizaciones
      const insertQueries = amortizaciones.map((amort: any) => ({
        query: `
          INSERT INTO amortizaciones (activo_id, periodo_año, periodo_mes, valor_inicial, 
                                    cuota_amortizacion, valor_final, metodo_aplicado, 
                                    calculado_automaticamente)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        params: [
          activoId,
          amort.año,
          amort.mes,
          amort.valor_inicial,
          amort.cuota_amortizacion,
          amort.valor_final,
          parametros.metodo_amortizacion,
          true
        ]
      }))

      await executeTransaction(insertQueries)

      // Obtener las amortizaciones recién creadas
      const nuevasAmortizaciones = await this.obtenerPorActivo(activoId, userId)

      return {
        success: true,
        data: nuevasAmortizaciones,
        message: `Amortizaciones calculadas para ${año} usando parámetros fiscales vigentes`
      }
    } catch (error) {
      console.error('Error calculando amortizaciones:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Lógica de cálculo de amortizaciones
  private static calcularAmortizacionesLogica(activo: any): any[] {
    const amortizaciones = []
    const valorAmortizable = activo.valor_adquisicion - activo.valor_residual
    const añoInicial = new Date(activo.fecha_adquisicion).getFullYear()
    
    let valorActual = activo.valor_adquisicion
    
    for (let i = 0; i < activo.vida_util_anos; i++) {
      const año = añoInicial + i
      let cuotaAmortizacion = 0
      
      switch (activo.metodo_amortizacion) {
        case 'lineal':
          cuotaAmortizacion = valorAmortizable / activo.vida_util_anos
          break
        case 'decreciente':
          const factorDecreciente = 2 / activo.vida_util_anos
          cuotaAmortizacion = valorActual * factorDecreciente
          break
        case 'acelerada':
          const factorAcelerado = 1.5 / activo.vida_util_anos
          cuotaAmortizacion = valorActual * factorAcelerado
          break
        default:
          cuotaAmortizacion = valorAmortizable / activo.vida_util_anos
      }
      
      // Asegurar que no se amortice más del valor amortizable
      const valorFinal = Math.max(valorActual - cuotaAmortizacion, activo.valor_residual)
      cuotaAmortizacion = valorActual - valorFinal
      
      amortizaciones.push({
        año,
        mes: 12, // Diciembre como mes de cierre
        valor_inicial: valorActual,
        cuota_amortizacion: cuotaAmortizacion,
        valor_final: valorFinal
      })
      
      valorActual = valorFinal
      
      // Si ya llegamos al valor residual, terminar
      if (valorActual <= activo.valor_residual) {
        break
      }
    }
    
    return amortizaciones
  }

  // Lógica de cálculo de amortizaciones usando parámetros anuales
  private static calcularAmortizacionesLogicaConParametros(activo: any, parametros: any, año: number): any[] {
    const amortizaciones = []
    
    // Convertir valores que pueden venir como string
    const valorResidualPorcentaje = typeof parametros.valor_residual_porcentaje === 'string' 
      ? parseFloat(parametros.valor_residual_porcentaje) 
      : parametros.valor_residual_porcentaje
    
    const tasaAnualPorcentaje = typeof parametros.tasa_anual_porcentaje === 'string'
      ? parseFloat(parametros.tasa_anual_porcentaje)
      : parametros.tasa_anual_porcentaje
      
    const coeficienteAjuste = typeof parametros.coeficiente_ajuste === 'string'
      ? parseFloat(parametros.coeficiente_ajuste)
      : parametros.coeficiente_ajuste
    
    // Usar SIEMPRE el valor residual según parámetros fiscales (no el del activo)
    const valorResidualFiscal = activo.valor_adquisicion * valorResidualPorcentaje
    const valorAmortizable = activo.valor_adquisicion - valorResidualFiscal
    
    let valorActual = activo.valor_adquisicion
    let cuotaAmortizacion = 0
    
    // Aplicar método de amortización según parámetros fiscales
    switch (parametros.metodo_amortizacion) {
      case 'lineal':
        // Cuota anual fija = Valor amortizable / Vida útil
        cuotaAmortizacion = (valorAmortizable / parametros.vida_util_anos) * coeficienteAjuste
        break
      case 'decreciente':
        // Tasa decreciente sobre saldo
        cuotaAmortizacion = valorActual * tasaAnualPorcentaje * coeficienteAjuste
        break
      case 'acelerada':
        // Tasa acelerada (mayor en primeros años)
        const factorAcelerado = tasaAnualPorcentaje * 1.5
        cuotaAmortizacion = valorActual * factorAcelerado * coeficienteAjuste
        break
      default:
        cuotaAmortizacion = (valorAmortizable / parametros.vida_util_anos) * coeficienteAjuste
    }
    
    // Asegurar que no se amortice más del valor amortizable
    const valorFinal = Math.max(valorActual - cuotaAmortizacion, valorResidualFiscal)
    cuotaAmortizacion = valorActual - valorFinal
    
    amortizaciones.push({
      año,
      mes: 12, // Diciembre como mes de cierre fiscal
      valor_inicial: valorActual,
      cuota_amortizacion: cuotaAmortizacion,
      valor_final: valorFinal,
      parametros_utilizados: {
        vida_util_anos: parametros.vida_util_anos,
        metodo: parametros.metodo_amortizacion,
        tasa_anual: tasaAnualPorcentaje,
        coeficiente_ajuste: coeficienteAjuste,
        anio_fiscal: parametros.anio_fiscal,
        valor_residual_fiscal: valorResidualFiscal,
        valor_amortizable: valorAmortizable
      }
    })
    
    return amortizaciones
  }

  // Calcular amortizaciones para múltiples activos en un año específico
  static async calcularAmortizacionesMasivas(params: {
    año: number
    mes?: number
    activo_id?: number
    cliente_id?: number
    categoria_id?: number
    metodo?: 'automatico' | 'recalcular'
    userId: number
  }): Promise<ApiResponse<any[]>> {
    try {
      const { año, activo_id, cliente_id, categoria_id, metodo = 'automatico', userId } = params
      
      // Construir query para obtener activos
      let activosQuery = `
        SELECT a.id, a.nombre, a.valor_adquisicion, a.valor_residual, a.fecha_adquisicion,
               a.categoria_id, c.nombre as categoria_nombre,
               cl.nombre as cliente_nombre, cl.id as cliente_id
        FROM activos a
        INNER JOIN categorias c ON a.categoria_id = c.id
        INNER JOIN clientes cl ON a.cliente_id = cl.id
        WHERE a.activo = TRUE AND a.usuario_id = ?
      `
      const queryParams: any[] = [userId]
      
      if (activo_id) {
        activosQuery += ' AND a.id = ?'
        queryParams.push(activo_id)
      }
      
      if (cliente_id) {
        activosQuery += ' AND a.cliente_id = ?'
        queryParams.push(cliente_id)
      }
      
      if (categoria_id) {
        activosQuery += ' AND a.categoria_id = ?'
        queryParams.push(categoria_id)
      }
      
      const activos = await executeQuery(activosQuery, queryParams) as any[]
      
      if (activos.length === 0) {
        return {
          success: false,
          error: 'No se encontraron activos para procesar con los filtros especificados'
        }
      }

      const resultados = []
      let procesados = 0
      let errores = 0

      for (const activo of activos) {
        try {
          // Si el método es automático, verificar si ya existen amortizaciones para ese año
          if (metodo === 'automatico') {
            const existentes = await executeQuery(
              'SELECT COUNT(*) as count FROM amortizaciones WHERE activo_id = ? AND periodo_año = ?',
              [activo.id, año]
            ) as any[]
            
            if (existentes[0].count > 0) {
              continue // Saltar este activo si ya tiene amortizaciones
            }
          }

          const resultado = await this.calcularAmortizaciones(activo.id, año, userId)
          
          if (resultado.success) {
            resultados.push(...(resultado.data || []))
            procesados++
          } else {
            errores++
            console.error(`Error procesando activo ${activo.nombre}:`, resultado.error)
          }
        } catch (error) {
          errores++
          console.error(`Error procesando activo ${activo.nombre}:`, error)
        }
      }

      return {
        success: true,
        data: resultados,
        message: `Procesamiento completado: ${procesados} activos procesados, ${errores} errores`
      }
    } catch (error) {
      console.error('Error en cálculo masivo de amortizaciones:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }
  static async actualizarAmortizacion(id: number, datos: {
    cuota_amortizacion?: number
    observaciones?: string
  }): Promise<ApiResponse<any>> {
    try {
      const campos = []
      const valores = []

      if (datos.cuota_amortizacion !== undefined) {
        campos.push('cuota_amortizacion = ?')
        valores.push(datos.cuota_amortizacion)
        campos.push('calculado_automaticamente = ?')
        valores.push(false)
      }
      if (datos.observaciones !== undefined) {
        campos.push('observaciones = ?')
        valores.push(datos.observaciones)
      }

      if (campos.length === 0) {
        return {
          success: false,
          error: 'No hay campos para actualizar'
        }
      }

      valores.push(id)

      // Obtener la amortización actual
      const amortizacionQuery = `
        SELECT * FROM amortizaciones WHERE id = ?
      `
      const amortizacionResult = await executeQuery(amortizacionQuery, [id])
      
      if ((amortizacionResult as any[]).length === 0) {
        return {
          success: false,
          error: 'Amortización no encontrada'
        }
      }

      const amortizacion = (amortizacionResult as any[])[0]

      // Actualizar valor final si se cambió la cuota
      if (datos.cuota_amortizacion !== undefined) {
        const nuevoValorFinal = amortizacion.valor_inicial - datos.cuota_amortizacion
        campos.push('valor_final = ?')
        valores.splice(-1, 0, nuevoValorFinal) // Insertar antes del id
      }

      const query = `
        UPDATE amortizaciones 
        SET ${campos.join(', ')} 
        WHERE id = ?
      `
      await executeQuery(query, valores)

      // Obtener la amortización actualizada
      const amortizacionActualizada = await executeQuery(
        `SELECT * FROM amortizaciones WHERE id = ?`,
        [id]
      )

      return {
        success: true,
        data: (amortizacionActualizada as any[])[0],
        message: 'Amortización actualizada exitosamente'
      }
    } catch (error) {
      console.error('Error actualizando amortización:', error)
      return {
        success: false,
        error: 'Error interno del servidor'
      }
    }
  }

  // Obtener resumen de amortizaciones por año
  static async obtenerResumenAnual(año: number, userId: number): Promise<any> {
    const query = `
      SELECT 
        am.periodo_año,
        COUNT(*) as total_amortizaciones,
        SUM(am.cuota_amortizacion) as total_cuotas,
        AVG(am.cuota_amortizacion) as promedio_cuotas,
        COUNT(DISTINCT am.activo_id) as activos_amortizados,
        COUNT(DISTINCT a.cliente_id) as clientes_afectados
      FROM amortizaciones am
      INNER JOIN activos a ON am.activo_id = a.id
      WHERE am.periodo_año = ? AND a.usuario_id = ?
      GROUP BY am.periodo_año
    `
    const result = await executeQuery(query, [año, userId])
    const resumen = result as any[]
    return resumen.length > 0 ? resumen[0] : null
  }

  // Obtener detalle de amortizaciones por categoría
  static async obtenerPorCategoria(categoriaId: number, userId: number, año?: number): Promise<any[]> {
    let query = `
      SELECT am.id, am.activo_id, am.periodo_año, am.periodo_mes, am.valor_inicial,
             am.cuota_amortizacion, am.valor_final, am.metodo_aplicado,
             am.calculado_automaticamente, am.observaciones, am.fecha_calculo,
             am.fecha_actualizacion,
             a.nombre as activo_nombre, a.numero_serie,
             c.nombre as categoria_nombre,
             cl.nombre as cliente_nombre, cl.rut as cliente_rut
      FROM amortizaciones am
      INNER JOIN activos a ON am.activo_id = a.id
      INNER JOIN categorias c ON a.categoria_id = c.id
      INNER JOIN clientes cl ON a.cliente_id = cl.id
      WHERE c.id = ? AND a.usuario_id = ?
    `
    const params = [categoriaId, userId]

    if (año) {
      query += ` AND am.periodo_año = ?`
      params.push(año)
    }

    query += ` ORDER BY am.periodo_año DESC, am.periodo_mes DESC, cl.nombre, a.nombre`

    const result = await executeQuery(query, params)
    return result as any[]
  }
}
