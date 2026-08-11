# Washouse — Project Context & Architecture

**Date:** 2026-08-04  
**Version:** 2.0.0  
**Stack:** React 19 + Vite + Tailwind v4 + Supabase + Framer Motion

---

## Overview

**Washouse** es un sistema de gestión de lavandería con dos roles principales:
- **Host**: operador de máquinas, gestión de ciclos, órdenes de servicio
- **Admin**: panel de control, reportes, gestión de personal, inventario, gastos

La app corre en navegador (Vite dev server) y persiste todo en Supabase (sin localStorage después de la migración 2.0.0).

---

## Tech Stack

| Layer | Technologies |
|-------|---|
| **Frontend** | React 19.2.0, React Router 7.13, Vite 7.2.4 |
| **Styling** | Tailwind v4.1.18, Tailwind Merge, Framer Motion 12.30.0 |
| **UI Components** | Lucide React (icons), Recharts (charts), custom CVA-based components |
| **Backend** | Supabase (PostgreSQL) + RLS policies |
| **Auth** | Custom PIN-based (RPC verify_pin) — no Supabase Auth sessions |
| **State** | React Context API (8 contexts) |
| **Build** | Vite (SPA) |

---

## Project Structure

```
src/
├── main.jsx                    # Vite entry
├── App.jsx                     # Router setup
├── context/                    # React Contexts (state management)
│   ├── AppContext.jsx          # Global app state, branch/machine sync
│   ├── AuthContext.jsx         # User login, PIN verification (RPC)
│   ├── StorageContext.jsx      # Centralized Supabase read/write
│   ├── EquipmentContext.jsx    # Machine status, cycles
│   ├── SalesContext.jsx        # Sales & shifts (migrated to Supabase)
│   ├── OrderContext.jsx        # Order CRUD (migrated to Supabase)
│   ├── InventoryContext.jsx    # Inventory management
│   └── ExpenseContext.jsx      # Expense tracking
├── pages/                      # Route pages
│   ├── HostDashboard.jsx       # Machine control cards
│   ├── ServiceReception.jsx    # Service order management
│   ├── AdminDashboard.jsx      # KPI overview, alerts
│   ├── AdminLogin.jsx          # PIN login
│   ├── StaffManagement.jsx     # CRUD staff
│   ├── ClientsPage.jsx         # Customer directory
│   ├── ReportsPage.jsx         # Financial BI (charts, P&L)
│   └── SettingsPage.jsx        # Branch config, utilities
├── layouts/
│   ├── HostLayout.jsx          # Header, nav for host role
│   └── AdminLayout.jsx         # Sidebar, nav for admin role
├── components/
│   ├── ui/                     # Reusable UI (Button, Modal, KpiCard, MachineCard, etc.)
│   ├── admin/                  # Admin-specific (tables, modals, filters)
│   ├── services/               # Service/order workflow (Kanban, NewOrderWizard)
│   ├── clients/                # Client management
│   └── *.jsx                   # Layout-level (BranchLockout, PageTransition)
├── hooks/                      # Custom hooks
│   └── useMetrics.js           # KPI calculations, alerts
├── utils/                      # Helpers
│   ├── formatCurrency.js
│   ├── exportUtils.js
│   ├── printServiceTicket.js
│   └── [others]
├── assets/                     # Images (logo, etc.)
└── styles/                     # Tailwind config in tailwind.config.js

supabase/
└── migrations/
    └── 20260728_full_schema.sql # Migration: 12 tables + RLS + RPC functions
```

---

## Core Contexts (State Management)

### 1. **AppContext** — Global App State
- Branches, machines, system config
- Activity logs sync (async to Supabase)
- `CURRENT_SYSTEM_VERSION = '2.0.0'` (cache invalidation key)
- **Read on mount:** branches, machines, activity_logs

