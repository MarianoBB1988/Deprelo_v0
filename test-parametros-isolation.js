const mysql = require('mysql2/promise')

async function testParametrosAnualesIsolation() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'deprelo_v0'
  })

  console.log('🧪 Probando aislamiento de parámetros anuales...\n')

  try {
    // Obtener todos los usuarios
    const [users] = await connection.execute('SELECT id, email FROM usuarios WHERE activo = TRUE')
    
    console.log('👥 Usuarios disponibles:')
    for (const user of users) {
      console.log(`   - ID: ${user.id}, Email: ${user.email}`)
    }
    console.log()

    // Simular consulta para cada usuario
    for (const user of users) {
      console.log(`🔍 Verificando parámetros anuales para ${user.email}...`)
      
      // Simular la misma consulta que hace el servicio
      const [parametros] = await connection.execute(`
        SELECT 
          cpa.id,
          cpa.categoria_id,
          c.nombre as categoria_nombre,
          cpa.anio_fiscal,
          cpa.vida_util_anos,
          cpa.metodo_amortizacion,
          cpa.valor_residual_porcentaje,
          cpa.tasa_anual_porcentaje,
          cpa.coeficiente_ajuste,
          cpa.activo
        FROM categoria_parametros_anuales cpa
        JOIN categorias c ON cpa.categoria_id = c.id
        WHERE cpa.anio_fiscal = ? AND cpa.activo = TRUE AND cpa.usuario_id = ?
        ORDER BY c.nombre
      `, [2024, user.id])

      console.log(`   → Parámetros encontrados para año 2024: ${parametros.length}`)
      
      if (parametros.length > 0) {
        console.log('   → Categorías con parámetros:')
        for (const param of parametros) {
          console.log(`     * ${param.categoria_nombre} (Vida útil: ${param.vida_util_anos} años, Método: ${param.metodo_amortizacion})`)
        }
      }
      console.log()
    }

    // Verificar que cada usuario solo ve sus propios parámetros
    console.log('✅ Verificación de aislamiento:')
    
    // Usuario admin@deprelo.com debería tener parámetros
    const [adminParams] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM categoria_parametros_anuales cpa
      WHERE cpa.usuario_id = (SELECT id FROM usuarios WHERE email = 'admin@deprelo.com')
      AND cpa.activo = TRUE
    `)
    
    console.log(`   - admin@deprelo.com tiene ${adminParams[0].count} parámetros anuales`)
    
    // Otros usuarios no deberían tener parámetros
    const [otherParams] = await connection.execute(`
      SELECT u.email, COUNT(cpa.id) as count
      FROM usuarios u
      LEFT JOIN categoria_parametros_anuales cpa ON u.id = cpa.usuario_id AND cpa.activo = TRUE
      WHERE u.email != 'admin@deprelo.com' AND u.activo = TRUE
      GROUP BY u.id, u.email
    `)
    
    for (const user of otherParams) {
      console.log(`   - ${user.email} tiene ${user.count} parámetros anuales`)
    }

    // Test de integridad: verificar que no hay parámetros huérfanos
    const [orphanParams] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM categoria_parametros_anuales cpa
      LEFT JOIN usuarios u ON cpa.usuario_id = u.id
      WHERE u.id IS NULL OR u.activo = FALSE
    `)
    
    console.log(`\n🔒 Parámetros huérfanos o de usuarios inactivos: ${orphanParams[0].count}`)
    
    if (orphanParams[0].count === 0) {
      console.log('✅ ¡Perfecto! No hay parámetros huérfanos.')
    } else {
      console.log('⚠️  Advertencia: Hay parámetros que no pertenecen a usuarios activos.')
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message)
  } finally {
    await connection.end()
  }
}

testParametrosAnualesIsolation()
