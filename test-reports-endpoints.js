// Probar endpoints de reportes directamente
const testReportsEndpoints = async () => {
  console.log('🧪 Probando endpoints de reportes para usuario admin@deprelo.com...\n')
  
  try {
    // Simular cookie de autenticación del usuario 1
    const headers = {
      'Content-Type': 'application/json',
      'Cookie': 'auth-token=test-token-user-1'
    }
    
    console.log('1. Probando /api/dashboard/estadisticas...')
    try {
      const dashResponse = await fetch('http://localhost:3004/api/dashboard/estadisticas', { headers })
      const dashData = await dashResponse.json()
      console.log(`   Status: ${dashResponse.status}`)
      console.log(`   Success: ${dashData.success}`)
      if (dashData.success) {
        console.log(`   Datos: ${JSON.stringify(dashData.data, null, 2)}`)
      } else {
        console.log(`   Error: ${dashData.error}`)
      }
    } catch (err) {
      console.log(`   Error de conexión: ${err.message}`)
    }
    console.log()
    
    console.log('2. Probando /api/clientes/list...')
    try {
      const clientesResponse = await fetch('http://localhost:3004/api/clientes/list', { headers })
      const clientesData = await clientesResponse.json()
      console.log(`   Status: ${clientesResponse.status}`)
      console.log(`   Success: ${clientesData.success}`)
      if (clientesData.success) {
        console.log(`   Clientes encontrados: ${clientesData.data.length}`)
      } else {
        console.log(`   Error: ${clientesData.error}`)
      }
    } catch (err) {
      console.log(`   Error de conexión: ${err.message}`)
    }
    console.log()
    
    console.log('3. Probando /api/activos/list...')
    try {
      const activosResponse = await fetch('http://localhost:3004/api/activos/list', { headers })
      const activosData = await activosResponse.json()
      console.log(`   Status: ${activosResponse.status}`)
      console.log(`   Success: ${activosData.success}`)
      if (activosData.success) {
        console.log(`   Activos encontrados: ${activosData.data.length}`)
      } else {
        console.log(`   Error: ${activosData.error}`)
      }
    } catch (err) {
      console.log(`   Error de conexión: ${err.message}`)
    }
    console.log()
    
    console.log('4. Probando /api/amortizaciones?año=2025...')
    try {
      const amortResponse = await fetch('http://localhost:3004/api/amortizaciones?año=2025', { headers })
      const amortData = await amortResponse.json()
      console.log(`   Status: ${amortResponse.status}`)
      console.log(`   Success: ${amortData.success}`)
      if (amortData.success) {
        console.log(`   Amortizaciones encontradas: ${amortData.data.length}`)
      } else {
        console.log(`   Error: ${amortData.error}`)
      }
    } catch (err) {
      console.log(`   Error de conexión: ${err.message}`)
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Verificar si estamos en Node.js o en el navegador
if (typeof window !== 'undefined') {
  // En el navegador
  console.log('Ejecutándose en el navegador - usar la consola del desarrollador')
  window.testReportsEndpoints = testReportsEndpoints
} else {
  // En Node.js
  const fetch = require('node-fetch')
  testReportsEndpoints()
}
