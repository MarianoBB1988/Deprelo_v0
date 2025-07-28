-- ============================================
-- MIGRACIÓN A MULTI-TENANCY POR USUARIO (CORREGIDA)
-- Agrega usuario_id a todas las tablas principales
-- ============================================

USE deprelo_v0;

-- 1. Agregar usuario_id a tabla categorias
ALTER TABLE categorias 
ADD COLUMN usuario_id INT AFTER id,
ADD INDEX idx_usuario_categorias (usuario_id);

-- 2. Agregar usuario_id a tabla clientes  
ALTER TABLE clientes 
ADD COLUMN usuario_id INT AFTER id,
ADD INDEX idx_usuario_clientes (usuario_id);

-- 3. Agregar usuario_id a tabla activos
ALTER TABLE activos 
ADD COLUMN usuario_id INT AFTER id,
ADD INDEX idx_usuario_activos (usuario_id);

-- 4. Agregar usuario_id a tabla amortizaciones
ALTER TABLE amortizaciones 
ADD COLUMN usuario_id INT AFTER id,
ADD INDEX idx_usuario_amortizaciones (usuario_id);

-- 5. Agregar usuario_id a tabla categoria_parametros_anuales
ALTER TABLE categoria_parametros_anuales 
ADD COLUMN usuario_id INT AFTER id,
ADD INDEX idx_usuario_parametros (usuario_id);

-- ============================================
-- ASIGNAR DATOS EXISTENTES AL USUARIO ADMIN
-- ============================================

-- Obtener el ID del usuario admin
SET @admin_user_id = (SELECT id FROM usuarios WHERE email = 'admin@deprelo.com' LIMIT 1);

-- Si no existe el admin, usar el primer usuario
IF @admin_user_id IS NULL THEN
    SET @admin_user_id = (SELECT id FROM usuarios ORDER BY id LIMIT 1);
END IF;

-- Asignar todos los registros existentes al usuario admin
UPDATE categorias SET usuario_id = @admin_user_id WHERE usuario_id IS NULL;
UPDATE clientes SET usuario_id = @admin_user_id WHERE usuario_id IS NULL;
UPDATE activos SET usuario_id = @admin_user_id WHERE usuario_id IS NULL;
UPDATE amortizaciones SET usuario_id = @admin_user_id WHERE usuario_id IS NULL;
UPDATE categoria_parametros_anuales SET usuario_id = @admin_user_id WHERE usuario_id IS NULL;

-- ============================================
-- AGREGAR FOREIGN KEYS DESPUÉS DE ASIGNAR VALORES
-- ============================================

ALTER TABLE categorias 
ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE clientes 
ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE activos 
ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE amortizaciones 
ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE categoria_parametros_anuales 
ADD FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================
-- HACER CAMPOS OBLIGATORIOS DESPUÉS DE MIGRAR
-- ============================================

-- Hacer usuario_id NOT NULL después de asignar valores
ALTER TABLE categorias MODIFY usuario_id INT NOT NULL;
ALTER TABLE clientes MODIFY usuario_id INT NOT NULL;
ALTER TABLE activos MODIFY usuario_id INT NOT NULL;
ALTER TABLE amortizaciones MODIFY usuario_id INT NOT NULL;
ALTER TABLE categoria_parametros_anuales MODIFY usuario_id INT NOT NULL;

-- ============================================
-- FUNCIÓN PARA OBTENER EL USUARIO ACTUAL
-- ============================================

DELIMITER //
CREATE FUNCTION get_current_user_id() RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE user_id INT DEFAULT NULL;
    SELECT @current_user_id INTO user_id;
    RETURN COALESCE(user_id, 1); -- Default al primer usuario si no está definido
END //
DELIMITER ;

-- ============================================
-- TRIGGERS PARA AUTO-ASIGNAR USUARIO
-- ============================================

-- Trigger para categorias
DELIMITER //
CREATE TRIGGER tr_categorias_set_user BEFORE INSERT ON categorias
FOR EACH ROW
BEGIN
    IF NEW.usuario_id IS NULL THEN
        SET NEW.usuario_id = get_current_user_id();
    END IF;
END //
DELIMITER ;

-- Trigger para clientes
DELIMITER //
CREATE TRIGGER tr_clientes_set_user BEFORE INSERT ON clientes
FOR EACH ROW
BEGIN
    IF NEW.usuario_id IS NULL THEN
        SET NEW.usuario_id = get_current_user_id();
    END IF;
