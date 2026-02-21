import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { X, Building } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';

export default function ProductModal({ isOpen, onClose, onSave, productToEdit = null, branchId = 'main' }) {
    const { branches } = useStorage();
    const branchName = branches.find(b => b.id === (productToEdit?.branchId || branchId))?.name || 'Sucursal';

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        cost: '',
        stock: '',
        icon: '📦'
    });

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name,
                price: productToEdit.price,
                cost: productToEdit.cost || '',
                stock: productToEdit.stock,
                icon: productToEdit.icon || '📦'
            });
        } else {
            setFormData({
                name: '',
                price: '',
                cost: '',
                stock: '',
                icon: '📦'
            });
        }
    }, [productToEdit, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            price: parseFloat(formData.price),
            cost: parseFloat(formData.cost) || 0,
            stock: parseInt(formData.stock, 10)
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-fadeIn">
                <div className="bg-washouse-navy p-5 flex justify-between items-center text-white">
                    <div>
                        <h3 className="font-bold text-lg">{productToEdit ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
                        <p className="text-[10px] text-blue-200 uppercase font-black tracking-widest flex items-center gap-1 mt-0.5">
                            <Building size={10} /> {branchName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-washouse-blue focus:ring-washouse-blue"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Costo ($)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.1"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-washouse-blue focus:ring-washouse-blue"
                                value={formData.cost || ''}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                        <input
                            type="number"
                            required
                            min="0"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-washouse-blue focus:ring-washouse-blue"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icono (Emoji)</label>
                        <div className="flex gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            {['🧴', '🧼', '🌸', '🛍️', '🎒', '🥤', '🍪'].map(emoji => (
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

                    <div className="pt-4 flex justify-end gap-3">
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
