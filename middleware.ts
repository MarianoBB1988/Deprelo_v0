import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-jwt-ultra-segura-de-al-menos-32-caracteres-muy-larga-y-compleja-2024'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`[MIDDLEWARE] Pathname: ${pathname}`)

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/google']
  
  // Excluir todas las rutas de API excepto las de auth (los endpoints manejan su propia autenticación)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    console.log(`[MIDDLEWARE] Ruta API, saltando middleware: ${pathname}`)
    return NextResponse.next()
  }
  
  if (publicPaths.includes(pathname)) {
    console.log(`[MIDDLEWARE] Ruta pública: ${pathname}`)
    return NextResponse.next()
  }

  // Obtener el token de autenticación
  const token = request.cookies.get('auth-token')?.value
  console.log(`[MIDDLEWARE] Token encontrado: ${token ? 'SÍ' : 'NO'}`)

  if (!token) {
    console.log(`[MIDDLEWARE] Sin token, redirigiendo a login desde: ${pathname}`)
    // Si no hay token y está intentando acceder a una ruta protegida, redirigir a login
    if (pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  try {
    // Verificar el token usando jose (compatible con Edge Runtime)
    const secret = new TextEncoder().encode(JWT_SECRET)
    await jwtVerify(token, secret)
    console.log(`[MIDDLEWARE] Token válido`)
    
    // Si el token es válido y está en la página de login, redirigir al dashboard
    if (pathname === '/login' || pathname === '/') {
      console.log(`[MIDDLEWARE] Token válido en ${pathname}, redirigiendo a dashboard`)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    
    return NextResponse.next()
  } catch (error) {
    console.log(`[MIDDLEWARE] Token inválido:`, error)
    // Token inválido, redirigir a login
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('auth-token')
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
