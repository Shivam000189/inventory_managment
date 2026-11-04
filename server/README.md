# Stockroom API

Express REST API backed by Supabase PostgreSQL. Business data access is scoped to the authenticated user's current business and permissions.

## Layout

```text
server/
├── server.js          bootstrap: connect DB, start HTTP
├── app.js             express app (helmet, cors, json, routes, errors)
├── config/            environment, Supabase clients, PostgreSQL transactions
├── models/            Supabase-backed models and serialization
├── routes/            route mounts and access gates
├── controllers/       parse request -> call service -> send envelope
├── services/          business logic and transactional operations
├── repositories/      parameterized PostgreSQL queries
├── middleware/        database, authentication, business, permission, and platform guards
├── scripts/           bootstrap, recovery, and migration tools
└── tests/              backend unit and contract tests
```

Request flow: `route → auth/access middleware → controller → service → repository/model → PostgreSQL`.

## Account and access model

- **Super Admin**: provisions Business Admins and businesses through `/api/platform`.
- **Business Admin**: owns one provisioned business and manages only that business's salespeople.
- **Salesperson**: has one business membership and tenant-scoped permissions.
- Public account registration, password-reset links, and self-service business creation are not exposed.
- New provisioned users get random temporary passwords returned only in the creation response. They must change the password before using other protected API routes.
- Account and business status are reloaded from PostgreSQL during authentication. Inactive users and suspended/deactivated businesses are denied access; status changes revoke existing sessions.
- Platform and team-account mutations are transactional and produce sanitized audit events.
- Subscription and billing are not part of this account-management implementation.

## Authentication

- `POST /api/auth/login` `{ email, password }` → session and account details
- `GET /api/auth/me` (Bearer or cookie) → current session
- `PATCH /api/auth/password` `{ currentPassword, newPassword }` → changes password and revokes older sessions
- `POST /api/auth/logout` and `POST /api/auth/logout-all` clear/revoke sessions

There are no public register, forgot-password, or reset-password routes. Business profile routes live under `/api/businesses/me`; only Super Admins can create businesses.

## Platform and team provisioning

- `POST /api/platform/businesses`: Super Admin-only; atomically creates a business, Business Admin, default roles, and admin membership. The response includes a one-time temporary password.
- `PATCH /api/platform/businesses/:businessId/status`: Super Admin-only; `active`, `suspended`, or `deactivated`.
- `PATCH /api/platform/business-admins/:userId/status`: Super Admin-only; `active` or `inactive`.
- `POST /api/users`: Business Admin-only; creates a salesperson inside the caller's business and returns a one-time temporary password.
- `PATCH /api/users/:userId/status`: Business Admin-only; `active` or `inactive`.

See [the API reference](../docs/BACKEND_API_REFERENCE.md) for all endpoints, fields, and permission gates.

## Database setup

1. Configure Supabase URL, service-role key, and direct PostgreSQL connection settings in `server/.env`.
2. Apply the base schema and existing migrations, then apply `supabase/migrations/20261102000000_controlled_account_provisioning.sql`.
3. Configure `INITIAL_SUPER_ADMIN_PASSWORD` in the process environment and run `npm run bootstrap:super-admin` from the repository root. The script creates `aflix@gmail.com` only if no account with that email exists; it never resets an existing account.
4. Operator recovery uses `ACCOUNT_RECOVERY_PASSWORD` plus `npm run reset-password -- <account-email>`. Recovery invalidates old sessions and forces a password change. Keep secrets out of command history, logs, source control, and seed data.

The repository contains no demo seed scripts. After applying the schema and migrations,
bootstrap the first Super Admin and provision businesses through the platform interface.

## Responses and transactions

```jsonc
{ "success": true, "data": {}, "message": "..." }   // 2xx
{ "success": false, "message": "...", "errors": {} } // 4xx / 5xx
```

Provisioning and other multi-write flows use `withTransaction()` and fail rather than falling back to non-transactional writes. Run PostgreSQL against a supported transaction-capable instance.
