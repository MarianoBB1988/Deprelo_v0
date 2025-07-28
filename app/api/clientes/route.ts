import { NextRequest, NextResponse } from 'next/server'
import { ClienteService } from '@/lib/services/cliente.service'
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
    const conActivos = url.searchParams.get('conActivos')
    const buscar = url.searchParams.get('buscar')

    let clientes

    if (conActivos === 'true') {
      clientes = await ClienteService.obtenerConActivos(userId)
    } else if (buscar) {
      clientes = await ClienteService.buscar(buscar, userId)
    } else {
      clientes = await ClienteService.obtenerTodos(userId)
    }

    return NextResponse.json({
      success: true,
      data: clientes
    })
  } catch (error) {
    console.error('Error obteniendo clientes:', error)
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
    
    const resultado = await ClienteService.crear(datos, userId)
    
    if (resultado.success) {
      return NextResponse.json(resultado, { status: 201 })
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('Error creando cliente:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
