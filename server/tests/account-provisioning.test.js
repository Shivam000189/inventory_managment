import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { authRoutes } from '../routes/authRoutes.js'
import { platformRoutes } from '../routes/platformRoutes.js'
import { businessRoutes } from '../routes/businessRoutes.js'
import { fetchPlatformBusinessAdmins, fetchPlatformBusinesses, createPlatformBusiness, setPlatformBusinessStatus, setPlatformBusinessAdminStatus } from '../services/platformService.js'
import { buildPlatformBusinessAdminFilters, countPlatformBusinessAdmins, escapeLike, listPlatformBusinessAdmins } from '../repositories/platformRepository.js'
import { insertPlatformAuditEvent } from '../services/platformAuditService.js'
import { authenticate, requirePlatformRole, signToken } from '../middleware/auth.js'
import { User, Business, DEFAULT_ROLES } from '../models/index.js'
import bcrypt from 'bcryptjs'

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bootstrapPath = path.join(serverDirectory, 'scripts', 'bootstrap-super-admin.js')

function routeTable(router) {
  return router.stack
    .map((layer) => layer.route && ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods),
    }))
    .filter(Boolean)
}

test('public auth router exposes login but no signup or password recovery routes', () => {
  const routes = routeTable(authRoutes)
  const paths = routes.map((route) => route.path)
  assert.ok(paths.includes('/login'))
  assert.ok(paths.includes('/password'))
  assert.ok(!paths.includes('/register'))
  assert.ok(!paths.includes('/forgot-password'))
  assert.ok(!paths.includes('/reset-password'))
})

test('platform router wires business provisioning and lifecycle operations', () => {
  const routes = routeTable(platformRoutes)
  assert.ok(routes.some((route) => route.path === '/businesses' && route.methods.includes('post')))
  assert.ok(routes.some((route) => route.path === '/businesses/:businessId/status' && route.methods.includes('patch')))
  assert.ok(routes.some((route) => route.path === '/business-admins/:userId/status' && route.methods.includes('patch')))
})

test('business admin search filters by business email with escaped, shared list/count filters', () => {
  const filters = buildPlatformBusinessAdminFilters({ q: 'shop%_\\example.test' })
  assert.deepEqual(filters.params, ['%shop\\%\\_\\\\example.test%'])
  assert.ok(filters.where.some((filter) => filter.includes('b.email ILIKE')))
  assert.ok(filters.where.some((filter) => filter.includes('u.name ILIKE')))
})

test('Business Admin list and count queries use the same parameterized business-email search', async () => {
  const calls = []
  const pool = {
    async query(sql, params) {
      calls.push({ sql, params })
      return { rows: sql.includes('COUNT(*)') ? [{ total: 1 }] : [] }
    },
  }
  const filters = { q: 'shop%_\\example.test' }
  await listPlatformBusinessAdmins({ ...filters, page: 1, limit: 10 }, pool)
  await countPlatformBusinessAdmins(filters, pool)

  assert.equal(calls.length, 2)
  for (const { sql, params } of calls) {
    assert.match(sql, /b\.email ILIKE/)
    assert.ok(!sql.includes('shop'))
    assert.equal(params[0], '%shop\\%\\_\\\\example.test%')
  }
})

test('platform list rejects invalid pagination, filters, and date ranges before querying SQL', async () => {
  await assert.rejects(fetchPlatformBusinesses({ page: '0' }), { statusCode: 400 })
  await assert.rejects(fetchPlatformBusinesses({ limit: '101' }), { statusCode: 400 })
  await assert.rejects(fetchPlatformBusinesses({ status: 'pending' }), { statusCode: 400 })
  await assert.rejects(fetchPlatformBusinesses({ createdFrom: '2026-02-31' }), { statusCode: 400 })
  await assert.rejects(fetchPlatformBusinessAdmins({ industry: 'not-an-industry' }), { statusCode: 400 })
  await assert.rejects(fetchPlatformBusinesses({ businessId: 'another-tenant' }), { statusCode: 400 })
})

test('literal wildcard search escapes SQL LIKE metacharacters', () => {
  assert.equal(escapeLike('50%_\\shop'), '50\\%\\_\\\\shop')
})

