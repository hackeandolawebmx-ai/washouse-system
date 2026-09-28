import { Banknote, CreditCard, ArrowLeftRight } from 'lucide-react';

// Tarifa por kilos de "Lavado y secado", tal como está publicada en la
// sucursal (letrero físico "TARIFAS POR KILOS"). No es lineal: de 5 a 8 kg
// sube $30 por kilo dentro de "1 carga", pero de 8 a 8.5 kg salta de golpe
// a "2 cargas" ($320) — el letrero dice explícitamente que de 8.5 kg en
// adelante se redondea a 10 kg. 1-4 kg cobran el mínimo de $120. Arriba de
// 15 kg (lo último que trae el letrero) se sigue sumando $30 por kilo.
// Ver supabase/migrations/20260928_wash_dry_tarifa_por_kilos.sql.
const WASH_DRY_BRACKETS = [
    { maxKg: 2, price: 120 },
    { maxKg: 4, price: 120 },
    { maxKg: 5, price: 160 },
    { maxKg: 6, price: 190 },
    { maxKg: 7, price: 220 },
    { maxKg: 8, price: 250 },
    { maxKg: 10, price: 320 },
    { maxKg: 11, price: 350 },
    { maxKg: 12, price: 380 },
    { maxKg: 13, price: 410 },
    { maxKg: 15, price: 480 }
];

export const SERVICES_CATALOG = [
    // Autoservicio
    {
        id: 'wash_dry', name: 'Lavado y secado', price: 120, category: 'self_service', type: 'weight',
        baseKg: 5, // solo el peso que se prellena al agregarlo; no afecta el precio
        weightBrackets: WASH_DRY_BRACKETS,
        extraPerKg: 30,
        icon: '🧺'
    },
    { id: 'self_wash', name: 'Lavadora', price: 60, category: 'self_service', type: 'weight', baseKg: 5, extraPrice: 10, icon: '🧼' },
    { id: 'self_dry', name: 'Secadora', price: 60, category: 'self_service', type: 'weight', baseKg: 5, extraPrice: 10, icon: '💨' },

    // Edredones
    { id: 'duvet_s', name: 'Edredón individual', price: 160, category: 'special', type: 'unit', icon: '🛏️' },
    { id: 'duvet_m', name: 'Edredón matrimonial', price: 200, category: 'special', type: 'unit', icon: '🛏️' },
    { id: 'duvet_l_k', name: 'Edredón King o Queen', price: 240, category: 'special', type: 'unit', icon: '👑' },

    // Cubre colchones
    { id: 'mattress_s', name: 'Cubre colchón individual', price: 250, category: 'special', type: 'unit', icon: '🛌' },
    { id: 'mattress_m', name: 'Cubre colchón matrimonial', price: 280, category: 'special', type: 'unit', icon: '🛌' },
    { id: 'mattress_l_k', name: 'Cubre colchón King o Queen', price: 350, category: 'special', type: 'unit', icon: '🛌' },

    // Planchado
    { id: 'iron_piece', name: 'Planchado por pieza', price: 20, category: 'iron', type: 'unit', icon: '👕' },
    { id: 'iron_dozen', name: 'Planchado por docena', price: 180, category: 'iron', type: 'unit', icon: '♨️' },
    { id: 'iron_jeans', name: 'Mezclilla', price: 30, category: 'iron', type: 'unit', icon: '👖' },

    // Compostura
    { id: 'fix_adjust', name: 'Ajustes', price: 60, category: 'fixing', type: 'unit', icon: '🪡' },
    { id: 'fix_hem', name: 'Bastilla', price: 80, category: 'fixing', type: 'unit', icon: '🧵' },
    { id: 'fix_zipper', name: 'Cambio de zipper', price: 120, category: 'fixing', type: 'unit', icon: '🤐' },
    { id: 'fix_express', name: 'Servicio express', price: 40, category: 'fixing', type: 'unit', icon: '✨' },
];

export const SERVICE_LEVELS = [
    { id: 'standard', name: 'Estándar', multiplier: 1, color: 'bg-blue-100 text-blue-800' },
    { id: 'express', name: 'Express', multiplier: 1.25, color: 'bg-orange-100 text-orange-800' },
];

export const PRODUCTS_CATALOG = [
    { id: 'detergent_powder', name: 'Detergente polvo', price: 15, stock: 50, icon: '🧼' },
    { id: 'detergent_liquid', name: 'Detergente líquido', price: 15, stock: 30, icon: '🧴' },
    { id: 'softener', name: 'Suavizante', price: 15, stock: 100, icon: '🌸' },
    { id: 'bleach', name: 'Cloro', price: 6, stock: 60, icon: '🧴' },
    { id: 'pino', name: 'Pino', price: 8, stock: 45, icon: '🌲' },
    { id: 'wipe', name: 'Toallita', price: 10, stock: 100, icon: '✨' },
    { id: 'starch', name: 'Almidón', price: 8, stock: 20, icon: '💨' },
    { id: 'hanger', name: 'Gancho', price: 10, stock: 200, icon: '🧥' },
    { id: 'bag', name: 'Bolsa', price: 10, stock: 300, icon: '🛍️' },
    { id: 'stain_remover', name: 'Vanish', price: 10, stock: 20, icon: '✨' },
];

export const PAYMENT_METHODS = [
    { id: 'cash', label: 'Efectivo', icon: '💵' },
    { id: 'card', label: 'Tarjeta', icon: '💳' },
    { id: 'transfer', label: 'Transferencia', icon: '🏦' },
];
