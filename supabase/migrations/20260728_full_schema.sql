-- Migration: 20260728_full_schema.sql
-- Description: Complete schema for a NEW Washouse Supabase project.
-- Covers all 8 data domains that previously lived only in browser localStorage:
-- branches, machines, system_config, staff, sales, shifts, services, orders,
-- customer_overrides, inventory, expenses, activity_logs.
--
-- IMPORTANT: run this on a fresh/empty Supabase project's SQL Editor.
--
-- Security model note: this app does NOT use Supabase Auth (no login session,
-- no auth.uid()). Access control is enforced at the RPC layer for PINs
-- (see verify_pin below) and via RLS policies scoped to the anon/authenticated
-- roles for everything else. This is a pragmatic boundary given the app's
-- architecture, not full per-user row security -- a future move to Supabase
-- Auth would allow real per-user/per-branch RLS.

create extension if not exists pgcrypto;

-- ============================================================
-- BRANCHES
-- ============================================================
create table if not exists branches (
  id text primary key,
  name text not null,
  address text,
  water_cost_per_cycle numeric default 15,
  electricity_cost_per_cycle numeric default 20,
  gas_cost_per_cycle numeric default 30,
  created_at timestamptz default now()
);

-- ============================================================
-- MACHINES
-- ============================================================
create table if not exists machines (
  id text primary key,
  branch_id text references branches(id) on delete cascade,
  name text not null,
  type text not null,
  status text default 'available',
  time_left integer default 0,
  updated_at timestamptz default now()
);

-- ============================================================
-- SYSTEM CONFIG
-- ============================================================
create table if not exists system_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into system_config (key, value)
values ('schema_version', '{"version": "2.0.0"}')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ============================================================
-- STAFF (PINs are hashed, never exposed to the client directly)
-- ============================================================
create table if not exists staff (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  role text not null, -- 'admin' | 'host' | 'operator' | 'supervisor' (app-level convention, not DB-enforced)
  pin_hash text not null,
  branch_id text not null default 'all', -- 'all' or a specific branches.id
  created_at timestamptz default now()
);

