import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { X, Building, Settings, Wrench } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';

export default function BranchModal({ isOpen, onClose, onSave, branchToEdit = null }) {
    const { machines, updateMachine } = useStorage();
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

    const handleToggleMaintenance = (machineId, currentStatus) => {
        const newStatus = currentStatus === 'maintenance' ? 'available' : 'maintenance';
        updateMachine(machineId, { status: newStatus });
    };

    if (!isOpen) return null;

    const branchMachines = branchToEdit ? machines.filter(m => m.branchId === branchToEdit.id) : [];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
                <div className="bg-washouse-navy p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        {branchToEdit ? 'Editar Sucursal' : 'Nueva Sucursal'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="branch-form" onSubmit={handleSubmit} className="space-y-4 mb-8">
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
                    </form>

                    {branchToEdit && (
                        <div className="border-t pt-6">
                            <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5" /> Configuración de Equipos
                            </h4>

                            {branchMachines.length === 0 ? (
                                <p className="text-gray-400 text-sm">No hay equipos registrados en esta sucursal.</p>
                            ) : (
                                <div className="space-y-3">
                                    {branchMachines.map(machine => (
                                        <div key={machine.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <div className="font-medium text-washouse-navy">{machine.name}</div>
                                                <div className="text-xs text-gray-500 uppercase">{machine.type}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${machine.status === 'maintenance'
                                                    ? 'bg-orange-100 text-orange-700'
                                                    : 'bg-green-100 text-green-700'
                                                    }`}>
                                                    {machine.status === 'maintenance' ? 'Mantenimiento' : 'Operativo'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleMaintenance(machine.id, machine.status)}
                                                    className={`p-2 rounded-lg transition-colors ${machine.status === 'maintenance'
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-500 hover:bg-orange-100 hover:text-orange-600'
                                                        }`}
                                                    title={machine.status === 'maintenance' ? 'Habilitar equipo' : 'Poner en mantenimiento'}
                                                >
                                                    <Wrench size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="branch-form" variant="primary">
                        {branchToEdit ? 'Guardar Cambios' : 'Crear Sucursal'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
