import mysql from 'mysql2/promise'

// Configuración de la conexión a MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'deprelo_v0',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool(dbConfig)

// Función para obtener una conexión
export async function getConnection() {
  try {
    return await pool.getConnection()
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error)
    throw error
  }
}

// Función para ejecutar consultas
export async function executeQuery(query: string, params: any[] = []) {
  const connection = await getConnection()
  try {
    const [results] = await connection.execute(query, params)
    return results
  } catch (error) {
    console.error('Error ejecutando consulta:', error)
    throw error
  } finally {
    connection.release()
  }
}

// Función para ejecutar transacciones
export async function executeTransaction(queries: Array<{query: string, params: any[]}>) {
  const connection = await getConnection()
  try {
    await connection.beginTransaction()
    
    const results = []
    for (const {query, params} of queries) {
      const [result] = await connection.execute(query, params)
      results.push(result)
    }
    
    await connection.commit()
    return results
  } catch (error) {
    await connection.rollback()
    console.error('Error en transacción:', error)
    throw error
  } finally {
    connection.release()
  }
}

// Función para cerrar el pool (útil para tests)
export async function closePool() {
  await pool.end()
}

export default pool
