-- ============================================================
-- ALTA DE SUCURSAL: VISTA HERMOSA
-- Fecha: 2026-09-25
--
-- Corre este archivo completo en Supabase → SQL Editor.
-- Es idempotente: se puede volver a correr sin duplicar nada.
--
-- El id 'vista_hermosa' debe coincidir exactamente con la llave
-- registrada en src/data/licenses.js, o la app muestra la
-- pantalla de bloqueo de sucursal.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Sucursal
--    Ajusta la dirección y los costos por ciclo a los reales.
--    Los costos alimentan el margen operativo en Reportes.
-- ------------------------------------------------------------
insert into branches (id, name, address, water_cost_per_cycle, electricity_cost_per_cycle, gas_cost_per_cycle)
values (
  'vista_hermosa',
  'Washouse Vista Hermosa',
  '4a. Avenida 105-1er. Sector, Col. Cumbres, 64610 Monterrey, N.L.',
  15,
  20,
  30
)
on conflict (id) do update
  set name = excluded.name,
      address = excluded.address;

-- ------------------------------------------------------------
-- 2. Equipos: 6 lavadoras (W1-W6) + 6 secadoras (D7-D12)
--
--    El orden importa: el sistema empareja la N-ésima lavadora
--    con la N-ésima secadora para arrancar el secado
--    automáticamente (W1→D7, W2→D8, ... W6→D12).
-- ------------------------------------------------------------
insert into machines (id, branch_id, name, type, status, time_left)
values
  ('vh_w1',  'vista_hermosa', 'W1',  'lavadora', 'available', 0),
  ('vh_w2',  'vista_hermosa', 'W2',  'lavadora', 'available', 0),
  ('vh_w3',  'vista_hermosa', 'W3',  'lavadora', 'available', 0),
  ('vh_w4',  'vista_hermosa', 'W4',  'lavadora', 'available', 0),
  ('vh_w5',  'vista_hermosa', 'W5',  'lavadora', 'available', 0),
  ('vh_w6',  'vista_hermosa', 'W6',  'lavadora', 'available', 0),
  ('vh_d7',  'vista_hermosa', 'D7',  'secadora', 'available', 0),
  ('vh_d8',  'vista_hermosa', 'D8',  'secadora', 'available', 0),
  ('vh_d9',  'vista_hermosa', 'D9',  'secadora', 'available', 0),
  ('vh_d10', 'vista_hermosa', 'D10', 'secadora', 'available', 0),
  ('vh_d11', 'vista_hermosa', 'D11', 'secadora', 'available', 0),
  ('vh_d12', 'vista_hermosa', 'D12', 'secadora', 'available', 0)
on conflict (id) do update
  set branch_id = excluded.branch_id,
      name      = excluded.name,
      type      = excluded.type;

-- ------------------------------------------------------------
-- 3. Inventario inicial de la sucursal
--
--    Ajusta el campo stock al conteo físico del día de apertura.
--
--    OJO: inventory.id es llave primaria global, así que los ids
--    llevan el sufijo de la sucursal. Por eso el descuento
--    automático de existencias no aplica aquí (ver nota al final);
--    estas filas se ajustan a mano desde Inventario.
-- ------------------------------------------------------------
insert into inventory (id, branch_id, name, category, stock, price)
values
  ('detergent_powder__vista_hermosa', 'vista_hermosa', 'Detergente polvo',   'products',  50, 10),
  ('detergent_liquid__vista_hermosa', 'vista_hermosa', 'Detergente líquido', 'products',  30, 18),
  ('softener__vista_hermosa',         'vista_hermosa', 'Suavizante',         'products', 100, 12),
  ('bleach__vista_hermosa',           'vista_hermosa', 'Cloro',              'products',  60, 10),
  ('pino__vista_hermosa',             'vista_hermosa', 'Pino',               'products',  45, 10),
  ('wipe__vista_hermosa',             'vista_hermosa', 'Toallita',           'products', 100, 10),
  ('starch__vista_hermosa',           'vista_hermosa', 'Almidón',            'products',  20, 12),
  ('hanger__vista_hermosa',           'vista_hermosa', 'Gancho',             'products', 200,  8),
  ('bag__vista_hermosa',              'vista_hermosa', 'Bolsa',              'products', 300, 10),
  ('stain_remover__vista_hermosa',    'vista_hermosa', 'Quitamanchas',       'products',  20, 18)
on conflict (id) do update
  set name  = excluded.name,
      price = excluded.price;

-- ------------------------------------------------------------
-- 4. Personal de la sucursal
--
--    Los PINs se guardan hasheados, así que el alta va por RPC,
--    nunca con un insert directo a staff.
--    Descomenta y cambia nombre y PIN por los reales.
-- ------------------------------------------------------------
-- select upsert_staff('vh_host_1', 'NOMBRE DE QUIEN ATIENDE', 'host', '4821', 'vista_hermosa');

-- ------------------------------------------------------------
-- 5. Verificación
-- ------------------------------------------------------------
select
  (select count(*) from machines  where branch_id = 'vista_hermosa') as equipos,       -- espera 12
  (select count(*) from inventory where branch_id = 'vista_hermosa') as insumos,       -- espera 10
  (select count(*) from staff     where branch_id = 'vista_hermosa') as personal;      -- espera 1+

-- ============================================================
-- PENDIENTE CONOCIDO
--
-- El descuento automático de insumos compara el id del renglón
-- de la orden contra los ids del catálogo en src/data/catalog.js
-- (InventoryContext.updateInventoryStock + StorageContext.executeOrder).
-- Como inventory.id es una llave primaria global, ninguna sucursal
-- salvo la primera puede usar los ids planos del catálogo, así que
-- las existencias de Vista Hermosa NO se descuentan solas al vender.
-- Se ajustan a mano desde Inventario hasta que el descuento se
-- corrija para buscar por (branch_id, catálogo).
-- ============================================================
