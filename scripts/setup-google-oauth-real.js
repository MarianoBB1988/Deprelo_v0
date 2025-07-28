#!/usr/bin/env node

/**
 * Script para configurar Google OAuth automáticamente
 * Uso: node scripts/setup-google-oauth-real.js
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function main() {
  console.log('🔧 Configurador de Google OAuth Real\n')
  
  console.log('Este script te ayudará a configurar Google OAuth real para Deprelo.')
  console.log('Necesitarás tener las credenciales de Google Cloud Console.\n')
  
  const hasCredentials = await question('¿Ya tienes las credenciales de Google Cloud Console? (s/n): ')
  
  if (hasCredentials.toLowerCase() !== 's' && hasCredentials.toLowerCase() !== 'si') {
    console.log('\n📖 Para obtener las credenciales:')
    console.log('1. Ve a: https://console.cloud.google.com/')
    console.log('2. Crea un proyecto o selecciona uno existente')
    console.log('3. Habilita Google+ API y People API')
    console.log('4. Ve a "APIs & Services" > "Credentials"')
    console.log('5. Crea "OAuth 2.0 Client ID" para aplicación web')
    console.log('6. Agrega http://localhost:3000-3003 como URIs autorizados')
    console.log('\nVuelve a ejecutar este script cuando tengas las credenciales.')
    rl.close()
    return
  }
  
  console.log('\n🔑 Ingresa tus credenciales de Google:')
  
  const clientId = await question('Client ID: ')
  const clientSecret = await question('Client Secret: ')
  
  if (!clientId || !clientSecret) {
    console.log('❌ Client ID y Client Secret son requeridos.')
    rl.close()
    return
  }
  
  // Leer el archivo .env.local actual o crear uno nuevo
  const envPath = path.join(process.cwd(), '.env.local')
  let envContent = ''
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }
  
  // Actualizar o agregar las variables de Google OAuth
  const googleVars = [
    'GOOGLE_OAUTH_MODE=production',
    `NEXT_PUBLIC_GOOGLE_CLIENT_ID=${clientId}`,
    `GOOGLE_CLIENT_SECRET=${clientSecret}`
  ]
  
  // Remover variables existentes de Google OAuth
  envContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('GOOGLE_OAUTH_MODE') && 
                   !line.startsWith('NEXT_PUBLIC_GOOGLE_CLIENT_ID') && 
                   !line.startsWith('GOOGLE_CLIENT_SECRET'))
    .join('\n')
  
  // Agregar las nuevas variables
  if (envContent && !envContent.endsWith('\n')) {
    envContent += '\n'
  }
  envContent += '\n# Google OAuth Real\n'
  envContent += googleVars.join('\n') + '\n'
  
  // Escribir el archivo
  fs.writeFileSync(envPath, envContent)
  
  console.log('\n✅ Google OAuth configurado exitosamente!')
  console.log('\n📝 Variables agregadas a .env.local:')
  googleVars.forEach(variable => console.log(`   ${variable}`))
  
  console.log('\n🚀 Próximos pasos:')
  console.log('1. Reinicia el servidor de desarrollo (Ctrl+C y npm run dev)')
  console.log('2. Ve a la página de login')
  console.log('3. Haz clic en "Continuar con Google"')
  console.log('4. ¡Deberías ver el popup real de Google!')
  
  console.log('\n🔒 Nota de seguridad:')
  console.log('- No compartas tu .env.local file')
  console.log('- Para producción, configura estas variables en tu servidor')
  
  rl.close()
}

main().catch(console.error)
