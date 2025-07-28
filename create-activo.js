const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createActivo() {
  console.log('🏗️ Creando activo para admin@test.com...')
  
  try {
    // 1. Autenticar como admin@test.com
    console.log('1️⃣ Autenticando admin@test.com...')
    const login = await fetch('http://localhost:3004/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password'
      })
    })
    
    const auth = await login.json()
    const cookies = login.headers.get('set-cookie')
    
    if (!auth.success) {
      throw new Error('No se pudo autenticar')
    }
    console.log('   ✅ Login exitoso')
    
    // 2. Obtener categorías
    console.log('2️⃣ Obteniendo categorías...')
    const categorias = await fetch('http://localhost:3004/api/categorias', {
      headers: { 'Cookie': cookies }
    })
    const categoriasData = await categorias.json()
    console.log(`   📊 Encontradas ${categoriasData.data?.length || 0} categorías`)
    const categoria = categoriasData.data?.[0]
    
    // 3. Obtener clientes
    console.log('3️⃣ Obteniendo clientes...')
    const clientes = await fetch('http://localhost:3004/api/clientes', {
      headers: { 'Cookie': cookies }
    })
    const clientesData = await clientes.json()
    console.log(`   📊 Encontrados ${clientesData.data?.length || 0} clientes`)
    const cliente = clientesData.data?.[0]
    
    if (!categoria || !cliente) {
      throw new Error('No se encontraron categoría o cliente')
    }
    
    // 4. Crear un activo
    console.log('4️⃣ Creando activo...')
    const createActivo = await fetch('http://localhost:3004/api/activos', {
      method: 'POST',
      headers: { 
        'Cookie': cookies,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: 'Computador Test',
        descripcion: 'Computador para pruebas de admin@test.com',
        categoria_id: categoria.id,
        cliente_id: cliente.id,
        valor_adquisicion: 1500000,
        valor_residual: 150000,
        fecha_adquisicion: '2024-01-01',
        fecha_alta: '2024-01-01',
        numero_serie: 'TEST123456',
        proveedor: 'Proveedor Test',
        ubicacion: 'Oficina Test'
      })
    })
    
    const activoResponse = await createActivo.text()
    console.log('   📄 Respuesta del servidor:', activoResponse)
    
    try {
      const activoData = JSON.parse(activoResponse)
      if (activoData.success) {
        console.log(`   ✅ Activo creado: ${activoData.data?.nombre || 'Sin nombre'}`)
      } else {
        console.log(`   ❌ Error: ${activoData.error}`)
      }
    } catch (parseError) {
      console.log('   ❌ Error parseando respuesta JSON')
    }
    
  } catch (error) {
    console.error('💥 Error creando activo:', error.message)
  }
}

createActivo()
