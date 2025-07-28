// Script de prueba para verificar el aislamiento de datos multi-tenant

const baseURL = 'http://localhost:3004';

async function loginUser(email, password) {
  const response = await fetch(`${baseURL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(`Login failed: ${data.error}`);
  }
  
  // Extraer la cookie del header
  const cookies = response.headers.get('set-cookie');
  const authCookie = cookies ? cookies.split(';')[0] : null;
  
  return authCookie;
}

async function getActivosForUser(authCookie) {
  const response = await fetch(`${baseURL}/api/activos`, {
    headers: {
      'Cookie': authCookie,
    },
  });
  
  const data = await response.json();
  return data;
}

async function testIsolation() {
  try {
    console.log('🧪 Iniciando prueba de aislamiento de datos...\n');
    
    // Login con usuario contador@test.com
    console.log('1️⃣ Autenticando usuario contador@test.com...');
    const contadorCookie = await loginUser('contador@test.com', 'password');
    console.log('   ✅ Login exitoso');
    
    // Obtener activos del contador
    console.log('2️⃣ Obteniendo activos del contador...');
    const activosContador = await getActivosForUser(contadorCookie);
    console.log(`   📊 Activos encontrados: ${activosContador.data?.length || 0}`);
    
    // Login con usuario admin@test.com
    console.log('3️⃣ Autenticando usuario admin@test.com...');
    const adminCookie = await loginUser('admin@test.com', 'password');
    console.log('   ✅ Login exitoso');
    
    // Obtener activos del admin
    console.log('4️⃣ Obteniendo activos del admin...');
    const activosAdmin = await getActivosForUser(adminCookie);
    console.log(`   📊 Activos encontrados: ${activosAdmin.data?.length || 0}`);
    
    // Verificar aislamiento
    console.log('\n🔍 Análisis de resultados:');
    console.log(`   - Contador tiene ${activosContador.data?.length || 0} activos`);
    console.log(`   - Admin tiene ${activosAdmin.data?.length || 0} activos`);
    
    if (activosContador.data?.length !== activosAdmin.data?.length) {
      console.log('   ✅ ÉXITO: Los usuarios ven diferentes datos (aislamiento funcionando)');
    } else {
      console.log('   ❌ PROBLEMA: Los usuarios ven los mismos datos (aislamiento fallando)');
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testIsolation();
