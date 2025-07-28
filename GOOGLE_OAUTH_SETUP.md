# 🚀 Configuración de Google OAuth para Deprelo

## 📋 Estado Actual
- ✅ **Modo Desarrollo**: Funcionando con autenticación simulada
- ⚙️ **Modo Producción**: Listo para configurar con credenciales reales

## 🎯 Funcionalidades Implementadas

### 🔐 Sistema de Autenticación Completo
1. **Login tradicional** (email/contraseña)
2. **Registro de nuevos usuarios**
3. **Google OAuth** (simulado + producción)
4. **JWT con cookies httpOnly**
5. **Middleware de protección de rutas**

### 🎨 Interfaz de Usuario
- Formulario que alterna entre Login/Registro
- Botón de Google OAuth integrado
- Validaciones en tiempo real
- Mensajes de error claros
- Diseño responsivo

## 🛠️ Configuración para Producción

### Paso 1: Crear Proyecto en Google Cloud
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Google Identity API**

### Paso 2: Crear Credenciales OAuth 2.0
1. Ve a **APIs & Services** > **Credentials**
2. Haz clic en **Create Credentials** > **OAuth 2.0 Client IDs**
3. Selecciona **Web application**
4. Configura los orígenes autorizados:
   ```
   http://localhost:3000
   http://localhost:3001
   http://localhost:3002
   http://localhost:3003
   tu-dominio-produccion.com
   ```

### Paso 3: Configurar en la Aplicación
```bash
# Opción 1: Script automático
node scripts/setup-google-oauth.js TU_CLIENT_ID_AQUI

# Opción 2: Manual - editar .env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id-real.apps.googleusercontent.com
```

### Paso 4: Reiniciar el Servidor
```bash
npm run dev
```

## 🧪 Pruebas

### Modo Desarrollo (Actual)
- ✅ **Login tradicional**: `admin@test.com` / `password`
- ✅ **Registro nuevo**: Completa el formulario
- ✅ **Google OAuth simulado**: Haz clic en "Iniciar sesión con Google"

### Modo Producción (Tras configurar)
- ✅ **Google OAuth real**: Funciona con cuentas Google reales
- ✅ **Creación automática**: Usuarios nuevos se crean automáticamente
- ✅ **Login existente**: Usuarios existentes inician sesión directamente

## 🔒 Seguridad

### Implementaciones de Seguridad
- **Contraseñas hasheadas** con bcrypt (12 rounds)
- **JWT con expiración** de 7 días
- **Cookies httpOnly** para prevenir XSS
- **Middleware de autenticación** en todas las rutas protegidas
- **Validaciones** del lado cliente y servidor

### Multi-Tenant
- **Aislamiento por usuario**: Cada usuario ve solo sus datos
- **Triggers automáticos**: Asignación automática de usuario_id
- **Vistas filtradas**: Consultas automáticamente filtradas por usuario

## 📊 Base de Datos

### Nuevas Columnas Agregadas
```sql
ALTER TABLE usuarios ADD COLUMN auth_provider VARCHAR(20) DEFAULT 'email';
ALTER TABLE usuarios ADD COLUMN avatar_url VARCHAR(500) NULL;
ALTER TABLE usuarios MODIFY COLUMN password VARCHAR(255) NULL;
```

### Tipos de Autenticación Soportados
- `email`: Login tradicional con contraseña
- `google`: Login con Google OAuth

## 🚀 Próximos Pasos

1. **[OPCIONAL] Configurar Google OAuth real**
2. **Probar todas las funcionalidades**
3. **Configurar dominio de producción**
4. **Implementar recuperación de contraseña**
5. **Agregar más providers OAuth (Facebook, GitHub, etc.)**

## 🆘 Solución de Problemas

### Error: "Google OAuth no funciona"
- ✅ Verifica que el Client ID esté correctamente configurado
- ✅ Asegúrate de que el dominio esté en la lista de orígenes autorizados
- ✅ Reinicia el servidor tras cambiar variables de entorno

### Error: "Token inválido"
- ✅ Verifica que JWT_SECRET esté configurado
- ✅ Limpia las cookies del navegador
- ✅ Verifica que la base de datos esté funcionando

## 📞 Soporte

Si necesitas ayuda adicional con la configuración:
1. Revisa los logs del servidor
2. Verifica las variables de entorno
3. Comprueba la conectividad con la base de datos
4. Asegúrate de que todas las migraciones se ejecutaron
