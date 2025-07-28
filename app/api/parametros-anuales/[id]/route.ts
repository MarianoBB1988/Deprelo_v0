import { NextRequest, NextResponse } from 'next/server'
import { ParametroAnualService } from '@/lib/services/parametro-anual.service'
import { getUserIdFromRequest } from '@/lib/auth-middleware'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const parametroId = parseInt(params.id)
    
    await ParametroAnualService.actualizarParametro(parametroId, data, userId)
    
    return NextResponse.json({
      success: true,
      message: 'Parámetro actualizado correctamente'
    })
  } catch (error) {
    console.error('Error en PUT /api/parametros-anuales/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const parametroId = parseInt(params.id)
    
    await ParametroAnualService.eliminarParametro(parametroId, userId)
    
    return NextResponse.json({
      success: true,
      message: 'Parámetro eliminado correctamente'
    })
  } catch (error) {
    console.error('Error en DELETE /api/parametros-anuales/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor'
      },
      { status: 500 }
    )
  }
}
