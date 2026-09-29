-- Detalle del corte de caja. Antes solo se guardaban fondo inicial y total
-- vendido; el efectivo contado, el esperado, la diferencia y el desglose por
-- método se perdían al cerrar el turno.
alter table shifts
  add column if not exists cash_sales     numeric default 0,
  add column if not exists card_sales     numeric default 0,
  add column if not exists transfer_sales numeric default 0,
  add column if not exists total_expenses numeric default 0,
  add column if not exists expected_cash  numeric,
  add column if not exists counted_cash   numeric,
  add column if not exists difference     numeric;
