const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Script para probar diferentes combinaciones de usuario/contraseña
async function testPasswords() {
  const users = [
    { email: 'admin@deprelo.com', passwords: ['password', 'admin', '123456', 'admin123'] },
    { email: 'admin@test.com', passwords: ['password', 'admin', '123456'] },
    { email: 'contador@test.com', passwords: ['password', 'contador', '123456'] }
  ];

  for (const user of users) {
    console.log(`\n🔑 Probando usuario: ${user.email}`);
    
    for (const password of user.passwords) {
      try {
        const response = await fetch('http://localhost:3003/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            password: password
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log(`   ✅ ${password} - ÉXITO`);
          
          // Si el login es exitoso, probar obtener activos
          const cookies = response.headers.get('set-cookie');
          const activosResponse = await fetch('http://localhost:3003/api/activos', {
            headers: { 'Cookie': cookies }
          });
          const activosData = await activosResponse.json();
          console.log(`   📊 Tiene ${activosData.data?.length || 0} activos`);
          
          return { email: user.email, password: password, activos: activosData.data?.length || 0 };
        } else {
          console.log(`   ❌ ${password} - Error: ${result.error}`);
        }
      } catch (error) {
        console.log(`   💥 ${password} - Error de conexión: ${error.message}`);
      }
    }
  }
  
  return null;
}

testPasswords().then(result => {
  if (result) {
    console.log(`\n🎉 Usuario válido encontrado: ${result.email} con contraseña: ${result.password}`);
    console.log(`   📊 Este usuario tiene ${result.activos} activos`);
  } else {
    console.log('\n❌ No se encontró ninguna combinación válida');
  }
});
