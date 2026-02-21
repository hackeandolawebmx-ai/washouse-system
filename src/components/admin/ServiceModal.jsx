import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { X, Tag } from 'lucide-react';

export default function ServiceModal({ isOpen, onClose, onSave, serviceToEdit = null }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        category: 'wash',
        type: 'unit',
        baseKg: 5,
        extraPrice: 15,
        icon: '🧺'
    });

    useEffect(() => {
        if (serviceToEdit) {
            setFormData({
                name: serviceToEdit.name,
                price: serviceToEdit.price,
                category: serviceToEdit.category || 'wash',
                type: serviceToEdit.type || 'unit',
                baseKg: serviceToEdit.baseKg || 5,
                extraPrice: serviceToEdit.extraPrice || 15,
                icon: serviceToEdit.icon || '🧺'
            });
        } else {
            setFormData({
                name: '',
                price: '',
                category: 'wash',
                type: 'unit',
                baseKg: 5,
                extraPrice: 15,
                icon: '🧺'
            });
        }
    }, [serviceToEdit, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            price: parseFloat(formData.price),
            baseKg: parseFloat(formData.baseKg),
            extraPrice: parseFloat(formData.extraPrice)
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-fadeIn">
                <div className="bg-washouse-navy p-5 flex justify-between items-center text-white">
                    <div>
                        <h3 className="font-bold text-lg">{serviceToEdit ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
                        <p className="text-[10px] text-blue-200 uppercase font-black tracking-widest flex items-center gap-1 mt-0.5">
                            <Tag size={10} /> Configuración Maestra
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-washouse-blue focus:ring-washouse-blue"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej. Lavado y Secado"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                            <select
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-washouse-blue focus:ring-washouse-blue text-sm"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="wash">Lavado</option>
                                <option value="self_service">Autoservicio</option>
                                <option value="special">Especiales</option>
                                <option value="iron">Planchado</option>
                                <option value="fixing">Compostura</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cobro</label>
                            <select
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-washouse-blue focus:ring-washouse-blue text-sm"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="unit">Por Unidad / Carga</option>
                                <option value="weight">Por Peso (kg)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio Base / Unitario ($)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.5"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-washouse-blue focus:ring-washouse-blue"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                    </div>

                    {formData.type === 'weight' && (
                        <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
                            <div>
                                <label className="block text-[10px] font-black text-blue-800 uppercase mb-1">Kilos Base</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-blue-500"
                                    value={formData.baseKg}
                                    onChange={(e) => setFormData({ ...formData, baseKg: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-blue-800 uppercase mb-1">Precio Kg Extra</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="w-full rounded-lg border-gray-200 shadow-sm focus:ring-blue-500"
                                    value={formData.extraPrice}
                                    onChange={(e) => setFormData({ ...formData, extraPrice: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icono (Emoji)</label>
                        <div className="grid grid-cols-7 gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            {['🧺', '🧼', '💨', '🛏️', '👑', '👕', '♨️', '👖', '🪡', '🧵', '🤐', '🧴', '✨'].map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, icon: emoji })}
                                    className={`w-8 h-8 flex items-center justify-center rounded text-xl ${formData.icon === emoji ? 'bg-white shadow text-blue-600 ring-2 ring-blue-500' : 'hover:bg-gray-200'}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary">
                            Guardar
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
