# Demo Accounts & Credentials

This document lists all seeded demo accounts for each industry and business type in Stockroom (IMB).

All demo accounts share the password:
```text
Demo@12345
```

> **IMPORTANT: Account Type Selection on Login**
> When logging in via the web interface (`/login`), you **MUST** select the correct account type toggle:
> - For **Owner** accounts: Select **Shop owner** (`role: 'owner'`)
> - For **Manager** and **Staff** accounts: Select **Team member** (`role: 'team'`)
>
> Selecting the wrong account type will result in an `Invalid credentials for selected account type` error.

---

## Complete Demo Accounts Matrix (33 Logins)

| Industry | Business Name | Business Type | Role | Email | Password | Account Type to Pick | Assigned Role ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **pharmacy** | Aflix Pharma Wholesale | wholesale | Owner | `owner@pharmacy.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| pharmacy | Aflix Pharma Wholesale | wholesale | Manager | `manager@pharmacy.stockroom.test` | `Demo@12345` | Team member | `ROLE-MANAGER` |
| pharmacy | Aflix Pharma Wholesale | wholesale | Staff | `staff@pharmacy.stockroom.test` | `Demo@12345` | Team member | `ROLE-STAFF` |
| **clothing** | Threadline Apparel | retailwholesale | Owner | `owner@clothing.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| clothing | Threadline Apparel | retailwholesale | Manager | `manager@clothing.stockroom.test` | `Demo@12345` | Team member | `ROLE-MANAGER` |
| clothing | Threadline Apparel | retailwholesale | Staff | `staff@clothing.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **electronics** | VoltEdge Electronics | retail | Owner | `owner@electronics.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| electronics | VoltEdge Electronics | retail | Manager | `manager@electronics.stockroom.test` | `Demo@12345` | Team member | `ROLE-MANAGER` |
| electronics | VoltEdge Electronics | retail | Staff | `staff@electronics.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **grocery** | FreshBasket Mart | retail | Owner | `owner@grocery.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| grocery | FreshBasket Mart | retail | Manager | `manager@grocery.stockroom.test` | `Demo@12345` | Team member | `ROLE-MANAGER` |
| grocery | FreshBasket Mart | retail | Staff | `staff@grocery.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **hardware** | IronWorks Hardware | retailwholesale | Owner | `owner@hardware.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| hardware | IronWorks Hardware | retailwholesale | Manager | `manager@hardware.stockroom.test` | `Demo@12345` | Team member | `ROLE-MANAGER` |
| hardware | IronWorks Hardware | retailwholesale | Staff | `staff@hardware.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **automobile** | AutoParts Hub | retail | Owner | `owner@automobile.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| automobile | AutoParts Hub | retail | Manager | `manager@automobile.stockroom.test` | `Demo@12345` | Team member | `ROLE-MANAGER` |
| automobile | AutoParts Hub | retail | Staff | `staff@automobile.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **wholesale** | BulkBazaar Traders | wholesale | Owner | `owner@wholesale.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| wholesale | BulkBazaar Traders | wholesale | Manager | `manager@wholesale.stockroom.test` | `Demo@12345` | Team member | `ROLE-MANAGER` |
| wholesale | BulkBazaar Traders | wholesale | Staff | `staff@wholesale.stockroom.test` | `Demo@12345` | Team member | `ROLE-STAFF` |
| **retail** | Urban Corner Store | retail | Owner | `owner@retail.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| retail | Urban Corner Store | retail | Manager | `manager@retail.stockroom.test` | `Demo@12345` | Team member | `ROLE-MANAGER` |
| retail | Urban Corner Store | retail | Staff | `staff@retail.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **restaurant** | Spice Route Kitchen | service | Owner | `owner@restaurant.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| restaurant | Spice Route Kitchen | service | Manager | `manager@restaurant.stockroom.test` | `Demo@12345` | Team member | `ROLE-MANAGER` |
| restaurant | Spice Route Kitchen | service | Staff | `staff@restaurant.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **manufacturing** | Sunrise Plastics Works | manufacturing | Owner | `owner@manufacturing.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| manufacturing | Sunrise Plastics Works | manufacturing | Manager | `manager@manufacturing.stockroom.test` | `Demo@12345` | Team member | `ROLE-MANAGER` |
| manufacturing | Sunrise Plastics Works | manufacturing | Staff | `staff@manufacturing.stockroom.test` | `Demo@12345` | Team member | `ROLE-STAFF` |
| **other** | General Goods Co | other | Owner | `owner@other.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| other | General Goods Co | other | Manager | `manager@other.stockroom.test` | `Demo@12345` | Team member | `ROLE-MANAGER` |
| other | General Goods Co | other | Staff | `staff@other.stockroom.test` | `Demo@12345` | Team member | `ROLE-STAFF` |

---

## Default Demo Account (Original)

The base demo account created by `npm run seed:supabase` remains available:
- **Email**: `demo@stockroom.test`
- **Password**: `demo12345`
- **Account Type**: `Shop owner`
- **Business**: Aflix Pharmacy

---

## Seeding & Resetting Demo Data

To seed or refresh demo data for all 11 industries:

```bash
# Idempotent seed (updates existing, adds missing)
npm run seed:demo-all

# Complete fresh reset of all .stockroom.test demo accounts & businesses
npm run seed:demo-all -- --fresh
```

Flags:
- `--fresh`: Deletes only businesses and users whose emails end in `.stockroom.test` (excluding `demo@stockroom.test`), along with their associated cascade entities, before reseeding.
- `--force`: Required if running against `NODE_ENV=production`.
