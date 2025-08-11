// Script para obtener información del usuario con ID 1
const mysql = require('mysql2/promise');

async function getUserById() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'aws_user',
      password: process.env.DB_PASSWORD || 'VCNVqzX2TGkdo1ofXZ8A',
      database: process.env.DB_NAME || 'deprelo_v0'
    });

    console.log('🔍 Consultando usuario con ID 1...\n');

    // Consultar usuario con ID 1
    const [users] = await connection.execute(
      'SELECT id, email, nombre, apellido, rol, activo, fecha_creacion FROM usuarios WHERE id = ?',
      [1]
    );

    if (users.length > 0) {
      const user = users[0];
      console.log('👤 Usuario encontrado:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Nombre: ${user.nombre} ${user.apellido}`);
      console.log(`   - Rol: ${user.rol}`);
      console.log(`   - Activo: ${user.activo ? 'Sí' : 'No'}`);
      console.log(`   - Fecha creación: ${user.fecha_creacion}`);
      
      console.log('\n🔑 Para el login usa:');
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Contraseña: [Contraseña hasheada en BD - necesitas reset]`);
      
      // Verificar si es el usuario admin por defecto
      if (user.email === 'admin@deprelo.com') {
        console.log('\n💡 Este parece ser el usuario administrador por defecto.');
        console.log('   Si no recuerdas la contraseña, puedes usar el script de reset.');
      }
    } else {
      console.log('❌ No se encontró usuario con ID 1');
    }

    // Mostrar todos los usuarios para referencia
    console.log('\n📋 Todos los usuarios en la base de datos:');
    const [allUsers] = await connection.execute(
      'SELECT id, email, nombre, apellido, rol, activo FROM usuarios ORDER BY id'
    );
    
    allUsers.forEach(user => {
      console.log(`   ${user.id}: ${user.email} (${user.nombre} ${user.apellido}) - ${user.rol} ${user.activo ? '✅' : '❌'}`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Error al consultar usuario:', error.message);
  }
}

getUserById();
