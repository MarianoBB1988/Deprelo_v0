// Script para probar la consulta de activos directamente
const mysql = require('mysql2/promise');

async function testActivosQuery() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'deprelo_v0'
    });

    console.log('🧪 Probando consulta de activos...\n');

    // Probar la consulta exacta que está fallando
    const userId = 1; // admin@deprelo.com
    const query = `
      SELECT a.id, a.nombre, a.descripcion, a.categoria_id, a.cliente_id,
             a.valor_adquisicion, a.valor_residual, a.fecha_adquisicion, a.fecha_alta, 
             a.numero_serie, a.proveedor, a.ubicacion, a.estado, a.activo, 
             a.fecha_creacion, a.fecha_actualizacion,
             c.nombre as categoria_nombre,
             cl.nombre as cliente_nombre, cl.rut as cliente_rut
      FROM activos a
      INNER JOIN categorias c ON a.categoria_id = c.id AND c.usuario_id = ?
      INNER JOIN clientes cl ON a.cliente_id = cl.id AND cl.usuario_id = ?
      WHERE a.activo = TRUE AND a.usuario_id = ?
      ORDER BY a.fecha_adquisicion DESC, a.nombre
    `;

    console.log('📝 Consulta a ejecutar:');
    console.log(query);
    console.log('\n🔧 Parámetros:', [userId, userId, userId]);

    try {
      const [results] = await connection.execute(query, [userId, userId, userId]);
      console.log('\n✅ Consulta ejecutada exitosamente!');
      console.log(`📊 Resultados encontrados: ${results.length}`);
      
      if (results.length > 0) {
        console.log('\n📋 Primer resultado:');
        console.log(JSON.stringify(results[0], null, 2));
      }
    } catch (queryError) {
      console.error('\n❌ Error en la consulta:', queryError.message);
      console.error('🔍 Código de error:', queryError.code);
      console.error('🔍 Estado SQL:', queryError.sqlState);
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testActivosQuery();
