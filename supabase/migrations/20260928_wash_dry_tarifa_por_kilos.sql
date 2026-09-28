-- ============================================================
-- TARIFA POR KILOS DE "LAVADO Y SECADO"
-- Fecha: 2026-09-28
--
-- Reemplaza el precio lineal de Lavado y secado ($150 base + $20/kg sin
-- tope) por la tarifa real publicada en el letrero físico de la sucursal
-- ("TARIFAS POR KILOS"):
--
--   1 a 4 kg .......... $120 (mínimo)
--   5 kg .............. $160
--   6 kg .............. $190
--   7 kg .............. $220
--   8 kg .............. $250
--   8.5 a 10 kg ....... $320  (el letrero: "de 8.5 kg ya se redondea a 10")
--   11 kg .............. $350
--   12 kg .............. $380
--   13 kg .............. $410
--   13.5 a 15 kg ....... $480
--   arriba de 15 kg .... $480 + $30 por cada kilo extra (no viene en el
--                        letrero; acordado como continuación del mismo
--                        incremento de $30/kg de la tabla de 2 cargas)
--
-- El código (src/utils/orderPricing.js) busca el primer tramo cuyo maxKg
-- cubre el peso, no una fórmula continua -- por eso son tramos explícitos
-- y no un simple "extra por kilo": de 8 a 8.5 kg el precio salta de golpe
-- de $250 a $320 porque pasa de 1 a 2 cargas, no sube gradual.
--
-- baseKg se queda en 5: ya no afecta el precio, solo es el peso que se
-- prellena al agregar el servicio en el mostrador. extraPrice se quita
-- porque ya no aplica; lo reemplaza extraPerKg (para arriba de 15 kg).
-- ============================================================

update services
set
  price = 120,
  metadata = jsonb_build_object(
    'type', 'weight',
    'icon', '🧺',
    'baseKg', 5,
    'extraPerKg', 30,
    'weightBrackets', jsonb_build_array(
      jsonb_build_object('maxKg', 2,  'price', 120),
      jsonb_build_object('maxKg', 4,  'price', 120),
      jsonb_build_object('maxKg', 5,  'price', 160),
      jsonb_build_object('maxKg', 6,  'price', 190),
      jsonb_build_object('maxKg', 7,  'price', 220),
      jsonb_build_object('maxKg', 8,  'price', 250),
      jsonb_build_object('maxKg', 10, 'price', 320),
      jsonb_build_object('maxKg', 11, 'price', 350),
      jsonb_build_object('maxKg', 12, 'price', 380),
      jsonb_build_object('maxKg', 13, 'price', 410),
      jsonb_build_object('maxKg', 15, 'price', 480)
    )
  )
where id = 'wash_dry';

-- ------------------------------------------------------------
-- Verificación
-- ------------------------------------------------------------
select id, name, price, metadata from services where id = 'wash_dry';

-- ⚠️  Esto NO cambia órdenes ya registradas: cada orden guarda su propia
--     tarifa congelada al momento de cobrarse (items.weightBrackets), así
--     que el historial de ventas pasadas no se recalcula ni cambia.
