-- ============================================================
-- NOMBRES DE MAQUINAS EN ESPAÑOL (W/D -> L/S)
-- Fecha: 2026-09-27
--
-- Las lavadoras y secadoras se llamaban 'W1'..'W6' y 'D7'..'D12'
-- (Washer/Dryer). Pasan a 'L1'..'L6' (Lavadora) y 'S7'..'S12' (Secadora).
--
-- El NUMERO no cambia, solo la letra -- si ya hay stickers con el numero
-- pegados en el equipo fisico, no hay que despegarlos. Si mas adelante se
-- decide renumerar de verdad, es un cambio aparte.
--
-- Solo toca el nombre visible (name). El id interno de cada fila
-- (vh_w1, mitras_d7, etc.) no se toca: no se muestra en ningun lado y
-- cambiarlo es innecesario y mas riesgoso que falta le hace.
-- ============================================================

update machines
set name = regexp_replace(name, '^W', 'L')
where type = 'lavadora' and name ~ '^W[0-9]+$';

update machines
set name = regexp_replace(name, '^D', 'S')
where type = 'secadora' and name ~ '^D[0-9]+$';

-- ------------------------------------------------------------
-- Verificación
-- ------------------------------------------------------------
select branch_id, type, name
from machines
where name ~ '^[LS][0-9]+$'
order by branch_id, type, (regexp_match(name, '[0-9]+'))[1]::int;

-- No debe quedar ningún nombre con el esquema viejo.
select id, branch_id, name from machines where name ~ '^[WD][0-9]+$';
