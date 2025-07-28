import { NextRequest, NextResponse } from 'next/server'
import { ActivoService } from '@/lib/services/activo.service'
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
    const clienteId = url.searchParams.get('clienteId')
    const categoriaId = url.searchParams.get('categoriaId')
    const buscar = url.searchParams.get('buscar')
    const estadisticas = url.searchParams.get('estadisticas')

    let activos

    if (estadisticas === 'true') {
      activos = await ActivoService.obtenerEstadisticas(userId)
    } else if (clienteId) {
      activos = await ActivoService.obtenerPorCliente(parseInt(clienteId), userId)
    } else if (categoriaId) {
      activos = await ActivoService.obtenerPorCategoria(parseInt(categoriaId), userId)
    } else if (buscar) {
      activos = await ActivoService.buscar(buscar, userId)
    } else {
      activos = await ActivoService.obtenerTodos(userId)
    }

    return NextResponse.json({
      success: true,
      data: activos
    })
  } catch (error) {
    console.error('Error obteniendo activos:', error)
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
    // Obtener el userId del token de autenticación
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    const datos = await request.json()
    // Agregar userId a los datos
    datos.usuario_id = userId
    
    const resultado = await ActivoService.crear(datos)
    
    if (resultado.success) {
      return NextResponse.json(resultado, { status: 201 })
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('Error creando activo:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
