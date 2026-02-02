import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { X, Building } from 'lucide-react';

export default function BranchModal({ isOpen, onClose, onSave, branchToEdit = null }) {
    const [formData, setFormData] = useState({
        name: '',
        address: ''
    });

    useEffect(() => {
        if (branchToEdit) {
            setFormData({ name: branchToEdit.name, address: branchToEdit.address });
        } else {
            setFormData({ name: '', address: '' });
        }
    }, [branchToEdit, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        if (!branchToEdit) {
            setFormData({ name: '', address: '' });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-fadeIn">
                <div className="bg-washouse-navy p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        {branchToEdit ? 'Editar Sucursal' : 'Nueva Sucursal'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Sucursal</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Sucursal Norte"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-washouse-blue focus:ring-washouse-blue"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej. Av. Vallarta 123"
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-washouse-blue focus:ring-washouse-blue"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary">
                            {branchToEdit ? 'Guardar Cambios' : 'Crear Sucursal'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