### 2. **AuthContext** — User & Session
- Current user (name, role, branchId)
- PIN verification via RPC `verify_pin(pin, branchId)`
- Shift state: `isShiftOpen` boolean
- Methods: `loginAdmin()`, `loginHost()`, `logout()` — all async RPC calls

### 3. **EquipmentContext** — Machine Operations
- Machine status: available, running, finished, maintenance
- Cycle timers, time remaining
- Real-time subscriptions via Supabase Realtime on `machines` table
- Methods: `updateMachineStatus()`, `toggleMaintenance()`

### 4. **SalesContext** — Sales & Shifts
- Sales list, current shift, shifts history
- Variable: utilityEstimates (per-cycle costs)
- **Migrated to Supabase tables:** `sales`, `shifts`, `services`
- Methods: `createSale()`, `updateShift()`, `fetchShifts()` — all async

### 5. **OrderContext** — Order Management
- Orders list, customer overrides
- **Migrated to Supabase tables:** `orders`, `customer_overrides`
- Methods: `createOrder()`, `updateOrderStatus()`, `addOrderPayment()` — all async
- Status flow: RECEIVED → IN_PROGRESS → READY → COMPLETED

### 6. **InventoryContext** — Stock Management
- Inventory items list
- **Migrated to Supabase table:** `inventory`
- Methods: `addInventoryItem()`, `updateStock()` — all async

### 7. **ExpenseContext** — Expense Tracking
- Expenses list, total expenses
- **Migrated to Supabase table:** `expenses`
- Methods: `addExpense()` — async with optimistic UI

### 8. **StorageContext** — Centralized Supabase Access
- Wrapper around all contexts
- Branch/branch selection logic
- Methods: `executeOrder()`, `syncAllData()`
- On mount: fetches all data from Supabase for the selected branch

---

## Supabase Data Schema (v2.0.0)

### Tables (12 total)

| Table | Purpose | Key Fields | Migrated? |
|-------|---------|-----------|-----------|
| `branches` | Branch locations | id, name, address, cost_per_cycle (water/elec/gas) | ✓ Pre-existing |
| `machines` | Laundry equipment | id, branch_id, name, type (lavadora/secadora), status, time_left | ✓ Pre-existing |
| `system_config` | App config | key (schema_version), value (jsonb) | ✓ 2.0.0 |
| `staff` | Users (PINs hashed) | id, name, role (admin/host), pin_hash (MD5), branch_id | ✓ New |
| `services` | Service catalog | id, name, category, price, metadata | ✓ New |
| `shifts` | Work shifts | id, branch_id, start_time, ended_at, total_sales, status | ✓ New |
| `sales` | Transaction records | id, branch_id, shift_id, type, amount, machine_id, date | ✓ New |
| `orders` | Service orders | id, branch_id, customer_name, customer_phone, items, status, status_history | ✓ New |
| `customer_overrides` | Customer profiles | phone (pk), registration_branch_id, data (jsonb) | ✓ New |
| `inventory` | Stock items | id, branch_id, name, category, stock, price | ✓ New |
| `expenses` | Cost tracking | id, branch_id, amount, description, category, timestamp | ✓ New |
| `activity_logs` | Audit trail | id (bigserial), action, details, user_name, branch_id, timestamp | ✓ New |

### RPC Functions (SECURITY DEFINER)

1. **`verify_pin(p_pin, p_branch_id)`**  
   Verifies PIN against hashed staff entry. Returns: `(id, name, role, branch_id)` or empty.  
   Hash algo: `MD5(pin || staff_id)` — deterministic salt.

2. **`upsert_staff(p_id, p_name, p_role, p_pin, p_branch_id)`**  
   Create/update staff. PIN null on update = keep existing. Returns created/updated staff row (no pin_hash).

3. **`list_staff()`**  
   Returns all staff without pin_hash for admin UI.

4. **`delete_staff(p_id)`**  
   Soft/hard delete staff member.

### RLS Policies

- **Operational tables** (branches, machines, services, shifts, sales, orders, inventory, expenses, activity_logs):  
  Anon/authenticated can read/write/delete (trust model: shared device/kiosk).

