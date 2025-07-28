const mysql = require('mysql2/promise')

async function testReportesEndpoints() {
  console.log('🧪 Probando endpoints de reportes...\n')

  // Simular token JWT para admin@deprelo.com (usuario 1) - token real
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiYWRtaW5AZGVwcmVsby5jb20iLCJub21icmUiOiJBZG1pbiIsInJvbCI6ImFkbWluIiwiaWF0IjoxNzUzMzgxNzU2LCJleHAiOjE3NTM0NjgxNTZ9.bUDXvJC6MdM2Mr--ae--j35OA4_rnvhotFFgNPQltTc'
  const testCookie = `auth-token=${testToken}`

  try {
    // Test 1: Dashboard endpoint
    console.log('📊 Probando endpoint de dashboard...')
    const dashboardResponse = await fetch('http://localhost:3001/api/dashboard', {
      headers: {
        'Cookie': testCookie
      }
    })
    console.log(`   Status: ${dashboardResponse.status}`)
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json()
      console.log(`   Datos: ${JSON.stringify(dashboardData).substring(0, 100)}...`)
    } else {
      const errorData = await dashboardResponse.text()
      console.log(`   Error: ${errorData.substring(0, 200)}...`)
    }

    // Test 2: Activos endpoint
    console.log('\n🏢 Probando endpoint de activos...')
    const activosResponse = await fetch('http://localhost:3001/api/activos', {
      headers: {
        'Cookie': testCookie
      }
    })
    console.log(`   Status: ${activosResponse.status}`)
    if (activosResponse.ok) {
      const activosData = await activosResponse.json()
      console.log(`   Activos encontrados: ${activosData.data ? activosData.data.length : 0}`)
    }

    // Test 3: Clientes endpoint
    console.log('\n👥 Probando endpoint de clientes...')
    const clientesResponse = await fetch('http://localhost:3001/api/clientes', {
      headers: {
        'Cookie': testCookie
      }
    })
    console.log(`   Status: ${clientesResponse.status}`)
    if (clientesResponse.ok) {
      const clientesData = await clientesResponse.json()
      console.log(`   Clientes encontrados: ${clientesData.data ? clientesData.data.length : 0}`)
    }

    // Test 4: Categorías endpoint
    console.log('\n📂 Probando endpoint de categorías...')
    const categoriasResponse = await fetch('http://localhost:3001/api/categorias', {
      headers: {
        'Cookie': testCookie
      }
    })
    console.log(`   Status: ${categoriasResponse.status}`)
    if (categoriasResponse.ok) {
      const categoriasData = await categoriasResponse.json()
      console.log(`   Categorías encontradas: ${categoriasData.data ? categoriasData.data.length : 0}`)
    }

    // Test 5: Amortizaciones endpoint
    console.log('\n📈 Probando endpoint de amortizaciones...')
    const amortizacionesResponse = await fetch('http://localhost:3001/api/amortizaciones', {
      headers: {
        'Cookie': testCookie
      }
    })
    console.log(`   Status: ${amortizacionesResponse.status}`)
    if (amortizacionesResponse.ok) {
      const amortizacionesData = await amortizacionesResponse.json()
      console.log(`   Amortizaciones encontradas: ${amortizacionesData.data ? amortizacionesData.data.length : 0}`)
    }

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message)
  }
}

// Verificar datos directamente en la base de datos
async function verifyDatabaseData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'deprelo_v0'
  })

  console.log('\n📋 Verificación directa en base de datos para usuario ID 1:\n')

  try {
    // Verificar activos
    const [activos] = await connection.execute(
      'SELECT COUNT(*) as count FROM activos WHERE usuario_id = 1 AND activo = TRUE'
    )
    console.log(`   Activos: ${activos[0].count}`)

    // Verificar clientes
    const [clientes] = await connection.execute(
      'SELECT COUNT(*) as count FROM clientes WHERE usuario_id = 1 AND activo = TRUE'
    )
    console.log(`   Clientes: ${clientes[0].count}`)

    // Verificar categorías
    const [categorias] = await connection.execute(
      'SELECT COUNT(*) as count FROM categorias WHERE usuario_id = 1 AND activo = TRUE'
    )
    console.log(`   Categorías: ${categorias[0].count}`)

    // Verificar amortizaciones
    const [amortizaciones] = await connection.execute(
      `SELECT COUNT(*) as count FROM amortizaciones a
       JOIN activos act ON a.activo_id = act.id
       WHERE act.usuario_id = 1`
    )
    console.log(`   Amortizaciones: ${amortizaciones[0].count}`)

  } finally {
    await connection.end()
  }
}

async function main() {
  await verifyDatabaseData()
  await testReportesEndpoints()
}

main()
