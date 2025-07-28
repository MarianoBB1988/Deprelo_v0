# 🏗️ Sistema Multi-Tenant para DEPRELO

Este documento explica cómo implementar el sistema multi-tenant que permite que cada usuario tenga sus propios datos aislados.

## 📋 Opciones Disponibles

### ✅ **OPCIÓN RECOMENDADA: Multi-Tenancy por Fila**
- Cada usuario tiene sus datos aislados en las mismas tablas
- Filtrado automático por `usuario_id`
- Implementación simple y eficiente
- Ideal para tu caso de uso actual

### 🔄 **OPCIÓN AVANZADA: Base de Datos por Usuario**
- Cada usuario tiene su propia base de datos completa
- Máximo aislamiento pero mayor complejidad
- Para casos que requieren aislamiento total

## 🚀 Implementación Paso a Paso

### **PASO 1: Ejecutar Migración de Base de Datos**

```bash
# Conectar a MySQL
mysql -u root -p

# Ejecutar la migración
source database/migrate_multi_tenant.sql
```

Esto agregará:
- Campo `usuario_id` a todas las tablas principales
- Índices para optimizar consultas
- Triggers para auto-asignar usuarios
- Procedimientos almacenados para gestión
- Vistas para consultas optimizadas

### **PASO 2: Instalar Dependencias**

```bash
npm install jsonwebtoken bcrypt
npm install -D @types/jsonwebtoken @types/bcrypt
```

### **PASO 3: Actualizar Variables de Entorno**

```env
# .env.local
JWT_SECRET=tu-clave-secreta-muy-segura-aqui
NODE_ENV=production  # o development
```

### **PASO 4: Actualizar Servicios**

Reemplaza `lib/services/index.ts` con el contenido de `lib/services-multi-tenant.ts`:

```bash
# Hacer backup del archivo actual
cp lib/services/index.ts lib/services/index.ts.backup

# Usar la nueva implementación multi-tenant
cp lib/services-multi-tenant.ts lib/services/index.ts
```

### **PASO 5: Crear APIs de Autenticación**

#### A. Crear `app/api/auth/register/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const datos = await request.json()
    
    // Validar datos requeridos
    if (!datos.email || !datos.password || !datos.nombre || !datos.apellido) {
      return NextResponse.json(
        { success: false, message: 'Datos incompletos' },
        { status: 400 }
      )
    }

    const result = await AuthService.register({
      ...datos,
      crearDatosEjemplo: true // Crear categorías y datos de ejemplo
    })
    
    if (result.success && result.token) {
      const response = NextResponse.json({
        success: true,
        user: result.user,
        message: result.message
      })
      
      // Establecer cookie httpOnly con el token
      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 horas
        path: '/'
      })
      
      return response
    }
    
    return NextResponse.json(result, { status: 400 })
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

#### B. Crear `app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email y password requeridos' },
        { status: 400 }
      )
    }

    const result = await AuthService.login(email, password)
    
    if (result.success && result.token) {
      const response = NextResponse.json({
        success: true,
        user: result.user,
        message: result.message
      })
      
      response.cookies.set('auth-token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60,
        path: '/'
      })
      
      return response
    }
    
    return NextResponse.json(result, { status: 401 })
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
```

#### C. Crear `app/api/auth/logout/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logout exitoso' })
  
  response.cookies.delete('auth-token')
  
  return response
}
```

#### D. Crear `app/api/auth/me/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autenticado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Error de autenticación' },
      { status: 401 }
    )
  }
}
```

### **PASO 6: Actualizar APIs Existentes**

Actualiza todas las APIs existentes para usar autenticación:

#### Ejemplo con `app/api/activos/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ActivoService } from '@/lib/services'
import { getUserIdFromRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    const activos = await ActivoService.obtenerTodos(userId)
    
    return NextResponse.json({ success: true, data: activos })
  } catch (error) {
    const status = error.message === 'Usuario no autenticado' ? 401 : 500
    return NextResponse.json(
      { success: false, error: error.message },
      { status }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    const datos = await request.json()
    
    const id = await ActivoService.crear(datos, userId)
    
    return NextResponse.json({ success: true, id })
  } catch (error) {
    const status = error.message === 'Usuario no autenticado' ? 401 : 500
    return NextResponse.json(
      { success: false, error: error.message },
      { status }
    )
  }
}
```

### **PASO 7: Crear Componentes de Autenticación**

#### A. Componente de Login `components/auth/login-form.tsx`:

```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    apellido: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = isRegister ? '/api/auth/register' : '/api/auth/login'
      const body = isRegister ? formData : { email: formData.email, password: formData.password }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        })
        router.push('/dashboard')
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</CardTitle>
          <CardDescription>
            {isRegister ? 'Crea tu cuenta en DEPRELO' : 'Accede a tu cuenta de DEPRELO'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      required
                      value={formData.apellido}
                      onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Procesando...' : (isRegister ? 'Crear Cuenta' : 'Iniciar Sesión')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### B. Hook para autenticación `hooks/use-auth.ts`:

```typescript
"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface User {
  userId: number
  email: string
  nombre: string
  rol: 'admin' | 'contador'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  register: (datos: any) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setUser(result.user)
        }
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      
      if (result.success) {
        setUser(result.user)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error en login:', error)
      return false
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Error en logout:', error)
    } finally {
      setUser(null)
    }
  }

  const register = async (datos: any): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      })

      const result = await response.json()
      
      if (result.success) {
        setUser(result.user)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error en registro:', error)
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
```

## 🎯 Beneficios del Sistema Multi-Tenant

### ✅ **Para cada Usuario:**
- Datos completamente aislados
- No puede ver información de otros usuarios
- Experiencia personalizada
- Autonomía total sobre sus datos

### ✅ **Para el Sistema:**
- Escalabilidad eficiente
- Gestión centralizada
- Seguridad por diseño
- Fácil backup y mantenimiento

### ✅ **Para el Desarrollo:**
- Implementación gradual
- Compatible con código existente
- Middleware reutilizable
- Testing simplificado

## 🔧 Testing del Sistema

### **1. Prueba de Registro:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario1@test.com",
    "password": "password123",
    "nombre": "Usuario",
    "apellido": "Test"
  }'
```

### **2. Prueba de Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario1@test.com",
    "password": "password123"
  }'
```

### **3. Prueba de Aislamiento:**
- Registra 2 usuarios diferentes
- Crea activos con cada uno
- Verifica que cada usuario solo ve sus datos

## 🚨 Consideraciones de Seguridad

1. **JWT Secret:** Usa una clave secreta fuerte y única
2. **HTTPS:** Siempre en producción
3. **Cookies httpOnly:** Para prevenir XSS
4. **Validación:** Siempre valida `usuario_id` en consultas
5. **Rate Limiting:** Implementa límites en login/registro
6. **Logging:** Registra intentos de acceso sospechosos

## 📈 Próximos Pasos

1. **Ejecutar la migración de base de datos**
2. **Instalar dependencias necesarias**
3. **Implementar las APIs de autenticación**
4. **Actualizar componentes existentes**
5. **Probar el sistema completo**
6. **Desplegar a producción**

¿Quieres que implemente alguna parte específica o tienes preguntas sobre el proceso?
