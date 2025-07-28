import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Insertando datos de prueba...')
    
    // Insertar categorías
    await executeQuery(`
      INSERT IGNORE INTO categorias (id, nombre, descripcion, activo) VALUES
      (1, 'Maquinaria y Equipos', 'Maquinaria industrial y equipos', TRUE),
      (2, 'Vehículos', 'Vehículos de la empresa', TRUE),
      (3, 'Muebles y Enseres', 'Muebles de oficina y enseres', TRUE),
      (4, 'Equipos de Computación', 'Computadoras y equipos informáticos', TRUE)
    `)
    
    // Insertar parámetros anuales para 2025
    await executeQuery(`
      INSERT IGNORE INTO categoria_parametros_anuales 
      (categoria_id, anio_fiscal, tasa_amortizacion, metodo_amortizacion, vida_util_anos, valor_residual_porcentaje, activo) VALUES
      (1, 2025, 10.00, 'lineal', 10, 5.00, TRUE),
      (2, 2025, 20.00, 'lineal', 5, 10.00, TRUE),
      (3, 2025, 10.00, 'lineal', 10, 5.00, TRUE),
      (4, 2025, 25.00, 'lineal', 4, 0.00, TRUE)
    `)
    
    // Insertar clientes
    await executeQuery(`
      INSERT IGNORE INTO clientes (id, nombre, rut, email, telefono, direccion, activo) VALUES
      (1, 'Cliente Ejemplo S.A.', '12345678901', 'cliente@ejemplo.com', '099123456', 'Av. Principal 123', TRUE),
      (2, 'Empresa Test Ltda.', '98765432109', 'test@empresa.com', '099654321', 'Calle Secundaria 456', TRUE)
    `)
    
    // Insertar activos
    await executeQuery(`
      INSERT IGNORE INTO activos 
      (id, nombre, descripcion, categoria_id, cliente_id, valor_inicial, fecha_adquisicion, vida_util_anos, valor_residual, activo, created_at) VALUES
      (1, 'Máquina Cortadora Industrial', 'Máquina cortadora de metal industrial', 1, 1, 50000.00, '2025-01-01', 10, 2500.00, TRUE, NOW()),
      (2, 'Camioneta Ford Ranger', 'Vehículo utilitario de la empresa', 2, 1, 30000.00, '2025-01-01', 5, 3000.00, TRUE, NOW()),
      (3, 'Computadora Dell OptiPlex', 'Computadora de escritorio para oficina', 4, 2, 8000.00, '2025-01-01', 4, 0.00, TRUE, NOW()),
      (4, 'Mesa de Conferencias', 'Mesa grande para sala de reuniones', 3, 2, 5000.00, '2025-01-01', 10, 250.00, TRUE, NOW())
    `)
    
    // Verificar datos insertados
    const categorias = await executeQuery('SELECT COUNT(*) as count FROM categorias WHERE activo = TRUE') as any[]
    const parametros = await executeQuery('SELECT COUNT(*) as count FROM categoria_parametros_anuales WHERE anio_fiscal = 2025') as any[]
    const clientes = await executeQuery('SELECT COUNT(*) as count FROM clientes WHERE activo = TRUE') as any[]
    const activos = await executeQuery('SELECT COUNT(*) as count FROM activos WHERE activo = TRUE') as any[]
    
    console.log('✅ Datos insertados correctamente:', {
      categorias: categorias[0].count,
      parametros: parametros[0].count,
      clientes: clientes[0].count,
      activos: activos[0].count
    })
    
    return NextResponse.json({
      success: true,
      message: 'Datos de prueba insertados correctamente',
      data: {
        categorias: categorias[0].count,
        parametros: parametros[0].count,
        clientes: clientes[0].count,
        activos: activos[0].count
      }
    })
  } catch (error) {
    console.error('❌ Error insertando datos de prueba:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
