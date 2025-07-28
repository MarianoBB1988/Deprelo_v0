import { NextRequest, NextResponse } from 'next/server'
import { ActivoService } from '@/lib/services/activo.service'

export async function GET(request: NextRequest) {
  try {
    const activos = await ActivoService.obtenerTodos()
    
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
