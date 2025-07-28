const jwt = require('jsonwebtoken')

// Crear un token de prueba para el usuario admin@deprelo.com (ID: 1)
const JWT_SECRET = process.env.JWT_SECRET || 'tu-clave-jwt-ultra-segura-de-al-menos-32-caracteres-muy-larga-y-compleja-2024'

const payload = {
  userId: 1,
  email: 'admin@deprelo.com',
  nombre: 'Admin',
  rol: 'admin'
}

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })

console.log('🔑 Token de prueba generado:')
console.log('Token:', token)
console.log('\n📋 Para usar en las pruebas, copia este token en el header Authorization:')
console.log(`Authorization: Bearer ${token}`)
console.log('\n🍪 O como cookie:')
console.log(`Cookie: auth-token=${token}`)

// Verificar que el token sea válido
try {
  const decoded = jwt.verify(token, JWT_SECRET)
  console.log('\n✅ Token verificado correctamente:')
  console.log('Payload:', decoded)
} catch (error) {
  console.log('\n❌ Error verificando token:', error.message)
}
