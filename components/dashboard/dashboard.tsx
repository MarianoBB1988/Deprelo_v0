"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calculator, Package, TrendingUp, Users } from "lucide-react"

export function Dashboard() {
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
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,450,000</div>
            <p className="text-xs text-muted-foreground">+8% desde el mes pasado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amortización Anual</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$184,000</div>
            <p className="text-xs text-muted-foreground">Cuota anual calculada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">+2 nuevos este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos simplificados */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Amortizaciones por Mes</CardTitle>
            <CardDescription>Evolución de las amortizaciones durante el año</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { mes: "Enero", valor: 12000, porcentaje: 60 },
                { mes: "Febrero", valor: 15000, porcentaje: 75 },
                { mes: "Marzo", valor: 18000, porcentaje: 90 },
                { mes: "Abril", valor: 14000, porcentaje: 70 },
                { mes: "Mayo", valor: 16000, porcentaje: 80 },
                { mes: "Junio", valor: 19000, porcentaje: 95 },
              ].map((item) => (
                <div key={item.mes} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-sm font-medium w-16">{item.mes}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.porcentaje}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold ml-3">${item.valor.toLocaleString()}</span>
                </div>
              ))}
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
              {[
                { name: "Equipos", value: 45, color: "bg-blue-500" },
                { name: "Vehículos", value: 30, color: "bg-green-500" },
                { name: "Inmuebles", value: 15, color: "bg-yellow-500" },
                { name: "Otros", value: 10, color: "bg-red-500" },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium">{item.name}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 ml-3">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${item.color}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-bold ml-3">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de resumen */}
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
                  <th className="text-left p-2">Amortización Anual</th>
                  <th className="text-left p-2">Valor Contable</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { categoria: "Equipos de Computación", cantidad: 45, valor: 450000, amortizacion: 150000 },
                  { categoria: "Vehículos", cantidad: 12, valor: 1250000, amortizacion: 250000 },
                  { categoria: "Maquinaria", cantidad: 8, valor: 2000000, amortizacion: 200000 },
                  { categoria: "Inmuebles", cantidad: 3, valor: 5000000, amortizacion: 100000 },
                ].map((item, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{item.categoria}</td>
                    <td className="p-2">{item.cantidad}</td>
                    <td className="p-2">${item.valor.toLocaleString()}</td>
                    <td className="p-2 text-red-600">${item.amortizacion.toLocaleString()}</td>
                    <td className="p-2 font-medium">${(item.valor - item.amortizacion).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
