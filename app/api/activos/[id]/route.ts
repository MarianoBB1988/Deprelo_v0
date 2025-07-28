import { NextRequest, NextResponse } from 'next/server'
import { ActivoService } from '@/lib/services/activo.service'
import { getUserIdFromRequest } from '@/lib/auth-middleware'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Obtener el userId del token de autenticación
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    const activo = await ActivoService.obtenerPorId(id, userId)
    
    if (!activo) {
      return NextResponse.json(
        { success: false, error: 'Activo no encontrado o no tienes acceso a él' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: activo
    })
  } catch (error) {
    console.error('Error obteniendo activo:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    const datos = await request.json()
    const resultado = await ActivoService.actualizar(id, datos)
    
    if (resultado.success) {
      return NextResponse.json(resultado)
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('Error actualizando activo:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    const resultado = await ActivoService.eliminar(id)
    
    if (resultado.success) {
      return NextResponse.json(resultado)
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('Error eliminando activo:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
