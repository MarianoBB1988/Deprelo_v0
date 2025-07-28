import { NextRequest, NextResponse } from 'next/server'
import { DashboardService } from '@/lib/services/dashboard.service'
import { getUserIdFromRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const estadisticas = await DashboardService.obtenerEstadisticasGenerales(userId)
    
    return NextResponse.json({
      success: true,
      data: estadisticas
    })
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
