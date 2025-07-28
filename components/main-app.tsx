"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Dashboard } from "@/components/dashboard/dashboard"
import CategoriasView from "@/components/categorias/categorias-view"
import ActivosView from "@/components/activos/activos-view"
import ClientesView from "@/components/clientes/clientes-view"
import AmortizacionesView from "@/components/amortizaciones/amortizaciones-view"
import ParametrosAnualesView from "@/components/parametros/parametros-anuales-view"
import { ReportesView } from "@/components/reportes/reportes-view"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

interface MainAppProps {
  user: { email: string; rol: string } | null
  onLogout: () => void
}

export function MainApp({ user, onLogout }: MainAppProps) {
  const [activeView, setActiveView] = useState("dashboard")

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />
      case "categorias":
        return <CategoriasView />
      case "activos":
        return <ActivosView />
      case "clientes":
        return <ClientesView />
      case "amortizaciones":
        return <AmortizacionesView />
      case "parametros-anuales":
        return <ParametrosAnualesView />
      case "reportes":
        return <ReportesView />
      default:
        return <Dashboard />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar activeView={activeView} onViewChange={setActiveView} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">{user?.email}</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{user?.rol}</span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">{renderView()}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
