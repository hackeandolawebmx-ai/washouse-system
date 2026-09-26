-- ============================================================
-- BÚSQUEDA PÚBLICA DE FOLIO PARA FACTURACIÓN
-- Fecha: 2026-09-25
--
-- Hasta ahora, /solicitar-factura buscaba el folio en el arreglo
-- completo de órdenes que el navegador ya tenía cargado. Es decir:
-- cualquier visitante de esa página pública descargaba el historial
-- entero de órdenes y el directorio de clientes de todas las
-- sucursales.
--
-- Con esta función, la página pública pide UNA orden y recibe solo
-- los campos que necesita para que el cliente confirme que es la
-- suya. El nombre va enmascarado ("Alejandra R.") para que nadie
-- pueda cosechar el directorio probando folios.
-- ============================================================

create or replace function buscar_orden_para_factura(p_folio text)
returns table (
  id             text,
  branch_id      text,
  branch_name    text,
  customer_label text,
  total_amount   numeric,
  created_at     timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.branch_id,
    b.name as branch_name,
    -- Primer nombre + inicial del apellido, nunca el nombre completo.
    nullif(split_part(coalesce(o.customer_name, ''), ' ', 1), '')
      || case
           when split_part(coalesce(o.customer_name, ''), ' ', 2) <> ''
           then ' ' || left(split_part(o.customer_name, ' ', 2), 1) || '.'
           else ''
         end as customer_label,
    o.total_amount,
    o.created_at
  from orders o
  left join branches b on b.id = o.branch_id
  -- El ticket imprime el folio corto (el bloque de en medio de
  -- 'ORD-481207-14'), pero aceptamos también el id completo.
  where o.id = p_folio
     or split_part(o.id, '-', 2) = p_folio
  limit 1;
$$;

-- La página es pública y sin sesión: anon necesita poder ejecutarla.
grant execute on function buscar_orden_para_factura(text) to anon, authenticated;

-- Verificación: sustituye el folio por uno real de tu base.
-- select * from buscar_orden_para_factura('481207');
