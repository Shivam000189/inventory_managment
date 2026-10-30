# Demo Accounts & Credentials

This document lists all seeded demo accounts for each industry and business type in Stockroom (IMB).

All demo accounts share the password:
```text
Demo@12345
```

> **IMPORTANT: Account Type Selection on Login**
> When logging in via the web interface (`/login`), you **MUST** select the correct account type toggle:
> - For **Owner / Admin** accounts: Select **Shop owner** (`role: 'owner'`)
> - For **Salesperson** accounts: Select **Team member** (`role: 'team'`)
>
> Selecting the wrong account type will result in an `Invalid credentials for selected account type` error.

---

## Complete Demo Accounts Matrix (22 Logins: Admin & Salesperson)

| Industry | Business Name | Business Type | Role | Email | Password | Account Type to Pick | Assigned Role ID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **pharmacy** | Aflix Pharma Wholesale | wholesale | Admin | `owner@pharmacy.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| pharmacy | Aflix Pharma Wholesale | wholesale | Salesperson | `staff@pharmacy.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **clothing** | Threadline Apparel | retailwholesale | Admin | `owner@clothing.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| clothing | Threadline Apparel | retailwholesale | Salesperson | `staff@clothing.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **electronics** | VoltEdge Electronics | retail | Admin | `owner@electronics.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| electronics | VoltEdge Electronics | retail | Salesperson | `staff@electronics.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **grocery** | FreshBasket Mart | retail | Admin | `owner@grocery.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| grocery | FreshBasket Mart | retail | Salesperson | `staff@grocery.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **hardware** | IronWorks Hardware | retailwholesale | Admin | `owner@hardware.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| hardware | IronWorks Hardware | retailwholesale | Salesperson | `staff@hardware.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **automobile** | AutoParts Hub | retail | Admin | `owner@automobile.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| automobile | AutoParts Hub | retail | Salesperson | `staff@automobile.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **wholesale** | BulkBazaar Traders | wholesale | Admin | `owner@wholesale.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| wholesale | BulkBazaar Traders | wholesale | Salesperson | `staff@wholesale.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **retail** | Urban Corner Store | retail | Admin | `owner@retail.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| retail | Urban Corner Store | retail | Salesperson | `staff@retail.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **restaurant** | Spice Route Kitchen | service | Admin | `owner@restaurant.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| restaurant | Spice Route Kitchen | service | Salesperson | `staff@restaurant.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **manufacturing** | Sunrise Plastics Works | manufacturing | Admin | `owner@manufacturing.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| manufacturing | Sunrise Plastics Works | manufacturing | Salesperson | `staff@manufacturing.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |
| **other** | General Goods Co | other | Admin | `owner@other.stockroom.test` | `Demo@12345` | Shop owner | `ROLE-ADMIN` |
| other | General Goods Co | other | Salesperson | `staff@other.stockroom.test` | `Demo@12345` | Team member | `ROLE-SALESPERSON` |

---

## Default Demo Account (Original)

| Role | Email | Password | Account Type to Pick |
| :--- | :--- | :--- | :--- |
| **Aflix Default Admin** | `demo@stockroom.test` | `demo12345` | Shop owner |

---

## Account Type Routing Rules

1. **Shop Owner (`role: 'owner'`):**
   - User document in `users` has `role: 'owner'`.
   - Has `ROLE-ADMIN` permissions for full access to products, suppliers, stock adjustments, purchase orders, team management, and settings.

2. **Team Member (`role: 'team'`):**
   - User document in `users` has `role: 'team'`.
   - Has `ROLE-SALESPERSON` permissions scoped specifically to POS checkout, invoice printing, and personal sales records.
