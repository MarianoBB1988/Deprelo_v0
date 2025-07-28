const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWebAccess() {
  console.log('🌐 Probando acceso a la aplicación web...')
  
  try {
    // 1. Probar la página principal
    console.log('1️⃣ Accediendo a la página principal...')
    const mainPage = await fetch('http://localhost:3004/')
    console.log(`   📄 Página principal: ${mainPage.status} ${mainPage.statusText}`)
    
    // 2. Probar el login
    console.log('2️⃣ Probando login con admin@test.com...')
    const login = await fetch('http://localhost:3004/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password'
      })
    })
    
    const loginResult = await login.json()
    console.log(`   🔐 Login: ${login.status} - ${loginResult.success ? 'ÉXITO' : 'FALLO'}`)
    
    if (loginResult.success) {
      const cookies = login.headers.get('set-cookie')
      
      // 3. Probar acceso al dashboard
      console.log('3️⃣ Accediendo al dashboard...')
      const dashboard = await fetch('http://localhost:3004/api/dashboard', {
        headers: { 'Cookie': cookies }
      })
      
      console.log(`   📊 Dashboard: ${dashboard.status}`)
      if (dashboard.status === 200) {
        const dashboardData = await dashboard.json()
        console.log('   ✅ Dashboard funciona correctamente')
      } else {
        console.log('   ❌ Dashboard tiene errores')
      }
      
      // 4. Probar otros endpoints
      console.log('4️⃣ Probando otros endpoints...')
      const [activos, categorias, clientes] = await Promise.all([
        fetch('http://localhost:3004/api/activos', { headers: { 'Cookie': cookies } }),
        fetch('http://localhost:3004/api/categorias', { headers: { 'Cookie': cookies } }),
        fetch('http://localhost:3004/api/clientes', { headers: { 'Cookie': cookies } })
      ])
      
      console.log(`   📦 Activos: ${activos.status}`)
      console.log(`   📂 Categorías: ${categorias.status}`)
      console.log(`   👥 Clientes: ${clientes.status}`)
      
      console.log('\n🎯 RESUMEN:')
      if (mainPage.status === 200 && loginResult.success && 
          activos.status === 200 && categorias.status === 200 && clientes.status === 200) {
        console.log('   ✅ La aplicación web está funcionando correctamente')
        console.log('   ✅ El login funciona')
        console.log('   ✅ Los endpoints principales responden')
        if (dashboard.status === 200) {
          console.log('   ✅ El dashboard funciona')
        } else {
          console.log('   ⚠️  El dashboard tiene errores (pero no impide el uso)')
        }
        console.log('\n🌐 Puedes acceder a la aplicación en: http://localhost:3004')
      } else {
        console.log('   ❌ Hay problemas con la aplicación')
      }
    }
    
  } catch (error) {
    console.error('💥 Error durante la prueba:', error.message)
  }
}

testWebAccess()
