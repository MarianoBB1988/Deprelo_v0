#!/usr/bin/env node

/**
 * Script para configurar Google OAuth en Deprelo
 * 
 * Pasos para obtener credenciales reales:
 * 
 * 1. Ve a Google Cloud Console: https://console.cloud.google.com/
 * 2. Crea un nuevo proyecto o selecciona uno existente
 * 3. Habilita la "Google Identity API":
 *    - Ve a "APIs & Services" > "Library"
 *    - Busca "Google Identity"
 *    - Haz clic en "Enable"
 * 
 * 4. Crea credenciales OAuth 2.0:
 *    - Ve a "APIs & Services" > "Credentials"
 *    - Haz clic en "Create Credentials" > "OAuth 2.0 Client IDs"
 *    - Selecciona "Web application"
 *    - Nombre: "Deprelo App"
 *    - Authorized JavaScript origins:
 *      * http://localhost:3000
 *      * http://localhost:3001
 *      * http://localhost:3002
 *      * http://localhost:3003
 *      * tu-dominio-de-produccion.com
 * 
 * 5. Copia el Client ID y ejecuta este script:
 *    node scripts/setup-google-oauth.js YOUR_CLIENT_ID_HERE
 */

const fs = require('fs');
const path = require('path');

function setupGoogleOAuth(clientId) {
  if (!clientId) {
    console.log('❌ Error: Debes proporcionar un Client ID de Google');
    console.log('');
    console.log('Uso: node scripts/setup-google-oauth.js YOUR_CLIENT_ID_HERE');
    console.log('');
    console.log('Para obtener un Client ID, sigue las instrucciones en el archivo');
    process.exit(1);
  }

  const envPath = path.join(__dirname, '..', '.env.local');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Reemplazar la línea del Client ID
    const newClientIdLine = `NEXT_PUBLIC_GOOGLE_CLIENT_ID=${clientId}`;
    
    if (envContent.includes('NEXT_PUBLIC_GOOGLE_CLIENT_ID=')) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_GOOGLE_CLIENT_ID=.*/,
        newClientIdLine
      );
    } else {
      envContent += `\n${newClientIdLine}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Google OAuth configurado exitosamente!');
    console.log('');
    console.log('📝 Client ID configurado:', clientId);
    console.log('');
    console.log('🚀 Reinicia el servidor de desarrollo para aplicar los cambios:');
    console.log('   npm run dev');
    console.log('');
    console.log('🔐 Ahora podrás usar "Iniciar sesión con Google" en tu aplicación');
    
  } catch (error) {
    console.log('❌ Error al configurar Google OAuth:', error.message);
    process.exit(1);
  }
}

// Obtener el Client ID de los argumentos de línea de comandos
const clientId = process.argv[2];
setupGoogleOAuth(clientId);
