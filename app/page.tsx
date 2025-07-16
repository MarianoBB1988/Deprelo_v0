"use client"

import { useState } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { MainApp } from "@/components/main-app"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ email: string; rol: string } | null>(null)

  const handleLogin = (email: string, password: string) => {
    // Simulación de autenticación
    if (email && password) {
      setUser({
        email,
        rol: email.includes("admin") ? "admin" : "contador",
      })
      setIsAuthenticated(true)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />
  }

  return <MainApp user={user} onLogout={handleLogout} />
}
