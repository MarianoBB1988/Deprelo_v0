import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { OAuth2Client } from 'google-auth-library'

const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-jwt-ultra-segura-de-al-menos-32-caracteres-muy-larga-y-compleja-2024'
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const OAUTH_MODE = process.env.GOOGLE_OAUTH_MODE || 'development'

export async function POST(request: NextRequest) {
  try {
    const { credential, mockData } = await request.json()
    
    console.log('[GOOGLE AUTH] Credential recibido:', credential)
    console.log('[GOOGLE AUTH] Mock data recibido:', mockData)
    console.log('[GOOGLE AUTH] Modo OAuth:', OAUTH_MODE)
    
    if (!credential) {
      console.log('[GOOGLE AUTH] No se recibió credential')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Token de Google requerido' 
        },
        { status: 400 }
      )
    }

    let payload;

    // Modo de desarrollo vs producción
    if (OAUTH_MODE === 'production' && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
      // ===== MODO PRODUCCIÓN: Google OAuth Real =====
      try {
        console.log('[GOOGLE AUTH] Usando Google OAuth real')
        
        const client = new OAuth2Client(GOOGLE_CLIENT_ID)
        
        // Verificar el token real de Google
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID,
        })
        
        const googlePayload = ticket.getPayload()
        
        if (!googlePayload) {
          throw new Error('Token de Google inválido')
        }
        
        payload = {
          email: googlePayload.email,
          name: googlePayload.name,
          given_name: googlePayload.given_name,
          family_name: googlePayload.family_name,
          picture: googlePayload.picture
        }
        
        console.log('[GOOGLE AUTH] Token real verificado:', payload.email)
        
      } catch (error) {
        console.error('[GOOGLE AUTH] Error verificando token real:', error)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Token de Google inválido' 
          },
          { status: 400 }
        )
      }
    } else {
      // ===== MODO DESARROLLO: Simulación =====
      if (credential === 'mock-google-token' && mockData) {
        payload = mockData
        console.log('[GOOGLE AUTH] Usando datos simulados:', payload)
      } else {
        // Intentar decodificar JWT simulado
        try {
          if (credential.startsWith('header.')) {
            const parts = credential.split('.')
            const encodedPayload = parts[1]
            payload = JSON.parse(atob(encodedPayload))
            console.log('[GOOGLE AUTH] Token simulado decodificado:', payload)
          } else {
            // Fallback para otros formatos
            payload = JSON.parse(atob(credential.split('.')[1]))
            console.log('[GOOGLE AUTH] Token decodificado:', payload)
          }
        } catch (error) {
          console.error('[GOOGLE AUTH] Error decodificando token:', error)
          return NextResponse.json(
            { 
              success: false, 
              error: 'Token de Google inválido' 
            },
            { status: 400 }
          )
        }
      }
    }

    const { email, name, given_name, family_name, picture } = payload

    if (!email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email no encontrado en la cuenta de Google' 
        },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const checkUserQuery = `
      SELECT id, email, nombre, apellido, rol, activo 
      FROM usuarios 
      WHERE email = ?
    `
    const existingUser = await executeQuery(checkUserQuery, [email]) as any[]
    
    let usuario;
    
    if (existingUser.length > 0) {
      // Usuario existe, hacer login
      usuario = existingUser[0]
      console.log('[GOOGLE AUTH] Usuario existente logueado:', email)
    } else {
      // Usuario no existe, crear nuevo
      const insertQuery = `
        INSERT INTO usuarios (nombre, apellido, email, password, rol, activo, avatar_url)
        VALUES (?, ?, ?, NULL, 'contador', TRUE, ?)
      `
      
      const result = await executeQuery(insertQuery, [
        given_name || name, 
        family_name || '', 
        email, 
        picture
      ]) as any
      
      const userId = result.insertId

      // Obtener el usuario creado
      const getUserQuery = `
        SELECT id, email, nombre, apellido, rol, activo 
        FROM usuarios 
        WHERE id = ?
      `
      const newUser = await executeQuery(getUserQuery, [userId]) as any[]
      usuario = newUser[0]
      
      console.log('[GOOGLE AUTH] Nuevo usuario creado:', email)
    }

    // Generar JWT token
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
    
    return NextResponse.json({
      success: true,
      data: usuario,
      message: 'Autenticación con Google exitosa'
    })
    
  } catch (error) {
    console.error('Error en Google Auth:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
