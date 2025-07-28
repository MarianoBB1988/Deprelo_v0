"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, BarChart3, PieChart, Calculator, TrendingDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

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

  const years = ["2025", "2024", "2023", "2022", "2021"]

  // Cargar clientes y categorías al inicio
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('🔄 Cargando datos iniciales...')
        const [clientesResponse, categoriasResponse] = await Promise.all([
          fetch('/api/clientes'),
          fetch('/api/categorias')
        ])
        
        console.log('📊 Respuestas recibidas:', {
          clientes: clientesResponse.status,
          categorias: categoriasResponse.status
        })
        
        const clientesData = await clientesResponse.json()
        const categoriasData = await categoriasResponse.json()
        
        console.log('📋 Datos parseados:', {
          clientesSuccess: clientesData.success,
          clientesCount: clientesData.data?.length || 0,
          categoriasSuccess: categoriasData.success,
          categoriasCount: categoriasData.data?.length || 0
        })
        
        if (clientesData.success) {
          setClientes(clientesData.data)
        }
        if (categoriasData.success) {
          setCategorias(categoriasData.data)
        }
      } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error)
      }
    }
    loadInitialData()
  }, [])

  // Cargar datos del reporte
  const loadReportData = async () => {
    console.log('🚀 Iniciando carga de reporte:', {
      selectedReport,
      selectedYear,
      selectedClient,
      clientesCount: clientes.length,
      categoriasCount: categorias.length
    })
    
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
          const dashboardResponse = await fetch('/api/dashboard')
          const dashboardResult = await dashboardResponse.json()
          const dashboardData = dashboardResult.data || {}
          
          summary = {
            totalActivos: dashboardData.valor_total_activos || 0,
            amortizacionAcumulada: dashboardData.amortizacion_anual_actual || 0,
            activosRegistrados: dashboardData.total_activos || 0,
            valorResidual: (dashboardData.valor_total_activos || 0) - (dashboardData.amortizacion_anual_actual || 0)
          }

          // Obtener activos agrupados por categoría
          const activosResponse = await fetch('/api/activos')
          const activosResult = await activosResponse.json()
          const activosData = activosResult.success ? activosResult.data : []
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
              const amortizacionResponse = await fetch(`/api/amortizaciones?activoId=${activo.id}`)
              const amortizacionResult = await amortizacionResponse.json()
              const amortizaciones = amortizacionResult.success ? amortizacionResult.data : []
              
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
          const todosActivosResponse = await fetch('/api/activos')
          const todosActivosResult = await todosActivosResponse.json()
          const todosActivos = todosActivosResult.success ? todosActivosResult.data : []
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
          const activosClientesResponse = await fetch('/api/activos')
          const activosClientesResult = await activosClientesResponse.json()
          const activosClientes = activosClientesResult.success ? activosClientesResult.data : []
          
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
              const amortizacionResponse = await fetch(`/api/amortizaciones?activoId=${activo.id}`)
              const amortizacionResult = await amortizacionResponse.json()
              const amortizaciones = amortizacionResult.success ? amortizacionResult.data : []
              
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
      
      console.log('✅ Reporte cargado exitosamente:', {
        dataLength: data.length,
        summary,
        selectedReport
      })
      
      setReportData(data)
      setSummaryData(summary)
      
    } catch (error) {
      console.error('❌ Error cargando datos del reporte:', error)
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
    console.log('🔄 useEffect de reportes ejecutado:', {
      clientesLength: clientes.length,
      categoriasLength: categorias.length,
      shouldLoad: clientes.length > 0 && categorias.length > 0
    })
    
    if (clientes.length > 0 && categorias.length > 0) {
      console.log('✅ Condiciones cumplidas, cargando reporte...')
      loadReportData()
    } else {
      console.log('❌ Condiciones no cumplidas para cargar reporte')
    }
  }, [selectedReport, selectedYear, selectedClient, clientes, categorias])

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF()
      
      // Cargar y agregar el logo
      const logoResponse = await fetch('/placeholder-logo.png')
      const logoBlob = await logoResponse.blob()
      const logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(logoBlob)
      })
      
      // Agregar logo (ajustar tamaño y posición)
      doc.addImage(logoDataUrl, 'PNG', 15, 10, 18, 18)
      
      // Configurar fuente con espacio para el logo
      doc.setFontSize(20)
      doc.text('DEPRELO - Sistema Contable', 40, 22)
      
      doc.setFontSize(16)
      doc.text(`Reporte: ${reportTypes.find(r => r.value === selectedReport)?.label}`, 20, 45)
      
      doc.setFontSize(12)
      doc.text(`Año: ${selectedYear}`, 20, 55)
      const clienteNombre = selectedClient === 'todos' ? 'Todos los clientes' : 
        clientes.find(c => c.id.toString() === selectedClient)?.nombre || 'Cliente desconocido'
      doc.text(`Cliente: ${clienteNombre}`, 20, 65)
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 75)
      
      // Resumen ejecutivo
      doc.setFontSize(14)
      doc.text('Resumen Ejecutivo', 20, 95)
      
      const summaryTable = [
        ['Concepto', 'Valor'],
        ['Valor Total Activos', `$${summaryData.totalActivos.toLocaleString()}`],
        ['Amortización Acumulada', `$${summaryData.amortizacionAcumulada.toLocaleString()}`],
        ['Activos Registrados', `${summaryData.activosRegistrados}`],
        ['Valor Contable', `$${summaryData.valorResidual.toLocaleString()}`],
      ]
      
      autoTable(doc, {
        head: [summaryTable[0]],
        body: summaryTable.slice(1),
        startY: 100,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      })
      
      // Tabla detallada
      let tableData: any[] = []
      let headers: string[] = []
      
      switch (selectedReport) {
        case 'resumen':
        case 'clientes':
          headers = ['Categoría/Cliente', 'Cantidad', 'Valor Total', 'Amortización', 'Valor Contable']
          tableData = reportData.map(item => [
            item.categoria || item.cliente,
            item.cantidad.toString(),
            `$${item.valor.toLocaleString()}`,
            `$${item.amortizacion.toLocaleString()}`,
            `$${item.valorContable.toLocaleString()}`
          ])
          break
        case 'amortizaciones':
          headers = ['Activo', 'Cliente', 'Categoría', 'Período', 'Valor Inicial', 'Amortización', 'Valor Final']
          tableData = reportData.map(item => [
            item.activo_nombre,
            item.cliente_nombre,
            item.categoria_nombre,
            `${item.periodo_mes}/${item.periodo_año}`,
            `$${parseFloat(item.valor_inicial || 0).toLocaleString()}`,
            `$${parseFloat(item.cuota_amortizacion || 0).toLocaleString()}`,
            `$${parseFloat(item.valor_final || 0).toLocaleString()}`
          ])
          break
        case 'activos':
          headers = ['Nombre', 'Cliente', 'Categoría', 'Valor', 'Fecha Adquisición', 'Estado']
          tableData = reportData.map(item => [
            item.nombre,
            item.cliente,
            item.categoria,
            `$${item.valor.toLocaleString()}`,
            item.fechaAdquisicion,
            item.estado
          ])
          break
      }
      
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 150,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      })
      
      // Guardar el PDF
      const fileName = `reporte_${selectedReport}_${selectedYear}_${Date.now()}.pdf`
      doc.save(fileName)
      
      toast({
        title: "PDF exportado",
        description: `Reporte guardado como ${fileName}`,
      })
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar el archivo PDF",
        variant: "destructive",
      })
    }
  }

  const handleExportExcel = async () => {
    try {
      // Crear libro de Excel
      const workbook = XLSX.utils.book_new()
      
      // Hoja de resumen
      const summarySheet = XLSX.utils.aoa_to_sheet([
        ['DEPRELO - Sistema Contable'],
        [`Reporte: ${reportTypes.find(r => r.value === selectedReport)?.label}`],
        [`Año: ${selectedYear}`],
        [`Cliente: ${selectedClient === 'todos' ? 'Todos los clientes' : 
          clientes.find(c => c.id.toString() === selectedClient)?.nombre || 'Cliente desconocido'}`],
        [`Fecha: ${new Date().toLocaleDateString('es-ES')}`],
        [],
        ['RESUMEN EJECUTIVO'],
        ['Concepto', 'Valor'],
        ['Valor Total Activos', summaryData.totalActivos],
        ['Amortización Acumulada', summaryData.amortizacionAcumulada],
        ['Activos Registrados', summaryData.activosRegistrados],
        ['Valor Contable', summaryData.valorResidual],
      ])
      
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')
      
      // Hoja de datos detallados
      let detailData: any[] = []
      
      switch (selectedReport) {
        case 'resumen':
        case 'clientes':
          detailData = reportData.map(item => ({
            'Categoría/Cliente': item.categoria || item.cliente,
            'Cantidad': item.cantidad,
            'Valor Total': item.valor,
            'Amortización': item.amortizacion,
            'Valor Contable': item.valorContable
          }))
          break
        case 'amortizaciones':
          detailData = reportData.map(item => ({
            'Activo': item.activo_nombre,
            'Cliente': item.cliente_nombre,
            'Categoría': item.categoria_nombre,
            'Período': `${item.periodo_mes}/${item.periodo_año}`,
            'Valor Inicial': parseFloat(item.valor_inicial || 0),
            'Amortización': parseFloat(item.cuota_amortizacion || 0),
            'Valor Final': parseFloat(item.valor_final || 0),
            'Método': item.metodo_aplicado
          }))
          break
        case 'activos':
          detailData = reportData.map(item => ({
            'Nombre': item.nombre,
            'Cliente': item.cliente,
            'Categoría': item.categoria,
            'Valor': item.valor,
            'Fecha Adquisición': item.fechaAdquisicion,
            'Estado': item.estado
          }))
          break
      }
      
      const detailSheet = XLSX.utils.json_to_sheet(detailData)
      XLSX.utils.book_append_sheet(workbook, detailSheet, 'Detalle')
      
      // Guardar el archivo
      const fileName = `reporte_${selectedReport}_${selectedYear}_${Date.now()}.xlsx`
      XLSX.writeFile(workbook, fileName)
      
      toast({
        title: "Excel exportado",
        description: `Reporte guardado como ${fileName}`,
      })
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al generar el archivo Excel",
        variant: "destructive",
      })
    }
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

      {/* Resumen ejecutivo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total Activos</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryData.totalActivos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Valor contable actual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amortización Acumulada</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryData.amortizacionAcumulada.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total año {selectedYear}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos Registrados</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.activosRegistrados}</div>
            <p className="text-xs text-muted-foreground">En todas las categorías</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Residual</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summaryData.valorResidual.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Valor después de amortización</p>
          </CardContent>
        </Card>
      </div>

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
                {selectedReport === 'resumen' && (
                  <>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Amortización</TableHead>
                    <TableHead>Valor Contable</TableHead>
                  </>
                )}
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
                    <TableHead>Valor</TableHead>
                    <TableHead>Fecha Adquisición</TableHead>
                    <TableHead>Estado</TableHead>
                  </>
                )}
                {selectedReport === 'clientes' && (
                  <>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cantidad Activos</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Amortización</TableHead>
                    <TableHead>Valor Contable</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center p-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Cargando datos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center p-8">
                    <p className="text-gray-500">No hay datos disponibles para este reporte</p>
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((item, index) => (
                  <TableRow key={index}>
                    {selectedReport === 'resumen' && (
                      <>
                        <TableCell className="font-medium">{item.categoria}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>${item.valor.toLocaleString()}</TableCell>
                        <TableCell>${item.amortizacion.toLocaleString()}</TableCell>
                        <TableCell>${item.valorContable.toLocaleString()}</TableCell>
                      </>
                    )}
                    {selectedReport === 'amortizaciones' && (
                      <>
                        <TableCell className="font-medium">{item.activo_nombre}</TableCell>
                        <TableCell>{item.cliente_nombre}</TableCell>
                        <TableCell>{item.categoria_nombre}</TableCell>
                        <TableCell>{item.periodo_mes}/{item.periodo_año}</TableCell>
                        <TableCell>${parseFloat(item.valor_inicial || 0).toLocaleString()}</TableCell>
                        <TableCell>${parseFloat(item.cuota_amortizacion || 0).toLocaleString()}</TableCell>
                        <TableCell>${parseFloat(item.valor_final || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.metodo_aplicado}</Badge>
                        </TableCell>
                      </>
                    )}
                    {selectedReport === 'activos' && (
                      <>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell>{item.cliente}</TableCell>
                        <TableCell>{item.categoria}</TableCell>
                        <TableCell>${item.valor.toLocaleString()}</TableCell>
                        <TableCell>{item.fechaAdquisicion}</TableCell>
                        <TableCell>
                          <Badge variant={item.estado === 'Activo' ? 'default' : 'secondary'}>
                            {item.estado}
                          </Badge>
                        </TableCell>
                      </>
                    )}
                    {selectedReport === 'clientes' && (
                      <>
                        <TableCell className="font-medium">{item.cliente}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>${item.valor.toLocaleString()}</TableCell>
                        <TableCell>${item.amortizacion.toLocaleString()}</TableCell>
                        <TableCell>${item.valorContable.toLocaleString()}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
