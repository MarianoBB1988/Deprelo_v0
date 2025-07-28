-- ============================================
-- MIGRACIÓN: Simplificar tabla categorias
-- Eliminar parámetros duplicados que ya están en categoria_parametros_anuales
-- ============================================

-- Primero hacer backup de los datos actuales (opcional)
-- CREATE TABLE categorias_backup AS SELECT * FROM categorias;

-- Eliminar las columnas de parámetros que ahora están en categoria_parametros_anuales
ALTER TABLE categorias 
DROP COLUMN vida_util_anos,
DROP COLUMN metodo_amortizacion,
DROP COLUMN valor_residual_porcentaje;

-- Verificar la estructura actualizada
DESCRIBE categorias;

-- Mostrar datos actuales
SELECT * FROM categorias;
