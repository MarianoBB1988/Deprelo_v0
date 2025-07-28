const mysql = require('mysql2/promise')

async function testCompleteMultiTenantIsolation() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'deprelo_v0'
  })

  console.log('🏢 PRUEBA COMPLETA DE AISLAMIENTO MULTI-TENANT\n')

  try {
    // Obtener usuarios principales para prueba
    const [users] = await connection.execute(`
      SELECT id, email, nombre 
      FROM usuarios 
      WHERE email IN ('admin@deprelo.com', 'contador@deprelo.com', 'admin@test.com')
      AND activo = TRUE
    `)
    
    console.log('👥 Usuarios de prueba:')
    for (const user of users) {
      console.log(`   - ${user.email} (ID: ${user.id})`)
    }
    console.log()

    // Probar cada módulo por usuario
    for (const user of users) {
      console.log(`🔍 === VERIFICANDO AISLAMIENTO PARA ${user.email} ===`)
      
      // 1. Activos
      const [activos] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM activos 
        WHERE usuario_id = ? AND activo = TRUE
      `, [user.id])
      
      // 2. Categorías  
      const [categorias] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM categorias 
        WHERE usuario_id = ? AND activo = TRUE
      `, [user.id])
      
      // 3. Clientes
      const [clientes] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM clientes 
        WHERE usuario_id = ? AND activo = TRUE
      `, [user.id])
      
      // 4. Parámetros anuales
      const [parametros] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM categoria_parametros_anuales 
        WHERE usuario_id = ? AND activo = TRUE
      `, [user.id])
      
      // 5. Amortizaciones (a través de activos)
      const [amortizaciones] = await connection.execute(`
        SELECT COUNT(am.id) as count 
        FROM amortizaciones am
        INNER JOIN activos a ON am.activo_id = a.id
        WHERE a.usuario_id = ?
      `, [user.id])

      console.log(`   📊 Resumen de datos:`)
      console.log(`      * Activos: ${activos[0].count}`)
      console.log(`      * Categorías: ${categorias[0].count}`)
      console.log(`      * Clientes: ${clientes[0].count}`)
      console.log(`      * Parámetros anuales: ${parametros[0].count}`)
      console.log(`      * Amortizaciones: ${amortizaciones[0].count}`)
      
      // Verificar relaciones entre datos
      if (activos[0].count > 0) {
        const [relaciones] = await connection.execute(`
          SELECT 
            a.nombre as activo_nombre,
            c.nombre as categoria_nombre,
            cl.nombre as cliente_nombre
          FROM activos a
          INNER JOIN categorias c ON a.categoria_id = c.id
          INNER JOIN clientes cl ON a.cliente_id = cl.id
          WHERE a.usuario_id = ? AND a.activo = TRUE
          LIMIT 3
        `, [user.id])
        
        console.log(`   🔗 Relaciones (primeros 3 activos):`)
        for (const rel of relaciones) {
          console.log(`      * ${rel.activo_nombre} → ${rel.categoria_nombre} → ${rel.cliente_nombre}`)
        }
      }
      
      console.log()
    }

    // Verificación de integridad general
    console.log('🔒 === VERIFICACIÓN DE INTEGRIDAD ===')
    
    // Verificar que no hay referencias cruzadas entre usuarios
    const [crossReferences] = await connection.execute(`
      SELECT 
        'activos-categorias' as tabla,
        COUNT(*) as violaciones
      FROM activos a
      INNER JOIN categorias c ON a.categoria_id = c.id
      WHERE a.usuario_id != c.usuario_id
      
      UNION ALL
      
      SELECT 
        'activos-clientes' as tabla,
        COUNT(*) as violaciones
      FROM activos a
      INNER JOIN clientes cl ON a.cliente_id = cl.id
      WHERE a.usuario_id != cl.usuario_id
      
      UNION ALL
      
      SELECT 
        'parametros-categorias' as tabla,
        COUNT(*) as violaciones
      FROM categoria_parametros_anuales cpa
      INNER JOIN categorias c ON cpa.categoria_id = c.id
      WHERE cpa.usuario_id != c.usuario_id
    `)
    
    let totalViolaciones = 0
    for (const check of crossReferences) {
      console.log(`   ${check.tabla}: ${check.violaciones} violaciones`)
      totalViolaciones += check.violaciones
    }
    
    if (totalViolaciones === 0) {
      console.log('   ✅ ¡Excelente! No hay violaciones de integridad referencial entre usuarios.')
    } else {
      console.log(`   ⚠️  Se encontraron ${totalViolaciones} violaciones de integridad.`)
    }

    // Verificación de aislamiento total
    console.log('\n🛡️  === PRUEBA DE AISLAMIENTO TOTAL ===')
    
    const [resumen] = await connection.execute(`
      SELECT 
        u.email,
        COUNT(DISTINCT a.id) as activos,
        COUNT(DISTINCT c.id) as categorias,
        COUNT(DISTINCT cl.id) as clientes,
        COUNT(DISTINCT cpa.id) as parametros
      FROM usuarios u
      LEFT JOIN activos a ON u.id = a.usuario_id AND a.activo = TRUE
      LEFT JOIN categorias c ON u.id = c.usuario_id AND c.activo = TRUE
      LEFT JOIN clientes cl ON u.id = cl.usuario_id AND cl.activo = TRUE
      LEFT JOIN categoria_parametros_anuales cpa ON u.id = cpa.usuario_id AND cpa.activo = TRUE
      WHERE u.activo = TRUE
      GROUP BY u.id, u.email
      ORDER BY u.email
    `)
    
    for (const user of resumen) {
      const total = user.activos + user.categorias + user.clientes + user.parametros
      console.log(`   ${user.email}: ${total} registros totales (A:${user.activos}, C:${user.categorias}, Cl:${user.clientes}, P:${user.parametros})`)
    }

    console.log('\n🎉 ¡VERIFICACIÓN COMPLETA FINALIZADA!')

  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message)
  } finally {
    await connection.end()
  }
}

testCompleteMultiTenantIsolation()
