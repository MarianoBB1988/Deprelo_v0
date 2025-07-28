import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { LoginForm } from '@/components/auth/login-form'

const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-jwt-ultra-segura-de-al-menos-32-caracteres-muy-larga-y-compleja-2024'

async function getUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    if (!token?.value) {
      return null
    }

    const decoded = jwt.verify(token.value, JWT_SECRET) as any
    return decoded
  } catch (error) {
    return null
  }
}

export default async function LoginPage() {
  const user = await getUser()

  // Si el usuario ya está autenticado, redirigir al dashboard
  if (user) {
    redirect('/dashboard')
  }

  return <LoginForm />
}
