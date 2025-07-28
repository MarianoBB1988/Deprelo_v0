-- ============================================
-- SCRIPT DE LIMPIEZA: Resetear sistema de parámetros anuales
-- ============================================

-- Borra la vista si existe
DROP VIEW IF EXISTS vista_parametros_vigentes;

-- Borra la función si existe  
DROP FUNCTION IF EXISTS obtener_parametros_categoria;

-- Borra el procedimiento si existe
DROP PROCEDURE IF EXISTS actualizar_parametros_anio;

-- Borra la tabla existente
DROP TABLE IF EXISTS categoria_parametros_anuales;

-- Mensaje de confirmación
SELECT 'Sistema de parámetros anuales limpiado correctamente' as mensaje;
