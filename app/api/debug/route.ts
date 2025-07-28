import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando estado del sistema...')
    
    // Verificar activos
    const activos = await executeQuery('SELECT COUNT(*) as count FROM activos WHERE activo = TRUE')
    console.log('📦 Activos activos:', activos)
    
    // Verificar categorías
    const categorias = await executeQuery('SELECT COUNT(*) as count FROM categorias WHERE activo = TRUE')
    console.log('📁 Categorías activas:', categorias)
    
    // Verificar parámetros anuales
    const parametros = await executeQuery('SELECT COUNT(*) as count FROM categoria_parametros_anuales WHERE activo = TRUE')
    console.log('⚙️ Parámetros anuales activos:', parametros)
    
    // Verificar parámetros para 2025
    const parametros2025 = await executeQuery(
      'SELECT cpa.*, c.nombre as categoria_nombre FROM categoria_parametros_anuales cpa INNER JOIN categorias c ON cpa.categoria_id = c.id WHERE cpa.anio_fiscal = 2025'
    )
    console.log('📅 Parámetros para 2025:', parametros2025)
    
    // Verificar algunos activos de ejemplo
    const activosEjemplo = await executeQuery(`
      SELECT a.id, a.nombre, a.categoria_id, c.nombre as categoria_nombre 
      FROM activos a 
      INNER JOIN categorias c ON a.categoria_id = c.id 
      WHERE a.activo = TRUE 
      LIMIT 3
    `)
    console.log('🔍 Activos de ejemplo:', activosEjemplo)
    
    return NextResponse.json({
      success: true,
      data: {
        activos: activos,
        categorias: categorias,
        parametros: parametros,
        parametros2025: parametros2025,
        activosEjemplo: activosEjemplo
      }
    })
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
