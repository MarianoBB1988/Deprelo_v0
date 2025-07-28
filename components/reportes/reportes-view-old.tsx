"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, BarChart3, PieChart, Loader2, Calculator, TrendingDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { ActivoService, AmortizacionService, ClienteService, CategoriaService, DashboardService } from '@/lib/services'

// Extender el tipo jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable
  }
}

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
    { value: "amortizaciones", label: "Reporte de Amortizaciones" },
    { value: "activos", label: "Inventario de Activos" },
    { value: "clientes", label: "Reporte por Cliente" },
  ]

  const clients = [
    { value: "todos", label: "Todos los Clientes" },
    { value: "1", label: "Empresa ABC S.A." },
    { value: "2", label: "Comercial XYZ Ltda." },
    { value: "3", label: "Servicios DEF S.R.L." },
    { value: "4", label: "Industrias GHI S.A." },
  ]

  // Cargar datos del reporte
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
          // Obtener datos del dashboard que ya calcula todo
          const dashboardData = await DashboardService.obtenerEstadisticasGenerales()
          summary = {
            totalActivos: dashboardData.valor_total_activos || 0,
            amortizacionAcumulada: dashboardData.amortizacion_anual_actual || 0,
            activosRegistrados: dashboardData.total_activos || 0,
            valorResidual: (dashboardData.valor_total_activos || 0) - (dashboardData.amortizacion_anual_actual || 0)
          }

          // Obtener activos agrupados por categoría
          const activosData = await ActivoService.obtenerTodos()
          const activosPorCategoria = new Map()
          
          for (const activo of activosData) {
            const categoria = activo.categoria_nombre || 'Sin categoría'
            
            if (!activosPorCategoria.has(categoria)) {
              activosPorCategoria.set(categoria, {
                categoria,
                cantidad: 0,
                valor: 0,
                amortizacion: 0,
                valorContable: 0
              })
            }
            
            const item = activosPorCategoria.get(categoria)
            item.cantidad += 1
            item.valor += activo.valor_adquisicion || 0
            
            // Calcular amortización para este activo
            try {
              const amortizaciones = await AmortizacionService.obtenerPorActivo(activo.id)
              const amortizacionAnual = amortizaciones
                .filter((a: any) => a.periodo_año === parseInt(selectedYear))
                .reduce((sum: number, a: any) => sum + (a.cuota_amortizacion || 0), 0)
              item.amortizacion += amortizacionAnual
            } catch (error) {
              console.error(`Error calculando amortización para activo ${activo.id}:`, error)
            }
            
            item.valorContable = item.valor - item.amortizacion
          }
          
          data = Array.from(activosPorCategoria.values())
          break

        case "amortizaciones":
          // Obtener todas las amortizaciones del año
          let url = `/api/amortizaciones?año=${selectedYear}`
          if (selectedClient !== 'todos') {
            url += `&clienteId=${selectedClient}`
          }
          
          const response = await fetch(url)
          const result = await response.json()
          
          if (result.success) {
            data = result.data
            
            const totalAmortizacion = result.data.reduce((sum: number, item: any) => 
              sum + parseFloat(item.cuota_amortizacion || 0), 0)
            const totalValorInicial = result.data.reduce((sum: number, item: any) => 
              sum + parseFloat(item.valor_inicial || 0), 0)
            const totalValorFinal = result.data.reduce((sum: number, item: any) => 
              sum + parseFloat(item.valor_final || 0), 0)

            summary = {
              totalActivos: totalValorInicial,
              amortizacionAcumulada: totalAmortizacion,
              activosRegistrados: new Set(result.data.map((item: any) => item.activo_id)).size,
              valorResidual: totalValorFinal
            }
          }
          break

        case "activos":
          // Obtener todos los activos
          const todosActivos = await ActivoService.obtenerTodos()
          const activosDetalle = []
          
          for (const activo of todosActivos) {
            if (selectedClient !== "todos") {
              if (activo.cliente_id.toString() !== selectedClient) continue
            }
            
            activosDetalle.push({
              nombre: activo.nombre,
              categoria: activo.categoria_nombre,
              cliente: activo.cliente_nombre,
              valor: activo.valor_adquisicion || 0,
              fechaAdquisicion: activo.fecha_adquisicion,
              estado: activo.activo ? 'Activo' : 'Inactivo'
            })
          }
          
          data = activosDetalle
          summary.activosRegistrados = data.length
          summary.totalActivos = data.reduce((sum, item) => sum + item.valor, 0)
          break

        case "clientes":
          // Agrupar por cliente
          const activosPorCliente = new Map()
          const activosClientes = await ActivoService.obtenerTodos()
          
          for (const activo of activosClientes) {
            const cliente = activo.cliente_nombre || 'Sin cliente'
            
            if (!activosPorCliente.has(cliente)) {
              activosPorCliente.set(cliente, {
                cliente,
                cantidad: 0,
                valor: 0,
                amortizacion: 0,
                valorContable: 0
              })
            }
            
            const item = activosPorCliente.get(cliente)
            item.cantidad += 1
            item.valor += activo.valor_adquisicion || 0
            
            try {
              const amortizaciones = await AmortizacionService.obtenerPorActivo(activo.id)
              const amortizacionAnual = amortizaciones
                .filter((a: any) => a.periodo_año === parseInt(selectedYear))
                .reduce((sum: number, a: any) => sum + (a.cuota_amortizacion || 0), 0)
              item.amortizacion += amortizacionAnual
            } catch (error) {
              console.error(`Error calculando amortización para activo ${activo.id}:`, error)
            }
            
            item.valorContable = item.valor - item.amortizacion
          }
          
          data = Array.from(activosPorCliente.values())
          summary.activosRegistrados = data.reduce((sum, item) => sum + item.cantidad, 0)
          summary.totalActivos = data.reduce((sum, item) => sum + item.valor, 0)
          summary.amortizacionAcumulada = data.reduce((sum, item) => sum + item.amortizacion, 0)
          summary.valorResidual = summary.totalActivos - summary.amortizacionAcumulada
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

  // Cargar clientes y categorías al inicio
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [clientesData, categoriasData] = await Promise.all([
          ClienteService.obtenerTodos(),
          CategoriaService.obtenerTodas()
        ])
        setClientes(clientesData)
        setCategorias(categoriasData)
      } catch (error) {
        console.error('Error cargando datos iniciales:', error)
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    loadReportData()
  }, [selectedReport, selectedYear, selectedClient, clientes, categorias])

  // Función para exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Título del reporte
    doc.setFontSize(20)
    doc.text('Reporte Deprelo', 14, 22)
    
    doc.setFontSize(12)
    doc.text(`Tipo: ${reportTypes.find(r => r.value === selectedReport)?.label}`, 14, 32)
    doc.text(`Año: ${selectedYear}`, 14, 42)
    doc.text(`Cliente: ${clients.find(c => c.value === selectedClient)?.label}`, 14, 52)
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 62)

    // Preparar datos para la tabla
    let tableData: any[] = []
    let headers: string[] = []

    if (selectedReport === 'amortizaciones') {
      headers = ['Activo', 'Cliente', 'Valor Inicial', 'Amortización', 'Valor Final', 'Método']
      tableData = reportData.map(item => [
        item.activo_nombre,
        item.cliente_nombre,
        `$${parseFloat(item.valor_inicial).toLocaleString()}`,
        `$${parseFloat(item.cuota_amortizacion).toLocaleString()}`,
        `$${parseFloat(item.valor_final).toLocaleString()}`,
        item.metodo_aplicado
      ])
    } else if (selectedReport === 'activos') {
      headers = ['Nombre', 'Cliente', 'Categoría', 'Valor', 'Estado']
      tableData = reportData.map(item => [
        item.nombre,
        item.cliente_nombre,
        item.categoria_nombre,
        `$${parseFloat(item.valor_adquisicion).toLocaleString()}`,
        item.estado
      ])
    } else if (selectedReport === 'clientes') {
      headers = ['Nombre', 'RUT', 'Email', 'Teléfono']
      tableData = reportData.map(item => [
        item.nombre,
        item.rut,
        item.email || 'N/A',
        item.telefono || 'N/A'
      ])
    }

    // Generar tabla
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 75,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    })

    // Descargar el PDF
    doc.save(`reporte_${selectedReport}_${selectedYear}.pdf`)
    
    toast({
      title: "PDF Generado",
      description: "El reporte se ha exportado correctamente",
    })
  }

  // Función para exportar a Excel
  const exportToExcel = () => {
    let excelData: any[] = []
    let filename = `reporte_${selectedReport}_${selectedYear}.xlsx`

    if (selectedReport === 'amortizaciones') {
      excelData = reportData.map(item => ({
        'Activo': item.activo_nombre,
        'Cliente': item.cliente_nombre,
        'Categoría': item.categoria_nombre,
        'Período': `${item.periodo_mes}/${item.periodo_año}`,
        'Valor Inicial': parseFloat(item.valor_inicial),
        'Cuota Amortización': parseFloat(item.cuota_amortizacion),
        'Valor Final': parseFloat(item.valor_final),
        'Método': item.metodo_aplicado,
        'Automático': item.calculado_automaticamente ? 'Sí' : 'No',
        'Fecha Cálculo': new Date(item.fecha_calculo).toLocaleDateString()
      }))
    } else if (selectedReport === 'activos') {
      excelData = reportData.map(item => ({
        'Nombre': item.nombre,
        'Descripción': item.descripcion,
        'Cliente': item.cliente_nombre,
        'Categoría': item.categoria_nombre,
        'Valor Adquisición': parseFloat(item.valor_adquisicion),
        'Valor Residual': parseFloat(item.valor_residual),
        'Fecha Adquisición': new Date(item.fecha_adquisicion).toLocaleDateString(),
        'Número Serie': item.numero_serie,
        'Proveedor': item.proveedor,
        'Estado': item.estado
      }))
    } else if (selectedReport === 'clientes') {
      excelData = reportData.map(item => ({
        'Nombre': item.nombre,
        'RUT': item.rut,
        'Email': item.email,
        'Teléfono': item.telefono,
        'Dirección': item.direccion,
        'Activo': item.activo ? 'Sí' : 'No',
        'Fecha Creación': new Date(item.fecha_creacion).toLocaleDateString()
      }))
    }

    // Crear libro de trabajo
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte')

    // Descargar archivo
    XLSX.writeFile(wb, filename)
    
    toast({
      title: "Excel Generado",
      description: "El reporte se ha exportado correctamente",
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-UY', {
      style: 'currency',
      currency: 'UYU'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">
            Genera y exporta reportes de activos fijos y amortizaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button onClick={exportToExcel} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración del Reporte</CardTitle>
          <CardDescription>
            Selecciona los parámetros para generar el reporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Resumen */}
      {selectedReport === 'resumen' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amortizaciones</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.totalActivos}</div>
              <p className="text-xs text-muted-foreground">registros en {selectedYear}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Amortización Acumulada</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryData.amortizacionAcumulada)}</div>
              <p className="text-xs text-muted-foreground">total amortizado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos Registrados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData.activosRegistrados}</div>
              <p className="text-xs text-muted-foreground">activos únicos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Residual</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryData.valorResidual)}</div>
              <p className="text-xs text-muted-foreground">valor remanente</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de datos */}
      <Card>
        <CardHeader>
          <CardTitle>
            {reportTypes.find(r => r.value === selectedReport)?.label}
          </CardTitle>
          <CardDescription>
            {isLoading ? "Cargando datos..." : `${reportData.length} registros encontrados`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedReport === 'amortizaciones' && (
                      <>
                        <TableHead>Activo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Período</TableHead>
                        <TableHead>Valor Inicial</TableHead>
                        <TableHead>Amortización</TableHead>
                        <TableHead>Valor Final</TableHead>
                        <TableHead>Método</TableHead>
                      </>
                    )}
                    {selectedReport === 'activos' && (
                      <>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Valor Adquisición</TableHead>
                        <TableHead>Valor Residual</TableHead>
                        <TableHead>Estado</TableHead>
                      </>
                    )}
                    {selectedReport === 'clientes' && (
                      <>
                        <TableHead>Nombre</TableHead>
                        <TableHead>RUT</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Estado</TableHead>
                      </>
                    )}
                    {selectedReport === 'resumen' && (
                      <>
                        <TableHead>Activo</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Valor Inicial</TableHead>
                        <TableHead>Amortización</TableHead>
                        <TableHead>Valor Final</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((item, index) => (
                    <TableRow key={index}>
                      {selectedReport === 'amortizaciones' && (
                        <>
                          <TableCell className="font-medium">{item.activo_nombre}</TableCell>
                          <TableCell>{item.cliente_nombre}</TableCell>
                          <TableCell>{item.categoria_nombre}</TableCell>
                          <TableCell>{item.periodo_mes}/{item.periodo_año}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(item.valor_inicial))}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(item.cuota_amortizacion))}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(item.valor_final))}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.metodo_aplicado}</Badge>
                          </TableCell>
                        </>
                      )}
                      {selectedReport === 'activos' && (
                        <>
                          <TableCell className="font-medium">{item.nombre}</TableCell>
                          <TableCell>{item.cliente_nombre}</TableCell>
                          <TableCell>{item.categoria_nombre}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(item.valor_adquisicion))}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(item.valor_residual))}</TableCell>
                          <TableCell>
                            <Badge variant={item.estado === 'en_uso' ? 'default' : 'secondary'}>
                              {item.estado}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      {selectedReport === 'clientes' && (
                        <>
                          <TableCell className="font-medium">{item.nombre}</TableCell>
                          <TableCell>{item.rut}</TableCell>
                          <TableCell>{item.email || 'N/A'}</TableCell>
                          <TableCell>{item.telefono || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={item.activo ? 'default' : 'secondary'}>
                              {item.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      {selectedReport === 'resumen' && (
                        <>
                          <TableCell className="font-medium">{item.activo_nombre}</TableCell>
                          <TableCell>{item.cliente_nombre}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(item.valor_inicial))}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(item.cuota_amortizacion))}</TableCell>
                          <TableCell>{formatCurrency(parseFloat(item.valor_final))}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  {reportData.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No se encontraron datos para mostrar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
