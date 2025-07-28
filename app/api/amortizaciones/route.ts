import { NextRequest, NextResponse } from 'next/server'
import { AmortizacionService } from '@/lib/services/amortizacion.service'
import { getUserIdFromRequest } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Obtener el userId del token de autenticación
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    const url = new URL(request.url)
    const activoId = url.searchParams.get('activoId')
    const clienteId = url.searchParams.get('clienteId')
    const categoriaId = url.searchParams.get('categoriaId')
    const año = url.searchParams.get('año')
    const mes = url.searchParams.get('mes')
    const resumen = url.searchParams.get('resumen')

    let amortizaciones

    if (resumen === 'true' && año) {
      amortizaciones = await AmortizacionService.obtenerResumenAnual(parseInt(año), userId)
    } else if (activoId) {
      amortizaciones = await AmortizacionService.obtenerPorActivo(parseInt(activoId), userId)
    } else if (clienteId) {
      amortizaciones = await AmortizacionService.obtenerPorCliente(
        parseInt(clienteId), 
        userId,
        año ? parseInt(año) : undefined
      )
    } else if (categoriaId) {
      amortizaciones = await AmortizacionService.obtenerPorCategoria(
        parseInt(categoriaId), 
        userId,
        año ? parseInt(año) : undefined
      )
    } else if (año) {
      amortizaciones = await AmortizacionService.obtenerPorPeriodo(
        parseInt(año), 
        userId,
        mes ? parseInt(mes) : undefined
      )
    } else {
      amortizaciones = await AmortizacionService.obtenerTodas(userId)
    }

    return NextResponse.json({
      success: true,
      data: amortizaciones
    })
  } catch (error) {
    console.error('Error obteniendo amortizaciones:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener el userId del token de autenticación
    const userId = await getUserIdFromRequest(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    const { año, anio, mes, activo_id, cliente_id, categoria_id, metodo } = await request.json()
    
    // Aceptar tanto "año" como "anio" para compatibilidad
    const añoValue = año || anio
    
    console.log('🔢 POST /api/amortizaciones - Datos recibidos:', { año, anio, añoValue, mes, activo_id, cliente_id, categoria_id, metodo })
    
    if (!añoValue) {
      console.log('❌ Error: Año no proporcionado')
      return NextResponse.json(
        { success: false, error: 'El año es requerido' },
        { status: 400 }
      )
    }

    console.log('⚙️ Llamando a calcularAmortizacionesMasivas con parámetros:', {
      año: parseInt(añoValue),
      mes: mes ? parseInt(mes) : undefined,
      activo_id: activo_id ? parseInt(activo_id) : undefined,
      cliente_id: cliente_id ? parseInt(cliente_id) : undefined,
      categoria_id: categoria_id ? parseInt(categoria_id) : undefined,
      metodo: metodo || 'automatico',
      userId
    })

    const resultado = await AmortizacionService.calcularAmortizacionesMasivas({
      año: parseInt(añoValue),
      mes: mes ? parseInt(mes) : undefined,
      activo_id: activo_id ? parseInt(activo_id) : undefined,
      cliente_id: cliente_id ? parseInt(cliente_id) : undefined,
      categoria_id: categoria_id ? parseInt(categoria_id) : undefined,
      metodo: metodo || 'automatico',
      userId
    })
    
    console.log('📋 Resultado del cálculo:', resultado)
    
    if (resultado.success) {
      return NextResponse.json(resultado, { status: 201 })
    } else {
      return NextResponse.json(resultado, { status: 400 })
    }
  } catch (error) {
    console.error('💥 Error calculando amortizaciones:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    )
  }
}