- **staff table**: No RLS policies. Access only via RPC functions (anon/authenticated can EXECUTE RPCs).

- **system_config**: Select-only (anon can read, but no INSERT/UPDATE via direct access).

### Real-time Subscriptions

Enabled on: `branches`, `machines`, `orders`  
Used in: EquipmentContext (watch machine status), OrderContext (watch order updates)

---

## Authentication Model

**Not using Supabase Auth sessions.** Instead:

1. User enters PIN (4 digits expected in current schema: "1234")
2. Frontend calls RPC `verify_pin(pin, branchId)`
3. RPC hashes client PIN with staff ID, compares to `staff.pin_hash`
4. RPC returns staff record (or nothing)
5. Frontend sets `user = { id, name, role, branchId }` in AuthContext

PIN never transmitted plaintext to Supabase (hashed client-side before comparison). Staff table is never directly queried by client.

**Default seeded admin:** ID `admin_master`, name "Admin Principal", PIN `1234` (must change after first login).

---

## Key Design Decisions

### 1. MD5 Hashing for PINs
- Not cryptographically strong, but sufficient for 4-digit PINs as a deterrent
- Deterministic salt: `staff.id` appended to PIN before hashing
- **Why:** pgcrypto functions (gen_salt, digest) unavailable in Supabase environment

### 2. No Supabase Auth
- Pragmatic choice for a shared-device kiosk app
- Future migration to Supabase Auth would enable per-user row-level security
- Current RLS is all-or-nothing: anon can write to any branch's data (acceptable for internal use)

### 3. RPC Security Definer
- Staff table locked behind RPC functions
- RPCs run with elevated privileges, never expose pin_hash to client
- Anon/authenticated users granted EXECUTE permission only (not SELECT on table)

### 4. Real-time on Select Tables
- Branches, machines, orders: enable live updates across connected clients
- Other tables (sales, shifts, inventory, expenses): fetch-on-demand or periodic sync

### 5. Optimistic UI Updates
- Expenses, orders: update local state immediately, sync async with Supabase
- Prevents UI lag on slow connections

---

## Styling & Design System

