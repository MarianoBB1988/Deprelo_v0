// Script para verificar la estructura de la tabla activos
const mysql = require('mysql2/promise');

async function checkActivosStructure() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'deprelo_v0'
    });

    console.log('🔍 Verificando estructura de la tabla activos...\n');

    // Verificar estructura de activos
    const [activosStructure] = await connection.execute('DESCRIBE activos');
    console.log('📊 Columnas en la tabla activos:');
    activosStructure.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''} ${col.Default !== null ? `Default: ${col.Default}` : ''}`);
    });

    // Verificar si fecha_alta existe
    const hasFechaAlta = activosStructure.some(col => col.Field === 'fecha_alta');
    console.log(`\n✅ Campo 'fecha_alta' existe: ${hasFechaAlta ? 'SÍ' : 'NO'}`);

    if (!hasFechaAlta) {
      console.log('\n❌ PROBLEMA ENCONTRADO: El campo fecha_alta no existe en la tabla activos');
      console.log('💡 SOLUCIÓN: Necesitas ejecutar el script de migración o agregar la columna manualmente');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error al verificar la estructura:', error.message);
  }
}

checkActivosStructure();
