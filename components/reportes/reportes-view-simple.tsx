"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, BarChart3, PieChart, Calculator, TrendingDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ReportesView() {
  const { toast } = useToast()
  const [selectedReport, setSelectedReport] = useState("resumen")
  const [selectedYear, setSelectedYear] = useState("2025")
  const [selectedClient, setSelectedClient] = useState("todos")
  const [reportData, setReportData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [summaryData, setSummaryData] = useState({
    totalActivos: 0,
    amortizacionAcumulada: 0,
    activosRegistrados: 0,
    valorResidual: 0
  })

  const reportTypes = [
    { value: "resumen", label: "Resumen General" },
    { value: "amortizaciones", label: "Amortizaciones" },
    { value: "activos", label: "Activos" },
    { value: "clientes", label: "Por Cliente" },
  ]

  const years = ["2025", "2024", "2023", "2022", "2021"]

  // Cargar clientes y categorías al inicio
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [clientesResponse, categoriasResponse] = await Promise.all([
          fetch('/api/clientes/list'),
          fetch('/api/categorias/list')
        ])
        
        const [clientesResult, categoriasResult] = await Promise.all([
          clientesResponse.json(),
          categoriasResponse.json()
        ])
        
        if (clientesResult.success) {
          setClientes(clientesResult.data)
        }
        
        if (categoriasResult.success) {
          setCategorias(categoriasResult.data)
        }
      } catch (error) {
        console.error('Error cargando datos iniciales:', error)
      }
    }
    loadInitialData()
  }, [])

  // Cargar datos del reporte usando APIs existentes
  const loadReportData = async () => {
    setIsLoading(true)
    try {
      let data = []
      let summary = {
        totalActivos: 0,
        amortizacionAcumulada: 0,
        activosRegistrados: 0,
        valorResidual: 0
      }

      switch (selectedReport) {
        case "resumen":
          // Usar API del dashboard
          const dashboardResponse = await fetch('/api/dashboard/estadisticas')
          const dashboardResult = await dashboardResponse.json()
          
          if (dashboardResult.success) {
            const dashboardData = dashboardResult.data
            summary = {
              totalActivos: dashboardData.valor_total_activos || 0,
              amortizacionAcumulada: dashboardData.amortizacion_anual_actual || 0,
              activosRegistrados: dashboardData.total_activos || 0,
              valorResidual: (dashboardData.valor_total_activos || 0) - (dashboardData.amortizacion_anual_actual || 0)
            }
            
            // Datos simplificados para la tabla
            data = [
              {
                descripcion: "Total de Activos",
                valor: summary.totalActivos,
                tipo: "Valor"
              },
              {
                descripcion: "Amortización Acumulada",
                valor: summary.amortizacionAcumulada,
                tipo: "Amortización"
              },
              {
                descripcion: "Valor Residual",
                valor: summary.valorResidual,
                tipo: "Residual"
              }
            ]
          }
          break

        case "amortizaciones":
          // Usar API de amortizaciones existente
          let url = `/api/amortizaciones?año=${selectedYear}`
          if (selectedClient !== 'todos') {
            url += `&clienteId=${selectedClient}`
          }
          
          const amortResponse = await fetch(url)
          const amortResult = await amortResponse.json()
          
          if (amortResult.success) {
            data = amortResult.data
            
            const totalAmortizacion = amortResult.data.reduce((sum: number, item: any) => 
              sum + parseFloat(item.cuota_amortizacion || 0), 0)
            const totalValorInicial = amortResult.data.reduce((sum: number, item: any) => 
              sum + parseFloat(item.valor_inicial || 0), 0)
            const totalValorFinal = amortResult.data.reduce((sum: number, item: any) => 
              sum + parseFloat(item.valor_final || 0), 0)

            summary = {
              totalActivos: totalValorInicial,
              amortizacionAcumulada: totalAmortizacion,
              activosRegistrados: new Set(amortResult.data.map((item: any) => item.activo_id)).size,
              valorResidual: totalValorFinal
            }
          }
          break

        case "activos":
          // Usar API de activos existente
          const activosResponse = await fetch('/api/activos/list')
          const activosResult = await activosResponse.json()
          
          if (activosResult.success) {
            const activosData = activosResult.data.filter((activo: any) => {
              if (selectedClient !== "todos") {
                return activo.cliente_id.toString() === selectedClient
              }
              return true
            })
            
            data = activosData.map((activo: any) => ({
              nombre: activo.nombre,
              categoria: activo.categoria_nombre,
              cliente: activo.cliente_nombre,
              valor: activo.valor_adquisicion || 0,
              fechaAdquisicion: activo.fecha_adquisicion,
              estado: activo.activo ? 'Activo' : 'Inactivo'
            }))
            
            summary.activosRegistrados = data.length
            summary.totalActivos = data.reduce((sum, item) => sum + item.valor, 0)
          }
          break

        case "clientes":
          // Datos agrupados por cliente usando API de activos
          const clientesActivosResponse = await fetch('/api/activos/list')
          const clientesActivosResult = await clientesActivosResponse.json()
          
          if (clientesActivosResult.success) {
            const activosPorCliente = new Map()
            
            for (const activo of clientesActivosResult.data) {
              const cliente = activo.cliente_nombre || 'Sin cliente'
              
              if (!activosPorCliente.has(cliente)) {
                activosPorCliente.set(cliente, {
                  cliente,
                  cantidad: 0,
                  valor: 0,
                  valorContable: 0
                })
              }
              
              const item = activosPorCliente.get(cliente)
              item.cantidad += 1
              item.valor += activo.valor_adquisicion || 0
              item.valorContable += activo.valor_adquisicion || 0 // Simplificado
            }
            
            data = Array.from(activosPorCliente.values())
            summary.activosRegistrados = data.reduce((sum, item) => sum + item.cantidad, 0)
            summary.totalActivos = data.reduce((sum, item) => sum + item.valor, 0)
            summary.valorResidual = summary.totalActivos
          }
          break
      }
      
      setReportData(data)
      setSummaryData(summary)
      
    } catch (error) {
      console.error('Error cargando datos del reporte:', error)
      toast({
        title: "Error",
        description: "Error al cargar los datos del reporte",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (clientes.length > 0 && categorias.length > 0) {
      loadReportData()
    }
  }, [selectedReport, selectedYear, selectedClient, clientes, categorias])

  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/reportes/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: selectedReport,
          year: selectedYear,
          clientId: selectedClient
        }),
      })

      if (!response.ok) {
        throw new Error('Error al generar PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `reporte_${selectedReport}_${selectedYear}_${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "PDF exportado",
        description: `Reporte PDF generado exitosamente`,
      })
      
    } catch (error) {
      console.error('Error exportando PDF:', error)
      toast({
        title: "Error",
        description: "Error al generar el archivo PDF",
        variant: "destructive",
      })
    }
  }

  const handleExportExcel = async () => {
    try {
      const response = await fetch('/api/reportes/export-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: selectedReport,
          year: selectedYear,
          clientId: selectedClient
        }),
      })

      if (!response.ok) {
        throw new Error('Error al generar Excel')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `reporte_${selectedReport}_${selectedYear}_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Excel exportado",
        description: `Reporte Excel generado exitosamente`,
      })
      
    } catch (error) {
      console.error('Error exportando Excel:', error)
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR')
  }

  const renderTableHeaders = () => {
    switch (selectedReport) {
      case "resumen":
        return (
          <TableRow>
            <TableHead>Descripción</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Tipo</TableHead>
          </TableRow>
        )
      case "amortizaciones":
        return (
          <TableRow>
            <TableHead>Activo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Cuota</TableHead>
            <TableHead>Valor Inicial</TableHead>
            <TableHead>Valor Final</TableHead>
          </TableRow>
        )
      case "activos":
        return (
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Fecha Adquisición</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        )
      case "clientes":
        return (
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Valor Contable</TableHead>
          </TableRow>
        )
      default:
        return null
    }
  }

  const renderTableRows = () => {
    if (!reportData.length) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center">
            No hay datos para mostrar
          </TableCell>
        </TableRow>
      )
    }

    return reportData.map((item, index) => {
      switch (selectedReport) {
        case "resumen":
          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.descripcion}</TableCell>
              <TableCell>{formatCurrency(item.valor)}</TableCell>
              <TableCell>
                <Badge variant={item.tipo === 'Valor' ? 'default' : item.tipo === 'Amortización' ? 'destructive' : 'secondary'}>
                  {item.tipo}
                </Badge>
              </TableCell>
            </TableRow>
          )
        case "amortizaciones":
          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.activo_nombre}</TableCell>
              <TableCell>{item.cliente_nombre}</TableCell>
              <TableCell>{item.periodo_mes}/{item.periodo_año}</TableCell>
              <TableCell>{formatCurrency(item.cuota_amortizacion)}</TableCell>
              <TableCell>{formatCurrency(item.valor_inicial)}</TableCell>
              <TableCell>{formatCurrency(item.valor_final)}</TableCell>
            </TableRow>
          )
        case "activos":
          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.nombre}</TableCell>
              <TableCell>{item.categoria}</TableCell>
              <TableCell>{item.cliente}</TableCell>
              <TableCell>{formatCurrency(item.valor)}</TableCell>
              <TableCell>{formatDate(item.fechaAdquisicion)}</TableCell>
              <TableCell>
                <Badge variant={item.estado === 'Activo' ? 'default' : 'secondary'}>
                  {item.estado}
                </Badge>
              </TableCell>
            </TableRow>
          )
        case "clientes":
          return (
            <TableRow key={index}>
              <TableCell className="font-medium">{item.cliente}</TableCell>
              <TableCell>{item.cantidad}</TableCell>
              <TableCell>{formatCurrency(item.valor)}</TableCell>
              <TableCell>{formatCurrency(item.valorContable)}</TableCell>
            </TableRow>
          )
        default:
          return null
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">Genera y exporta reportes del sistema</p>
        </div>
      </div>

      {/* Configuración del reporte */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Reporte</CardTitle>
          <CardDescription>
            Selecciona los parámetros para generar el reporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectItem value="todos">Todos los clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id.toString()}>
                      {cliente.nombre}
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

      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryData.totalActivos)}</div>
            <p className="text-xs text-muted-foreground">
              {summaryData.activosRegistrados} activos registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amortización Acumulada</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryData.amortizacionAcumulada)}</div>
            <p className="text-xs text-muted-foreground">
              Año {selectedYear}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Residual</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryData.valorResidual)}</div>
            <p className="text-xs text-muted-foreground">
              Valor contable actual
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos Registrados</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.activosRegistrados}</div>
            <p className="text-xs text-muted-foreground">
              Total de activos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de datos */}
      <Card>
        <CardHeader>
          <CardTitle>
            {reportTypes.find(t => t.value === selectedReport)?.label} - {selectedYear}
          </CardTitle>
          <CardDescription>
            {selectedClient !== "todos" 
              ? `Datos filtrados para: ${clientes.find(c => c.id.toString() === selectedClient)?.nombre}`
              : "Todos los clientes"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-muted-foreground">Cargando datos...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                {renderTableHeaders()}
              </TableHeader>
              <TableBody>
                {renderTableRows()}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
