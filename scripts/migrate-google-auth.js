const mysql = require('mysql2/promise');

async function runMigration() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'Deprelo_v0'
    });

    console.log('Conectado a MySQL...');

    // Agregar columnas para Google Auth
    await connection.execute(`
      ALTER TABLE usuarios 
      ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email'
    `);
    console.log('✅ Columna auth_provider agregada');

    await connection.execute(`
      ALTER TABLE usuarios 
      ADD COLUMN avatar_url VARCHAR(500) NULL
    `);
    console.log('✅ Columna avatar_url agregada');

    // Hacer que la contraseña sea opcional
    await connection.execute(`
      ALTER TABLE usuarios 
      MODIFY COLUMN password VARCHAR(255) NULL
    `);
    console.log('✅ Columna password modificada para ser opcional');

    await connection.end();
    console.log('✅ Migración completada exitosamente');

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️ Las columnas ya existen, migración omitida');
    } else {
      console.error('❌ Error en migración:', error.message);
    }
  }
}

runMigration();
