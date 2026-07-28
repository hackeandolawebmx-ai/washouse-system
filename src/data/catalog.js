import { Banknote, CreditCard, ArrowLeftRight } from 'lucide-react';

export const SERVICES_CATALOG = [
    // Autoservicio
    { id: 'wash_dry', name: 'Lavado y secado', price: 150, category: 'self_service', type: 'weight', baseKg: 5, extraPrice: 20, icon: '🧺' },
    { id: 'self_wash', name: 'Lavadora', price: 50, category: 'self_service', type: 'weight', baseKg: 5, extraPrice: 10, icon: '🧼' },
    { id: 'self_dry', name: 'Secadora', price: 50, category: 'self_service', type: 'weight', baseKg: 5, extraPrice: 10, icon: '💨' },

    // Edredones
    { id: 'duvet_s', name: 'Edredón individual', price: 150, category: 'special', type: 'unit', icon: '🛏️' },
    { id: 'duvet_m', name: 'Edredón matrimonial', price: 190, category: 'special', type: 'unit', icon: '🛏️' },
    { id: 'duvet_l_k', name: 'Edredón King', price: 235, category: 'special', type: 'unit', icon: '👑' },

    // Planchado
    { id: 'iron_piece', name: 'Pieza', price: 18, category: 'iron', type: 'unit', icon: '👕' },
    { id: 'iron_dozen', name: 'Docena', price: 180, category: 'iron', type: 'unit', icon: '♨️' },
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
    { id: 'detergent_powder', name: 'Detergente polvo', price: 10, stock: 50, icon: '🧼' },
    { id: 'detergent_liquid', name: 'Detergente líquido', price: 18, stock: 30, icon: '🧴' },
    { id: 'softener', name: 'Suavizante', price: 12, stock: 100, icon: '🌸' },
    { id: 'bleach', name: 'Cloro', price: 10, stock: 60, icon: '🧴' },
    { id: 'pino', name: 'Pino', price: 10, stock: 45, icon: '🌲' },
    { id: 'wipe', name: 'Toallita', price: 10, stock: 100, icon: '✨' },
    { id: 'starch', name: 'Almidón', price: 12, stock: 20, icon: '💨' },
    { id: 'hanger', name: 'Gancho', price: 8, stock: 200, icon: '🧥' },
    { id: 'bag', name: 'Bolsa', price: 10, stock: 300, icon: '🛍️' },
    { id: 'stain_remover', name: 'Quitamanchas', price: 18, stock: 20, icon: '✨' },
];

export const PAYMENT_METHODS = [
    { id: 'cash', label: 'Efectivo', icon: '💵' },
    { id: 'card', label: 'Tarjeta', icon: '💳' },
    { id: 'transfer', label: 'Transferencia', icon: '🏦' },
];
