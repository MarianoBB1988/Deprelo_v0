import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import { executeQuery } from '@/lib/database';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-jwt-ultra-segura-de-al-menos-32-caracteres-muy-larga-y-compleja-2024';

export async function POST(request: NextRequest) {
  try {
    const { nombre, apellido, email, password, confirmPassword } = await request.json();

    // Validaciones básicas
    if (!nombre || !apellido || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Todos los campos son requeridos' 
        },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Las contraseñas no coinciden' 
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La contraseña debe tener al menos 6 caracteres' 
        },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const checkEmailQuery = `
      SELECT id FROM usuarios WHERE email = ?
    `
    const existingUser = await executeQuery(checkEmailQuery, [email]) as any[]
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Este email ya está registrado' 
        },
        { status: 409 }
      )
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Insertar nuevo usuario
    const insertQuery = `
      INSERT INTO usuarios (nombre, apellido, email, password, rol, activo, fecha_creacion)
      VALUES (?, ?, ?, ?, 'contador', TRUE, NOW())
    `
    
    const result = await executeQuery(insertQuery, [nombre, apellido, email, hashedPassword]) as any
    const userId = result.insertId

    // Obtener el usuario creado
    const getUserQuery = `
      SELECT id, email, nombre, apellido, rol, activo 
      FROM usuarios 
      WHERE id = ?
    `
    const newUser = await executeQuery(getUserQuery, [userId]) as any[]
    const usuario = newUser[0]

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
    
    console.log('[REGISTER] Usuario registrado exitosamente:', usuario.email)
    
    return NextResponse.json({
      success: true,
      data: usuario,
      message: 'Usuario registrado exitosamente'
    })
    
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
