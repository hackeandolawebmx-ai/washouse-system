-- Migration: 20260822_add_invoice_requests_table.sql
-- Description: Self-service invoice requests submitted by customers from a
-- public (unauthenticated) page, linked to their order ticket. Staff review
-- and issue the real CFDI invoice from the admin panel.

create table if not exists invoice_requests (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references orders(id) on delete cascade,
  branch_id text references branches(id) on delete set null,

  customer_rfc text not null,
  customer_razon_social text not null,
  customer_email text,

  status text not null default 'pending',              -- 'pending' | 'processed' | 'rejected'
  invoice_id text references invoices(id) on delete set null,

  created_at timestamptz default now(),
  processed_at timestamptz
);

create index if not exists idx_invoice_requests_order_id on invoice_requests(order_id);
create index if not exists idx_invoice_requests_status on invoice_requests(status);

alter table invoice_requests enable row level security;
drop policy if exists "anon full access" on invoice_requests;
create policy "anon full access" on invoice_requests for all using (true) with check (true);
