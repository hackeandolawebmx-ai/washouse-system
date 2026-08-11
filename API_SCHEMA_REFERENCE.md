# Washouse — API & Supabase Schema Reference

**Quick lookup for Supabase tables, RPC functions, and REST endpoints.**

---

## Supabase Client Setup

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);
```

**Environment Variables:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key-from-Supabase-dashboard>
```

---

## RPC Functions (Custom PostgreSQL Functions)

All RPC functions run with `SECURITY DEFINER` (elevated privileges). Anon/authenticated users have EXECUTE permission only.

### 1. `verify_pin(p_pin text, p_branch_id text = NULL)`

**Purpose:** Verify staff PIN against hashed entry. Used for login.

**Input:**
- `p_pin`: PIN entered by user (e.g., "1234")
- `p_branch_id` (optional): Branch to restrict lookup (null = any branch)

**Returns:** Single row or empty
```sql
{
  id: text,           -- staff.id
  name: text,         -- staff.name
  role: text,         -- 'admin' | 'host' | 'operator' | 'supervisor'
  branch_id: text     -- staff.branch_id
}
```

**Usage (JavaScript):**
```javascript
const { data, error } = await supabase.rpc('verify_pin', {
  p_pin: '1234',
  p_branch_id: 'branch_001'
});

if (data?.length > 0) {
  // Login successful
  const user = data[0];
  setUser(user);
} else {
  // PIN mismatch
  showError('Invalid PIN');
}
```

**Hash Algorithm:** `MD5(pin || staff_id)`  
Note: Client never sends plaintext PIN to RPC; RPC compares hashes.

---

### 2. `upsert_staff(p_id text, p_name text, p_role text, p_pin text, p_branch_id text)`

**Purpose:** Create new staff or update existing. PIN cannot be exposed to client.

**Input:**
- `p_id`: Staff ID (null = generate new UUID, update = provide existing ID)
- `p_name`: Full name
- `p_role`: Role string ('admin', 'host', 'operator', 'supervisor')
- `p_pin`: New PIN (required for CREATE, null for UPDATE = keep existing)
- `p_branch_id`: Branch assignment ('all' = all branches, or specific branch ID)

**Returns:** Updated/created staff row (no pin_hash)
```sql
{
  id: text,
  name: text,
  role: text,
  branch_id: text
}
```

**Usage (JavaScript):**
```javascript
// Create new staff
const { data: newStaff, error } = await supabase.rpc('upsert_staff', {
  p_id: null,                    // Will auto-generate UUID
  p_name: 'Juan García',
  p_role: 'host',
  p_pin: '5678',                 // Required for create
  p_branch_id: 'branch_001'
});

// Update existing staff (keep PIN)
const { data: updated, error } = await supabase.rpc('upsert_staff', {
  p_id: 'staff_uuid_here',
  p_name: 'Juan García',
  p_role: 'host',
  p_pin: null,                   // null = don't change PIN
  p_branch_id: 'branch_001'
});

// Update staff PIN only
const { data: updated, error } = await supabase.rpc('upsert_staff', {
  p_id: 'staff_uuid_here',
  p_name: 'Juan García',         // Must provide, even if unchanged
  p_role: 'host',
  p_pin: '9999',                 // New PIN
  p_branch_id: 'branch_001'
});
```

---

### 3. `list_staff()`

**Purpose:** Fetch all staff for admin listing. No parameters.

**Returns:** Array of staff (no pin_hash)
```sql
[
  { id, name, role, branch_id },
  ...
]
```

**Usage (JavaScript):**
```javascript
const { data: staffList, error } = await supabase.rpc('list_staff');
// staffList = [ { id: '...', name: 'Admin Principal', role: 'admin', branch_id: 'all' }, ... ]
```

---

### 4. `delete_staff(p_id text)`

**Purpose:** Delete a staff member.

**Input:**
- `p_id`: Staff ID to delete

**Returns:** void

**Usage (JavaScript):**
```javascript
const { error } = await supabase.rpc('delete_staff', {
  p_id: 'staff_uuid_here'
});
```

