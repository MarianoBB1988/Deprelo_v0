#!/usr/bin/env node
/**
 * Script para registrar usuarios en Deprelo
 * Uso: node scripts/create-user.js <email> <password> <nombre> [apellido] [rol]
 */

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'deprelo_v0',
};

async function createUser(email, password, nombre, apellido = '', rol = 'contador') {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🔍 Verificando si el usuario ya existe...');
    const [existingUsers] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  Usuario ya existe. Actualizando contraseña...');
    } else {
      console.log('✅ Usuario nuevo. Creando...');
    }

    console.log('🔐 Hasheando contraseña...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('💾 Guardando en base de datos...');
    if (existingUsers.length > 0) {
      // Actualizar usuario existente
      await connection.execute(
        'UPDATE usuarios SET password = ?, nombre = ?, apellido = ?, rol = ? WHERE email = ?',
        [hashedPassword, nombre, apellido, rol, email]
      );
    } else {
      // Crear nuevo usuario
      await connection.execute(
        'INSERT INTO usuarios (email, password, nombre, apellido, rol, activo) VALUES (?, ?, ?, ?, ?, 1)',
        [email, hashedPassword, nombre, apellido, rol]
      );
    }

    console.log('🧪 Verificando hash generado...');
    const testValidation = await bcrypt.compare(password, hashedPassword);
    console.log('✅ Hash válido:', testValidation);

    console.log('📋 Verificando usuario en base de datos...');
    const [userCheck] = await connection.execute(
      'SELECT id, email, nombre, apellido, rol, activo, LENGTH(password) as password_length FROM usuarios WHERE email = ?',
      [email]
    );

    if (userCheck.length > 0) {
      const user = userCheck[0];
      console.log('👤 Usuario creado/actualizado:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Nombre:', user.nombre, user.apellido);
      console.log('   Rol:', user.rol);
      console.log('   Activo:', user.activo);
      console.log('   Longitud de contraseña:', user.password_length);
    }

    console.log('✅ ¡Usuario creado/actualizado exitosamente!');
    console.log('🔑 Credenciales:');
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${password}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log(`
📖 USO DEL SCRIPT DE REGISTRO DE USUARIOS

Uso: node scripts/create-user.js <email> <password> <nombre> [apellido] [rol]

Parámetros:
  email      - Email del usuario (requerido)
  password   - Contraseña del usuario (requerido)
  nombre     - Nombre del usuario (requerido)
  apellido   - Apellido del usuario (opcional, por defecto: "")
  rol        - Rol del usuario: "admin" o "contador" (opcional, por defecto: "contador")

Ejemplos:
  node scripts/create-user.js admin@deprelo.com password123 Admin Sistema admin
  node scripts/create-user.js contador@empresa.com mipassword Juan Pérez contador
  node scripts/create-user.js test@test.com 123456 Usuario

🔧 El script:
  - Crea usuarios nuevos o actualiza existentes
  - Hashea las contraseñas automáticamente
  - Verifica que todo funcione correctamente
  - Muestra las credenciales finales
`);
}

// Función principal
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  if (args.length < 3) {
    console.error('❌ Error: Se requieren al menos email, password y nombre');
    console.log('💡 Usa: node scripts/create-user.js --help para ver la ayuda');
    process.exit(1);
  }

  const [email, password, nombre, apellido = '', rol = 'contador'] = args;

  // Validaciones
  if (!email.includes('@')) {
    console.error('❌ Error: Email inválido');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('❌ Error: La contraseña debe tener al menos 6 caracteres');
    process.exit(1);
  }

  if (!['admin', 'contador'].includes(rol)) {
    console.error('❌ Error: El rol debe ser "admin" o "contador"');
    process.exit(1);
  }

  console.log('🚀 SCRIPT DE REGISTRO DE USUARIOS - DEPRELO');
  console.log('==========================================');
  
  await createUser(email, password, nombre, apellido, rol);
}

// Ejecutar el script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createUser };