test('platform audit writer strips secret-like metadata keys', async () => {
  let inserted
  const marker = crypto.randomUUID()
  await insertPlatformAuditEvent({
    async query(_sql, params) {
      inserted = params
    },
  }, {
    actorUserId: crypto.randomUUID(),
    action: 'test.audit',
    targetType: 'user',
    targetId: crypto.randomUUID(),
    metadata: {
      email: 'admin@example.test',
      temporaryPassword: marker,
      nested: { sessionToken: marker },
    },
    request: { id: crypto.randomUUID(), ip: '127.0.0.1', get: () => 'unit-test' },
  })
  assert.ok(inserted)
  assert.ok(!JSON.stringify(inserted[5]).includes(marker))
  assert.ok(JSON.stringify(inserted[5]).includes('admin@example.test'))
})

test('bootstrap fails safely when its required secret is absent or weak', () => {
  const env = { ...process.env, NODE_ENV: 'test' }
  env.INITIAL_SUPER_ADMIN_PASSWORD = ''
  const missing = spawnSync(process.execPath, [bootstrapPath], { cwd: serverDirectory, env, encoding: 'utf8' })
  assert.equal(missing.status, 1)
  assert.match(missing.stderr, /INITIAL_SUPER_ADMIN_PASSWORD is required/)

  const weakSecret = 'a'.repeat(16)
  const weak = spawnSync(process.execPath, [bootstrapPath], {
    cwd: serverDirectory,
    env: { ...env, INITIAL_SUPER_ADMIN_PASSWORD: weakSecret },
    encoding: 'utf8',
  })
  assert.equal(weak.status, 1)
  assert.match(weak.stderr, /does not meet the password policy/)
  assert.ok(!weak.stdout.includes(weakSecret))
  assert.ok(!weak.stderr.includes(weakSecret))
})

function fakeTransaction(client) {
  const events = []
  return {
    events,
    run: async (work) => {
      events.push('BEGIN')
      try {
        const result = await work(client)
        events.push('COMMIT')
        return result
      } catch (error) {
        events.push('ROLLBACK')
        throw error
      }
    },
  }
}

async function authenticateAs(databaseUser, {
  claimRole = databaseUser.role,
  body = {},
  query = {},
  platformRoleHeader,
} = {}) {
  const originalFindById = User.findById
  User.findById = async () => databaseUser
  const token = signToken({
    _id: databaseUser._id,
    role: claimRole,
    business: databaseUser.business || null,
    tokenVersion: databaseUser.tokenVersion || 0,
  })
  const req = {
    headers: {
      authorization: `Bearer ${token}`,
      ...(platformRoleHeader ? { 'x-platform-role': platformRoleHeader } : {}),
    },
    cookies: {},
    originalUrl: '/api/platform/overview',
    body,
    query,
  }
  try {
    const error = await new Promise((resolve) => {
      authenticate(req, {}, (caught) => resolve(caught || null))
    })
    return { req, error }
  } finally {
    User.findById = originalFindById
  }
}

test('regular users and Business Admins cannot access platform routes; request claims cannot grant access', async () => {
  for (const role of ['team', 'owner']) {
    const dbUser = {
      _id: crypto.randomUUID(),
      role,
      platformRole: 'user',
      status: 'active',
      tokenVersion: 0,
      mustChangePassword: false,
    }
    const { req, error } = await authenticateAs(dbUser, {
      claimRole: 'super_admin',
      body: { role: 'super_admin', platform_role: 'super_admin' },
      query: { platform_role: 'super_admin' },
      platformRoleHeader: 'super_admin',
    })
    assert.ifError(error)
    assert.equal(req.user, dbUser)
    assert.throws(() => requirePlatformRole('super_admin')(req, {}, () => {}), { statusCode: 403 })
  }

  const dbSuperAdmin = {
    _id: crypto.randomUUID(),
    role: 'owner',
    platformRole: 'super_admin',
    status: 'active',
    tokenVersion: 0,
    mustChangePassword: false,
  }
  const { req, error } = await authenticateAs(dbSuperAdmin, {
    body: { role: 'team', platform_role: 'user' },
  })
  assert.ifError(error)
  assert.doesNotThrow(() => requirePlatformRole('super_admin')(req, {}, () => {}))
})

