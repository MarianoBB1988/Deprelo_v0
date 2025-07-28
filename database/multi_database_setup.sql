-- ============================================
-- SISTEMA DE BASE DE DATOS POR USUARIO
-- Cada usuario tendrá su propia base de datos
-- ============================================

-- Script para crear automáticamente una DB por usuario

-- ============================================
-- PROCEDIMIENTO PARA CREAR DB POR USUARIO
-- ============================================

DELIMITER //
CREATE PROCEDURE crear_database_usuario(
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_nombre VARCHAR(255),
    IN p_apellido VARCHAR(255)
)
BEGIN
    DECLARE db_name VARCHAR(100);
    DECLARE nuevo_usuario_id INT;
    DECLARE sql_stmt TEXT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Crear entrada en la DB principal
    INSERT INTO deprelo_v0.usuarios (email, password, rol, nombre, apellido)
    VALUES (p_email, p_password, 'contador', p_nombre, p_apellido);
    
    SET nuevo_usuario_id = LAST_INSERT_ID();
    
    -- Generar nombre único para la DB
    SET db_name = CONCAT('deprelo_user_', nuevo_usuario_id);
    
    -- Actualizar usuario con el nombre de su DB
    UPDATE deprelo_v0.usuarios 
    SET database_name = db_name 
    WHERE id = nuevo_usuario_id;
    
    -- Crear la nueva base de datos
    SET sql_stmt = CONCAT('CREATE DATABASE ', db_name, ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    SET @sql = sql_stmt;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Usar la nueva base de datos
    SET sql_stmt = CONCAT('USE ', db_name);
    SET @sql = sql_stmt;
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    COMMIT;
    
    SELECT nuevo_usuario_id as usuario_id, db_name as database_name, 'Database creada exitosamente' as mensaje;
END //
DELIMITER ;

-- ============================================
-- FUNCIÓN PARA OBTENER CONEXIÓN DE USUARIO
-- ============================================

-- Agregar columna para el nombre de DB en usuarios
ALTER TABLE deprelo_v0.usuarios 
ADD COLUMN database_name VARCHAR(100) AFTER apellido,
ADD INDEX idx_database_name (database_name);

-- ============================================
-- TEMPLATE PARA CREAR SCHEMA EN NUEVA DB
-- ============================================

-- Este script se ejecutará para cada nueva DB de usuario
-- (se puede cargar desde archivo externo)

/*
INSTRUCCIONES DE IMPLEMENTACIÓN:

1. CONFIGURACIÓN DE CONEXIÓN:
```typescript
// lib/database-manager.ts
export class DatabaseManager {
    private connections: Map<string, mysql.Connection> = new Map()
    
    async getUserConnection(userId: number): Promise<mysql.Connection> {
        const user = await this.getUserInfo(userId)
        
        if (!this.connections.has(user.database_name)) {
            const connection = mysql.createConnection({
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: user.database_name
            })
            this.connections.set(user.database_name, connection)
        }
        
        return this.connections.get(user.database_name)!
    }
}
```

2. SERVICIOS ACTUALIZADOS:
```typescript
// lib/services/activo-service.ts
export class ActivoService {
    static async obtenerTodos(userId: number) {
        const connection = await DatabaseManager.getUserConnection(userId)
        const [rows] = await connection.execute('SELECT * FROM activos WHERE activo = TRUE')
        return rows
    }
}
```

3. MIDDLEWARE DE AUTENTICACIÓN:
```typescript
// middleware/auth.ts
export async function authenticateUser(request: NextRequest) {
    const token = request.cookies.get('auth-token')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Retorna tanto userId como database_name
    return {
        userId: decoded.userId,
        databaseName: decoded.databaseName
    }
}
```

VENTAJAS:
- ✅ Aislamiento completo de datos
- ✅ Escalabilidad independiente
- ✅ Backups individuales
- ✅ Múltiples esquemas/versiones

DESVENTAJAS:
- ❌ Mayor complejidad de gestión
- ❌ Más recursos de servidor
- ❌ Múltiples conexiones de DB
- ❌ Mantenimiento complejo
*/
