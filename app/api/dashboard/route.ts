import { NextRequest, NextResponse } from 'next/server'
import { DashboardService } from '@/lib/services/dashboard.service'
import { getUserIdFromRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Obtener el userId del token de autenticación
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const url = new URL(request.url)
    const tipo = url.searchParams.get('tipo')
    const año = url.searchParams.get('año')
    const limit = url.searchParams.get('limit')

    let datos

    switch (tipo) {
      case 'generales':
        datos = await DashboardService.obtenerEstadisticasGenerales(userId)
        break
      case 'categorias':
        datos = await DashboardService.obtenerEstadisticasPorCategoria(userId)
        break
      case 'clientes':
        datos = await DashboardService.obtenerEstadisticasPorCliente(userId)
        break
      case 'amortizaciones-mes':
        datos = await DashboardService.obtenerAmortizacionesPorMes(
          userId,
          año ? parseInt(año) : undefined
        )
        break
      case 'evolucion-activos':
        datos = await DashboardService.obtenerEvolucionActivos(userId)
        break
      case 'proximos-depreciacion':
        datos = await DashboardService.obtenerActivosProximosDepreciacion(userId)
        break
      case 'top-activos':
        datos = await DashboardService.obtenerTopActivosPorValor(
          userId,
          limit ? parseInt(limit) : 10
        )
        break
      case 'distribucion-estado':
        datos = await DashboardService.obtenerDistribucionPorEstado(userId)
        break
      case 'resumen-metodo':
        datos = await DashboardService.obtenerResumenPorMetodo(userId)
        break
      case 'alertas':
        datos = await DashboardService.obtenerAlertas(userId)
        break
      case 'metricas':
        datos = await DashboardService.obtenerMetricasRendimiento(userId)
        break
      default:
        datos = await DashboardService.obtenerEstadisticasGenerales(userId)
    }

    return NextResponse.json({
      success: true,
      data: datos
    })
  } catch (error) {
    console.error('Error obteniendo datos del dashboard:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
