import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const filePath = join(__dirname, '../routes/index.js')

let content = readFileSync(filePath, 'utf8')

// 1. Add platform import after clothingRoutes import
const clothingImport = `import { clothingRoutes } from './clothingRoutes.js'`
const platformImport = `import { platformRoutes } from './platformRoutes.js'`

if (content.includes(platformImport)) {
  console.log('Platform import already present, skipping.')
} else if (content.includes(clothingImport)) {
  content = content.replace(
    clothingImport,
    `${clothingImport}\n${platformImport}`
  )
  console.log('✅ Added platform import.')
} else {
  console.error('❌ Could not find clothingRoutes import.')
  process.exit(1)
}

// 2. Add platform guard + route mount before the business-scoped guard
const guardLine = `// Business-scoped resources: DB up + authenticated user + completed business workspace.`
const platformMount = `// Platform routes: authenticated super-admin only, intentionally cross-tenant (no requireBusiness).
const platformGuard = [requireDatabase, authenticate, requirePlatformRole('super_admin')]
api.use('/platform', platformGuard, platformRoutes)\n\n`

if (content.includes("api.use('/platform'")) {
  console.log('Platform route mount already present, skipping.')
} else if (content.includes(guardLine)) {
  content = content.replace(guardLine, `${platformMount}${guardLine}`)
  console.log('✅ Added platform route mount.')
} else {
  console.error('❌ Could not find guard comment line.')
  process.exit(1)
}

writeFileSync(filePath, content, 'utf8')
console.log('✅ routes/index.js patched successfully.')

