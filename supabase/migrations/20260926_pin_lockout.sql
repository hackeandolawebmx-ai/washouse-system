-- ============================================================
-- LÍMITE DE INTENTOS EN verify_pin
-- Fecha: 2026-09-26
--
-- CONTEXTO — léelo antes de correr esto
--
-- Hoy verify_pin() no tiene ningún límite de intentos. Un PIN es de
-- 4 dígitos (10,000 combinaciones) y la función es de acceso público
-- (anon puede ejecutarla): cualquiera con la anon key —que viaja
-- expuesta en el bundle público, es pública por diseño— puede
-- adivinar el PIN de cualquier empleado o del admin en un script de
-- unos minutos, sin que el sistema se entere.
--
-- Esta migración NO resuelve el problema de fondo (que cualquiera con
-- la anon key puede leer/escribir directo contra orders, customer_overrides,
-- sales, expenses, etc. via REST, sin pasar por la app — hoy TODAS las
-- políticas RLS de esas tablas son 'using (true)'). Eso requiere
-- autenticación real (Supabase Auth o un JWT que verify_pin emita), y
-- esa migración necesita una decisión y una acción tuya en el dashboard
-- de Supabase que yo no puedo hacer por ti.
--
-- Lo que SÍ hace, y es real: le pone un freno al adivinador de PINes.
-- Después de 8 intentos fallidos seguidos contra la misma sucursal (o
-- contra el admin), bloquea 5 minutos. Un PIN legítimo nunca lo nota
-- (nadie se equivoca 8 veces seguidas); un script de fuerza bruta pasa
-- de "minutos" a "días".
-- ============================================================

create table if not exists pin_lockouts (
  lockout_key   text primary key,  -- branch_id, o '__admin__' cuando p_branch_id es null
  failed_count  int  not null default 0,
  locked_until  timestamptz,
  updated_at    timestamptz not null default now()
);

-- Nadie necesita leer ni escribir esta tabla directo; solo la toca
-- verify_pin (security definer). Sin policy = sin acceso vía anon/authenticated.
alter table pin_lockouts enable row level security;

create or replace function verify_pin(p_pin text, p_branch_id text default null)
returns table (id text, name text, role text, branch_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text := coalesce(p_branch_id, '__admin__');
  v_locked_until timestamptz;
  v_failed int;
  v_max_attempts constant int := 8;
  v_lockout_minutes constant int := 5;
begin
  -- ¿Está bloqueada esta llave ahora mismo? Si sí, no toca ni la tabla
  -- staff: corta antes de comparar el PIN.
  select locked_until into v_locked_until
  from pin_lockouts where lockout_key = v_key;

  if v_locked_until is not null and v_locked_until > now() then
    return;
  end if;

  return query
  select s.id, s.name, s.role, s.branch_id
  from staff s
  where s.pin_hash = md5(p_pin || s.id)
    and (
      p_branch_id is null
      or s.branch_id = 'all'
      or s.branch_id = p_branch_id
    )
  limit 1;

  if found then
    -- Acierto: se borra el contador de esta llave.
    delete from pin_lockouts where lockout_key = v_key;
  else
    -- Fallo: sube el contador (atómico contra intentos simultáneos) y,
    -- si llega al máximo, bloquea la llave por v_lockout_minutes.
    insert into pin_lockouts (lockout_key, failed_count, updated_at)
    values (v_key, 1, now())
    on conflict (lockout_key) do update
      set failed_count = pin_lockouts.failed_count + 1,
          updated_at   = now()
    returning failed_count into v_failed;

    if v_failed >= v_max_attempts then
      update pin_lockouts
      set locked_until = now() + (v_lockout_minutes || ' minutes')::interval,
          failed_count = 0
      where lockout_key = v_key;
    end if;
  end if;
end;
$$;

grant execute on function verify_pin(text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- Verificación
-- ------------------------------------------------------------
-- Debe seguir funcionando con un PIN real:
--   select * from verify_pin('4821', 'vista_hermosa');
--
-- Simula el bloqueo con un PIN incorrecto 8 veces seguidas y confirma
-- que la 9na, aunque sea el PIN correcto, no regresa nada:
--   select * from verify_pin('0000', 'vista_hermosa');  -- x8
--   select * from verify_pin('4821', 'vista_hermosa');  -- vacío, bloqueado
--   select * from pin_lockouts;                          -- locked_until en el futuro

-- ============================================================
-- LO QUE QUEDA ABIERTO
--
-- Esto sube el costo de adivinar un PIN; no cierra el acceso directo a
-- las tablas vía la anon key. Cualquiera que la extraiga del bundle
-- público sigue pudiendo leer/escribir orders, customer_overrides,
-- sales, expenses, etc. sin pasar por verify_pin en absoluto — este
-- límite no lo toca porque no depende de haber iniciado sesión.
--
-- El cierre real necesita identidad de verdad (auth.uid() que RLS
-- pueda revisar), y eso implica una de dos rutas, ambas con un paso que
-- solo tú puedes dar en el dashboard de Supabase:
--   a) Supabase Auth con una cuenta real por empleado (correo sintético
--      + el PIN como contraseña) — requiere desactivar la confirmación
--      de correo en Authentication → Settings.
--   b) Un Edge Function que verify_pin invoque para emitir un JWT firmado
--      con la service role key — requiere desplegar esa función tú, la
--      service role key nunca debe pegarse en este chat.
-- ============================================================
