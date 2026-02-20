import { Banknote, CreditCard, ArrowLeftRight } from 'lucide-react';

export const SERVICES_CATALOG = [
    // Lavado
    { id: 'wash_weight', name: 'Lavado y Secado (Carga 5kg)', price: 150, category: 'wash', type: 'weight', baseKg: 5, extraPrice: 15, icon: '🧺' },

    // Autoservicio
    { id: 'self_wash_s', name: 'Autolavado Chico', price: 50, category: 'self_service', type: 'unit', icon: '🧼' },
    { id: 'self_dry_s', name: 'Autosecado Chico', price: 50, category: 'self_service', type: 'unit', icon: '💨' },

    // Especiales
    { id: 'duvet_s', name: 'Edredón Chico', price: 150, category: 'special', type: 'unit', icon: '🛏️' },
    { id: 'duvet_m_g', name: 'Edredón Mediano / Grande', price: 190, category: 'special', type: 'unit', icon: '🛏️' },
    { id: 'duvet_xl', name: 'Edredón XL', price: 235, category: 'special', type: 'unit', icon: '👑' },

    // Planchado
    { id: 'iron_piece', name: 'Pieza Planchado', price: 16, category: 'iron', type: 'unit', icon: '👕' },
    { id: 'iron_dozen', name: 'Docena Planchado', price: 160, category: 'iron', type: 'unit', icon: '♨️' },
    { id: 'iron_jeans', name: 'Mezclilla', price: 26, category: 'iron', type: 'unit', icon: '👖' },

    // Compostura
    { id: 'fix_adjust', name: 'Ajustes', price: 0, category: 'fixing', type: 'unit', icon: '🪡' },
    { id: 'fix_hem', name: 'Bastilla', price: 0, category: 'fixing', type: 'unit', icon: '🧵' },
    { id: 'fix_zipper', name: 'Zipper', price: 0, category: 'fixing', type: 'unit', icon: '🤐' },
];

export const SERVICE_LEVELS = [
    { id: 'standard', name: 'Estándar', multiplier: 1, color: 'bg-blue-100 text-blue-800' },
    { id: 'express', name: 'Express', multiplier: 1.25, color: 'bg-orange-100 text-orange-800' },
];

export const PRODUCTS_CATALOG = [
    { id: 'detergent_powder', name: 'Polvo', price: 6, stock: 50, icon: '🧼' },
    { id: 'detergent_pino', name: 'Pino', price: 8, stock: 45, icon: '🌲' },
    { id: 'detergent_liquid', name: 'Jabón Líquido', price: 15, stock: 30, icon: '🧴' },
    { id: 'softener_suavitel', name: 'Suavitel', price: 9, stock: 100, icon: '🌸' },
    { id: 'bleach', name: 'Cloro', price: 8, stock: 60, icon: '🧴' },
    { id: 'wipe', name: 'Toallita', price: 7, stock: 100, icon: '𧻻' },
    { id: 'starch', name: 'Almidón', price: 8, stock: 20, icon: '💨' },
    { id: 'hanger', name: 'Gancho', price: 6, stock: 200, icon: '🧥' },
    { id: 'bag', name: 'Bolsa', price: 7, stock: 300, icon: '🛍️' },
    { id: 'vanish', name: 'Vanish', price: 15, stock: 20, icon: '✨' },
];

export const PAYMENT_METHODS = [
    { id: 'cash', label: 'Efectivo', icon: '💵' },
    { id: 'card', label: 'Tarjeta', icon: '💳' },
    { id: 'transfer', label: 'Transferencia', icon: '🏦' },
];