---

## Tables (Direct Query)

### `branches`
**Columns:**
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
address TEXT
water_cost_per_cycle NUMERIC DEFAULT 15
electricity_cost_per_cycle NUMERIC DEFAULT 20
gas_cost_per_cycle NUMERIC DEFAULT 30
created_at TIMESTAMPTZ DEFAULT now()
```

**RLS:** Anon/authenticated can SELECT, INSERT, UPDATE, DELETE.

**Usage (JavaScript):**
```javascript
// Read all branches
const { data, error } = await supabase
  .from('branches')
  .select('*');

// Create branch
const { data, error } = await supabase
  .from('branches')
  .insert({
    id: 'branch_new',
    name: 'Centro Mall',
    water_cost_per_cycle: 12
  });

// Update branch
const { data, error } = await supabase
  .from('branches')
  .update({ water_cost_per_cycle: 18 })
  .eq('id', 'branch_001');

// Delete branch (cascades to machines, sales, orders, etc.)
const { error } = await supabase
  .from('branches')
  .delete()
  .eq('id', 'branch_001');
```

---

### `machines`
**Columns:**
```sql
id TEXT PRIMARY KEY
branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE
name TEXT NOT NULL
type TEXT NOT NULL              -- 'lavadora' | 'secadora'
status TEXT DEFAULT 'available' -- 'available' | 'running' | 'finished' | 'maintenance'
time_left INTEGER DEFAULT 0     -- Minutes remaining (if running)
updated_at TIMESTAMPTZ DEFAULT now()
```

**RLS:** Anon/authenticated can SELECT, INSERT, UPDATE, DELETE.

**Realtime:** Enabled (subscribe to status changes).

**Usage (JavaScript):**
```javascript
// Read machines for a branch
const { data, error } = await supabase
  .from('machines')
  .select('*')
  .eq('branch_id', 'branch_001');

// Update machine status
const { data, error } = await supabase
  .from('machines')
  .update({ status: 'running', time_left: 45 })
  .eq('id', 'machine_001');

// Subscribe to machine updates (real-time)
const subscription = supabase
  .channel('machines')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'machines' }, (payload) => {
    console.log('Machine updated:', payload);
  })
  .subscribe();
```

---

### `sales`
**Columns:**
```sql
id TEXT PRIMARY KEY
branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE
shift_id TEXT REFERENCES shifts(id) ON DELETE SET NULL
type TEXT NOT NULL              -- 'cycle', 'service', etc.
description TEXT
amount NUMERIC NOT NULL
order_id TEXT
method TEXT                     -- 'cash', 'card', etc.
machine_id TEXT
machine_type TEXT              -- 'lavadora' | 'secadora'
date TIMESTAMPTZ DEFAULT now()
```

**RLS:** Anon/authenticated can SELECT, INSERT, UPDATE, DELETE.

**Usage (JavaScript):**
```javascript
// Create sale (record a washing cycle)
const { data, error } = await supabase
  .from('sales')
  .insert({
    branch_id: 'branch_001',
    shift_id: 'shift_xyz',
    type: 'cycle',
    amount: 50,
    machine_id: 'machine_001',
    machine_type: 'lavadora'
  });

// Query sales by branch & date range
const { data, error } = await supabase
  .from('sales')
  .select('*')
  .eq('branch_id', 'branch_001')
  .gte('date', '2026-08-01')
  .lte('date', '2026-08-31');
