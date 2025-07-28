-- ============================================
-- Sistema de Gestión de Activos Fijos - Deprelo_v0
-- Base de datos MySQL
-- ============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS deprelo_v0 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE deprelo_v0;

-- ============================================
-- TABLA: usuarios
-- ============================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'contador') NOT NULL DEFAULT 'contador',
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rol (rol)
);

-- ============================================
-- TABLA: categorias
-- ============================================
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_activo (activo)
);

-- ============================================
-- TABLA: clientes
-- ============================================
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rut VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    region VARCHAR(100),
    pais VARCHAR(100) DEFAULT 'Chile',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_rut (rut),
    INDEX idx_email (email),
    INDEX idx_activo (activo)
);

-- ============================================
-- TABLA: activos
-- ============================================
CREATE TABLE activos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_id INT NOT NULL,
    cliente_id INT NOT NULL,
    valor_adquisicion DECIMAL(12,2) NOT NULL,
    valor_residual DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    fecha_adquisicion DATE NOT NULL,
    fecha_alta DATE NOT NULL,
    numero_serie VARCHAR(100),
    proveedor VARCHAR(255),
    ubicacion VARCHAR(255),
    estado ENUM('en_uso', 'mantenimiento', 'fuera_servicio', 'vendido', 'dado_baja', 'depreciado', 'desechado') DEFAULT 'en_uso',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_nombre (nombre),
    INDEX idx_categoria (categoria_id),
    INDEX idx_cliente (cliente_id),
    INDEX idx_fecha_adquisicion (fecha_adquisicion),
    INDEX idx_estado (estado),
    INDEX idx_activo (activo)
);

-- ============================================
-- TABLA: amortizaciones
-- ============================================
CREATE TABLE amortizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activo_id INT NOT NULL,
    periodo_año INT NOT NULL,
    periodo_mes INT NOT NULL,
    valor_inicial DECIMAL(12,2) NOT NULL,
    cuota_amortizacion DECIMAL(12,2) NOT NULL,
    valor_final DECIMAL(12,2) NOT NULL,
    metodo_aplicado ENUM('lineal', 'decreciente', 'acelerada') NOT NULL,
    calculado_automaticamente BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    fecha_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    UNIQUE KEY unique_activo_periodo (activo_id, periodo_año, periodo_mes),
    INDEX idx_activo (activo_id),
    INDEX idx_periodo (periodo_año, periodo_mes),
    INDEX idx_metodo (metodo_aplicado)
);

-- ============================================
-- TABLA: reportes
-- ============================================
CREATE TABLE reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_reporte ENUM('amortizacion_mensual', 'amortizacion_anual', 'activos_por_cliente', 'resumen_general') NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    parametros JSON,
    usuario_id INT NOT NULL,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archivo_generado VARCHAR(500),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_tipo (tipo_reporte),
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_generacion)
);

