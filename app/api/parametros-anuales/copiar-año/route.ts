import { NextRequest, NextResponse } from 'next/server'
import { ParametroAnualService } from '@/lib/services/parametro-anual.service'
import { getUserIdFromRequest } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { año_origen, año_destino, coeficiente_ajuste } = await request.json()
    
    const resultado = await ParametroAnualService.copiarParametrosAño(
      año_origen,
      año_destino,
      userId,
      coeficiente_ajuste
    )
    
    return NextResponse.json({
      success: true,
      data: resultado,
      message: `Parámetros copiados desde ${año_origen} a ${año_destino}`
    })
  } catch (error) {
    console.error('Error en POST /api/parametros-anuales/copiar-año:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