```

---

### `orders`
**Columns:**
```sql
id TEXT PRIMARY KEY
branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE
customer_name TEXT
customer_phone TEXT
machine_id TEXT
items JSONB DEFAULT '[]'
total_amount NUMERIC DEFAULT 0
advance_payment NUMERIC DEFAULT 0
balance_due NUMERIC DEFAULT 0
payment_method TEXT
status TEXT DEFAULT 'RECEIVED'  -- RECEIVED | IN_PROGRESS | READY | COMPLETED | DELIVERED
status_history JSONB DEFAULT '[]'  -- Array of { status, timestamp }
created_at TIMESTAMPTZ DEFAULT now()
```

**RLS:** Anon/authenticated can SELECT, INSERT, UPDATE, DELETE.

**Realtime:** Enabled (subscribe to status changes).

**Usage (JavaScript):**
```javascript
// Create order
const { data, error } = await supabase
  .from('orders')
  .insert({
    branch_id: 'branch_001',
    customer_name: 'María López',
    customer_phone: '555-1234',
    items: [{ service: 'dry-cleaning', qty: 3, price: 10 }],
    total_amount: 30,
    advance_payment: 15,
    balance_due: 15
  });

// Update order status
const { data, error } = await supabase
  .from('orders')
  .update({
    status: 'READY',
    status_history: [
      { status: 'RECEIVED', timestamp: '...' },
      { status: 'IN_PROGRESS', timestamp: '...' },
      { status: 'READY', timestamp: '...' }
    ]
  })
  .eq('id', 'order_001');

// Subscribe to order changes
const subscription = supabase
  .channel('orders')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
    console.log('Order status:', payload.new.status);
  })
  .subscribe();
```

---

### `shifts`
**Columns:**
```sql
id TEXT PRIMARY KEY
branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE
start_time TIMESTAMPTZ NOT NULL
ended_at TIMESTAMPTZ
initial_cash NUMERIC NOT NULL DEFAULT 0
total_sales NUMERIC DEFAULT 0
status TEXT DEFAULT 'open'  -- 'open' | 'closed'
closed_by TEXT
created_at TIMESTAMPTZ DEFAULT now()
```

**RLS:** Anon/authenticated can SELECT, INSERT, UPDATE, DELETE.

**Usage (JavaScript):**
```javascript
// Create new shift
const { data: shift, error } = await supabase
  .from('shifts')
  .insert({
    branch_id: 'branch_001',
    start_time: new Date().toISOString(),
    initial_cash: 1000,
    status: 'open'
  });

// Close shift
const { data, error } = await supabase
  .from('shifts')
  .update({
    status: 'closed',
    ended_at: new Date().toISOString(),
    total_sales: 5000,
    closed_by: 'admin_user'
  })
  .eq('id', 'shift_xyz');
```

---

### `inventory`
**Columns:**
```sql
id TEXT PRIMARY KEY
branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE
name TEXT NOT NULL
category TEXT
stock NUMERIC DEFAULT 0
price NUMERIC DEFAULT 0
metadata JSONB DEFAULT '{}'
created_at TIMESTAMPTZ DEFAULT now()
```

**RLS:** Anon/authenticated can SELECT, INSERT, UPDATE, DELETE.

**Usage (JavaScript):**
```javascript
// Add inventory item
const { data, error } = await supabase
  .from('inventory')
  .insert({
    branch_id: 'branch_001',
    name: 'Laundry Detergent',
    category: 'Supplies',
    stock: 50,
    price: 5.99
  });

// Update stock
const { data, error } = await supabase
  .from('inventory')
  .update({ stock: 45 })
  .eq('id', 'item_001');
```

---

### `expenses`
**Columns:**
```sql
id TEXT PRIMARY KEY
branch_id TEXT REFERENCES branches(id) ON DELETE CASCADE
amount NUMERIC NOT NULL
description TEXT
category TEXT             -- 'maintenance', 'supply', 'utilities', etc.
user_name TEXT
timestamp TIMESTAMPTZ DEFAULT now()
```

**RLS:** Anon/authenticated can SELECT, INSERT, UPDATE, DELETE.

**Usage (JavaScript):**
```javascript
// Add expense
const { data, error } = await supabase
  .from('expenses')
  .insert({
    branch_id: 'branch_001',
    amount: 250,
    description: 'Monthly water bill',
    category: 'utilities',
    user_name: 'Admin Principal'
  });
