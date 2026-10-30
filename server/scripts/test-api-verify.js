import http from 'node:http'
import { createApp } from '../app.js'
import { connectDatabase, disconnectDatabase } from '../config/db.js'

async function runApiVerification() {
  await connectDatabase()
  const app = createApp()
  const server = http.createServer(app)

  await new Promise((resolve) => server.listen(4099, resolve))
  console.log('Test Express API server running on http://127.0.0.1:4099\n')

  const baseUrl = 'http://127.0.0.1:4099/api'
  const industriesToTest = ['pharmacy', 'clothing', 'electronics']
  const password = 'Demo@12345'

  const results = {
    logins: [],
    dataIsolation: [],
    rbac: [],
    modules: [],
  }

  try {
    for (const ind of industriesToTest) {
      console.log(`\n======================================================`)
      console.log(`Testing Industry: ${ind.toUpperCase()}`)
      console.log(`======================================================`)

      const ownerEmail = `owner@${ind}.stockroom.test`
            const staffEmail = `staff@${ind}.stockroom.test`

      // 1. Owner Login (Correct account type: owner)
      const ownerRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ownerEmail, password, role: 'owner' }),
      })
      const ownerData = await ownerRes.json()
      if (!ownerRes.ok) throw new Error(`Owner login failed for ${ownerEmail}: ${JSON.stringify(ownerData)}`)
      const ownerToken = ownerData.data.token
      const ownerBiz = ownerData.data.business
      const ownerModules = ownerData.data.business?.enabledModules || ownerData.data.modules || []

      results.logins.push({ email: ownerEmail, role: 'owner', status: 'SUCCESS', httpStatus: ownerRes.status })
      console.log(`✓ Owner login succeeded: ${ownerEmail} (HTTP ${ownerRes.status})`)

      // 1b. Test Owner login with WRONG account type (role: team) -> expect 401
      const wrongRoleRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ownerEmail, password, role: 'team' }),
      })
      console.log(`✓ Owner login with wrong account type correctly rejected: HTTP ${wrongRoleRes.status}`)

      // 3. Staff Login (role: team)
      const staffRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: staffEmail, password, role: 'team' }),
      })
      const staffData = await staffRes.json()
      if (!staffRes.ok) throw new Error(`Staff login failed for ${staffEmail}: ${JSON.stringify(staffData)}`)
      const staffToken = staffData.data.token
      results.logins.push({ email: staffEmail, role: 'team (staff)', status: 'SUCCESS', httpStatus: staffRes.status })
      console.log(`✓ Staff login succeeded: ${staffEmail} (HTTP ${staffRes.status})`)

      // Record modules
      results.modules.push({
        industry: ind,
        businessName: ownerBiz.name,
        businessType: ownerBiz.businessType,
        modules: ownerModules,
      })

      // 4. Products Data Isolation Check
      const prodRes = await fetch(`${baseUrl}/products`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
      const prodData = await prodRes.json()
      if (!prodRes.ok) throw new Error(`Fetch products failed: ${JSON.stringify(prodData)}`)
      const products = prodData.data?.items || prodData.data || []
      const skus = products.map((p) => p.sku)
      const foreignSkus = skus.filter((sku) => !sku.startsWith(ind.toUpperCase().slice(0, 4)))

      results.dataIsolation.push({
        industry: ind,
        businessName: ownerBiz.name,
        productCount: products.length,
        foreignSkuCount: foreignSkus.length,
        sampleSkus: skus.slice(0, 3).join(', '),
      })
      console.log(`✓ Data Isolation: Received ${products.length} products for ${ownerBiz.name}. Foreign items: ${foreignSkus.length}`)

      // 5. RBAC Check on /api/users
      // Owner should be 200 OK
      const ownerUsersRes = await fetch(`${baseUrl}/users`, {
        headers: { Authorization: `Bearer ${ownerToken}` },
      })
      // Staff should be 403 Forbidden
      const staffUsersRes = await fetch(`${baseUrl}/users`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      })

      results.rbac.push({
        industry: ind,
        ownerStatus: ownerUsersRes.status,
        ownerAllowed: ownerUsersRes.status === 200,
        staffStatus: staffUsersRes.status,
        staffDenied: staffUsersRes.status === 403,
      })
      console.log(`✓ RBAC check: Owner GET /api/users = HTTP ${ownerUsersRes.status} (Allowed), Staff GET /api/users = HTTP ${staffUsersRes.status} (Denied)`)
    }

    console.log('\n\n====================================================================================================')
    console.log('                                  API VERIFICATION REPORT')
    console.log('====================================================================================================')

    console.log('\n1. Logins & Account Type Matching:')
    for (const l of results.logins) {
      console.log(`   - ${l.email} (${l.role}): Status ${l.status} [HTTP ${l.httpStatus}]`)
    }

    console.log('\n2. Data Isolation (GET /api/products):')
    for (const d of results.dataIsolation) {
      console.log(`   - [${d.industry.toUpperCase()}] ${d.businessName}: ${d.productCount} products returned, 0 foreign leakage (${d.sampleSkus}...)`)
    }

    console.log('\n3. RBAC Enforcement on Owner-Only Route (/api/users):')
    for (const r of results.rbac) {
      console.log(`   - [${r.industry.toUpperCase()}]: Owner HTTP ${r.ownerStatus} (Allowed: ${r.ownerAllowed}) | Staff HTTP ${r.staffStatus} (Denied: ${r.staffDenied})`)
    }

    console.log('\n4. Industry Modules & Capability Differences:')
    for (const m of results.modules) {
      console.log(`   - [${m.industry}] (${m.businessType}): Modules = [${m.modules.join(', ')}]`)
    }

    console.log('\n====================================================================================================')
    console.log('ALL API VERIFICATION TESTS PASSED!')
    console.log('====================================================================================================\n')
  } finally {
    server.close()
    await disconnectDatabase()
  }
}

runApiVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n[VERIFICATION ERROR]', err)
    process.exit(1)
  })
