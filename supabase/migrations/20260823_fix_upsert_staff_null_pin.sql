-- Migration: 20260823_fix_upsert_staff_null_pin.sql
-- Description: Fix upsert_staff failing to edit a staff member without
-- changing their PIN.
--
-- Root cause: in `INSERT ... ON CONFLICT DO UPDATE`, Postgres evaluates the
-- proposed row's VALUES (including pin_hash) before deciding whether to
-- insert or divert to the UPDATE branch. When p_pin is null (editing without
-- changing the PIN), `md5(p_pin || new_staff_id)` evaluates to null (NULL
-- concatenation always yields NULL), which violated the pin_hash NOT NULL
-- constraint even though the actual ON CONFLICT UPDATE clause already knew
-- to keep the existing pin_hash unchanged.
--
-- Fix: fall back to the row's current pin_hash in the VALUES clause itself,
-- so the proposed row always has a non-null placeholder. On a genuine new
-- insert p_pin is required (enforced above), so md5(p_pin || id) is never
-- null there and this fallback never actually triggers for inserts.

create or replace function upsert_staff(
  p_id text,
  p_name text,
  p_role text,
  p_pin text,
  p_branch_id text
)
returns table (id text, name text, role text, branch_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_staff_id text := coalesce(p_id, gen_random_uuid()::text);
  staff_exists boolean := p_id is not null and exists (select 1 from staff where staff.id = p_id);
begin
  if not staff_exists and p_pin is null then
    raise exception 'p_pin is required when creating a new staff member';
  end if;

  insert into staff (id, name, role, pin_hash, branch_id)
  values (
    new_staff_id,
    p_name,
    p_role,
    coalesce(md5(p_pin || new_staff_id), (select s.pin_hash from staff s where s.id = new_staff_id)),
    p_branch_id
  )
  on conflict on constraint staff_pkey do update
    set name = excluded.name,
        role = excluded.role,
        branch_id = excluded.branch_id,
        pin_hash = case when p_pin is not null then md5(p_pin || new_staff_id) else staff.pin_hash end;

  return query select s.id, s.name, s.role, s.branch_id from staff s where s.id = new_staff_id;
end;
$$;