```

---

### `staff`
**Columns:**
```sql
id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text
name TEXT NOT NULL
role TEXT NOT NULL          -- 'admin' | 'host' | 'operator' | 'supervisor'
pin_hash TEXT NOT NULL      -- MD5(pin || staff_id), never exposed
branch_id TEXT NOT NULL DEFAULT 'all'
created_at TIMESTAMPTZ DEFAULT now()
```

**RLS:** No direct access (locked behind RPC functions).

**Important:** Client cannot directly query or modify `staff` table. Always use RPC functions:
- `verify_pin()` for login
- `upsert_staff()` for create/update
- `list_staff()` for admin listing
- `delete_staff()` for removal

---

### `customer_overrides`
**Columns:**
```sql
phone TEXT PRIMARY KEY
registration_branch_id TEXT REFERENCES branches(id)
data JSONB DEFAULT '{}'     -- Customer profile: name, preferences, payment method
updated_at TIMESTAMPTZ DEFAULT now()
```

**RLS:** Anon/authenticated can SELECT, INSERT, UPDATE, DELETE.

**Usage (JavaScript):**
```javascript
// Store/update customer profile by phone
const { data, error } = await supabase
  .from('customer_overrides')
  .upsert({
    phone: '555-1234',
    registration_branch_id: 'branch_001',
    data: { name: 'María López', preferred_payment: 'card' }
  }, { onConflict: 'phone' });

// Retrieve customer profile
const { data, error } = await supabase
  .from('customer_overrides')
  .select('*')
  .eq('phone', '555-1234');
```

---

### `services`
**Columns:**
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
category TEXT
price NUMERIC NOT NULL DEFAULT 0
metadata JSONB DEFAULT '{}'
created_at TIMESTAMPTZ DEFAULT now()
```

**RLS:** Anon/authenticated can SELECT, INSERT, UPDATE, DELETE.

**Usage (JavaScript):**
```javascript
// Add service to catalog
const { data, error } = await supabase
  .from('services')
  .insert({
    id: 'service_dry_clean',
    name: 'Dry Cleaning',
    category: 'laundry',
    price: 8.99,
    metadata: { duration: '24h', color_safe: true }
  });
```

---

### `activity_logs`
**Columns:**
```sql
id BIGSERIAL PRIMARY KEY
action TEXT NOT NULL        -- 'login', 'shift_open', 'sale', 'order_created', etc.
details TEXT
user_name TEXT
branch_id TEXT
timestamp TIMESTAMPTZ DEFAULT now()
```

**RLS:** Anon/authenticated can SELECT, INSERT, UPDATE, DELETE.

**Usage (JavaScript):**
```javascript
// Log activity
const { error } = await supabase
  .from('activity_logs')
  .insert({
    action: 'shift_open',
    details: `Shift opened by ${user.name}`,
    user_name: user.name,
    branch_id: 'branch_001'
  });

// Query logs
const { data, error } = await supabase
  .from('activity_logs')
  .select('*')
  .eq('branch_id', 'branch_001')
  .gte('timestamp', '2026-08-01')
  .order('timestamp', { ascending: false });
```

---

### `system_config`
**Columns:**
```sql
key TEXT PRIMARY KEY
value JSONB NOT NULL
updated_at TIMESTAMPTZ DEFAULT now()
```

**RLS:** Anon can SELECT only.

**Current Value:**
```json
{ "key": "schema_version", "value": { "version": "2.0.0" } }
```

**Usage (JavaScript):**
```javascript
// Read config
const { data, error } = await supabase
  .from('system_config')
  .select('*')
  .eq('key', 'schema_version');
// Returns: { key: 'schema_version', value: { version: '2.0.0' }, updated_at: '...' }
```

---

## Context Integration Examples

### AuthContext Usage
```javascript
import { useAuth } from '../context/AuthContext';

const { user, isShiftOpen, loginAdmin, loginHost, logout } = useAuth();

// Login (calls verify_pin RPC)
const handleLogin = async (pin) => {
  await loginAdmin(pin, selectedBranch);
};

// Check user
if (user?.role === 'admin') {
  // Show admin panel
}

// Logout
const handleLogout = () => logout();
```

