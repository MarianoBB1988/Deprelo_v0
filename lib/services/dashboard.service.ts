import { executeQuery } from '../database'
import { VistaDashboard } from '../types'

export class DashboardService {
  
  // Obtener estadísticas generales para el dashboard
  static async obtenerEstadisticasGenerales(userId: number): Promise<VistaDashboard> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM activos WHERE activo = TRUE AND usuario_id = ?) as total_activos,
        (SELECT COUNT(*) FROM clientes WHERE activo = TRUE AND usuario_id = ?) as total_clientes,
        (SELECT COUNT(*) FROM categorias WHERE activo = TRUE AND usuario_id = ?) as total_categorias,
        (SELECT COALESCE(SUM(valor_adquisicion), 0) FROM activos WHERE activo = TRUE AND usuario_id = ?) as valor_total_activos,
        (SELECT COALESCE(SUM(am.cuota_amortizacion), 0) 
         FROM amortizaciones am 
         INNER JOIN activos a ON am.activo_id = a.id 
         WHERE am.periodo_año = YEAR(CURDATE()) AND a.usuario_id = ?) as amortizacion_anual_actual
    `
    const result = await executeQuery(query, [userId, userId, userId, userId, userId])
    const stats = result as any[]
    return stats[0] as VistaDashboard
  }

  // Obtener estadísticas por categoría
  static async obtenerEstadisticasPorCategoria(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        c.id,
        c.nombre as categoria_nombre,
        COUNT(a.id) as total_activos,
        COALESCE(SUM(a.valor_adquisicion), 0) as valor_total,
        COALESCE(SUM(a.valor_residual), 0) as valor_residual_total,
        COALESCE(AVG(a.valor_adquisicion), 0) as valor_promedio
      FROM categorias c
      LEFT JOIN activos a ON c.id = a.categoria_id AND a.activo = TRUE AND a.usuario_id = ?
      WHERE c.activo = TRUE AND c.usuario_id = ?
      GROUP BY c.id, c.nombre
      ORDER BY valor_total DESC
    `
    const result = await executeQuery(query, [userId, userId])
    return result as any[]
  }

  // Obtener estadísticas por cliente
  static async obtenerEstadisticasPorCliente(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        cl.id,
        cl.nombre as cliente_nombre,
        cl.rut,
        COUNT(a.id) as total_activos,
        COALESCE(SUM(a.valor_adquisicion), 0) as valor_total,
        COALESCE(SUM(a.valor_residual), 0) as valor_residual_total,
        COALESCE(AVG(a.valor_adquisicion), 0) as valor_promedio,
        MIN(a.fecha_adquisicion) as primera_compra,
        MAX(a.fecha_adquisicion) as ultima_compra,
        COUNT(DISTINCT a.categoria_id) as categorias_diferentes
      FROM clientes cl
      LEFT JOIN activos a ON cl.id = a.cliente_id AND a.activo = TRUE AND a.usuario_id = ?
      WHERE cl.activo = TRUE AND cl.usuario_id = ?
      GROUP BY cl.id, cl.nombre, cl.rut
      ORDER BY valor_total DESC
    `
    const result = await executeQuery(query, [userId, userId])
    return result as any[]
  }

  // Obtener amortizaciones por mes del año actual
  static async obtenerAmortizacionesPorMes(userId: number, año?: number): Promise<any[]> {
    const añoActual = año || new Date().getFullYear()
    const query = `
      SELECT 
        am.periodo_mes,
        COUNT(*) as total_amortizaciones,
        COALESCE(SUM(am.cuota_amortizacion), 0) as total_cuotas,
        COALESCE(AVG(am.cuota_amortizacion), 0) as promedio_cuotas,
        COUNT(DISTINCT am.activo_id) as activos_amortizados
      FROM amortizaciones am
      INNER JOIN activos a ON am.activo_id = a.id
      WHERE am.periodo_año = ? AND a.usuario_id = ?
      GROUP BY am.periodo_mes
      ORDER BY am.periodo_mes
    `
    const result = await executeQuery(query, [añoActual, userId])
    return result as any[]
  }

  // Obtener evolución de activos por año
  static async obtenerEvolucionActivos(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        YEAR(fecha_adquisicion) as año,
        COUNT(*) as activos_adquiridos,
        SUM(valor_adquisicion) as valor_total_año,
        AVG(valor_adquisicion) as valor_promedio_año
      FROM activos
      WHERE activo = TRUE AND usuario_id = ?
      GROUP BY YEAR(fecha_adquisicion)
      ORDER BY año DESC
      LIMIT 5
    `
    const result = await executeQuery(query, [userId])
    return result as any[]
  }

  // Obtener activos próximos a depreciarse completamente
  static async obtenerActivosProximosDepreciacion(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        a.id,
        a.nombre as activo_nombre,
        a.valor_adquisicion,
        a.valor_residual,
        a.fecha_adquisicion,
        c.nombre as categoria_nombre,
        c.vida_util_anos,
        cl.nombre as cliente_nombre,
        YEAR(DATE_ADD(a.fecha_adquisicion, INTERVAL c.vida_util_anos YEAR)) as año_depreciacion_completa,
        DATEDIFF(DATE_ADD(a.fecha_adquisicion, INTERVAL c.vida_util_anos YEAR), CURDATE()) as dias_restantes
      FROM activos a
      INNER JOIN categorias c ON a.categoria_id = c.id
      INNER JOIN clientes cl ON a.cliente_id = cl.id
      WHERE a.activo = TRUE AND a.usuario_id = ?
      AND DATE_ADD(a.fecha_adquisicion, INTERVAL c.vida_util_anos YEAR) > CURDATE()
      AND DATE_ADD(a.fecha_adquisicion, INTERVAL c.vida_util_anos YEAR) <= DATE_ADD(CURDATE(), INTERVAL 1 YEAR)
      ORDER BY dias_restantes ASC
    `
    const result = await executeQuery(query, [userId])
    return result as any[]
  }

  // Obtener top activos por valor
  static async obtenerTopActivosPorValor(userId: number, limit: number = 10): Promise<any[]> {
    const query = `
      SELECT 
        a.id,
        a.nombre as activo_nombre,
        a.valor_adquisicion,
        a.valor_residual,
        a.fecha_adquisicion,
        c.nombre as categoria_nombre,
        cl.nombre as cliente_nombre,
        cl.rut as cliente_rut,
        (a.valor_adquisicion - a.valor_residual) as valor_amortizable
      FROM activos a
      INNER JOIN categorias c ON a.categoria_id = c.id
      INNER JOIN clientes cl ON a.cliente_id = cl.id
      WHERE a.activo = TRUE AND a.usuario_id = ?
      ORDER BY a.valor_adquisicion DESC
      LIMIT ?
    `
    const result = await executeQuery(query, [userId, limit])
    return result as any[]
  }

  // Obtener distribución de activos por estado
  static async obtenerDistribucionPorEstado(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        estado,
        COUNT(*) as cantidad,
        SUM(valor_adquisicion) as valor_total,
        AVG(valor_adquisicion) as valor_promedio
      FROM activos
      WHERE activo = TRUE AND usuario_id = ?
      GROUP BY estado
      ORDER BY cantidad DESC
    `
    const result = await executeQuery(query, [userId])
    return result as any[]
  }

  // Obtener resumen de amortizaciones por método
  static async obtenerResumenPorMetodo(userId: number): Promise<any[]> {
    const query = `
      SELECT 
        c.metodo_amortizacion,
        COUNT(DISTINCT a.id) as total_activos,
        SUM(a.valor_adquisicion) as valor_total_activos,
        COUNT(am.id) as total_amortizaciones,
        SUM(am.cuota_amortizacion) as total_cuotas_amortizacion,
        AVG(am.cuota_amortizacion) as promedio_cuotas
      FROM categorias c
      LEFT JOIN activos a ON c.id = a.categoria_id AND a.activo = TRUE AND a.usuario_id = ?
      LEFT JOIN amortizaciones am ON a.id = am.activo_id
      WHERE c.activo = TRUE AND c.usuario_id = ?
      GROUP BY c.metodo_amortizacion
      ORDER BY total_activos DESC
    `
    const result = await executeQuery(query, [userId, userId])
    return result as any[]
  }

  // Obtener alertas y notificaciones
  static async obtenerAlertas(userId: number): Promise<any[]> {
    const alertas = []

    // Activos sin amortizaciones calculadas
    const sinAmortizacionesQuery = `
      SELECT 
        a.id,
        a.nombre as activo_nombre,
        cl.nombre as cliente_nombre,
        'sin_amortizaciones' as tipo_alerta,
        'Este activo no tiene amortizaciones calculadas' as mensaje
      FROM activos a
      INNER JOIN clientes cl ON a.cliente_id = cl.id
      LEFT JOIN amortizaciones am ON a.id = am.activo_id
      WHERE a.activo = TRUE AND a.usuario_id = ?
      AND am.id IS NULL
    `
    const sinAmortizaciones = await executeQuery(sinAmortizacionesQuery, [userId])
    alertas.push(...(sinAmortizaciones as any[]))

    // Activos con valor residual mayor al 50% del valor de adquisición
    const valorResidualAltoQuery = `
      SELECT 
        a.id,
        a.nombre as activo_nombre,
        cl.nombre as cliente_nombre,
        'valor_residual_alto' as tipo_alerta,
        CONCAT('El valor residual (', FORMAT(a.valor_residual, 0), ') es muy alto comparado con el valor de adquisición (', FORMAT(a.valor_adquisicion, 0), ')') as mensaje
      FROM activos a
      INNER JOIN clientes cl ON a.cliente_id = cl.id
      WHERE a.activo = TRUE AND a.usuario_id = ?
      AND a.valor_residual > (a.valor_adquisicion * 0.5)
    `
    const valorResidualAlto = await executeQuery(valorResidualAltoQuery, [userId])
    alertas.push(...(valorResidualAlto as any[]))

    return alertas
  }

  // Obtener métricas de rendimiento
  static async obtenerMetricasRendimiento(userId: number): Promise<any> {
    const query = `
      SELECT 
        COUNT(DISTINCT a.id) as total_activos_gestionados,
        COUNT(DISTINCT cl.id) as total_clientes_activos,
        COUNT(DISTINCT c.id) as total_categorias_utilizadas,
        COUNT(am.id) as total_amortizaciones_calculadas,
        (SELECT COUNT(*) FROM amortizaciones am2 
         INNER JOIN activos a2 ON am2.activo_id = a2.id 
         WHERE am2.calculado_automaticamente = TRUE AND a2.usuario_id = ?) as amortizaciones_automaticas,
        (SELECT COUNT(*) FROM amortizaciones am2 
         INNER JOIN activos a2 ON am2.activo_id = a2.id 
         WHERE am2.calculado_automaticamente = FALSE AND a2.usuario_id = ?) as amortizaciones_manuales,
        AVG(DATEDIFF(CURDATE(), a.fecha_adquisicion)) as antiguedad_promedio_dias,
        SUM(a.valor_adquisicion) / COUNT(DISTINCT cl.id) as valor_promedio_por_cliente
      FROM activos a
      INNER JOIN clientes cl ON a.cliente_id = cl.id
      INNER JOIN categorias c ON a.categoria_id = c.id
      LEFT JOIN amortizaciones am ON a.id = am.activo_id
      WHERE a.activo = TRUE AND a.usuario_id = ?
    `
    const result = await executeQuery(query, [userId, userId, userId])
    const metricas = result as any[]
    return metricas[0]
  }
}
