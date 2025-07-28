// Script para verificar el estado de la base de datos
const mysql = require('mysql2/promise');

async function checkDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'deprelo_v0'
    });

    console.log('🔍 Verificando estado de la base de datos...\n');

    // Verificar usuarios
    const [usuarios] = await connection.execute('SELECT id, email, nombre FROM usuarios WHERE activo = TRUE');
    console.log('👥 Usuarios encontrados:');
    usuarios.forEach(user => {
      console.log(`   - ID: ${user.id}, Email: ${user.email}, Nombre: ${user.nombre}`);
    });
    
    // Verificar si las tablas tienen usuario_id
    console.log('\n📊 Estructura de tablas:');
    
    const [activosStructure] = await connection.execute('DESCRIBE activos');
    const hasUsuarioIdActivos = activosStructure.some(col => col.Field === 'usuario_id');
    console.log(`   - Tabla activos tiene usuario_id: ${hasUsuarioIdActivos ? '✅' : '❌'}`);
    
    const [categoriasStructure] = await connection.execute('DESCRIBE categorias');
    const hasUsuarioIdCategorias = categoriasStructure.some(col => col.Field === 'usuario_id');
    console.log(`   - Tabla categorias tiene usuario_id: ${hasUsuarioIdCategorias ? '✅' : '❌'}`);
    
    const [clientesStructure] = await connection.execute('DESCRIBE clientes');
    const hasUsuarioIdClientes = clientesStructure.some(col => col.Field === 'usuario_id');
    console.log(`   - Tabla clientes tiene usuario_id: ${hasUsuarioIdClientes ? '✅' : '❌'}`);
    
    try {
      const [parametrosStructure] = await connection.execute('DESCRIBE categoria_parametros_anuales');
      const hasUsuarioIdParametros = parametrosStructure.some(col => col.Field === 'usuario_id');
      console.log(`   - Tabla categoria_parametros_anuales tiene usuario_id: ${hasUsuarioIdParametros ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   - Tabla categoria_parametros_anuales: ❓ Error verificando estructura`);
    }
    // Verificar datos con y sin usuario_id
    console.log('\n📈 Datos existentes:');
    
    const [activosTotal] = await connection.execute('SELECT COUNT(*) as total FROM activos WHERE activo = TRUE');
    const [activosConUsuario] = await connection.execute('SELECT COUNT(*) as total FROM activos WHERE activo = TRUE AND usuario_id IS NOT NULL');
    console.log(`   - Activos totales: ${activosTotal[0].total}`);
    console.log(`   - Activos con usuario_id: ${activosConUsuario[0].total}`);
    
    const [categoriasTotal] = await connection.execute('SELECT COUNT(*) as total FROM categorias WHERE activo = TRUE');
    const [categoriasConUsuario] = await connection.execute('SELECT COUNT(*) as total FROM categorias WHERE activo = TRUE AND usuario_id IS NOT NULL');
    console.log(`   - Categorías totales: ${categoriasTotal[0].total}`);
    console.log(`   - Categorías con usuario_id: ${categoriasConUsuario[0].total}`);
    
    const [clientesTotal] = await connection.execute('SELECT COUNT(*) as total FROM clientes WHERE activo = TRUE');
    const [clientesConUsuario] = await connection.execute('SELECT COUNT(*) as total FROM clientes WHERE activo = TRUE AND usuario_id IS NOT NULL');
    console.log(`   - Clientes totales: ${clientesTotal[0].total}`);
    console.log(`   - Clientes con usuario_id: ${clientesConUsuario[0].total}`);
    
    try {
      const [parametrosTotal] = await connection.execute('SELECT COUNT(*) as total FROM categoria_parametros_anuales');
      const [parametrosConUsuario] = await connection.execute('SELECT COUNT(*) as total FROM categoria_parametros_anuales WHERE usuario_id IS NOT NULL');
      console.log(`   - Parámetros anuales totales: ${parametrosTotal[0].total}`);
      console.log(`   - Parámetros anuales con usuario_id: ${parametrosConUsuario[0].total}`);
    } catch (error) {
      console.log(`   - Parámetros anuales: ❓ Error verificando datos`);
    }
    // Verificar datos por usuario específico
    if (usuarios.length > 0) {
      console.log('\n👤 Datos por usuario:');
      for (const usuario of usuarios) {
        const [activosUsuario] = await connection.execute('SELECT COUNT(*) as total FROM activos WHERE activo = TRUE AND usuario_id = ?', [usuario.id]);
        const [categoriasUsuario] = await connection.execute('SELECT COUNT(*) as total FROM categorias WHERE activo = TRUE AND usuario_id = ?', [usuario.id]);
        const [clientesUsuario] = await connection.execute('SELECT COUNT(*) as total FROM clientes WHERE activo = TRUE AND usuario_id = ?', [usuario.id]);
        
        let parametrosUsuario = { total: 0 };
        try {
          const [parametrosUsuarioResult] = await connection.execute('SELECT COUNT(*) as total FROM categoria_parametros_anuales WHERE usuario_id = ?', [usuario.id]);
          parametrosUsuario = parametrosUsuarioResult[0];
        } catch (error) {
          // Tabla no existe o no tiene usuario_id
        }
        
        console.log(`   - ${usuario.email}:`);
        console.log(`     * Activos: ${activosUsuario[0].total}`);
        console.log(`     * Categorías: ${categoriasUsuario[0].total}`);
        console.log(`     * Clientes: ${clientesUsuario[0].total}`);
        console.log(`     * Parámetros anuales: ${parametrosUsuario.total}`);
      }
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDatabase();
