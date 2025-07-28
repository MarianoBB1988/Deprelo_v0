import { NextRequest, NextResponse } from 'next/server'
import { ParametroAnualService } from '@/lib/services/parametro-anual.service'
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
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const año = searchParams.get('año')
    
    const parametros = await ParametroAnualService.obtenerParametrosPorAño(
      año ? parseInt(año) : new Date().getFullYear(),
      userId
    )
    
    return NextResponse.json({
      success: true,
      data: parametros
    })
  } catch (error) {
    console.error('Error en GET /api/parametros-anuales:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

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

    const data = await request.json()
    
    const parametroId = await ParametroAnualService.crearParametro(data, userId)
    
    return NextResponse.json({
      success: true,
      data: { id: parametroId }
    })
  } catch (error) {
    console.error('Error en POST /api/parametros-anuales:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
