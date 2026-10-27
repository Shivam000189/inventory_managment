# Stockroom (IMB)

Inventory & small-business management app. **MERN stack:**

```
React + Vite  →  REST API (Express)  →  MongoDB (Mongoose)  →  API  →  React UI
```

MongoDB is the single source of truth for all persistent data. The browser holds
no token — the session is an httpOnly cookie (`sr_session`) with a companion
readable CSRF token (`sr_csrf`); API/integration callers use `Authorization:
Bearer` instead.

## Prerequisites

- Node.js 18+
- A MongoDB database — [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
  or a local `mongod`. Put its connection string in `server/.env`.

## Setup

```powershell
npm install
copy .env.example .env                 # frontend: VITE_API_URL
copy server\.env.example server\.env    # backend: MONGODB_URI, JWT_SECRET, ...
```

Edit `server/.env` and set at least `MONGODB_URI` and `JWT_SECRET`.

## Run

```powershell
npm run dev:all      # starts API (nodemon) + Vite together
```

or in two terminals:

```powershell
npm run server       # API at http://localhost:4000
npm run dev          # Vite at http://localhost:5173
```

Optional demo data:

```powershell
npm run seed -- --demo    # creates demo@stockroom.test / demo12345 with sample records
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server (frontend) |
| `npm run server` | Express API |
| `npm run server:dev` | Express API with nodemon reload |
| `npm run dev:all` | Both, via `concurrently` |
| `npm run seed` | Migrate `server/data/db.json` into MongoDB (`-- --demo`, `-- --fresh`) |
| `npm run build` / `npm run preview` | Production build / preview |
| `npm run lint` | oxlint |

## Environment

**Frontend – `.env`**

| Var | Default |
| --- | --- |
| `VITE_API_URL` | `http://localhost:4000/api` |

**Backend – `server/.env`**

| Var | Default |
| --- | --- |
| `PORT` | `4000` |
| `NODE_ENV` | `development` |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/inventory_app` |
| `JWT_SECRET` | _(required in production; must be ≥ 32 chars there)_ |
| `JWT_EXPIRES_IN` | `12h` (idle timeout; the cookie renews on activity) |
| `CLIENT_URL` | `http://localhost:5173` (CORS allow-list, comma-separated) |
| `TRUST_PROXY` | `false` — set to `1` (hop count) behind a reverse proxy |
| `SECURE_COOKIES` | on when `NODE_ENV=production`; set `1` to force HTTPS-only cookies |
| `COOKIE_SAMESITE` | `lax` — use `none` (with HTTPS) for cross-site frontend/API |
| `COOKIE_DOMAIN` | _(unset)_ — e.g. `.example.com` to share across subdomains |

## Structure

MERN monorepo — one Vite frontend (`src/`) and one Express API (`server/`), sharing
a single `package.json` and a small `shared/` folder.

```text
IMB/
├── src/            React frontend (Vite) — see below
├── server/         Express + Mongoose API — see below
├── shared/         code needed by both sides
│   └── industryConfig.js   per-industry module/field config (drives IndustryModule.jsx & backend validation)
├── public/         static assets served as-is (favicon.svg)
├── index.html      Vite entry HTML
├── vite.config.js  Vite config
├── vercel.json / render.yaml   deploy config (Vercel = frontend, Render = API)
├── .env / .env.example         frontend env (VITE_API_URL)
├── artifacts/      reference screenshots used while redesigning the UI (git-ignored)
└── dist/           production build output of `npm run build` (git-ignored)
```

### `src/` — Frontend Architecture & Design System

The frontend has been completely refactored with a **Feature-Driven Architecture**, unified design tokens, route-level code splitting, and strict accessibility standards.

#### Performance & Bundle Metrics (Production Build)

| Metric | Before Refactor (Baseline) | After Refactor (Phase 4/5) | Reduction / Target |
| :--- | :--- | :--- | :--- |
| **Initial JS Chunk** | `903.92 kB` (gzip: `260.40 kB`) | **`85.54 kB`** (gzip: **`21.58 kB`**) | **-90.5%** (Target: < 250 kB / < 80 kB gzip) |
| **React Vendor JS** | Bundled in monolith | **`228.88 kB`** (gzip: **`73.22 kB`**) | Cleanly isolated vendor chunk |
| **Initial CSS Chunk** | `575.27 kB` (gzip: `94.12 kB`) | **`104.04 kB`** (gzip: **`17.36 kB`**) | **-81.9%** (Target: < 120 kB) |
| **Dead CSS Pruned** | ~5,600 unused lines in `App.css` | 246 lines of genuine globals | **-95.8%** lines removed |
| **Code Splitting** | Monolithic single chunk | 19 lazy-loaded route chunks | On-demand dynamic loading |

#### Design System (`src/components/ui/`)

All views consume standard tokens and reusable UI primitives styled after the owner's modern dashboard:

* **Tokens**: `src/styles/tokens.css` (color scales, typography, elevation, spacing) & `src/styles/ui-system.css` (semantic variables, button/input standards, scrollbar styles, skip links).
* **Components**:
  * `Button`: Primary, secondary, danger, ghost variants with `icon`, `size`, `loading` states.
  * `Badge`: Tone-based status badges (`success`, `warning`, `danger`, `info`, `neutral`) with optional dot indicators.
  * `Card` / `StatCard` / `StatGrid`: Elevation surfaces, stats with trends and spark metrics.
  * `PageHeader`: Accessible header with single `<h1>`, subtitle, breadcrumbs, and responsive action slot.
  * `Toolbar`: Integrated search, filter popovers, export, and primary action bar.
  * `DataTable`: Responsive tables with loading skeletons, empty states, and pagination controls.
  * `Modal` & `Drawer`: Accessible dialogs with focus trapping, backdrop blur, and escape key handling.
  * `Tabs`: Accessible tab navigation with keyboard arrows support.
  * `Pagination`: Accessible page navigation with page-size selectors.
  * `Feedback` (`FormStatus`, `Alert`, `PageSkeleton`): Shimmer loaders and dismissible alerts.
  * `ErrorBoundary`: Graceful UI error catching with retry and reload actions.
  * `ConfirmDialog` / `PromptDialog`: Promise-driven modal replacements for `window.confirm` and `prompt`.
  * `Icon`: Centralized SVG icon library with consistent stroke width and sizing.

#### Responsive Mobile-First Layout

Tested and verified across 6 viewports (`360x740`, `390x844`, `768x1024`, `1024x768`, `1280x800`, `1536x864`) in light and dark themes:
* **Mobile (< 768px)**: Off-canvas drawer navigation with focus trap, backdrop blur, top bar with mobile menu trigger, full-screen search overlay, and zero horizontal scroll (`scrollWidth <= innerWidth`).
* **Tablet (768px - 1023px)**: Auto-collapsible rail navigation (72px) with icon tooltips to maximize workspace width.
* **Desktop (>= 1024px)**: Full brand sidebar with expandable navigation sections, workspace switcher, and collapsed avatar user chip.

#### Directory Structure

```text
src/
├── main.jsx                    React entry point
├── App.css                     Global CSS resets (246 lines)
├── app/
│   ├── App.jsx                 App shell, skip-link, header, navigation & lazy route setup
│   ├── routes.jsx              Lazy-loaded route declarations & permissions
│   └── main.jsx
├── components/
│   ├── layout/                 App chrome (AppHeader, AppSidebar, NotificationCenter)
│   └── ui/                     Reusable design system component library (14 components)
├── features/                   Feature modules (co-located component + CSS)
│   ├── auth/                   AuthPage & Login
│   ├── dashboard/              DashboardOverview, StatCards, InventoryTable
│   ├── products/               ProductsPage (Catalog, Stock Level Indicators)
│   ├── inventory/              InventoryOperations (Stock In, Out, Adjustments, Audit)
│   ├── purchasing/             PurchaseOrdersPage
│   ├── receiving/              ReceivingGrnPage
│   ├── suppliers/              SuppliersPage
│   ├── sales/                  SalesOrdersPage, OrderDetailsModal
│   ├── pos/                    PosTerminalPage, PosReceiptModal
│   ├── payments/               PaymentsPage
│   ├── returns/                ReturnsPage (Sales & Purchase Returns)
│   ├── product-import/         ProductImportPage (CSV Import, Validation Grid)
│   ├── reports/                ReportsPage (BI Charts, KPI Metrics)
│   ├── users/                  UserManagementPage, RolesPermissionsPage
│   ├── settings/               StoreSettingsPage, BusinessProfilePage
│   ├── industries/             ClothingModule, BulkPricingPage, PharmacyModule
│   └── onboarding/             BusinessSetup wizard
├── api/                        REST client modules (client.js, productApi, etc.)
├── hooks/                      Custom hooks (useResource.js, useAuth.js)
└── styles/
    ├── tokens.css              Core design tokens & theme palettes
    ├── ui-system.css           Semantic tokens, typography, skip-link, buttons
    └── app-chrome.css          Sidebar, navbar, drawer, and header layout rules
```

### `server/` — API

Every resource follows the same four-layer pattern, same base name across folders
(e.g. `product` → `routes/productRoutes.js` → `controllers/*` → `services/productService.js`
→ `models/Product.js`); simpler resources share `controllers/resourceController.js` +
`services/crudService.js` instead of a dedicated controller/service.

```text
server/
├── server.js          process entry point (listen, graceful shutdown)
├── app.js             Express app: middleware + route mounting
├── config/
│   ├── env.js              loads/validates environment variables
│   └── db.js                Mongoose connection
├── routes/             Express routers — one per resource, mounted in routes/index.js
├── controllers/        HTTP request/response layer
├── services/            business logic, transactions, cross-model rules
├── models/               Mongoose schemas (Business, Product, SalesOrder, User, …)
│   └── plugins/serialize.js   shared toJSON/id transform for every schema
├── middleware/
│   ├── auth.js               session verification (cookie or Bearer) + revocation
│   ├── csrf.js               double-submit CSRF guard for cookie sessions
│   ├── database.js           per-request DB/tenant scoping
│   └── errorHandler.js       central error → HTTP response mapping
├── validators/
│   ├── assert.js             request input assertions
│   └── password.js           password strength checks
├── utils/
│   ├── token.js              JWT sign/verify + duration parsing
│   ├── cookies.js            session + CSRF cookie handling
│   ├── ApiError.js           typed HTTP errors
│   └── asyncHandler.js, respond.js   route helpers
├── data/db.json           seed source data
└── scripts/               one-off ops: seed.js, seed-sample.js,
                            seed-wholesale-clothing.js, reset-password.js,
                            db-check.js, integration.test.mjs
```

See [`server/README.md`](server/README.md) for the API reference.
