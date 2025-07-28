const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testIsolation() {
  console.log('🧪 Iniciando prueba de aislamiento real...')
  
  try {
    // 1. Autenticar como admin@test.com (usuario sin datos)
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
      console.log('   ❌ Error en login admin:', adminAuth.error)
      return
    }
    console.log('   ✅ Login admin exitoso')
    
    // 2. Obtener datos del admin
    console.log('2️⃣ Obteniendo datos del admin...')
    const adminData = await fetch('http://localhost:3004/api/activos', {
      headers: { 'Cookie': adminCookies }
    })
    const adminActivos = await adminData.json()
    console.log(`   📊 Admin tiene ${adminActivos.data?.length || 0} activos`)
    
    // 3. Autenticar como contador@test.com (usuario sin datos)
    console.log('3️⃣ Autenticando usuario contador@test.com...')
    const loginContador = await fetch('http://localhost:3004/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'contador@test.com',
        password: 'password'
      })
    })
    
    const contadorAuth = await loginContador.json()
    const contadorCookies = loginContador.headers.get('set-cookie')
    
    if (!contadorAuth.success) {
      console.log('   ❌ Error en login contador:', contadorAuth.error)
      return
    }
    console.log('   ✅ Login contador exitoso')
    
    // 4. Obtener datos del contador
    console.log('4️⃣ Obteniendo datos del contador...')
    const contadorData = await fetch('http://localhost:3004/api/activos', {
      headers: { 'Cookie': contadorCookies }
    })
    const contadorActivos = await contadorData.json()
    console.log(`   📊 Contador tiene ${contadorActivos.data?.length || 0} activos`)
    
    // 5. Test de dashboard
    console.log('5️⃣ Probando dashboard del admin...')
    const adminDashboard = await fetch('http://localhost:3004/api/dashboard?tipo=generales', {
      headers: { 'Cookie': adminCookies }
    })
    const adminDashData = await adminDashboard.json()
    console.log(`   📊 Dashboard admin - Total activos: ${adminDashData.data?.total_activos || 0}`)
    
    console.log('6️⃣ Probando dashboard del contador...')
    const contadorDashboard = await fetch('http://localhost:3004/api/dashboard?tipo=generales', {
      headers: { 'Cookie': contadorCookies }
    })
    const contadorDashData = await contadorDashboard.json()
    console.log(`   📊 Dashboard contador - Total activos: ${contadorDashData.data?.total_activos || 0}`)
    
    // 7. Test de amortizaciones
    console.log('7️⃣ Probando amortizaciones del admin...')
    const adminAmort = await fetch('http://localhost:3004/api/amortizaciones', {
      headers: { 'Cookie': adminCookies }
    })
    const adminAmortData = await adminAmort.json()
    console.log(`   📊 Admin tiene ${adminAmortData.data?.length || 0} amortizaciones`)
    
    console.log('8️⃣ Probando amortizaciones del contador...')
    const contadorAmort = await fetch('http://localhost:3004/api/amortizaciones', {
      headers: { 'Cookie': contadorCookies }
    })
    const contadorAmortData = await contadorAmort.json()
    console.log(`   📊 Contador tiene ${contadorAmortData.data?.length || 0} amortizaciones`)
    
    // Análisis final
    console.log('\n🔍 Análisis de resultados:')
    console.log(`   - Admin activos: ${adminActivos.data?.length || 0}`)
    console.log(`   - Contador activos: ${contadorActivos.data?.length || 0}`)
    console.log(`   - Admin dashboard activos: ${adminDashData.data?.total_activos || 0}`)
    console.log(`   - Contador dashboard activos: ${contadorDashData.data?.total_activos || 0}`)
    console.log(`   - Admin amortizaciones: ${adminAmortData.data?.length || 0}`)
    console.log(`   - Contador amortizaciones: ${contadorAmortData.data?.length || 0}`)
    
    // Verificar aislamiento
    const adminTieneData = (adminActivos.data?.length || 0) > 0
    const contadorTieneData = (contadorActivos.data?.length || 0) > 0
    
    if (adminTieneData && !contadorTieneData) {
      console.log('   ✅ ÉXITO: El aislamiento funciona correctamente')
      console.log('   ✅ Admin ve sus datos, contador no ve datos del admin')
    } else if (!adminTieneData && !contadorTieneData) {
      console.log('   ⚠️  Ambos usuarios tienen 0 datos - verificar datos de prueba')
    } else if (adminTieneData && contadorTieneData) {
      console.log('   ❌ PROBLEMA: Ambos usuarios ven datos - aislamiento fallando')
    } else {
      console.log('   ⚠️  Situación inesperada')
    }
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message)
  }
}

testIsolation()
