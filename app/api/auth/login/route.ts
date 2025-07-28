import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import bcrypt from 'bcrypt'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-jwt-ultra-segura-de-al-menos-32-caracteres-muy-larga-y-compleja-2024'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email y contraseña son requeridos' 
        },
        { status: 400 }
      )
    }

    // Obtener usuario con password para validación
    const query = `
      SELECT id, email, password, rol, nombre, apellido, activo 
      FROM usuarios 
      WHERE email = ? AND activo = 1
    `
    const result = await executeQuery(query, [email]) as any[]
    
    if (result.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Credenciales inválidas' 
        },
        { status: 401 }
      )
    }

    const usuario = result[0]
    
    // Validar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password)
    
    if (!passwordValida) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Credenciales inválidas' 
        },
        { status: 401 }
      )
    }

    // Retornar usuario sin contraseña
    const { password: _, ...usuarioSinPassword } = usuario
    
    // Generar JWT token usando jose
    const secret = new TextEncoder().encode(JWT_SECRET)
    const token = await new SignJWT({ 
      userId: usuario.id, 
      email: usuario.email, 
      nombre: usuario.nombre,
      rol: usuario.rol
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)

    // Configurar cookie httpOnly
    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/'
    })
    
    console.log('[LOGIN] Cookie establecida exitosamente')
    console.log('[LOGIN] Usuario autenticado:', usuarioSinPassword.email)
    
    return NextResponse.json({
      success: true,
      data: usuarioSinPassword
    })
    
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
