-- Migration: 20260810_add_invoices_table.sql
-- Description: Add invoicing system to Washouse (Mexico, SAT, CFDI)
-- Creates invoices table with auto-sequential numbering, IVA calculation (16%), and CFDI placeholders

create table if not exists invoices (
  id text primary key default gen_random_uuid()::text,
  branch_id text not null references branches(id) on delete cascade,
  order_id text references orders(id) on delete set null,

  -- Numeración (secuencial por sucursal)
  invoice_number text not null,              -- '000001', '000002', etc. (único por sucursal)
  invoice_date timestamptz default now(),

  -- Cliente
  customer_name text not null,
  customer_phone text,
  customer_rfc text,                         -- RFC del cliente (opcional)

  -- Montos
  items jsonb not null default '[]',         -- Array: [{ description, qty, unit_price, total }, ...]
  subtotal numeric not null default 0,       -- Antes de IVA
  iva_amount numeric not null default 0,     -- 16% del subtotal
  total_amount numeric not null default 0,   -- subtotal + iva_amount - discount

  -- Descuentos y pago
  discount_amount numeric default 0,         -- Descuento aplicado al total
  payment_method text,                       -- 'cash', 'card', 'transfer', 'check'

  -- Estado
  status text default 'draft',                -- 'draft' | 'issued' | 'sent_to_sat' | 'cancelled'
  cfdi_uuid text,                             -- UUID de CFDI de SAT (cuando se valide con Facturación.py)

  -- Auditoría
  created_by text,                            -- staff.id o user name que genera
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices para performance
create index if not exists idx_invoices_branch_id on invoices(branch_id);
create index if not exists idx_invoices_order_id on invoices(order_id);
create index if not exists idx_invoices_number on invoices(invoice_number, branch_id);
create index if not exists idx_invoices_status on invoices(status);
create index if not exists idx_invoices_date on invoices(invoice_date);

-- Row Level Security
alter table invoices enable row level security;
create policy "anon full access" on invoices for all using (true) with check (true);

-- RPC: Generate next invoice number for a branch
-- Returns the next sequential number (e.g., '000001', '000002')
create or replace function get_next_invoice_number(p_branch_id text)
returns text
language sql
security definer
set search_path = public
as $$
  select
    lpad(
      (coalesce(max(cast(invoice_number as integer)), 0) + 1)::text,
      6,
      '0'
    )
  from invoices
  where branch_id = p_branch_id and status != 'cancelled';
$$;

-- Grant execute permission
grant execute on function get_next_invoice_number(text) to anon, authenticated;

-- Log this schema change
insert into activity_logs (action, details, timestamp)
values ('schema_update', 'Created invoices table and RPC function get_next_invoice_number', now())
on conflict do nothing;
