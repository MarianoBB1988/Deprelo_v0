import { NextRequest, NextResponse } from 'next/server'
import { CategoriaService } from '@/lib/services/categoria.service'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    const categoria = await CategoriaService.obtenerPorId(id)
    
    if (!categoria) {
      return NextResponse.json(
        { success: false, error: 'Categoría no encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: categoria
    })
  } catch (error) {
    console.error('Error obteniendo categoría:', error)
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
    const resultado = await CategoriaService.actualizar(id, datos)
    
    if (resultado.success) {
      return NextResponse.json(resultado)
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('Error actualizando categoría:', error)
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
    const resultado = await CategoriaService.eliminar(id)
    
    if (resultado.success) {
      return NextResponse.json(resultado)
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('Error eliminando categoría:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
