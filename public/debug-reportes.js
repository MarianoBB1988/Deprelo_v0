// Script para debuggear el comportamiento de reportes en el navegador
console.log('🔍 Iniciando debug de reportes...')

async function testReportesFromBrowser() {
  try {
    console.log('📊 Probando endpoint de dashboard...')
    const dashboardResponse = await fetch('/api/dashboard')
    console.log('Dashboard Status:', dashboardResponse.status)
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json()
      console.log('Dashboard Data:', dashboardData)
    } else {
      const error = await dashboardResponse.text()
      console.log('Dashboard Error:', error)
    }
    
    console.log('\n🏢 Probando endpoint de activos...')
    const activosResponse = await fetch('/api/activos')
    console.log('Activos Status:', activosResponse.status)
    
    if (activosResponse.ok) {
      const activosData = await activosResponse.json()
      console.log('Activos Data:', activosData)
    } else {
      const error = await activosResponse.text()
      console.log('Activos Error:', error)
    }
    
    console.log('\n👥 Probando endpoint de clientes...')
    const clientesResponse = await fetch('/api/clientes')
    console.log('Clientes Status:', clientesResponse.status)
    
    if (clientesResponse.ok) {
      const clientesData = await clientesResponse.json()
      console.log('Clientes Data:', clientesData)
    } else {
      const error = await clientesResponse.text()
      console.log('Clientes Error:', error)
    }
    
    console.log('\n📂 Probando endpoint de categorías...')
    const categoriasResponse = await fetch('/api/categorias')
    console.log('Categorías Status:', categoriasResponse.status)
    
    if (categoriasResponse.ok) {
      const categoriasData = await categoriasResponse.json()
      console.log('Categorías Data:', categoriasData)
    } else {
      const error = await categoriasResponse.text()
      console.log('Categorías Error:', error)
    }
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error)
  }
}

testReportesFromBrowser()
