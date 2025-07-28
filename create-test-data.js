const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createTestData() {
  console.log('🏗️ Creando datos de prueba para admin@test.com...')
  
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
    
    // 2. Crear una categoría
    console.log('2️⃣ Creando categoría...')
    const createCategoria = await fetch('http://localhost:3004/api/categorias', {
      method: 'POST',
      headers: { 
        'Cookie': cookies,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: 'Equipos de Oficina Test',
        descripcion: 'Equipos para la oficina de admin@test.com'
      })
    })
    const categoriaData = await createCategoria.json()
    console.log(`   ✅ Categoría creada: ${categoriaData.data?.nombre}`)
    
    // 3. Crear un cliente
    console.log('3️⃣ Creando cliente...')
    const createCliente = await fetch('http://localhost:3004/api/clientes', {
      method: 'POST',
      headers: { 
        'Cookie': cookies,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre: 'Cliente Test Admin',
        rut: '12345678-9',
        email: 'cliente@test.com',
        telefono: '+56912345678',
        direccion: 'Calle Test 123',
        ciudad: 'Santiago',
        region: 'Metropolitana',
        pais: 'Chile'
      })
    })
    const clienteData = await createCliente.json()
    console.log(`   ✅ Cliente creado: ${clienteData.data?.nombre}`)
    
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
        categoria_id: categoriaData.data?.id,
        cliente_id: clienteData.data?.id,
        valor_adquisicion: 1500000,
        valor_residual: 150000,
        fecha_adquisicion: '2024-01-01',
        fecha_alta: '2024-01-01',
        numero_serie: 'TEST123456',
        proveedor: 'Proveedor Test',
        ubicacion: 'Oficina Test'
      })
    })
    const activoData = await createActivo.json()
    console.log(`   ✅ Activo creado: ${activoData.data?.nombre}`)
    
    console.log('\n✅ ¡Datos de prueba creados exitosamente!')
    console.log('   Ahora admin@test.com tiene datos para probar el aislamiento')
    
  } catch (error) {
    console.error('💥 Error creando datos:', error.message)
  }
}

createTestData()
