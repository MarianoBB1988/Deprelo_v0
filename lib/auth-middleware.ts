// ============================================
// MIDDLEWARE DE AUTENTICACIÓN MULTI-TENANT
// Sistema de JWT con aislamiento por usuario
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { getConnection } from '@/lib/database'

// ============================================
// TIPOS PARA AUTENTICACIÓN
// ============================================

export interface UserToken {
  userId: number
  email: string
  nombre: string
  rol: 'admin' | 'contador'
  iat: number
  exp: number
}

export interface AuthResult {
  success: boolean
  user?: UserToken
  token?: string
  message?: string
}

// ============================================
// SERVICIO DE AUTENTICACIÓN
// ============================================

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
  private static readonly JWT_EXPIRES_IN = '24h'

  // Registrar nuevo usuario con su propio tenant
  static async register(datos: {
    email: string
    password: string
    nombre: string
    apellido: string
    crearDatosEjemplo?: boolean
  }): Promise<AuthResult> {
    try {
      const connection = await getConnection()
      
      // Verificar si el email ya existe
      const [existingUsers] = await connection.execute(
        'SELECT id FROM usuarios WHERE email = ?',
        [datos.email]
      )
      
      if ((existingUsers as any[]).length > 0) {
        return {
          success: false,
          message: 'El email ya está registrado'
        }
      }

      // Hashear password
      const hashedPassword = await bcrypt.hash(datos.password, 10)

      // Crear nuevo tenant usando el procedimiento almacenado
      const [result] = await connection.execute(
        'CALL crear_nuevo_tenant(?, ?, ?, ?, ?)',
        [
          datos.email,
          hashedPassword,
          datos.nombre,
          datos.apellido,
          datos.crearDatosEjemplo || true
        ]
      )

      const newUser = (result as any[])[0]
      
      // Generar JWT
      const token = this.generateToken({
        userId: newUser.usuario_id,
        email: datos.email,
        nombre: datos.nombre,
        rol: 'contador'
      })

      return {
        success: true,
        user: {
          userId: newUser.usuario_id,
          email: datos.email,
          nombre: datos.nombre,
          rol: 'contador',
          iat: 0,
          exp: 0
        },
        token,
        message: 'Usuario registrado exitosamente'
      }

    } catch (error) {
      console.error('Error en registro:', error)
      return {
        success: false,
        message: 'Error interno del servidor'
      }
    }
  }

  // Login de usuario
  static async login(email: string, password: string): Promise<AuthResult> {
    try {
      const connection = await getConnection()
      
      // Buscar usuario
      const [users] = await connection.execute(
        'SELECT * FROM usuarios WHERE email = ? AND activo = TRUE',
        [email]
      )

      const user = (users as any[])[0]
      
      if (!user) {
        return {
          success: false,
          message: 'Credenciales inválidas'
        }
      }

      // Verificar password
      const passwordValid = await bcrypt.compare(password, user.password)
      
      if (!passwordValid) {
        return {
          success: false,
          message: 'Credenciales inválidas'
        }
      }

      // Generar JWT
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      })

      return {
        success: true,
        user: {
          userId: user.id,
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
          iat: 0,
          exp: 0
        },
        token,
        message: 'Login exitoso'
      }

    } catch (error) {
      console.error('Error en login:', error)
      return {
        success: false,
        message: 'Error interno del servidor'
      }
    }
  }

  // Verificar token JWT
  static verifyToken(token: string): UserToken | null {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as UserToken
      return decoded
    } catch (error) {
      return null
    }
  }

  // Generar token JWT
  private static generateToken(payload: Omit<UserToken, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN })
  }

  // Obtener usuario del request
  static async getUserFromRequest(request: NextRequest): Promise<UserToken | null> {
    try {
      // Intentar obtener token del header Authorization
      const authHeader = request.headers.get('authorization')
      let token: string | undefined

      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      } else {
        // Fallback a cookie
        token = request.cookies.get('auth-token')?.value
      }

      if (!token) {
        return null
      }

      return this.verifyToken(token)
    } catch (error) {
      return null
    }
  }
}

// ============================================
// MIDDLEWARE PARA PROTEGER RUTAS
// ============================================

export function requireAuth(handler: (request: NextRequest, user: UserToken) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const user = await AuthService.getUserFromRequest(request)
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Token de autenticación requerido' },
          { status: 401 }
        )
      }

      // Establecer el usuario actual en el contexto de la BD
      const connection = await getConnection()
      await connection.execute('SET @current_user_id = ?', [user.userId])

      return handler(request, user)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Error de autenticación' },
        { status: 401 }
      )
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export async function getUserIdFromRequest(request: NextRequest): Promise<number | null> {
  const user = await AuthService.getUserFromRequest(request)
  return user ? user.userId : null
}

export async function setUserContext(userId: number): Promise<void> {
  const connection = await getConnection()
  await connection.execute('SET @current_user_id = ?', [userId])
}

// ============================================
// EJEMPLO DE USO EN APIs
// ============================================

/*
// app/api/auth/register/route.ts
export async function POST(request: NextRequest) {
  try {
    const datos = await request.json()
    const result = await AuthService.register(datos)
    
    if (result.success && result.token) {
      const response = NextResponse.json(result)
      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 // 24 horas
      })
      return response
    }
    
    return NextResponse.json(result, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const result = await AuthService.login(email, password)
    
    if (result.success && result.token) {
      const response = NextResponse.json(result)
      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60
      })
      return response
    }
    
    return NextResponse.json(result, { status: 401 })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// app/api/activos/route.ts
export const GET = requireAuth(async (request: NextRequest, user: UserToken) => {
  try {
    const activos = await ActivoService.obtenerTodos(user.userId)
    return NextResponse.json({ success: true, data: activos })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
})

// O usando el helper getUserIdFromRequest:
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    const activos = await ActivoService.obtenerTodos(userId)
    return NextResponse.json({ success: true, data: activos })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message === 'Usuario no autenticado' ? 401 : 500 }
    )
  }
}
*/