test('authentication blocks inactive accounts and non-active businesses', async () => {
  const inactive = await authenticateAs({
    _id: crypto.randomUUID(),
    role: 'owner',
    platformRole: 'super_admin',
    status: 'inactive',
    tokenVersion: 0,
    mustChangePassword: false,
  })
  assert.equal(inactive.error?.statusCode, 401)

  const originalFindById = Business.findById
  Business.findById = async () => ({ status: 'suspended' })
  try {
    const blockedBusiness = await authenticateAs({
      _id: crypto.randomUUID(),
      role: 'owner',
      platformRole: 'user',
      status: 'active',
      business: crypto.randomUUID(),
      tokenVersion: 0,
      mustChangePassword: false,
    })
    assert.equal(blockedBusiness.error?.statusCode, 403)
  } finally {
    Business.findById = originalFindById
  }
})

test('business provisioning transaction creates admin, business, roles, and membership; returns only the one-time password', async () => {
  const statements = []
  const db = {
    async query(sql, params = []) {
      statements.push({ sql, params })
      if (sql.includes('SELECT id FROM users WHERE lower(email)')) return { rows: [], rowCount: 0 }
      return { rows: [{ id: crypto.randomUUID() }], rowCount: 1 }
    },
  }
  const transaction = fakeTransaction(db)
  const actor = { _id: crypto.randomUUID() }
  const result = await createPlatformBusiness(actor, {
    name: 'Searchable Retail',
    industry: 'retail',
    businessType: 'retail',
    country: 'India',
    currency: 'INR',
    adminName: 'Business Admin',
    adminEmail: 'admin@searchable.test',
    email: 'business@searchable.test',
  }, undefined, transaction.run)

  assert.deepEqual(transaction.events, ['BEGIN', 'COMMIT'])
  assert.ok(statements.some(({ sql }) => sql.includes('INSERT INTO users')))
  assert.ok(statements.some(({ sql, params }) => sql.includes('INSERT INTO businesses') && params.includes('business@searchable.test')))
  assert.equal(statements.filter(({ sql }) => sql.includes('INSERT INTO roles')).length, DEFAULT_ROLES.length)
  assert.ok(statements.some(({ sql }) => sql.includes('INSERT INTO members')))
  const userInsert = statements.find(({ sql }) => sql.includes('INSERT INTO users'))
  assert.notEqual(userInsert.params[3], result.temporaryPassword)
  assert.equal(await bcrypt.compare(result.temporaryPassword, userInsert.params[3]), true)
  assert.deepEqual(Object.keys(result).sort(), ['business', 'businessAdmin', 'temporaryPassword'])
  assert.ok(!JSON.stringify(result).includes(userInsert.params[3]))
  const serializedUser = new User({
    id: crypto.randomUUID(),
    email: 'admin@searchable.test',
    password: userInsert.params[3],
  }).toJSON()
  assert.equal(Object.hasOwn(serializedUser, 'password'), false)
})

test('business and Business Admin status changes increment token versions', async () => {
  const actorId = crypto.randomUUID()
  const businessId = crypto.randomUUID()
  const adminId = crypto.randomUUID()

  const businessStatements = []
  const businessDb = {
    async query(sql) {
      businessStatements.push(sql)
      if (sql.includes('SELECT id, name, status FROM businesses')) {
        return { rows: [{ id: businessId, name: 'A Business', status: 'active' }], rowCount: 1 }
      }
      return { rows: [], rowCount: 1 }
    },
  }
  const businessTx = fakeTransaction(businessDb)
  await setPlatformBusinessStatus({ _id: actorId }, businessId, { status: 'suspended' }, undefined, businessTx.run)
  assert.ok(businessStatements.some((sql) => sql.includes('UPDATE users SET token_version = token_version + 1 WHERE business_id = $1')))

  const adminStatements = []
  const adminDb = {
    async query(sql) {
      adminStatements.push(sql)
      if (sql.includes('SELECT u.id, u.name, u.email')) {
        return {
          rows: [{
            id: adminId,
            name: 'Business Admin',
            email: 'admin@example.test',
            role: 'owner',
            status: 'active',
            platform_role: 'user',
            business_id: businessId,
            owner_id: adminId,
          }],
          rowCount: 1,
        }
      }
      return { rows: [], rowCount: 1 }
    },
  }
  const adminTx = fakeTransaction(adminDb)
  await setPlatformBusinessAdminStatus({ _id: actorId }, adminId, { status: 'inactive' }, undefined, adminTx.run)
  assert.ok(adminStatements.some((sql) => sql.includes('token_version = token_version + 1')))
})

test('business profile router does not expose a self-delete endpoint', () => {
  const routes = routeTable(businessRoutes)
  assert.ok(!routes.some((route) => route.methods.includes('delete')))
})
