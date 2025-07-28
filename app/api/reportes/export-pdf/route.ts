import { NextRequest, NextResponse } from 'next/server'
import { createPDF } from '@/lib/server-utils'
import { ActivoService, AmortizacionService, ClienteService, CategoriaService, DashboardService } from '@/lib/services'
import { getUserIdFromRequest } from '@/lib/auth-middleware'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { reportType, year, clientId } = await request.json()
    
    // Generar datos del reporte
    let reportData: any[] = []
    let summaryData = {
      totalActivos: 0,
      amortizacionAcumulada: 0,
      activosRegistrados: 0,
      valorResidual: 0
    }

    // Obtener clientes y categorías
    const [clientes, categorias] = await Promise.all([
      ClienteService.obtenerTodos(userId),
      CategoriaService.obtenerTodas(userId)
    ])

    switch (reportType) {
      case "resumen":
        const dashboardData = await DashboardService.obtenerEstadisticasGenerales(userId)
        summaryData = {
          totalActivos: dashboardData.valor_total_activos || 0,
          amortizacionAcumulada: dashboardData.amortizacion_anual_actual || 0,
          activosRegistrados: dashboardData.total_activos || 0,
          valorResidual: (dashboardData.valor_total_activos || 0) - (dashboardData.amortizacion_anual_actual || 0)
        }

        const activosData = await ActivoService.obtenerTodos(userId)
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
          
          try {
            const amortizaciones = await AmortizacionService.obtenerPorActivo(activo.id, userId)
            const amortizacionAnual = amortizaciones
              .filter((a: any) => a.periodo_año === parseInt(year))
              .reduce((sum: number, a: any) => sum + (a.cuota_amortizacion || 0), 0)
            item.amortizacion += amortizacionAnual
          } catch (error) {
            console.error(`Error calculando amortización para activo ${activo.id}:`, error)
          }
          
          item.valorContable = item.valor - item.amortizacion
        }
        
        reportData = Array.from(activosPorCategoria.values())
        break

      case "amortizaciones":
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002'}/api/amortizaciones?año=${year}${clientId !== 'todos' ? `&clienteId=${clientId}` : ''}`)
        const result = await response.json()
        
        if (result.success) {
          reportData = result.data
          
          const totalAmortizacion = result.data.reduce((sum: number, item: any) => 
            sum + parseFloat(item.cuota_amortizacion || 0), 0)
          const totalValorInicial = result.data.reduce((sum: number, item: any) => 
            sum + parseFloat(item.valor_inicial || 0), 0)
          const totalValorFinal = result.data.reduce((sum: number, item: any) => 
            sum + parseFloat(item.valor_final || 0), 0)

          summaryData = {
            totalActivos: totalValorInicial,
            amortizacionAcumulada: totalAmortizacion,
            activosRegistrados: new Set(result.data.map((item: any) => item.activo_id)).size,
            valorResidual: totalValorFinal
          }
        }
        break

      case "activos":
        const todosActivos = await ActivoService.obtenerTodos(userId)
        const activosDetalle = []
        
        for (const activo of todosActivos) {
          if (clientId !== "todos") {
            if (activo.cliente_id.toString() !== clientId) continue
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
        
        reportData = activosDetalle
        summaryData.activosRegistrados = reportData.length
        summaryData.totalActivos = reportData.reduce((sum, item) => sum + item.valor, 0)
        break

      case "clientes":
        const activosPorCliente = new Map()
        const activosClientes = await ActivoService.obtenerTodos(userId)
        
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
            const amortizaciones = await AmortizacionService.obtenerPorActivo(activo.id, userId)
            const amortizacionAnual = amortizaciones
              .filter((a: any) => a.periodo_año === parseInt(year))
              .reduce((sum: number, a: any) => sum + (a.cuota_amortizacion || 0), 0)
            item.amortizacion += amortizacionAnual
          } catch (error) {
            console.error(`Error calculando amortización para activo ${activo.id}:`, error)
          }
          
          item.valorContable = item.valor - item.amortizacion
        }
        
        reportData = Array.from(activosPorCliente.values())
        summaryData.activosRegistrados = reportData.reduce((sum, item) => sum + item.cantidad, 0)
        summaryData.totalActivos = reportData.reduce((sum, item) => sum + item.valor, 0)
        summaryData.amortizacionAcumulada = reportData.reduce((sum, item) => sum + item.amortizacion, 0)
        summaryData.valorResidual = summaryData.totalActivos - summaryData.amortizacionAcumulada
        break
    }

    // Crear PDF usando importación dinámica
    const { jsPDF, autoTable } = await createPDF()
    const doc = new jsPDF()
    
    // Cargar y agregar el logo
    try {
      const logoPath = path.join(process.cwd(), 'public', 'deprelo.png')
      const logoBuffer = fs.readFileSync(logoPath)
      const logoBase64 = logoBuffer.toString('base64')
      const logoDataUrl = `data:image/png;base64,${logoBase64}`
      
      // Agregar logo (ajustar tamaño y posición)
      doc.addImage(logoDataUrl, 'PNG', 15, 10, 18, 18)
    } catch (error) {
      console.warn('No se pudo cargar el logo:', error)
    }
    
    // Configurar fuente con espacio para el logo
    doc.setFontSize(20)
    doc.text('DEPRELO - Gestor de Activos', 40, 22)
    
    doc.setFontSize(16)
    const reportTypes = {
      resumen: "Resumen General",
      amortizaciones: "Reporte de Amortizaciones", 
      activos: "Inventario de Activos",
      clientes: "Reporte por Cliente"
    }
    doc.text(`Reporte: ${reportTypes[reportType as keyof typeof reportTypes]}`, 20, 45)
    
    doc.setFontSize(12)
    doc.text(`Año: ${year}`, 20, 55)
    const clienteNombre = clientId === 'todos' ? 'Todos los clientes' : 
      clientes.find(c => c.id.toString() === clientId)?.nombre || 'Cliente desconocido'
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
    
    switch (reportType) {
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
    
    // Convertir PDF a buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte_${reportType}_${year}_${Date.now()}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json(
      { success: false, error: 'Error generando el PDF' },
      { status: 500 }
    )
  }
}
