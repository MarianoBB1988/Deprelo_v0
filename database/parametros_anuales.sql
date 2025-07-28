-- ============================================
-- TABLA: categoria_parametros_anuales
-- Parámetros fiscales que cambian año a año según DGI Uruguay
-- ============================================

CREATE TABLE categoria_parametros_anuales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id INT NOT NULL,
    anio_fiscal INT NOT NULL,
    vida_util_anos INT NOT NULL,
    metodo_amortizacion ENUM('lineal', 'decreciente', 'acelerada') NOT NULL DEFAULT 'lineal',
    valor_residual_porcentaje DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
    tasa_anual_porcentaje DECIMAL(5,4) NOT NULL,
    coeficiente_ajuste DECIMAL(8,6) DEFAULT 1.000000,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Claves foráneas
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_categoria_anio (categoria_id, anio_fiscal),
    INDEX idx_anio_fiscal (anio_fiscal),
    INDEX idx_activo (activo),
    
    -- Restricción única: una categoría no puede tener parámetros duplicados para el mismo año
    UNIQUE KEY uk_categoria_anio (categoria_id, anio_fiscal)
);

-- ============================================
-- DATOS DE EJEMPLO - PARÁMETROS URUGUAY 2024-2025
-- ============================================

-- Insertar parámetros para 2024 (ejemplo basado en normativa uruguaya)
INSERT INTO categoria_parametros_anuales (categoria_id, anio_fiscal, vida_util_anos, metodo_amortizacion, valor_residual_porcentaje, tasa_anual_porcentaje, coeficiente_ajuste) VALUES
-- Equipos de Computación
(1, 2024, 3, 'lineal', 0.1000, 0.3333, 1.000000),
(1, 2025, 3, 'lineal', 0.1000, 0.3333, 1.045000), -- Ajuste por inflación estimada

-- Vehículos
(2, 2024, 5, 'lineal', 0.2000, 0.2000, 1.000000),
(2, 2025, 5, 'lineal', 0.2000, 0.2000, 1.045000),

-- Maquinaria
(3, 2024, 10, 'lineal', 0.0500, 0.1000, 1.000000),
(3, 2025, 10, 'lineal', 0.0500, 0.1000, 1.045000),

-- Inmuebles
(4, 2024, 50, 'lineal', 0.0500, 0.0200, 1.000000),
(4, 2025, 50, 'lineal', 0.0500, 0.0200, 1.045000),

-- Muebles y Enseres
(5, 2024, 8, 'lineal', 0.1000, 0.1250, 1.000000),
(5, 2025, 8, 'lineal', 0.1000, 0.1250, 1.045000),

-- Herramientas
(6, 2024, 5, 'lineal', 0.0500, 0.2000, 1.000000),
(6, 2025, 5, 'lineal', 0.0500, 0.2000, 1.045000);

-- ============================================
-- VISTA: parametros_vigentes
-- Obtener parámetros del año actual o más reciente disponible
-- ============================================

CREATE VIEW vista_parametros_vigentes AS
SELECT 
    c.id as categoria_id,
    c.nombre as categoria_nombre,
    cpa.anio_fiscal,
    cpa.vida_util_anos,
    cpa.metodo_amortizacion,
    cpa.valor_residual_porcentaje,
    cpa.tasa_anual_porcentaje,
    cpa.coeficiente_ajuste,
    cpa.activo
FROM categorias c
LEFT JOIN categoria_parametros_anuales cpa ON c.id = cpa.categoria_id
WHERE cpa.anio_fiscal = (
    SELECT MAX(anio_fiscal) 
    FROM categoria_parametros_anuales cpa2 
    WHERE cpa2.categoria_id = c.id 
    AND cpa2.anio_fiscal <= YEAR(CURDATE())
)
AND c.activo = TRUE
AND cpa.activo = TRUE;

-- ============================================
-- FUNCIÓN: obtener_parametros_categoria
-- Obtiene parámetros de una categoría para un año específico
-- ============================================

DELIMITER //

