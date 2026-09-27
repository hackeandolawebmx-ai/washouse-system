-- ============================================================
-- DESCUENTO DE INVENTARIO POR SUCURSAL
-- Fecha: 2026-09-26
--
-- inventory.id es llave primaria global, asi que una segunda sucursal no
-- puede reusar el id plano del catalogo ('detergent_liquid'): la fila de
-- Vista Hermosa quedo como 'detergent_liquid__vista_hermosa'. El problema:
-- cuando se vende un insumo, el sistema busca la fila por el id plano del
-- catalogo (es lo unico que una orden conoce), asi que nunca encontraba la
-- fila de Vista Hermosa y el stock no bajaba solo.
--
-- Agrega catalog_id: guarda el id plano del catalogo por separado del id
-- real de la fila, para que la busqueda sea por (branch_id, catalog_id) y
-- no por (branch_id, id). Los productos personalizados (dados de alta a
-- mano, no del catalogo) se quedan con catalog_id nulo — no aplica.
-- ============================================================

alter table inventory add column if not exists catalog_id text;

-- Cubre ambos esquemas de id ya existentes en una sola pasada:
--   'detergent_powder'                 (sucursal 'main', id = catalogo)
--   'detergent_powder__vista_hermosa'  (Vista Hermosa, id con sufijo)
-- split_part(id, '__', 1) devuelve el id tal cual cuando no hay '__', y el
-- prefijo antes de '__' cuando sí lo hay — funciona para los dos casos.
update inventory
set catalog_id = split_part(id, '__', 1)
where catalog_id is null
  and split_part(id, '__', 1) in (
    'detergent_powder', 'detergent_liquid', 'softener', 'bleach', 'pino',
    'wipe', 'starch', 'hanger', 'bag', 'stain_remover'
  );

-- Verificación: cada sucursal con inventario del catálogo debe mostrar sus
-- 10 productos con catalog_id lleno. Un renglón con catalog_id vacío es un
-- producto personalizado (correcto) o uno que quedó sin resolver (revisar).
select branch_id, count(*) filter (where catalog_id is not null) as con_catalogo,
       count(*) filter (where catalog_id is null)     as personalizados
from inventory
group by branch_id
order by branch_id;
