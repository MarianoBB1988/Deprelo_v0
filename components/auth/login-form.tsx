
// Declaración global para grecaptcha
declare global {
  interface Window {
    grecaptcha?: {
      execute(siteKey: string, options: { action: string }): Promise<string>;
    };
  }
}
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Loader2, AlertCircle, Mail, Eye, EyeOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const RECAPTCHA_SITE_KEY = "6Lei4qIrAAAAAKA93Vt40sFaH-qzgdrSe8tIFgXB";

export function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showGoogleEmailDialog, setShowGoogleEmailDialog] = useState(false)
  const [googleEmail, setGoogleEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Ejecutar reCaptcha v3
      if (window.grecaptcha) {
        const recaptchaToken = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "login" });
        if (!recaptchaToken) {
          setError("No se pudo validar reCaptcha. Intenta de nuevo.");
          setIsLoading(false);
          return;
        }

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const body = isLogin
          ? { email, password, recaptchaToken }
          : { nombre, apellido, email, password, confirmPassword, recaptchaToken };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error en la autenticación');
        }

        if (data.success) {
          await new Promise(resolve => setTimeout(resolve, 100));
          window.location.href = '/dashboard';
        } else {
          throw new Error(data.error || 'Error en la autenticación');
        }
      } else {
        setError("No se pudo cargar reCaptcha. Intenta de nuevo.");
      }
    } catch (error: any) {
      setError(error.message || 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    // Verificar si Google OAuth real está configurado
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    
    if (clientId && clientId !== 'abcdefg123456789' && !clientId.includes('YOUR_GOOGLE_CLIENT_ID') && typeof window !== 'undefined' && window.google) {
      // ===== GOOGLE OAUTH REAL =====
      try {
        console.log('[FRONTEND] Usando Google OAuth real con Client ID:', clientId)
        
        // Inicializar Google Sign-In
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            await handleRealGoogleLogin(response.credential)
          }
        })
        
        // Renderizar botón de Google directamente
        const buttonContainer = document.getElementById("google-signin-button")
        if (buttonContainer && window.google.accounts.id.renderButton) {
          // Limpiar el contenedor primero
          buttonContainer.innerHTML = ''
          
          window.google.accounts.id.renderButton(buttonContainer, { 
            theme: "outline", 
            size: "large",
            width: "100%",
            text: isLogin ? "signin_with" : "signup_with"
          })
          buttonContainer.classList.remove('hidden')
          
          // Hacer clic automáticamente en el botón de Google
          setTimeout(() => {
            const googleButton = buttonContainer.querySelector('div[role="button"]') as HTMLElement
            if (googleButton) {
              googleButton.click()
            }
          }, 100)
        }
        
      } catch (error) {
        console.error('[FRONTEND] Error con Google OAuth real:', error)
        setError('Error al inicializar Google Sign-In')
      }
    } else {
      // ===== MODO DESARROLLO: Simulación con modal =====
      console.log('[FRONTEND] Usando modo simulación - Client ID no configurado o Google script no cargado')
      setShowGoogleEmailDialog(true)
    }
  }

  const handleGoogleEmailSubmit = async () => {
    if (!googleEmail) {
      setError('Por favor ingresa tu email de Gmail')
      return
    }

    // Validar que sea un email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(googleEmail)) {
      setError('Por favor ingresa un email válido')
      return
    }

    setShowGoogleEmailDialog(false)
    setIsLoading(true)
    setError("")

    try {
      // Extraer el nombre del email para personalizar
      const emailName = googleEmail.split('@')[0]
      const capitalizedName = emailName.charAt(0).toUpperCase() + emailName.slice(1)

      // Datos simulados del usuario con el email real
      const mockGoogleData = {
        email: googleEmail,
        name: capitalizedName,
        given_name: capitalizedName,
        family_name: "Usuario",
        picture: "https://via.placeholder.com/150"
      }

      console.log('[FRONTEND] Enviando datos simulados:', mockGoogleData)

      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          credential: 'mock-google-token',
          mockData: mockGoogleData 
        }),
      })

      const data = await response.json()

      console.log('[FRONTEND] Respuesta recibida:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Error en la autenticación con Google')
      }

      if (data.success) {
        await new Promise(resolve => setTimeout(resolve, 100))
        window.location.href = '/dashboard'
      } else {
        throw new Error(data.error || 'Error en la autenticación con Google')
      }
    } catch (error: any) {
      console.error('[FRONTEND] Error en Google login:', error)
      setError(error.message || 'Error inesperado')
    } finally {
      setIsLoading(false)
      setGoogleEmail("")
    }
  }

  // Función para inicializar Google Sign-In (modo producción)
  const initializeGoogleSignIn = () => {
    // Solo inicializar si hay un client ID real configurado
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (typeof window !== 'undefined' && window.google && clientId && !clientId.includes('abcdefg')) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          handleRealGoogleLogin(response.credential)
        }
      })
      
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-button"),
        { 
          theme: "outline", 
          size: "large",
          width: "100%",
          text: isLogin ? "signin_with" : "signup_with"
        }
      )
    }
  }

  // Función para Google login real (cuando esté configurado)
  const handleRealGoogleLogin = async (credential: string) => {
    setIsLoading(true)
    setError("")

    try {
      console.log('[FRONTEND] Enviando token real de Google')
      
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      })

      const data = await response.json()

      console.log('[FRONTEND] Respuesta del servidor:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Error en la autenticación con Google')
      }

      if (data.success) {
        await new Promise(resolve => setTimeout(resolve, 100))
        window.location.href = '/dashboard'
      } else {
        throw new Error(data.error || 'Error en la autenticación con Google')
      }
    } catch (error: any) {
      console.error('[FRONTEND] Error en Google login real:', error)
      setError(error.message || 'Error inesperado')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Cargar el script de Google Sign-In
    if (!document.getElementById('google-signin-script')) {
      const script = document.createElement('script');
      script.id = 'google-signin-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }

    // Cargar el script de reCaptcha v3
    if (!document.getElementById('recaptcha-v3-script')) {
      const recaptchaScript = document.createElement('script');
      recaptchaScript.id = 'recaptcha-v3-script';
      recaptchaScript.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
      recaptchaScript.async = true;
      recaptchaScript.defer = true;
      document.head.appendChild(recaptchaScript);
    }
  }, [isLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div>
              <svg
                width="60px"
                height="60px"
                viewBox="0 0 36 36"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                aria-hidden="true"
                role="img"
                className="iconify iconify--twemoji"
                preserveAspectRatio="xMidYMid meet"
              >
                <path
                  fill="#3B88C3"
                  d="M36 32a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v28z"
                />
                <path
                  fill="#FFF"
                  d="M9.057 9.312c0-1.427.992-2.388 2.387-2.388h5.147c6.946 0 10.915 4.465 10.915 11.348C27.506 24.783 23.289 29 16.901 29h-5.395c-1.023 0-2.449-.559-2.449-2.325V9.312zm4.651 15.409h3.132c4 0 5.829-2.945 5.829-6.666c0-3.969-1.859-6.852-6.139-6.852h-2.822v13.518z"
                />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Deprelo</CardTitle>
          <CardDescription>
            {isLogin 
              ? "Ingresa tus credenciales para acceder al sistema"
              : "Crea tu cuenta para comenzar a usar Deprelo"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      type="text"
                      placeholder="Juan"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      type="text"
                      placeholder="Pérez"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      required
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
                placeholder="contador@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
            
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? "Iniciando sesión..." : "Registrando..."}
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  {isLogin ? "Iniciar Sesión" : "Registrarse"}
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O continúa con
                </span>
              </div>
            </div>
            
            <div className="mt-4">
              {/* Botón de Google para modo desarrollo */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isLogin ? "Iniciar sesión con Google" : "Registrarse con Google"}
              </Button>
              
              {/* Contenedor para el botón real de Google (cuando esté configurado) */}
              <div id="google-signin-button" className="w-full hidden"></div>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin)
                setError("")
                setEmail("")
                setPassword("")
                setConfirmPassword("")
                setNombre("")
                setApellido("")
              }}
              className="text-sm"
            >
              {isLogin 
                ? "¿No tienes cuenta? Regístrate aquí"
                : "¿Ya tienes cuenta? Inicia sesión aquí"
              }
            </Button>
          </div>
          
          {isLogin && (
            <div className="mt-4 text-sm text-muted-foreground text-center">
             
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para elegir email de Google */}
      <Dialog open={showGoogleEmailDialog} onOpenChange={setShowGoogleEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Ingresa con Google
            </DialogTitle>
            <DialogDescription>
              Para simular el login con Google, ingresa tu email de Gmail. En producción esto se haría automáticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google-email">Tu email de Gmail</Label>
              <Input
                id="google-email"
                type="email"
                placeholder="tu.email@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleGoogleEmailSubmit()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowGoogleEmailDialog(false)
                setGoogleEmail("")
                setError("")
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleGoogleEmailSubmit}
              disabled={!googleEmail || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                'Continuar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

