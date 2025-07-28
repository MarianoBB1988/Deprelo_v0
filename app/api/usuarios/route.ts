import { NextRequest, NextResponse } from 'next/server'
import { UsuarioService } from '@/lib/services/usuario.service'

export async function GET() {
  try {
    const usuarios = await UsuarioService.obtenerTodos()
    return NextResponse.json({
      success: true,
      data: usuarios
    })
  } catch (error) {
    console.error('Error obteniendo usuarios:', error)
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
    const datos = await request.json()
    const resultado = await UsuarioService.crear(datos)
    
    if (resultado.success) {
      return NextResponse.json(resultado, { status: 201 })
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('Error creando usuario:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
