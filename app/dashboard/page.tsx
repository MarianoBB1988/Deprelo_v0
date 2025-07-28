import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { DashboardWrapper } from './dashboard-wrapper'

const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-jwt-ultra-segura-de-al-menos-32-caracteres-muy-larga-y-compleja-2024'

async function getUser() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')

    if (!token?.value) {
      return null
    }

    const decoded = jwt.verify(token.value, JWT_SECRET) as any
    return {
      id: decoded.userId,
      email: decoded.email,
      nombre: decoded.nombre,
      rol: decoded.rol
    }
  } catch (error) {
    return null
  }
}

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return <DashboardWrapper user={user} />
}
