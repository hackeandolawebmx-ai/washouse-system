-- ============================================================
-- AJUSTES POSTERIORES AL ALTA DE VISTA HERMOSA
-- Fecha: 2026-09-25
--
-- Corre este archivo DESPUÉS de 20260925_add_vista_hermosa_branch.sql.
-- Tres bloques, en orden:
--
--   BLOQUE 1  Ajustes de Vista Hermosa .... dirección y personal
--   BLOQUE 2  Diagnóstico de sucursales ... informativo, no cambia nada
--   BLOQUE 3  Dejar solo la instalada ..... borra semillero y guadalupe
--
-- Se puede correr completo de un jalón.
-- ============================================================


-- ============================================================
-- BLOQUE 1 — Ajustes de Vista Hermosa
-- Edita los valores y corre este bloque solo.
-- ============================================================

-- 1.a  Dirección y costos por ciclo.
--      Los costos alimentan el margen operativo en Reportes:
--      es lo que te cuesta a ti cada ciclo de agua, luz y gas.
update branches
set
  address                     = '4a. Avenida 105-1er. Sector, Col. Cumbres, 64610 Monterrey, N.L.',
  water_cost_per_cycle        = 15,
  electricity_cost_per_cycle  = 20,
  gas_cost_per_cycle          = 30
where id = 'vista_hermosa';

-- 1.b  Personal de la sucursal.
--      El PIN son 4 dígitos y es con el que Angie abre turno.
--      Nunca insertes en staff directamente: el PIN se guarda
--      hasheado y solo esta función lo hace bien.
--
--      Para cambiar el PIN después, vuelve a correr esta misma
--      llamada con el nuevo, o hazlo desde Admin → Personal.
select upsert_staff(
  'vh_host_1',      -- id interno, no lo cambies
  'Angie',
  'host',
  '0000',
  'vista_hermosa'
);

-- 1.c  Verificación del bloque 1
select
  (select address from branches where id = 'vista_hermosa')            as direccion,
  (select count(*) from machines  where branch_id = 'vista_hermosa')   as equipos,    -- 12
  (select count(*) from inventory where branch_id = 'vista_hermosa')   as insumos,    -- 10
  (select count(*) from staff     where branch_id = 'vista_hermosa')   as personal;   -- 1+


-- ============================================================
-- BLOQUE 2 — ¿Qué hay realmente en las otras sucursales?
--
-- Córrelo y LEE el resultado antes de borrar nada. Si todos los
-- renglones traen ceros en ventas, órdenes y facturas, son datos
-- de ejemplo y borrarlos no cuesta nada. Si traen números, ahí
-- hay operación real y borrarla NO se puede deshacer.
-- ============================================================

select
  b.id,
  b.name,
  (select count(*) from machines  m where m.branch_id  = b.id) as equipos,
  (select count(*) from sales     s where s.branch_id  = b.id) as ventas,
  (select count(*) from orders    o where o.branch_id  = b.id) as ordenes,
  (select count(*) from shifts    t where t.branch_id  = b.id) as turnos,
  (select count(*) from expenses  e where e.branch_id  = b.id) as gastos,
  (select count(*) from inventory i where i.branch_id  = b.id) as insumos,
  (select count(*) from invoices  f where f.branch_id  = b.id) as facturas
from branches b
order by b.id;


-- ============================================================
-- BLOQUE 3 — Dejar solo la sucursal instalada
--
-- Activo: toda la data de las otras sucursales es de prueba y no
-- hay histórico que conservar (confirmado 2026-09-25).
--
-- Aun así, borrar una sucursal arrastra en cascada TODO lo suyo:
-- máquinas, turnos, ventas, órdenes, inventario, gastos y
-- facturas. Si algún día estas sucursales ya operaron de verdad,
-- NO vuelvas a correr este bloque sin respaldar primero.
-- ============================================================

-- 3.a  Los clientes no se borran: solo se les suelta la sucursal
--      donde se registraron, porque esa columna no tiene borrado
--      en cascada y si no, el delete falla.
update customer_overrides
set registration_branch_id = null
where registration_branch_id in ('semillero', 'guadalupe');

-- 3.b  Fuera las sucursales que no están instaladas.
delete from branches where id in ('semillero', 'guadalupe');

-- 3.c  'main' se queda, pero marcado.
--
--      No se borra porque el código lo usa como sucursal de
--      respaldo en ~15 lugares (AppContext, AuthContext, el
--      asistente de órdenes, inventario) y StorageContext.deleteBranch
--      se niega explícitamente a borrarlo. Sin ese renglón, un
--      dispositivo sin vincular apunta a una sucursal inexistente
--      y muestra "Sucursal Desconocida" con el tablero vacío.
--
--      Renombrarlo es lo que evita que alguien vincule una tablet
--      ahí por error. Quitarlo de verdad es un cambio de código,
--      no un delete, y conviene hacerlo después de la instalación.
update branches
set name    = '— No usar · respaldo del sistema —',
    address = 'Renglón técnico. No vincular dispositivos aquí.'
where id = 'main';

-- 3.d  Verificación: deben quedar solo 'main' y 'vista_hermosa'.
select id, name from branches order by id;
