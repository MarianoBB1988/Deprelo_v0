import { NextRequest, NextResponse } from 'next/server'
import { AmortizacionService } from '@/lib/services/amortizacion.service'

interface RouteParams {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    const datos = await request.json()
    const resultado = await AmortizacionService.actualizarAmortizacion(id, datos)
    
    if (resultado.success) {
      return NextResponse.json(resultado)
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('Error actualizando amortización:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