### Tailwind Config
- v4.1.18 (latest PostCSS-based)
- Custom colors: `washouse-blue` (#0090D7), `washouse-navy`, `washouse-subtle`
- Font: Outfit (sans-serif, rounded)
- Rounded pill/card styling (2xl, 3xl borders)

### Component Patterns
- **Button.jsx**: CVA-based, variants (primary, outline, ghost, etc.), sizes (sm, md, lg)
- **Modal.jsx**: Framer Motion animations, backdrop blur
- **KpiCard.jsx**: Stats display with trend arrows, glowing accents
- **MachineCard.jsx**: Status-specific gradients, animated icons, progress bars
- **StatusBadge.jsx**: Color-coded status pills

### Color Palette
- Primary: Blue (#0090D7)
- Status: Green (available), Orange (finished), Slate (maintenance)
- Neutrals: Gray scale for UI chrome, white for cards
- Dark mode: Supported via Tailwind dark: prefix

### Typography
- H1–H4: font-outfit, font-black, tracking-tighter
- Body: text-sm/xs, font-bold/black uppercase tracking-widest
- No serif fonts (clean, modern look)

---

## Routing

**React Router v7.13.0** (App.jsx)

```
/                      → Host Dashboard (HostLayout)
/services              → Service Reception (HostLayout)
/admin/login           → Admin Login (no layout)
/admin                 → Admin Dashboard (AdminLayout)
/admin/staff           → Staff Management
/admin/clients         → Clients Directory
/admin/reports         → Financial Reports & BI
/admin/settings        → Branch & System Config
/admin/inventory       → Inventory Management
```

Protected routes: ProtectedRoute component checks AuthContext user/role before allowing access.

---

## Performance Considerations

### Code Splitting
- Vite handles dynamic imports (NewOrderWizard, PrintServiceTicket dynamic import)

### Lazy Loading
- React.lazy for admin pages (potential, not yet implemented)

### Realtime Overhead
- Subscriptions auto-cleanup on context unmount
- Only 3 tables subscribed (branches, machines, orders) to reduce noise

### Caching
- `CURRENT_SYSTEM_VERSION = '2.0.0'` used as cache-busting key in localStorage
- App checks version on mount; if changed, clears old cache

---

## Migration History

### Phase 1: Initial Build (pre-2.0.0)
- Only branches + machines in Supabase
- Everything else (staff, sales, orders, etc.) in localStorage

### Phase 2: Full Supabase Migration (2.0.0, 2026-07-28)
- Created `20260728_full_schema.sql` with all 12 tables + RLS + RPC
- Migrated all 6 local-only contexts to Supabase:
  - AuthContext: verify_pin RPC
  - SalesContext: sales, shifts, services tables
  - OrderContext: orders, customer_overrides tables
  - InventoryContext: inventory table
  - ExpenseContext: expenses table
  - AppContext: activity_logs sync
- Removed localStorage dependency (except cache-busting)
- `.env` untracked, `.env.example` created
- **Status:** Complete, ready for new Supabase project deployment

---

## Current Issues & TODOs

### Resolved (v2.0.0)
- ✓ PI division by zero in Reports → fixed with `totalIncome > 0` check
- ✓ False "low demand" alerts → gated on `totalCycles > 0`
- ✓ Mobile grid collapse → 2 columns on small screens
- ✓ Empty chart states → placeholder views added

### In Progress
- Rotate exposed anon key in old Supabase project (manual step at dashboard)

### Potential Enhancements (Out of Scope)
- Supabase Auth migration (per-user RLS)
- Code splitting for admin pages
- Offline-first caching (service worker)
- Push notifications (Realtime subscriptions already in place)

---

## Developer Setup

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd Lavanderias
   npm install
   ```

2. **Create `.env`** (from `.env.example`)
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key-from-dashboard>
   ```

3. **Run Migration** (one-time, on new Supabase project)
   - Copy `supabase/migrations/20260728_full_schema.sql`
   - Paste into Supabase dashboard → SQL Editor → Run

4. **Dev Server**
   ```bash
   npm run dev
   # Opens http://localhost:5174
   ```

5. **Build for Production**
   ```bash
   npm run build
   # Output: dist/
   ```

6. **Deploy** (e.g., Vercel, Netlify)
   - Add `.env` vars to platform (never commit `.env`)
   - Point to new Supabase project URL/key

---

## Conventions

### File Naming
- Components: PascalCase (Button.jsx, MachineCard.jsx)
- Pages: PascalCase (AdminDashboard.jsx)
- Hooks: camelCase, prefix `use` (useMetrics.js)
- Utils: camelCase (formatCurrency.js)

### Code Style
- ESLint config: `@eslint/js` + React plugin
- No semicolons (Vite default)
- Prefer const, arrow functions
- Comments only for non-obvious logic

### State Management
- One Context per domain (Auth, Sales, Equipment, etc.)
- Context reducer logic lives in context file
- StorageContext wraps Supabase client

### Component Props
- Prefer destructuring
- Use `...props` for pass-through styling (className, style)
- No implicit prop drilling (use Context for global state)

### Styling
- Tailwind utility classes (no CSS-in-JS)
- CVA for component variants
- Responsive: sm:, md:, lg:, xl: prefixes
- Dark mode: dark: prefix (not currently tested, but available)

---

## Resources for New Developers

- **Vite Docs:** https://vite.dev
- **React 19:** https://react.dev
- **Tailwind v4:** https://tailwindcss.com (new PostCSS engine)
- **Supabase:** https://supabase.com/docs
- **Framer Motion:** https://www.framer.com/motion/
- **Recharts:** https://recharts.org
- **Lucide Icons:** https://lucide.dev