END //
DELIMITER ;

-- Trigger para activos
DELIMITER //
CREATE TRIGGER tr_activos_set_user BEFORE INSERT ON activos
FOR EACH ROW
BEGIN
    IF NEW.usuario_id IS NULL THEN
        SET NEW.usuario_id = get_current_user_id();
    END IF;
END //
DELIMITER ;

-- Trigger para amortizaciones
DELIMITER //
CREATE TRIGGER tr_amortizaciones_set_user BEFORE INSERT ON amortizaciones
FOR EACH ROW
BEGIN
    IF NEW.usuario_id IS NULL THEN
        SET NEW.usuario_id = get_current_user_id();
    END IF;
END //
DELIMITER ;

-- ============================================
-- PROCEDIMIENTO PARA CREAR NUEVO TENANT
-- ============================================

DELIMITER //
CREATE PROCEDURE crear_nuevo_tenant(
    IN p_email VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_nombre VARCHAR(255),
    IN p_apellido VARCHAR(255),
    IN p_crear_datos_ejemplo BOOLEAN
)
BEGIN
    DECLARE nuevo_usuario_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    -- Crear el usuario
    INSERT INTO usuarios (email, password, rol, nombre, apellido)
    VALUES (p_email, p_password, 'contador', p_nombre, p_apellido);
    
    SET nuevo_usuario_id = LAST_INSERT_ID();
    
    -- Crear categorías básicas para el nuevo usuario si se solicita
    IF p_crear_datos_ejemplo THEN
        INSERT INTO categorias (nombre, descripcion, usuario_id) VALUES
        ('Equipos de Computación', 'Computadores, laptops, impresoras y equipos informáticos', nuevo_usuario_id),
        ('Vehículos', 'Automóviles, camiones y vehículos comerciales', nuevo_usuario_id),
        ('Maquinaria', 'Maquinaria industrial y equipos de producción', nuevo_usuario_id),
        ('Muebles y Enseres', 'Muebles de oficina, escritorios y enseres', nuevo_usuario_id),
        ('Herramientas', 'Herramientas y equipos menores', nuevo_usuario_id);
    END IF;
    
    COMMIT;
    
    SELECT nuevo_usuario_id as usuario_id, 'Usuario creado exitosamente' as mensaje;
END //
DELIMITER ;

-- ============================================
-- ACTUALIZAR VISTAS EXISTENTES
-- ============================================

-- Recrear vista_activos_usuario con filtrado por usuario
DROP VIEW IF EXISTS vista_activos_usuario;
CREATE VIEW vista_activos_usuario AS
SELECT 
    a.*,
    u.nombre as usuario_nombre,
    u.email as usuario_email,
    c.nombre as categoria_nombre,
    cl.nombre as cliente_nombre,
    cl.rut as cliente_rut
FROM activos a
JOIN usuarios u ON a.usuario_id = u.id
JOIN categorias c ON a.categoria_id = c.id AND c.usuario_id = a.usuario_id
JOIN clientes cl ON a.cliente_id = cl.id AND cl.usuario_id = a.usuario_id
WHERE u.activo = TRUE AND a.activo = TRUE;

-- Recrear vista_dashboard_usuario con datos agrupados por usuario
DROP VIEW IF EXISTS vista_dashboard_usuario;
CREATE VIEW vista_dashboard_usuario AS
SELECT 
    u.id as usuario_id,
    u.nombre as usuario_nombre,
    COUNT(DISTINCT a.id) as total_activos,
    COUNT(DISTINCT c.id) as total_clientes,
    COUNT(DISTINCT cat.id) as total_categorias,
    COALESCE(SUM(a.valor_adquisicion), 0) as valor_total_activos,
    COALESCE(SUM(am.cuota_amortizacion), 0) as amortizacion_total
FROM usuarios u
LEFT JOIN activos a ON u.id = a.usuario_id AND a.activo = TRUE
LEFT JOIN clientes c ON u.id = c.usuario_id AND c.activo = TRUE
LEFT JOIN categorias cat ON u.id = cat.usuario_id AND cat.activo = TRUE
LEFT JOIN amortizaciones am ON u.id = am.usuario_id
WHERE u.activo = TRUE
GROUP BY u.id, u.nombre;

SELECT 'Migración multi-tenant completada exitosamente' as resultado;