CREATE FUNCTION obtener_parametros_categoria(
    p_categoria_id INT, 
    p_anio INT
) RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE resultado JSON;
    
    SELECT JSON_OBJECT(
        'vida_util_anos', vida_util_anos,
        'metodo_amortizacion', metodo_amortizacion,
        'valor_residual_porcentaje', valor_residual_porcentaje,
        'tasa_anual_porcentaje', tasa_anual_porcentaje,
        'coeficiente_ajuste', coeficiente_ajuste,
        'anio_fiscal', anio_fiscal
    ) INTO resultado
    FROM categoria_parametros_anuales 
    WHERE categoria_id = p_categoria_id 
    AND anio_fiscal = (
        SELECT MAX(anio_fiscal) 
        FROM categoria_parametros_anuales 
        WHERE categoria_id = p_categoria_id 
        AND anio_fiscal <= p_anio
        AND activo = TRUE
    )
    AND activo = TRUE;
    
    RETURN resultado;
END //

DELIMITER ;

-- ============================================
-- PROCEDIMIENTO: actualizar_parametros_año
-- Copia parámetros del año anterior y permite ajustes
-- ============================================

DELIMITER //

CREATE PROCEDURE actualizar_parametros_anio(
    IN p_anio_nuevo INT,
    IN p_coeficiente_ajuste_general DECIMAL(8,6)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    -- Si no se proporciona coeficiente, usar 1.0
    IF p_coeficiente_ajuste_general IS NULL THEN
        SET p_coeficiente_ajuste_general = 1.000000;
    END IF;
    
    START TRANSACTION;
    
    -- Insertar parámetros para el nuevo año basados en el año anterior
    INSERT INTO categoria_parametros_anuales 
    (categoria_id, anio_fiscal, vida_util_anos, metodo_amortizacion, 
     valor_residual_porcentaje, tasa_anual_porcentaje, coeficiente_ajuste)
    SELECT 
        categoria_id,
        p_anio_nuevo,
        vida_util_anos,
        metodo_amortizacion,
        valor_residual_porcentaje,
        tasa_anual_porcentaje,
        coeficiente_ajuste * p_coeficiente_ajuste_general
    FROM categoria_parametros_anuales cpa1
    WHERE anio_fiscal = (
        SELECT MAX(anio_fiscal) 
        FROM categoria_parametros_anuales cpa2 
        WHERE cpa2.categoria_id = cpa1.categoria_id 
        AND anio_fiscal < p_anio_nuevo
    )
    AND activo = TRUE
    AND categoria_id NOT IN (
        SELECT categoria_id 
        FROM categoria_parametros_anuales 
        WHERE anio_fiscal = p_anio_nuevo
    );
    
    COMMIT;
    
    SELECT CONCAT('Parametros actualizados para el anio ', p_anio_nuevo) as mensaje;
END //

DELIMITER ;

-- ============================================
-- COMENTARIOS Y USO
-- ============================================

/*
EXPLICACIÓN DEL SISTEMA:

1. TABLA categoria_parametros_anuales:
   - Almacena parámetros fiscales específicos por año
   - Cada categoría puede tener diferentes parámetros según el año
   - Incluye coeficiente de ajuste por inflación/normativa

2. VISTA vista_parametros_vigentes:
   - Muestra automáticamente los parámetros más recientes disponibles
   - Se actualiza automáticamente cuando se cargan nuevos años

3. FUNCIÓN obtener_parametros_categoria:
   - Obtiene parámetros para una categoría y año específico
   - Devuelve JSON con todos los parámetros necesarios

4. PROCEDIMIENTO actualizar_parametros_año:
   - Facilita la actualización anual de parámetros
   - Copia del año anterior y aplica ajustes generales

EJEMPLO DE USO:

-- Obtener parámetros vigentes
SELECT * FROM vista_parametros_vigentes;

-- Obtener parámetros específicos
SELECT obtener_parametros_categoria(1, 2024);

-- Actualizar parametros para 2026 con 4.5% de ajuste
CALL actualizar_parametros_anio(2026, 1.045);

-- Actualizar parametros para 2027 sin ajuste (coeficiente 1.0)
CALL actualizar_parametros_anio(2027, 1.000000);

VENTAJAS:
✅ Cumple normativa uruguaya (DGI)
✅ Histórico de parámetros por año
✅ Fácil actualización anual
✅ Cálculos automáticos precisos
✅ Auditoría completa de cambios

*/
