"use client"

import { useRouter } from 'next/navigation'
import { MainApp } from '@/components/main-app'

interface DashboardWrapperProps {
  user: {
    id: number
    email: string
    nombre: string
    rol?: string
  }
}

export function DashboardWrapper({ user }: DashboardWrapperProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        router.push('/login')
        router.refresh()
      } else {
        console.error('Error en logout')
      }
    } catch (error) {
      console.error('Error en logout:', error)
    }
  }

  const mainAppUser = {
    email: user.email,
    rol: user.rol || 'contador'
  }

  return <MainApp user={mainAppUser} onLogout={handleLogout} />
}
