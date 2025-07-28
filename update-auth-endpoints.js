const fs = require('fs')
const path = require('path')

// Lista de archivos a actualizar
const files = [
  'app/api/clientes/route.ts',
  'app/api/categorias/route.ts', 
  'app/api/amortizaciones/route.ts',
  'app/api/parametros-anuales/route.ts',
  'app/api/parametros-anuales/[id]/route.ts',
  'app/api/parametros-anuales/copiar-año/route.ts',
  'app/api/clientes/[id]/route.ts',
  'app/api/activos/[id]/route.ts',
  'app/api/clientes/list/route.ts',
  'app/api/categorias/list/route.ts'
]

function updateFile(filePath) {
  const fullPath = path.join('c:\\xampp2\\htdocs\\Deprelo_v0', filePath)
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Archivo no encontrado: ${filePath}`)
    return
  }

  let content = fs.readFileSync(fullPath, 'utf8')
  
  // Patron 1: GET con getUserIdFromRequest
  const pattern1 = /(\s+const userId = await getUserIdFromRequest\(request\))\s*(\n\s+)/g
  const replacement1 = `$1
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }$2`

  // Patron 2: POST/PUT/DELETE con getUserIdFromRequest
  const pattern2 = /(\s+const userId = await getUserIdFromRequest\(request\))\s*(\n\s+const)/g
  const replacement2 = `$1
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }
    const`

  let updated = false
  
  if (pattern1.test(content)) {
    content = content.replace(pattern1, replacement1)
    updated = true
  }
  
  if (pattern2.test(content)) {
    content = content.replace(pattern2, replacement2)
    updated = true
  }

  if (updated) {
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`✅ Actualizado: ${filePath}`)
  } else {
    console.log(`ℹ️  Sin cambios: ${filePath}`)
  }
}

console.log('🔧 Actualizando endpoints con validación de autenticación...\n')

files.forEach(updateFile)

console.log('\n✅ Proceso completado')
