-- ============================================================
-- CATÁLOGO DE SERVICIOS COMO FUENTE ÚNICA DE PRECIOS
-- Fecha: 2026-09-25
--
-- Hasta ahora los 14 servicios base vivían hardcodeados en
-- src/data/catalog.js y la tabla 'services' solo guardaba los
-- personalizados. Peor: SalesContext filtraba cualquier renglón de
-- la base cuyo id coincidiera con uno del catálogo, así que editar
-- el precio de un servicio base desde Configuración no se guardaba:
-- el UPDATE no encontraba fila, no marcaba error, y al recargar el
-- precio volvía al del código.
--
-- Esta migración siembra los 14 en la base. A partir de aquí la base
-- manda y el catálogo del código queda solo como respaldo si Supabase
-- no responde. Es lo que permite que la web pública y el mostrador
-- muestren siempre el mismo precio.
--
-- Es idempotente, PERO respeta los precios ya editados: 'on conflict'
-- no toca el precio de una fila existente, solo rellena las que falten.
-- ============================================================

insert into services (id, name, category, price, metadata) values
  -- Autoservicio
  ('wash_dry',   'Lavado y secado',      'self_service', 150, '{"type":"weight","baseKg":5,"extraPrice":20,"icon":"🧺"}'),
  ('self_wash',  'Lavadora',             'self_service',  50, '{"type":"weight","baseKg":5,"extraPrice":10,"icon":"🧼"}'),
  ('self_dry',   'Secadora',             'self_service',  50, '{"type":"weight","baseKg":5,"extraPrice":10,"icon":"💨"}'),

  -- Edredones
  ('duvet_s',    'Edredón individual',   'special',      150, '{"type":"unit","icon":"🛏️"}'),
  ('duvet_m',    'Edredón matrimonial',  'special',      190, '{"type":"unit","icon":"🛏️"}'),
  ('duvet_l_k',  'Edredón King',         'special',      235, '{"type":"unit","icon":"👑"}'),

  -- Planchado
  ('iron_piece', 'Planchado por pieza',  'iron',          20, '{"type":"unit","icon":"👕"}'),
  ('iron_dozen', 'Planchado por docena', 'iron',         180, '{"type":"unit","icon":"♨️"}'),
  ('iron_jeans', 'Mezclilla',            'iron',          30, '{"type":"unit","icon":"👖"}'),

  -- Compostura
  ('fix_adjust', 'Ajustes',              'fixing',        60, '{"type":"unit","icon":"🪡"}'),
  ('fix_hem',    'Bastilla',             'fixing',        80, '{"type":"unit","icon":"🧵"}'),
  ('fix_zipper', 'Cambio de zipper',     'fixing',       120, '{"type":"unit","icon":"🤐"}'),
  ('fix_express','Servicio express',     'fixing',        40, '{"type":"unit","icon":"✨"}')
on conflict (id) do nothing;

-- Verificación: 13 renglones base, más los personalizados que existan.
select category, count(*) as servicios, min(price) as desde, max(price) as hasta
from services
group by category
order by category;