### SalesContext Usage
```javascript
import { useSales } from '../context/SalesContext';

const { sales, shifts, createSale, closeShift } = useSales();

// Create sale (async, updates Supabase)
const handleSale = async () => {
  await createSale({
    type: 'cycle',
    amount: 50,
    machine_id: 'machine_001'
  });
};
```

### EquipmentContext Usage
```javascript
import { useEquipment } from '../context/EquipmentContext';

const { machines, updateMachineStatus } = useEquipment();

// Update machine (real-time subscription active)
const handleStartCycle = async (machineId) => {
  await updateMachineStatus(machineId, {
    status: 'running',
    time_left: 45
  });
};
```

---

## Error Handling Patterns

### Check RPC Errors
```javascript
const { data, error } = await supabase.rpc('verify_pin', { p_pin: '1234' });

if (error) {
  console.error('RPC Error:', error.message);
  // Handle: permissions, timeout, etc.
}

if (!data || data.length === 0) {
  // PIN mismatch (not an error, just empty result)
  showError('Invalid PIN');
}
```

### Check Table Query Errors
```javascript
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('branch_id', branchId);

if (error) {
  // RLS violation, network, etc.
  console.error('Query Error:', error.message);
}

// Use data (empty array if no rows)
orders.forEach(order => { ... });
```

---

## Performance Notes

- **Real-time Subscriptions:** Only on branches, machines, orders (others fetch-on-demand)
- **Batch Operations:** Use `insert([{}, {}])` for multiple rows
- **Filtering:** Push filters to Supabase (`.eq()`, `.gte()`, etc.) rather than client-side
- **Indexes:** Branch_id indexed on all tables for fast branch-scoped queries
- **Connection Pooling:** Supabase manages automatically

---

## Security Model Summary

| Access | Table | Method |
|--------|-------|--------|
| ✓ Anon read/write | branches, machines, services, shifts, sales, orders, inventory, expenses, activity_logs, customer_overrides, system_config (select only) | Direct query |
| ✗ Anon direct access | staff | RPC only |
| ✓ Anon execute | verify_pin, upsert_staff, list_staff, delete_staff | RPC |
| ✓ Real-time | branches, machines, orders | Subscription |

**Philosophy:** Shared-device kiosk model. Full table access via Supabase is acceptable; future per-user RLS via Supabase Auth would restrict by user.

---

## Migration Script (One-Time Setup)

Copy & paste `supabase/migrations/20260728_full_schema.sql` into Supabase SQL Editor:

```
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Paste the entire migration SQL
4. Click "Run"
5. Verify all 12 tables created, RLS enabled, RPC functions available
6. Seed admin: upsert_staff('admin_master', 'Admin Principal', 'admin', '1234', 'all')
```

Done. Database is ready.

---

## Quick Reference: Common Queries

### Get all machines for a branch
```javascript
const { data } = await supabase
  .from('machines')
  .select('*')
  .eq('branch_id', branchId);
```

### Get sales this month
```javascript
const start = new Date(2026, 7, 1).toISOString();
const end = new Date(2026, 7, 31).toISOString();
const { data } = await supabase
  .from('sales')
  .select('*')
  .gte('date', start)
  .lte('date', end);
```

### Get staff (admin only)
```javascript
const { data } = await supabase.rpc('list_staff');
```

### Verify login
```javascript
const { data } = await supabase.rpc('verify_pin', {
  p_pin: pin,
  p_branch_id: branchId
});
```

### Create order
```javascript
const { data } = await supabase
  .from('orders')
  .insert({ branch_id: branchId, customer_name: '...', ... })
  .select();
```

### Update order status
```javascript
const { data } = await supabase
  .from('orders')
  .update({ status: 'READY' })
  .eq('id', orderId);
```

### Subscribe to order changes
```javascript
supabase
  .channel('orders')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
    console.log('Order updated:', payload.new);
  })
  .subscribe();
```