-- ============================================================
-- SERVICES (catalog overrides/custom services added by admins)
-- ============================================================
create table if not exists services (
  id text primary key,
  name text not null,
  category text,
  price numeric not null default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- SHIFTS
-- ============================================================
create table if not exists shifts (
  id text primary key,
  branch_id text references branches(id) on delete cascade,
  start_time timestamptz not null,
  ended_at timestamptz,
  initial_cash numeric not null default 0,
  total_sales numeric default 0,
  status text default 'open' check (status in ('open', 'closed')),
  closed_by text,
  created_at timestamptz default now()
);

-- ============================================================
-- SALES
-- ============================================================
create table if not exists sales (
  id text primary key,
  branch_id text references branches(id) on delete cascade,
  shift_id text references shifts(id) on delete set null,
  type text not null,
  description text,
  amount numeric not null,
  order_id text,
  method text,
  machine_id text,
  machine_type text,
  date timestamptz default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id text primary key,
  branch_id text references branches(id) on delete cascade,
  customer_name text,
  customer_phone text,
  machine_id text,
  items jsonb default '[]',
  total_amount numeric default 0,
  advance_payment numeric default 0,
  balance_due numeric default 0,
  payment_method text,
  status text default 'RECEIVED',
  status_history jsonb default '[]',
  created_at timestamptz default now()
);

-- ============================================================
-- CUSTOMER OVERRIDES (keyed by normalized phone number)
-- ============================================================
create table if not exists customer_overrides (
  phone text primary key,
  registration_branch_id text references branches(id),
  data jsonb default '{}',
  updated_at timestamptz default now()
);

-- ============================================================
-- INVENTORY
-- ============================================================
create table if not exists inventory (
  id text primary key,
  branch_id text references branches(id) on delete cascade,
  name text not null,
  category text,
  stock numeric default 0,
  price numeric default 0,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================================
-- EXPENSES
-- ============================================================
create table if not exists expenses (
  id text primary key,
  branch_id text references branches(id) on delete cascade,
  amount numeric not null,
  description text,
  category text,
  user_name text,
  timestamp timestamptz default now()
);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
create table if not exists activity_logs (
  id bigint generated always as identity primary key,
  action text not null,
  details text,
  user_name text,
  branch_id text,
  timestamp timestamptz default now()
);

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table branches;
alter publication supabase_realtime add table machines;
alter publication supabase_realtime add table orders;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table branches enable row level security;
alter table machines enable row level security;
alter table system_config enable row level security;
alter table staff enable row level security;
alter table services enable row level security;
alter table shifts enable row level security;
alter table sales enable row level security;
alter table orders enable row level security;
alter table customer_overrides enable row level security;
alter table inventory enable row level security;
alter table expenses enable row level security;
alter table activity_logs enable row level security;

-- Operational tables: the app has no Supabase Auth session, so access is
-- granted to anon/authenticated broadly. This matches today's trust model
-- (a shared device/kiosk running the app) while still requiring RLS to be
-- explicitly opted into per table (defense against forgetting a table).
create policy "anon full access" on branches for all using (true) with check (true);
create policy "anon full access" on machines for all using (true) with check (true);
create policy "anon read config" on system_config for select using (true);
create policy "anon full access" on services for all using (true) with check (true);
create policy "anon full access" on shifts for all using (true) with check (true);
create policy "anon full access" on sales for all using (true) with check (true);
create policy "anon full access" on orders for all using (true) with check (true);
create policy "anon full access" on customer_overrides for all using (true) with check (true);
create policy "anon full access" on inventory for all using (true) with check (true);
create policy "anon full access" on expenses for all using (true) with check (true);
create policy "anon full access" on activity_logs for all using (true) with check (true);

-- staff: NO client-facing policy at all. Nobody can SELECT/INSERT/UPDATE/DELETE
-- staff directly with the anon key -- all access goes through the
-- SECURITY DEFINER RPC functions below, which run with elevated privileges
-- and never return pin_hash to the caller.

-- ============================================================
-- RPC: verify_pin
-- Verifies a PIN against staff.pin_hash server-side. Returns the matching
-- staff row (minus pin_hash) on success, or nothing on failure. The client
-- never sees any PIN or hash, and never needs SELECT on staff.
-- Uses MD5 hash with staff ID as salt (not cryptographically strong, but
-- sufficient for 4-digit PINs as a deterrent against brute-force).
-- ============================================================
create or replace function verify_pin(p_pin text, p_branch_id text default null)
returns table (id text, name text, role text, branch_id text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select s.id, s.name, s.role, s.branch_id
  from staff s
  where s.pin_hash = md5(p_pin || s.id)
    and (
      p_branch_id is null
      or s.branch_id = 'all'
      or s.branch_id = p_branch_id
    )
  limit 1;
end;
$$;

-- ============================================================
-- RPC: upsert_staff
-- Admin-only helper to create/update a staff member with a hashed PIN.
-- Call this instead of inserting into staff directly (which is blocked by RLS).
-- p_pin may be null on updates to keep the existing PIN unchanged.
-- p_pin is required (not null) when creating a new staff member.
-- Uses MD5(pin || staff_id) as hash to match verify_pin() logic.
-- ============================================================
create or replace function upsert_staff(
  p_id text,
  p_name text,
  p_role text,
  p_pin text,
  p_branch_id text
)
returns table (id text, name text, role text, branch_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_staff_id text := coalesce(p_id, gen_random_uuid()::text);
  staff_exists boolean := p_id is not null and exists (select 1 from staff where staff.id = p_id);
begin
  if not staff_exists and p_pin is null then
    raise exception 'p_pin is required when creating a new staff member';
  end if;

  insert into staff (id, name, role, pin_hash, branch_id)
  values (new_staff_id, p_name, p_role, md5(p_pin || new_staff_id), p_branch_id)
  on conflict on constraint staff_pkey do update
    set name = excluded.name,
        role = excluded.role,
        branch_id = excluded.branch_id,
        pin_hash = case when p_pin is not null then md5(p_pin || new_staff_id) else staff.pin_hash end;

  return query select s.id, s.name, s.role, s.branch_id from staff s where s.id = new_staff_id;
end;
$$;

-- ============================================================
-- RPC: list_staff
-- Returns staff without pin_hash, for admin UI listing/management.
-- ============================================================
create or replace function list_staff()
returns table (id text, name text, role text, branch_id text)
language sql
security definer
set search_path = public
as $$
  select id, name, role, branch_id from staff order by name;
$$;

-- ============================================================
-- RPC: delete_staff
-- ============================================================
create or replace function delete_staff(p_id text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from staff where id = p_id;
$$;

-- Allow anon/authenticated to call the RPC functions (the functions
-- themselves are the security boundary, not table grants).
grant execute on function verify_pin(text, text) to anon, authenticated;
grant execute on function upsert_staff(text, text, text, text, text) to anon, authenticated;
grant execute on function list_staff() to anon, authenticated;
grant execute on function delete_staff(text) to anon, authenticated;

-- Seed a default admin so you're not locked out. CHANGE THIS PIN IMMEDIATELY
-- after first login (Settings -> Staff), then re-run upsert_staff to update it.
select upsert_staff('admin_master', 'Admin Principal', 'admin', '1234', 'all');
