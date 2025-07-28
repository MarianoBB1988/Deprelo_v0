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
    const clientes = await ClienteService.obtenerTodos(userId)
    
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
