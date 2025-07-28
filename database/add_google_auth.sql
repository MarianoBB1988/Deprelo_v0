-- Agregar columnas para autenticación con Google
ALTER TABLE usuarios 
ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email',
ADD COLUMN avatar_url VARCHAR(500) NULL;

-- Hacer que la contraseña sea opcional para usuarios de Google
ALTER TABLE usuarios 
MODIFY COLUMN password VARCHAR(255) NULL;
