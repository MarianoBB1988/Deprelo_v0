import { NextRequest, NextResponse } from 'next/server'
import { ClienteService } from '@/lib/services/cliente.service'
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
    const url = new URL(request.url)
    const estadisticas = url.searchParams.get('estadisticas')

    if (estadisticas === 'true') {
      const stats = await ClienteService.obtenerEstadisticas(userId)
      return NextResponse.json({
        success: true,
        data: stats
      })
    } else {
      const cliente = await ClienteService.obtenerPorId(id, userId)
      if (!cliente) {
        return NextResponse.json(
          { success: false, error: 'Cliente no encontrado o no tienes acceso a él' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        data: cliente
      })
    }
  } catch (error) {
    console.error('Error obteniendo cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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
    const datos = await request.json()
    const resultado = await ClienteService.actualizar(id, datos, userId)
    
    if (resultado.success) {
      return NextResponse.json(resultado)
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('Error actualizando cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
    const resultado = await ClienteService.eliminar(id, userId)
    
    if (resultado.success) {
      return NextResponse.json(resultado)
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('Error eliminando cliente:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
