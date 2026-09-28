-- ============================================================
-- DATOS PÚBLICOS PARA WASHOUSE.APP
-- Fecha: 2026-09-25
--
-- La web pública no lee las tablas de la operación. Lee dos vistas
-- que exponen, a propósito, solo lo que un cliente necesita ver:
-- qué sucursales están abiertas al público y cuánto cuesta cada
-- servicio. Nada de órdenes, clientes, ventas ni costos internos.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Datos de contacto y bandera de publicación
--
--    is_public decide qué aparece en la web. NO se usa la lista de
--    licencias para esto: esa es código y controla el cobro, no la
--    vitrina. Así una sucursal nueva se publica con un update, sin
--    deploy, y 'main' (el renglón técnico de respaldo) jamás sale.
-- ------------------------------------------------------------
alter table branches add column if not exists is_public boolean default false;
alter table branches add column if not exists phone     text;
alter table branches add column if not exists hours     text;
alter table branches add column if not exists maps_url  text;

-- Ajusta teléfono, horario y liga de Google Maps a los reales.
update branches
set
  is_public = true,
  phone     = '81 1788 0335',
  hours     = 'Lunes a sábado de 9:00 a 20:00 · Domingo de 9:00 a 19:00',
  maps_url  = 'https://maps.app.goo.gl/whkn1zx2Mt3QFnUKA'
where id = 'vista_hermosa';

-- El renglón de respaldo nunca se publica.
update branches set is_public = false where id = 'main';

-- ------------------------------------------------------------
-- 2. Vistas públicas
-- ------------------------------------------------------------
create or replace view public_branches as
select id, name, address, phone, hours, maps_url
from branches
where is_public = true;

create or replace view public_services as
select id, name, category, price, metadata
from services;

-- ------------------------------------------------------------
-- 3. Permisos: solo lectura, y solo sobre las vistas
-- ------------------------------------------------------------
grant select on public_branches to anon, authenticated;
grant select on public_services to anon, authenticated;

-- ------------------------------------------------------------
-- 4. Verificación
-- ------------------------------------------------------------
select 'sucursales publicadas' as que, count(*)::text as valor from public_branches
union all
select 'servicios publicados',        count(*)::text          from public_services;
