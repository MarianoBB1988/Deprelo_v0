# 🔧 Configurar Google OAuth Real

## ¿Qué tienes ahora?

✅ **Google OAuth simulado funcionando** - Puedes usar cualquier email para hacer login  
🎯 **API real de Google** - Sigue estos pasos para conectar con Google real

## Paso 1: Google Cloud Console

1. **Ve a Google Cloud Console**: https://console.cloud.google.com/
2. **Crea un nuevo proyecto** o selecciona uno existente
3. **Habilita las APIs necesarias**:
   - Ve a "APIs & Services" > "Library"
   - Busca **"Google+ API"** y habilítala
   - Busca **"People API"** y habilítala

## Paso 2: Crear Credenciales OAuth

1. **Ve a "APIs & Services" > "Credentials"**
2. **Configura la pantalla de consentimiento OAuth**:
   - Tipo: External (para desarrollo) o Internal (si tienes Google Workspace)
   - Nombre de la aplicación: **"Deprelo"**
   - Email de soporte: tu email
   - Dominios autorizados: `localhost` (para desarrollo)

3. **Crear OAuth 2.0 Client ID**:
   - Haz clic en "Create Credentials" > "OAuth 2.0 Client IDs"
   - Tipo de aplicación: **Web application**
   - Nombre: **Deprelo Web Client**
   - **URIs de redirección autorizados**:
     ```
     http://localhost:3000
     http://localhost:3001  
     http://localhost:3002
     http://localhost:3003
     https://tu-dominio.com  (para producción)
     ```

## Paso 3: Obtener las Credenciales

Después de crear el OAuth Client, obtendrás:
- **Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abcdefghijklmnop`

## Paso 4: Configuración Automática (Recomendado)

Ejecuta el script automático:

```bash
node scripts/setup-google-oauth-real.js
```

## Paso 5: Configuración Manual (Alternativa)

Si prefieres configurar manualmente, edita tu archivo `.env.local`:

```env
# Google OAuth Real
GOOGLE_OAUTH_MODE=production
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu-client-id-aqui
GOOGLE_CLIENT_SECRET=tu-client-secret-aqui
```

## Paso 6: Probar

1. **Reinicia el servidor**: Ctrl+C y `npm run dev`
2. **Ve a la página de login**: http://localhost:3003
3. **Haz clic en "Continuar con Google"**
4. **¡Deberías ver el popup oficial de Google!**

## ¿Cómo saber si está funcionando?

### Modo Simulación (actual):
- Se abre un modal donde ingresas tu email
- Logs en consola: `[FRONTEND] Usando modo simulación`

### Modo Real (después de configurar):
- Se abre el popup oficial de Google
- Puedes elegir tu cuenta de Google real
- Logs en consola: `[FRONTEND] Usando Google OAuth real`

## Beneficios del OAuth Real

✅ **Seguridad**: Tokens verificados por Google  
✅ **Experiencia**: Popup oficial de Google  
✅ **Datos reales**: Foto de perfil, nombre completo  
✅ **Sin passwords**: Los usuarios no necesitan crear contraseñas

## Problemas Comunes

### "Error al inicializar Google Sign-In"
- Verifica que el Client ID esté bien configurado
- Asegúrate de que el dominio esté autorizado en Google Cloud Console

### "Token de Google inválido"
- El Client Secret puede estar mal configurado
- Verifica que las APIs estén habilitadas

### "Popup bloqueado"
- Los navegadores pueden bloquear popups
- El script fallback mostrará un botón si el popup no aparece

## Producción

Para producción, simplemente:
1. Agrega tu dominio real a los URIs autorizados en Google Cloud Console
2. Configura las mismas variables de entorno en tu servidor
3. ¡Listo!

---

**¿Necesitas ayuda?** El sistema actual ya funciona perfectamente con simulación. La configuración real es opcional para una mejor experiencia de usuario.
