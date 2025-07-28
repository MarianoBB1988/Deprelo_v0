-- Script para insertar datos de prueba para amortizaciones

-- Insertar categorías de prueba si no existen
INSERT IGNORE INTO categorias (id, nombre, descripcion, activo) VALUES
(1, 'Maquinaria y Equipos', 'Maquinaria industrial y equipos', TRUE),
(2, 'Vehículos', 'Vehículos de la empresa', TRUE),
(3, 'Muebles y Enseres', 'Muebles de oficina y enseres', TRUE),
(4, 'Equipos de Computación', 'Computadoras y equipos informáticos', TRUE);

-- Insertar parámetros anuales para 2025 si no existen
INSERT IGNORE INTO categoria_parametros_anuales 
(categoria_id, anio_fiscal, tasa_amortizacion, metodo_amortizacion, vida_util_anos, valor_residual_porcentaje, activo) VALUES
-- Maquinaria y Equipos
(1, 2025, 10.00, 'lineal', 10, 5.00, TRUE),
-- Vehículos  
(2, 2025, 20.00, 'lineal', 5, 10.00, TRUE),
-- Muebles y Enseres
(3, 2025, 10.00, 'lineal', 10, 5.00, TRUE),
-- Equipos de Computación
(4, 2025, 25.00, 'lineal', 4, 0.00, TRUE);

-- Insertar clientes de prueba si no existen
INSERT IGNORE INTO clientes (id, nombre, rut, email, telefono, direccion, activo) VALUES
(1, 'Cliente Ejemplo S.A.', '12345678901', 'cliente@ejemplo.com', '099123456', 'Av. Principal 123', TRUE),
(2, 'Empresa Test Ltda.', '98765432109', 'test@empresa.com', '099654321', 'Calle Secundaria 456', TRUE);

-- Insertar activos de prueba si no existen
INSERT IGNORE INTO activos 
(id, nombre, descripcion, categoria_id, cliente_id, valor_inicial, fecha_adquisicion, vida_util_anos, valor_residual, activo, created_at) VALUES
(1, 'Máquina Cortadora Industrial', 'Máquina cortadora de metal industrial', 1, 1, 50000.00, '2025-01-01', 10, 2500.00, TRUE, NOW()),
(2, 'Camioneta Ford Ranger', 'Vehículo utilitario de la empresa', 2, 1, 30000.00, '2025-01-01', 5, 3000.00, TRUE, NOW()),
(3, 'Computadora Dell OptiPlex', 'Computadora de escritorio para oficina', 4, 2, 8000.00, '2025-01-01', 4, 0.00, TRUE, NOW()),
(4, 'Mesa de Conferencias', 'Mesa grande para sala de reuniones', 3, 2, 5000.00, '2025-01-01', 10, 250.00, TRUE, NOW());

-- Verificar que se insertaron los datos
SELECT 'Categorías insertadas:' as info;
SELECT id, nombre FROM categorias WHERE activo = TRUE;

SELECT 'Parámetros anuales 2025:' as info;
SELECT cpa.categoria_id, c.nombre, cpa.tasa_amortizacion, cpa.metodo_amortizacion 
FROM categoria_parametros_anuales cpa 
INNER JOIN categorias c ON cpa.categoria_id = c.id 
WHERE cpa.anio_fiscal = 2025;

SELECT 'Clientes insertados:' as info;
SELECT id, nombre, rut FROM clientes WHERE activo = TRUE;

SELECT 'Activos insertados:' as info;
SELECT a.id, a.nombre, c.nombre as categoria, cl.nombre as cliente 
FROM activos a 
INNER JOIN categorias c ON a.categoria_id = c.id 
INNER JOIN clientes cl ON a.cliente_id = cl.id 
WHERE a.activo = TRUE;
