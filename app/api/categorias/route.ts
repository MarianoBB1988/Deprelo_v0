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
    
    const resultado = await CategoriaService.crear(datos)
    
    if (resultado.success) {
      return NextResponse.json(resultado, { status: 201 })
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('Error creando categoría:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
