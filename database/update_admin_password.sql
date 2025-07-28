-- Script para crear usuario de prueba
UPDATE usuarios SET password = '$2b$12$xNgF27x0wPQTTddtygj3qOXjNvoillMm/3CGHCfKXarII0EQn9cBVe' 
WHERE email = 'admin@deprelo.com';

-- Verificar que se guardó
SELECT id, email, nombre, LENGTH(password) as password_length 
FROM usuarios WHERE email = 'admin@deprelo.com';
