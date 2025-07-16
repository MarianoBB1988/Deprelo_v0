"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, Download, Eye } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Amortizacion {
  id: number
  activo: string
  cliente: string
  anio: number
  valorInicial: number
  cuota: number
  valorFinal: number
  metodo: string
}

export function AmortizacionesView() {
  const [selectedYear, setSelectedYear] = useState("2024")
  const [selectedClient, setSelectedClient] = useState("todos")

  const amortizaciones: Amortizacion[] = [
    {
      id: 1,
      activo: "Laptop Dell XPS 13",
      cliente: "Empresa ABC S.A.",
      anio: 2024,
      valorInicial: 1200,
      cuota: 360,
      valorFinal: 840,
      metodo: "lineal",
    },
    {
      id: 2,
      activo: "Vehículo Toyota Corolla",
      cliente: "Comercial XYZ Ltda.",
      anio: 2024,
      valorInicial: 25000,
      cuota: 4000,
      valorFinal: 21000,
      metodo: "lineal",
    },
    {
      id: 3,
      activo: "Impresora HP LaserJet",
      cliente: "Empresa ABC S.A.",
      anio: 2024,
      valorInicial: 800,
      cuota: 240,
      valorFinal: 560,
      metodo: "lineal",
    },
    {
      id: 4,
      activo: "Maquinaria Industrial",
      cliente: "Industrias GHI S.A.",
      anio: 2024,
      valorInicial: 50000,
      cuota: 10000,
      valorFinal: 40000,
      metodo: "decreciente",
    },
  ]

  const years = ["2024", "2023", "2022", "2021"]
  const clients = ["todos", "Empresa ABC S.A.", "Comercial XYZ Ltda.", "Industrias GHI S.A."]

  const filteredAmortizaciones = amortizaciones.filter((item) => {
    const yearMatch = item.anio.toString() === selectedYear
    const clientMatch = selectedClient === "todos" || item.cliente === selectedClient
    return yearMatch && clientMatch
  })

  const totalCuotas = filteredAmortizaciones.reduce((sum, item) => sum + item.cuota, 0)

  const AmortizacionDetail = ({ activo }: { activo: string }) => {
    const detalleAmortizacion = [
      { anio: 2024, valorInicial: 1200, cuota: 360, valorFinal: 840 },
      { anio: 2025, valorInicial: 840, cuota: 360, valorFinal: 480 },
      { anio: 2026, valorInicial: 480, cuota: 360, valorFinal: 120 },
      { anio: 2027, valorInicial: 120, cuota: 120, valorFinal: 0 },
    ]

    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Proyección de amortización para: <strong>{activo}</strong>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Año</TableHead>
              <TableHead>Valor Inicial</TableHead>
              <TableHead>Cuota</TableHead>
              <TableHead>Valor Final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detalleAmortizacion.map((item) => (
              <TableRow key={item.anio}>
                <TableCell>{item.anio}</TableCell>
                <TableCell>${item.valorInicial.toLocaleString()}</TableCell>
                <TableCell className="font-medium">${item.cuota.toLocaleString()}</TableCell>
                <TableCell>${item.valorFinal.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Amortizaciones</h1>
        <p className="text-muted-foreground">Gestiona y visualiza las amortizaciones de activos fijos</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecciona el año y cliente para ver las amortizaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Año</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
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
                <SelectTrigger className="w-64">
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
            <div className="flex items-end">
              <Button>
                <Calculator className="mr-2 h-4 w-4" />
                Calcular
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos Procesados</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAmortizaciones.length}</div>
            <p className="text-xs text-muted-foreground">Para el año {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amortizado</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCuotas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Cuotas del año {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Activo</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {filteredAmortizaciones.length > 0
                ? Math.round(totalCuotas / filteredAmortizaciones.length).toLocaleString()
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Cuota promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de amortizaciones */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Detalle de Amortizaciones {selectedYear}</CardTitle>
              <CardDescription>{filteredAmortizaciones.length} activos con amortización calculada</CardDescription>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Valor Inicial</TableHead>
                <TableHead>Cuota Anual</TableHead>
                <TableHead>Valor Final</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAmortizaciones.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.activo}</TableCell>
                  <TableCell>{item.cliente}</TableCell>
                  <TableCell>
                    <Badge variant={item.metodo === "lineal" ? "default" : "secondary"}>{item.metodo}</Badge>
                  </TableCell>
                  <TableCell>${item.valorInicial.toLocaleString()}</TableCell>
                  <TableCell className="font-medium text-red-600">${item.cuota.toLocaleString()}</TableCell>
                  <TableCell>${item.valorFinal.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>Detalle de Amortización</DialogTitle>
                          <DialogDescription>Proyección completa de amortización del activo</DialogDescription>
                        </DialogHeader>
                        <AmortizacionDetail activo={item.activo} />
                      </DialogContent>
                    </Dialog>
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
