import { NextRequest, NextResponse } from 'next/server'
import { createExcel } from '@/lib/server-utils'
import { ActivoService, AmortizacionService, ClienteService, CategoriaService, DashboardService } from '@/lib/services'
import { getUserIdFromRequest } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const { reportType, year, clientId } = await request.json()
    
    // Generar datos del reporte (mismo código que en PDF)
    let reportData: any[] = []
    let summaryData = {
      totalActivos: 0,
      amortizacionAcumulada: 0,
      activosRegistrados: 0,
      valorResidual: 0
    }

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

    // Crear libro de Excel usando importación dinámica
    const XLSX = await createExcel()
    const workbook = XLSX.utils.book_new()
    
    // Hoja de resumen
    const reportTypes = {
      resumen: "Resumen General",
      amortizaciones: "Reporte de Amortizaciones", 
      activos: "Inventario de Activos",
      clientes: "Reporte por Cliente"
    }
    
    const clienteNombre = clientId === 'todos' ? 'Todos los clientes' : 
      clientes.find(c => c.id.toString() === clientId)?.nombre || 'Cliente desconocido'
    
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['DEPRELO - Sistema Contable'],
      [`Reporte: ${reportTypes[reportType as keyof typeof reportTypes]}`],
      [`Año: ${year}`],
      [`Cliente: ${clienteNombre}`],
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
    
    switch (reportType) {
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
    
    // Convertir a buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
    
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte_${reportType}_${year}_${Date.now()}.xlsx"`
      }
    })
    
  } catch (error) {
    console.error('Error generando Excel:', error)
    return NextResponse.json(
      { success: false, error: 'Error generando el Excel' },
      { status: 500 }
    )
  }
}
