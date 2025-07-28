# Configuración Google OAuth - Deprelo

## ✅ Lo que ya está configurado:

1. **Client ID configurado**: `1009839331172-nft3oshq0hgik8t10ql1f5pqkv37qbnl.apps.googleusercontent.com`
2. **Script de Google Identity API cargado** en el layout principal
3. **Endpoint de autenticación** `/api/auth/google` creado y funcionando
4. **Componente de login** con botón de Google OAuth implementado
5. **Variables de entorno** configuradas en `.env.local`

## 🔧 Para completar la configuración (paso final):

### 1. Obtener el Client Secret:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **"APIs y servicios" > "Credenciales"**
4. Busca tu credencial OAuth 2.0 con el Client ID: `1009839331172-nft3oshq0hgik8t10ql1f5pqkv37qbnl.apps.googleusercontent.com`
5. Haz clic en el ícono de edición (lápiz)
6. Copia el **"Client Secret"**

### 2. Actualizar .env.local:

Abre el archivo `.env.local` y reemplaza:
```
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
```

Por:
```
GOOGLE_CLIENT_SECRET=tu_client_secret_real_aqui
```

### 3. Configurar URLs autorizadas:

En Google Cloud Console, en la misma credencial OAuth 2.0, asegúrate de que tienes configuradas estas URLs:

**URIs de origen autorizados:**
- `http://localhost:3002`
- `http://localhost:3001`
- `http://localhost:3000`
- Tu dominio de producción (si tienes)

**URIs de redirección autorizados:**
- `http://localhost:3002`
- `http://localhost:3001`
- `http://localhost:3000`
- Tu dominio de producción (si tienes)

### 4. Reiniciar el servidor:

Después de actualizar el `.env.local`:
```bash
# Detén el servidor (Ctrl+C) y reinicia:
npm run dev
```

## 🚀 ¡Listo para usar!

Una vez completados estos pasos, los usuarios podrán:

1. Ir a la página de login (`http://localhost:3002/login`)
2. Hacer clic en **"Iniciar sesión con Google"**
3. Autenticarse con su cuenta de Google
4. Ser redirigidos automáticamente al dashboard

## 🔍 Verificación:

Para verificar que todo funciona:

1. Abre las **Herramientas de desarrollador** (F12)
2. Ve a la pestaña **Console**
3. Intenta hacer login con Google
4. Deberías ver logs como:
   - `[FRONTEND] Usando Google OAuth real`
   - `[GOOGLE AUTH] Token real verificado: email@usuario.com`

## 🛠️ Troubleshooting:

Si hay problemas:

1. **"Token de Google inválido"**: Verifica que el Client Secret esté correcto
2. **Popup bloqueado**: Asegúrate de permitir popups para localhost
3. **CORS errors**: Verifica las URLs autorizadas en Google Cloud Console

## 📝 Notas adicionales:

- El sistema está configurado en **modo producción** para usar OAuth real
- Se mantiene compatibilidad con modo desarrollo para testing
- Los usuarios de Google se crean automáticamente en la base de datos
- Se almacena información básica: email, nombre, apellido
