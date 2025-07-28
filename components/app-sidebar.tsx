"use client"

import { Building2, Calculator, FileText, FolderOpen, Home, Package, Users, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Logo personalizado para Deprelo
const DepreloLogo = ({ className }: { className?: string }) => (
  <svg
    width="40px"
    height="40px"
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
)

const menuItems = [
  {
    title: "Dashboard",
    url: "dashboard",
    icon: Home,
  },
  {
    title: "Categorías",
    url: "categorias",
    icon: FolderOpen,
  },
  {
    title: "Activos",
    url: "activos",
    icon: Package,
  },
  {
    title: "Clientes",
    url: "clientes",
    icon: Users,
  },
  {
    title: "Amortizaciones",
    url: "amortizaciones",
    icon: Calculator,
  },
  {
    title: "Parámetros Anuales",
    url: "parametros-anuales",
    icon: Settings,
  },
  {
    title: "Reportes",
    url: "reportes",
    icon: FileText,
  },
]

interface AppSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function AppSidebar({ activeView, onViewChange }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div>
            <DepreloLogo className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Deprelo</h2>
            <p className="text-sm text-muted-foreground">Gestor de Activos</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton onClick={() => onViewChange(item.url)} isActive={activeView === item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
