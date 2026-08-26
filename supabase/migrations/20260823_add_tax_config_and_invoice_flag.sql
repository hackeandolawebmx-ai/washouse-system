-- Migration: 20260823_add_tax_config_and_invoice_flag.sql
-- Description: Support charging IVA only when the customer requests a CFDI.
--
-- Business model chosen: público en general pays the listed price; a customer
-- who wants a factura pays the listed price + IVA, decided at the counter
-- during checkout. The order records that decision so invoicing later knows
-- whether the collected amount already contains IVA (and must be broken down
-- backwards) or not (and IVA must be added on top).
--
-- tax_config.mode:
--   'added_on_invoice' -> listed prices are pre-IVA; IVA is added when the
--                         customer opts into invoicing at checkout.
--   'included'         -> listed prices already contain IVA; invoices break
--                         the tax out of the total instead of adding to it.
-- Stored in system_config so the model can be switched without a code change.

alter table orders add column if not exists requires_invoice boolean not null default false;

insert into system_config (key, value)
values ('tax_config', '{"mode": "added_on_invoice", "rate": 0.16}'::jsonb)
on conflict (key) do nothing;
