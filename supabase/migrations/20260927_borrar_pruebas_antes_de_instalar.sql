-- ============================================================
-- BORRAR TODO LO TRANSACCIONAL ANTES DE INSTALAR EN VISTA HERMOSA
-- Fecha: 2026-09-27 — YA CORRIDO, este archivo queda como registro
--
-- Lo que había en la base antes de correr esto eran pruebas hechas
-- mientras el dispositivo todavía apuntaba a 'main' (antes de vincularlo
-- a Vista Hermosa): 3 órdenes, 2 ventas, 1 factura en BORRADOR (nunca se
-- timbró ante el SAT: cfdi_uuid era nulo, nunca fue un documento fiscal
-- real), 114 renglones de bitácora, y 3 clientes de prueba en el
-- directorio. Vista Hermosa en sí no tenía ninguna venta real todavía.
--
-- Objetivo: dejar el sistema en cero para que la primera orden real de
-- Vista Hermosa sea literalmente la primera.
--
-- ⚠️  IRREVERSIBLE. No hay papelera. No lo vuelvas a correr sin revisar
--     antes si ya hay operación real (ver el bloque 0).
--
-- Lo que este archivo NO toca (es configuración, no historial de
-- ventas): branches, machines, staff, inventory, services,
-- system_config, pin_lockouts.
-- ============================================================

-- ------------------------------------------------------------
-- 0. Vista previa: qué se va a borrar. Córrelo solo, antes del resto,
--    si vuelves a usar este script y quieres confirmar antes de seguir.
-- ------------------------------------------------------------
-- select 'orders' as tabla, count(*) from orders
-- union all select 'sales', count(*) from sales
-- union all select 'shifts', count(*) from shifts
-- union all select 'expenses', count(*) from expenses
-- union all select 'invoices', count(*) from invoices
-- union all select 'invoice_requests', count(*) from invoice_requests
-- union all select 'activity_logs', count(*) from activity_logs
-- union all select 'customer_overrides', count(*) from customer_overrides;

-- ------------------------------------------------------------
-- 1. Borrado
-- ------------------------------------------------------------
delete from invoice_requests;
delete from invoices;
delete from sales;
delete from expenses;
delete from shifts;
delete from orders;
delete from customer_overrides;
delete from activity_logs;

-- ------------------------------------------------------------
-- 2. Verificación: las ocho deben dar 0
-- ------------------------------------------------------------
select 'orders' as tabla, count(*) from orders
union all select 'sales', count(*) from sales
union all select 'shifts', count(*) from shifts
union all select 'expenses', count(*) from expenses
union all select 'invoices', count(*) from invoices
union all select 'invoice_requests', count(*) from invoice_requests
union all select 'activity_logs', count(*) from activity_logs
union all select 'customer_overrides', count(*) from customer_overrides;

-- Lo que debe seguir intacto: Vista Hermosa, sus 12 equipos libres,
-- su inventario y el personal con su PIN de siempre.
select
  (select count(*) from branches  where id = 'vista_hermosa')                                  as sucursal,
  (select count(*) from machines  where branch_id = 'vista_hermosa')                           as equipos,
  (select count(*) from machines  where branch_id = 'vista_hermosa' and status = 'available')  as equipos_libres,
  (select count(*) from inventory where branch_id = 'vista_hermosa')                           as insumos,
  (select count(*) from staff     where branch_id = 'vista_hermosa')                           as personal;

-- ============================================================
-- REUTILIZABLE PARA LA SIGUIENTE SUCURSAL
--
-- Este script borra TODO lo transaccional de TODAS las sucursales, sin
-- filtrar por branch_id (asi se uso hoy porque los datos de prueba
-- vivian bajo 'main', no bajo 'vista_hermosa'). Si en el futuro se
-- necesita limpiar SOLO una sucursal nueva sin tocar la operacion real
-- de las demas, cada DELETE necesita su propio "where branch_id = '...'"
-- -- customer_overrides y activity_logs son la excepcion: no tienen
-- columna branch_id confiable para filtrar (activity_logs.branch_id no
-- es NOT NULL y customer_overrides usa registration_branch_id, que
-- puede ser nulo), asi que borrarlos por sucursal exige revisar cada
-- fila a mano en vez de un DELETE de una linea.
-- ============================================================
