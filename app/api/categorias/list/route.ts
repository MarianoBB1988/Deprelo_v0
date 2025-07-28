import { NextRequest, NextResponse } from 'next/server'
import { CategoriaService } from '@/lib/services/categoria.service'
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
    const categorias = await CategoriaService.obtenerTodas(userId)
    
    return NextResponse.json({
      success: true,
      data: categorias
    })
  } catch (error) {
    console.error('Error obteniendo categorías:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
