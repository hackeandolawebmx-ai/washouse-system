import { Banknote, CreditCard, ArrowLeftRight } from 'lucide-react';

export const SERVICES_CATALOG = [
    // Lavado
    { id: 'wash_basic', name: 'Carga Lavado (5kg)', price: 90, category: 'wash', type: 'weight', baseKg: 5, extraPrice: 15, icon: '🧼' },
    { id: 'wash_dry', name: 'Lavado + Secado (5kg)', price: 150, category: 'wash', type: 'weight', baseKg: 5, extraPrice: 20, icon: '🧺' },
    { id: 'wash_dry_iron', name: 'Lavado + Secado + Planchado', price: 220, category: 'wash', type: 'weight', baseKg: 5, extraPrice: 25, icon: '👔' },

    // Especiales
    { id: 'duvet_s', name: 'Edredón Ind/Mat', price: 150, category: 'special', type: 'unit', icon: '🛏️' },
    { id: 'duvet_l', name: 'Edredón King', price: 200, category: 'special', type: 'unit', icon: '👑' },
    { id: 'sneakers', name: 'Tenis (Par)', price: 120, category: 'special', type: 'unit', icon: '👟' },

    // Planchado
    { id: 'iron_dozen', name: 'Docena Planchado', price: 120, category: 'iron', type: 'unit', icon: '♨️' },
    { id: 'iron_piece', name: 'Pieza Planchado', price: 15, category: 'iron', type: 'unit', icon: '👕' },
];

export const SERVICE_LEVELS = [
    { id: 'standard', name: 'Estándar (24h)', multiplier: 1, color: 'bg-blue-100 text-blue-800' },
    { id: 'express', name: 'Express (Urgente)', multiplier: 1.3, color: 'bg-orange-100 text-orange-800' },
];

export const PRODUCTS_CATALOG = [
    { id: 'soap_dose', name: 'Dosis Jabón', price: 15, stock: 50, icon: '🧼' },
    { id: 'softener_dose', name: 'Dosis Suavitel', price: 15, stock: 45, icon: '🌸' },
    { id: 'bleach_dose', name: 'Dosis Cloro', price: 10, stock: 30, icon: '🧴' },
    { id: 'bag_l', name: 'Bolsa Grande', price: 15, stock: 100, icon: '🛍️' },
    { id: 'bag_j', name: 'Bolsa Jumbo', price: 25, stock: 60, icon: '🎒' },
];

export const PAYMENT_METHODS = [
    { id: 'cash', label: 'Efectivo', icon: '💵' },
    { id: 'card', label: 'Tarjeta', icon: '💳' },
    { id: 'transfer', label: 'Transferencia', icon: '🏦' },
];
