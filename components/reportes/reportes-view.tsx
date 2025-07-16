"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, BarChart3, PieChart } from "lucide-react"

const reporteData = [
  { categoria: "Equipos", cantidad: 45, valor: 45000, amortizacion: 15000 },
  { categoria: "Vehículos", cantidad: 12, valor: 125000, amortizacion: 25000 },
  { categoria: "Maquinaria", cantidad: 8, valor: 200000, amortizacion: 20000 },
  { categoria: "Inmuebles", cantidad: 3, valor: 500000, amortizacion: 10000 },
]

export function ReportesView() {
  const [selectedReport, setSelectedReport] = useState("resumen")
  const [selectedYear, setSelectedYear] = useState("2024")
  const [selectedClient, setSelectedClient] = useState("todos")

  const reportTypes = [
    { value: "resumen", label: "Resumen General" },
    { value: "amortizaciones", label: "Reporte de Amortizaciones" },
    { value: "activos", label: "Inventario de Activos" },
    { value: "clientes", label: "Reporte por Cliente" },
  ]

  const years = ["2024", "2023", "2022", "2021"]
  const clients = ["todos", "Empresa ABC S.A.", "Comercial XYZ Ltda.", "Servicios DEF S.R.L.", "Industrias GHI S.A."]

  const handleExportPDF = () => {
    alert("Función de exportación a PDF - Próximamente disponible")
  }

  const handleExportExcel = () => {
    alert("Función de exportación a Excel - Próximamente disponible")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">Genera y exporta reportes detallados de activos y amortizaciones</p>
      </div>

      {/* Configuración de reportes */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Reporte</CardTitle>
          <CardDescription>Selecciona los parámetros para generar tu reporte</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Reporte</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Año</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client === "todos" ? "Todos los clientes" : client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen ejecutivo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Activos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$870,000</div>
            <p className="text-xs text-muted-foreground">Valor contable actual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amortización Acumulada</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$70,000</div>
            <p className="text-xs text-muted-foreground">Total año {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos Registrados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68</div>
            <p className="text-xs text-muted-foreground">En todas las categorías</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Residual</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$87,000</div>
            <p className="text-xs text-muted-foreground">Valor residual estimado</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico visual simple */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Valores por Categoría</CardTitle>
          <CardDescription>Representación visual de activos y amortizaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reporteData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{item.categoria}</span>
                  <span className="text-sm text-muted-foreground">{item.cantidad} activos</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Valor: ${item.valor.toLocaleString()}</span>
                    <span>Amortización: ${item.amortizacion.toLocaleString()}</span>
                  </div>
                  <div className="relative bg-muted rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full"
                      style={{ width: `${(item.valor / 500000) * 100}%` }}
                    />
                    <div
                      className="absolute top-0 bg-red-500 h-4 rounded-full opacity-70"
                      style={{ width: `${(item.amortizacion / 500000) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabla detallada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle del Reporte - {reportTypes.find((r) => r.value === selectedReport)?.label}</CardTitle>
          <CardDescription>Información detallada para el período seleccionado</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Valor Original</TableHead>
                <TableHead>Amortización Anual</TableHead>
                <TableHead>Valor Contable</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reporteData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.categoria}</TableCell>
                  <TableCell>{item.cantidad}</TableCell>
                  <TableCell>${item.valor.toLocaleString()}</TableCell>
                  <TableCell className="text-red-600">${item.amortizacion.toLocaleString()}</TableCell>
                  <TableCell>${(item.valor - item.amortizacion).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="default">Activo</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
