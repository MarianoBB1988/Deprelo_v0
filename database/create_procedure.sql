-- Crear procedimiento almacenado para calcular amortizaciones
USE deprelo_v0;

-- Eliminar el procedimiento si existe
DROP PROCEDURE IF EXISTS sp_calcular_amortizaciones;

-- Crear el procedimiento
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
        COALESCE(cat.vida_util_anos, 5) as vida_util,
        act.valor_adquisicion,
        act.valor_residual,
        COALESCE(cat.metodo_amortizacion, 'lineal') as metodo,
        YEAR(act.fecha_adquisicion)
    INTO v_vida_util, v_valor_adquisicion, v_valor_residual, v_metodo, v_año_inicial
    FROM activos act
    LEFT JOIN categorias cat ON act.categoria_id = cat.id
    WHERE act.id = activo_id;
    
    -- Si no se encontró el activo, salir
    IF v_valor_adquisicion IS NULL THEN
        LEAVE sp_calcular_amortizaciones;
    END IF;
    
    -- Calcular cuota anual (método lineal)
    SET v_cuota_anual = (v_valor_adquisicion - v_valor_residual) / v_vida_util;
    SET v_año_actual = v_año_inicial;
    SET v_valor_actual = v_valor_adquisicion;
    
    -- Limpiar amortizaciones existentes para este activo
    DELETE FROM amortizaciones WHERE activo_id = activo_id;
    
    -- Generar amortizaciones para cada año
    WHILE v_contador < v_vida_util DO
        -- Insertar amortización para cada mes del año
        SET @mes = 1;
        WHILE @mes <= 12 DO
            INSERT INTO amortizaciones (
                activo_id,
                periodo_año,
                periodo_mes,
                valor_inicial,
                cuota_amortizacion,
                valor_final,
                metodo_aplicado,
                calculado_automaticamente,
                fecha_calculo
            ) VALUES (
                activo_id,
                v_año_actual,
                @mes,
                v_valor_actual,
                v_cuota_anual / 12,
                v_valor_actual - (v_cuota_anual / 12),
                v_metodo,
                TRUE,
                NOW()
            );
            
            SET @mes = @mes + 1;
        END WHILE;
        
        SET v_valor_actual = v_valor_actual - v_cuota_anual;
        SET v_año_actual = v_año_actual + 1;
        SET v_contador = v_contador + 1;
    END WHILE;
    
END //
DELIMITER ;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS tr_activo_after_insert;

DELIMITER //
CREATE TRIGGER tr_activo_after_insert
AFTER INSERT ON activos
FOR EACH ROW
BEGIN
    CALL sp_calcular_amortizaciones(NEW.id);
END //
DELIMITER ;