-- ============================================
-- TABLA: auditoria
-- ============================================
CREATE TABLE auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    registro_id INT NOT NULL,
    accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    usuario_id INT,
    fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_tabla (tabla_afectada),
    INDEX idx_registro (registro_id),
    INDEX idx_accion (accion),
    INDEX idx_usuario (usuario_id),
    INDEX idx_fecha (fecha_accion)
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Usuarios iniciales
INSERT INTO usuarios (email, password, rol, nombre, apellido) VALUES
('admin@deprelo.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Administrador', 'Sistema'),
('contador@deprelo.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'contador', 'Contador', 'Principal'),
('admin@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin', 'Test'),
('contador@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'contador', 'Contador', 'Test');

-- Categorías iniciales
INSERT INTO categorias (nombre, descripcion) VALUES
('Equipos de Computación', 'Computadores, laptops, impresoras y equipos informáticos'),
('Vehículos', 'Automóviles, camiones y vehículos comerciales'),
('Maquinaria', 'Maquinaria industrial y equipos de producción'),
('Inmuebles', 'Edificios, oficinas y construcciones'),
('Muebles y Enseres', 'Muebles de oficina, escritorios y enseres'),
('Herramientas', 'Herramientas y equipos menores');

-- Clientes iniciales
INSERT INTO clientes (nombre, rut, email, telefono, direccion, ciudad, region) VALUES
('Empresa ABC S.A.', '12.345.678-9', 'contacto@empresaabc.com', '+56 9 1234 5678', 'Av. Principal 123', 'Santiago', 'Región Metropolitana'),
('Comercial XYZ Ltda.', '98.765.432-1', 'info@comercialxyz.cl', '+56 9 8765 4321', 'Calle Comercio 456', 'Valparaíso', 'Región de Valparaíso'),
('Servicios DEF S.R.L.', '11.222.333-4', 'admin@serviciosdef.com', '+56 9 1122 3344', 'Av. Servicios 789', 'Concepción', 'Región del Biobío'),
('Industrias GHI S.A.', '55.666.777-8', 'gerencia@industriasghi.cl', '+56 9 5566 7788', 'Parque Industrial 321', 'Antofagasta', 'Región de Antofagasta'),
('Constructora JKL Ltda.', '44.333.222-1', 'contacto@constructorajkl.cl', '+56 9 4433 2211', 'Av. Construcción 654', 'La Serena', 'Región de Coquimbo');

-- Activos iniciales
INSERT INTO activos (nombre, descripcion, categoria_id, cliente_id, valor_adquisicion, valor_residual, fecha_adquisicion, fecha_alta, numero_serie, proveedor, ubicacion) VALUES
('Laptop Dell XPS 13', 'Laptop profesional para oficina', 1, 1, 1200.00, 120.00, '2024-01-15', '2024-01-15', 'DL2024001', 'Dell Chile', 'Oficina Principal'),
('Vehículo Toyota Corolla', 'Vehículo comercial modelo 2023', 2, 2, 25000.00, 5000.00, '2023-06-10', '2023-06-10', 'TC2023456', 'Toyota Chile', 'Flota Comercial'),
('Impresora HP LaserJet Pro', 'Impresora láser multifuncional', 1, 1, 800.00, 80.00, '2024-03-20', '2024-03-20', 'HP2024789', 'HP Chile', 'Oficina Principal'),
('Maquinaria Industrial CNC', 'Torno CNC para producción', 3, 4, 50000.00, 7500.00, '2023-12-01', '2023-12-01', 'CNC2023001', 'Maquinarias del Norte', 'Planta Antofagasta'),
('Escritorios Ejecutivos', 'Set de 10 escritorios ejecutivos', 5, 3, 3000.00, 300.00, '2024-02-01', '2024-02-01', 'ESC2024010', 'Muebles Biobío', 'Oficinas Concepción');

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de activos por cliente
CREATE VIEW vista_activos_cliente AS
SELECT 
    c.id as cliente_id,
    c.nombre as cliente_nombre,
    c.rut as cliente_rut,
    COUNT(a.id) as total_activos,
    SUM(a.valor_adquisicion) as valor_total_activos,
    SUM(a.valor_residual) as valor_residual_total
FROM clientes c
LEFT JOIN activos a ON c.id = a.cliente_id AND a.activo = TRUE
WHERE c.activo = TRUE
GROUP BY c.id, c.nombre, c.rut;

-- Vista: Amortizaciones por año
CREATE VIEW vista_amortizaciones_anuales AS
SELECT 
    am.periodo_año,
    act.nombre as activo_nombre,
    cat.nombre as categoria_nombre,
    cli.nombre as cliente_nombre,
    SUM(am.cuota_amortizacion) as total_amortizacion_anual,
    act.valor_adquisicion,
    MIN(am.valor_final) as valor_final_año
FROM amortizaciones am
INNER JOIN activos act ON am.activo_id = act.id
INNER JOIN categorias cat ON act.categoria_id = cat.id
INNER JOIN clientes cli ON act.cliente_id = cli.id
GROUP BY am.periodo_año, act.id, act.nombre, cat.nombre, cli.nombre, act.valor_adquisicion;

-- Vista: Dashboard resumen
CREATE VIEW vista_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM activos WHERE activo = TRUE) as total_activos,
    (SELECT COUNT(*) FROM clientes WHERE activo = TRUE) as total_clientes,
    (SELECT COUNT(*) FROM categorias WHERE activo = TRUE) as total_categorias,
    (SELECT SUM(valor_adquisicion) FROM activos WHERE activo = TRUE) as valor_total_activos,
    (SELECT SUM(cuota_amortizacion) FROM amortizaciones WHERE periodo_año = YEAR(CURDATE())) as amortizacion_anual_actual;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Procedure: Calcular amortizaciones para un activo
DELIMITER //
CREATE PROCEDURE sp_calcular_amortizaciones(IN activo_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_vida_util INT;
    DECLARE v_valor_adquisicion DECIMAL(12,2);
    DECLARE v_valor_residual DECIMAL(12,2);
    DECLARE v_metodo VARCHAR(20);
    DECLARE v_cuota_anual DECIMAL(12,2);
    DECLARE v_año_inicial INT;
    DECLARE v_año_actual INT;
    DECLARE v_contador INT DEFAULT 0;
    DECLARE v_valor_actual DECIMAL(12,2);
    
    -- Obtener datos del activo
    SELECT 
        cat.vida_util_anos,
        act.valor_adquisicion,
        act.valor_residual,
        cat.metodo_amortizacion,
        YEAR(act.fecha_adquisicion)
    INTO v_vida_util, v_valor_adquisicion, v_valor_residual, v_metodo, v_año_inicial
    FROM activos act
    INNER JOIN categorias cat ON act.categoria_id = cat.id
    WHERE act.id = activo_id;
    
    -- Calcular cuota anual (método lineal)
    SET v_cuota_anual = (v_valor_adquisicion - v_valor_residual) / v_vida_util;
    SET v_valor_actual = v_valor_adquisicion;
    
    -- Limpiar amortizaciones existentes
    DELETE FROM amortizaciones WHERE activo_id = activo_id;
    
    -- Generar amortizaciones por cada año
    WHILE v_contador < v_vida_util DO
        SET v_año_actual = v_año_inicial + v_contador;
        
        -- Insertar amortización anual
        INSERT INTO amortizaciones (
            activo_id, 
            periodo_año, 
            periodo_mes, 
            valor_inicial, 
            cuota_amortizacion, 
            valor_final, 
            metodo_aplicado
        ) VALUES (
            activo_id,
            v_año_actual,
            12, -- Diciembre como mes de cierre
            v_valor_actual,
            v_cuota_anual,
            v_valor_actual - v_cuota_anual,
            v_metodo
        );
        
        SET v_valor_actual = v_valor_actual - v_cuota_anual;
        SET v_contador = v_contador + 1;
    END WHILE;
    
END //
DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Calcular amortizaciones al insertar activo
DELIMITER //
CREATE TRIGGER tr_activo_after_insert
AFTER INSERT ON activos
FOR EACH ROW
BEGIN
    CALL sp_calcular_amortizaciones(NEW.id);
END //
DELIMITER ;

-- Trigger: Auditoría para usuarios
DELIMITER //
CREATE TRIGGER tr_usuarios_audit
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, usuario_id)
    VALUES ('usuarios', NEW.id, 'UPDATE', 
            JSON_OBJECT('email', OLD.email, 'rol', OLD.rol, 'activo', OLD.activo),
            JSON_OBJECT('email', NEW.email, 'rol', NEW.rol, 'activo', NEW.activo),
            NEW.id);
END //
DELIMITER ;

-- ============================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_activos_cliente_categoria ON activos(cliente_id, categoria_id);
CREATE INDEX idx_amortizaciones_periodo ON amortizaciones(periodo_año, periodo_mes);
CREATE INDEX idx_activos_fecha_estado ON activos(fecha_adquisicion, estado);

-- ============================================
-- CONFIGURACIÓN DE PERMISOS
-- ============================================

-- Crear usuario para la aplicación
CREATE USER 'deprelo_app'@'localhost' IDENTIFIED BY 'deprelo_2024_secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON deprelo_v0.* TO 'deprelo_app'@'localhost';

-- Crear usuario de solo lectura para reportes
CREATE USER 'deprelo_readonly'@'localhost' IDENTIFIED BY 'deprelo_readonly_2024';
GRANT SELECT ON deprelo_v0.* TO 'deprelo_readonly'@'localhost';

FLUSH PRIVILEGES;

-- ============================================
-- COMENTARIOS FINALES
-- ============================================

/*
Este schema incluye:

1. TABLAS PRINCIPALES:
   - usuarios: Sistema de autenticación con roles
   - categorias: Tipos de activos con parámetros de amortización
   - clientes: Empresas/personas que poseen activos
   - activos: Bienes a amortizar
   - amortizaciones: Cálculos de depreciación
   - reportes: Registro de reportes generados
   - auditoria: Seguimiento de cambios

2. FUNCIONALIDADES:
   - Cálculo automático de amortizaciones
   - Auditoria de cambios
   - Vistas para consultas comunes
   - Stored procedures para lógica compleja
   - Triggers para automatización

3. SEGURIDAD:
   - Usuarios con permisos específicos
   - Restricciones de integridad referencial
   - Campos de auditoría

4. OPTIMIZACIÓN:
   - Índices estratégicos
   - Vistas para consultas frecuentes
   - Estructura normalizada

Para usar este schema:
1. Ejecutar todo el script en MySQL
2. Configurar las credenciales en la aplicación
3. Adaptar las consultas según necesidades específicas
*/
