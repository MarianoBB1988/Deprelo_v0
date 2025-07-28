import { NextRequest, NextResponse } from 'next/server'
import { executeQuery } from '@/lib/database'

export async function GET() {
  try {
    // Probar conexión básica
    const result = await executeQuery('SELECT 1 as test')
    
    // Probar consulta a la base de datos
    const usuarios = await executeQuery('SELECT COUNT(*) as count FROM usuarios')
    const categorias = await executeQuery('SELECT COUNT(*) as count FROM categorias')
    const clientes = await executeQuery('SELECT COUNT(*) as count FROM clientes')
    const activos = await executeQuery('SELECT COUNT(*) as count FROM activos')
    
    return NextResponse.json({
      success: true,
      message: 'Conexión a la base de datos exitosa',
      data: {
        usuarios: (usuarios as any[])[0].count,
        categorias: (categorias as any[])[0].count,
        clientes: (clientes as any[])[0].count,
        activos: (activos as any[])[0].count
      }
    })
  } catch (error) {
    console.error('Error conectando a la base de datos:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error conectando a la base de datos',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    )
  }
}
