"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Package, TrendingUp, Users, Loader2 } from "lucide-react"

interface DashboardStats {
  total_activos: number
  total_clientes: number
  total_categorias: number
  valor_total_activos: number
  amortizacion_anual_actual: number
}

interface CategoriaStats {
  id: number
  categoria_nombre: string
  total_activos: number
  valor_total: number
  valor_residual_total: number
  valor_promedio: number
}

interface AmortizacionMes {
  periodo_mes: number
  total_amortizaciones: number
  total_cuotas: number
  promedio_cuotas: number
  activos_amortizados: number
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [categoriasStats, setCategoriasStats] = useState<CategoriaStats[]>([])
  const [amortizacionesMes, setAmortizacionesMes] = useState<AmortizacionMes[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Cargar estadísticas generales
      const [statsResponse, categoriasResponse, amortizacionesResponse] = await Promise.all([
        fetch('/api/dashboard?tipo=generales'),
        fetch('/api/dashboard?tipo=categorias'),
        fetch('/api/dashboard?tipo=amortizaciones-mes')
      ])

      const statsResult = await statsResponse.json()
      const categoriasResult = await categoriasResponse.json()
      const amortizacionesResult = await amortizacionesResponse.json()

      if (statsResult.success) {
        setStats(statsResult.data)
      }
      if (categoriasResult.success) {
        setCategoriasStats(categoriasResult.data)
      }
      if (amortizacionesResult.success) {
        setAmortizacionesMes(amortizacionesResult.data)
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando dashboard...</span>
      </div>
    )
  }

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor)
  }

  const obtenerNombreMes = (numeroMes: number) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return meses[numeroMes - 1] || 'N/A'
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de activos fijos y amortizaciones</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_activos}</div>
            <p className="text-xs text-muted-foreground">Activos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearMoneda(stats.valor_total_activos)}</div>
            <p className="text-xs text-muted-foreground">Valor de adquisición total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amortización Anual</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearMoneda(stats.amortizacion_anual_actual)}</div>
            <p className="text-xs text-muted-foreground">Cuota anual {new Date().getFullYear()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_clientes}</div>
            <p className="text-xs text-muted-foreground">{stats.total_categorias} categorías disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos con datos reales */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Amortizaciones por Mes</CardTitle>
            <CardDescription>Evolución de las amortizaciones durante el año {new Date().getFullYear()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {amortizacionesMes.length > 0 ? (
                amortizacionesMes.map((item) => {
                  const maxValor = Math.max(...amortizacionesMes.map(a => a.total_cuotas))
                  const porcentaje = maxValor > 0 ? (item.total_cuotas / maxValor) * 100 : 0
                  return (
                    <div key={item.periodo_mes} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm font-medium w-20">{obtenerNombreMes(item.periodo_mes)}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold ml-3">{formatearMoneda(item.total_cuotas)}</span>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No hay datos de amortizaciones para este año
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribución por Categoría</CardTitle>
            <CardDescription>Porcentaje de activos por categoría</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoriasStats.length > 0 ? (
                categoriasStats.map((item, index) => {
                  const totalActivos = categoriasStats.reduce((sum, cat) => sum + cat.total_activos, 0)
                  const porcentaje = totalActivos > 0 ? (item.total_activos / totalActivos) * 100 : 0
                  const colores = [
                    "bg-blue-500",
                    "bg-green-500", 
                    "bg-yellow-500",
                    "bg-red-500",
                    "bg-purple-500",
                    "bg-orange-500"
                  ]
                  const color = colores[index % colores.length]
                  
                  return (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-4 h-4 rounded-full ${color}`}></div>
                        <span className="text-sm font-medium">{item.categoria_nombre}</span>
                        <div className="flex-1 bg-muted rounded-full h-2 ml-3">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${color}`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-bold ml-3">{porcentaje.toFixed(1)}%</span>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No hay datos de categorías disponibles
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de resumen con datos reales */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Activos por Categoría</CardTitle>
          <CardDescription>Vista detallada de los activos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Categoría</th>
                  <th className="text-left p-2">Cantidad</th>
                  <th className="text-left p-2">Valor Total</th>
                  <th className="text-left p-2">Valor Promedio</th>
                  <th className="text-left p-2">Valor Residual</th>
                </tr>
              </thead>
              <tbody>
                {categoriasStats.length > 0 ? (
                  categoriasStats.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{item.categoria_nombre}</td>
                      <td className="p-2">{item.total_activos}</td>
                      <td className="p-2">{formatearMoneda(item.valor_total)}</td>
                      <td className="p-2">{formatearMoneda(item.valor_promedio)}</td>
                      <td className="p-2 text-green-600">{formatearMoneda(item.valor_residual_total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No hay datos de categorías disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
