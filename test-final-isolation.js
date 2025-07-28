const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWithDataUser() {
  console.log('🧪 Probando aislamiento con usuario que tiene datos...')
  
  try {
    // 1. Autenticar como admin@test.com (usuario CON datos)
    console.log('1️⃣ Autenticando usuario admin@test.com...')
    const loginAdmin = await fetch('http://localhost:3004/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password'
      })
    })
    
    const adminAuth = await loginAdmin.json()
    const adminCookies = loginAdmin.headers.get('set-cookie')
    
    if (!adminAuth.success) {
      throw new Error('No se pudo autenticar admin@test.com')
    }
    console.log('   ✅ Login admin@test.com exitoso')
    
    // 2. Obtener datos de admin@test.com
    console.log('2️⃣ Obteniendo datos del admin@test.com...')
    const adminActivos = await fetch('http://localhost:3004/api/activos', {
      headers: { 'Cookie': adminCookies }
    })
    const adminActivosData = await adminActivos.json()
    console.log(`   📊 Admin@test.com tiene ${adminActivosData.data?.length || 0} activos`)
    
    // 3. Obtener dashboard de admin@test.com
    console.log('3️⃣ Probando dashboard del admin@test.com...')
    const adminDashboard = await fetch('http://localhost:3004/api/dashboard', {
      headers: { 'Cookie': adminCookies }
    })
    const adminDashboardData = await adminDashboard.json()
    console.log(`   📊 Dashboard admin@test.com - Total activos: ${adminDashboardData.data?.total_activos || 0}`)
    
    // 4. Autenticar como contador@test.com (usuario SIN datos)
    console.log('4️⃣ Autenticando usuario contador@test.com...')
    const loginTest = await fetch('http://localhost:3004/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'contador@test.com',
        password: 'password'
      })
    })
    
    const testAuth = await loginTest.json()
    const testCookies = loginTest.headers.get('set-cookie')
    
    if (!testAuth.success) {
      throw new Error('No se pudo autenticar contador@test.com')
    }
    console.log('   ✅ Login contador@test.com exitoso')
    
    // 5. Obtener datos de contador@test.com
    console.log('5️⃣ Obteniendo datos del contador@test.com...')
    const testActivos = await fetch('http://localhost:3004/api/activos', {
      headers: { 'Cookie': testCookies }
    })
    const testActivosData = await testActivos.json()
    console.log(`   📊 Contador@test.com tiene ${testActivosData.data?.length || 0} activos`)
    
    // 6. Obtener dashboard de contador@test.com
    console.log('6️⃣ Probando dashboard del contador@test.com...')
    const testDashboard = await fetch('http://localhost:3004/api/dashboard', {
      headers: { 'Cookie': testCookies }
    })
    const testDashboardData = await testDashboard.json()
    console.log(`   📊 Dashboard contador@test.com - Total activos: ${testDashboardData.data?.total_activos || 0}`)
    
    console.log('\n🔍 Análisis de resultados:')
    const adminActivosCount = adminActivosData.data?.length || 0
    const testActivosCount = testActivosData.data?.length || 0
    const adminDashboardActivos = adminDashboardData.data?.total_activos || 0
    const testDashboardActivos = testDashboardData.data?.total_activos || 0
    
    console.log(`   - Admin@test.com activos: ${adminActivosCount}`)
    console.log(`   - Contador@test.com activos: ${testActivosCount}`)
    console.log(`   - Admin@test.com dashboard activos: ${adminDashboardActivos}`)
    console.log(`   - Contador@test.com dashboard activos: ${testDashboardActivos}`)
    
    if (adminActivosCount > 0 && testActivosCount === 0 && 
        adminDashboardActivos > 0 && testDashboardActivos === 0) {
      console.log('\n✅ ¡PRUEBA EXITOSA! El aislamiento multi-tenant funciona correctamente:')
      console.log('   - El usuario admin@test.com ve sus datos (tiene algunos)')
      console.log('   - El usuario contador@test.com NO ve los datos del admin (tiene 0)')
      console.log('   - Cada usuario está correctamente aislado')
    } else {
      console.log('\n❌ PROBLEMA: Los datos no están correctamente aislados')
    }
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message)
  }
}

testWithDataUser()
