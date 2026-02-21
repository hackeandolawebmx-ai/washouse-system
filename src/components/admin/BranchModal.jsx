import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { X, Building, Settings, Wrench } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';

export default function BranchModal({ isOpen, onClose, onSave, branchToEdit = null }) {
    const { machines, updateMachine } = useStorage();
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        waterCostPerCycle: 0,
        electricityCostPerCycle: 0,
        gasCostPerCycle: 0
    });

    useEffect(() => {
        if (branchToEdit) {
            setFormData({
                name: branchToEdit.name,
                address: branchToEdit.address,
                waterCostPerCycle: branchToEdit.waterCostPerCycle || 0,
                electricityCostPerCycle: branchToEdit.electricityCostPerCycle || 0,
                gasCostPerCycle: branchToEdit.gasCostPerCycle || 0
            });
        } else {
            setFormData({
                name: '',
                address: '',
                waterCostPerCycle: 0,
                electricityCostPerCycle: 0,
                gasCostPerCycle: 0
            });
        }
    }, [branchToEdit, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        if (!branchToEdit) {
            setFormData({
                name: '',
                address: '',
                waterCostPerCycle: 0,
                electricityCostPerCycle: 0,
                gasCostPerCycle: 0
            });
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

                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Costos Operativos (por ciclo)</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Agua/Insumos</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-6 rounded-lg border-gray-300 text-sm focus:border-washouse-blue focus:ring-washouse-blue font-mono"
                                            value={formData.waterCostPerCycle}
                                            onChange={(e) => setFormData({ ...formData, waterCostPerCycle: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Energía</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-6 rounded-lg border-gray-300 text-sm focus:border-washouse-blue focus:ring-washouse-blue font-mono"
                                            value={formData.electricityCostPerCycle}
                                            onChange={(e) => setFormData({ ...formData, electricityCostPerCycle: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Gas</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-6 rounded-lg border-gray-300 text-sm focus:border-washouse-blue focus:ring-washouse-blue font-mono"
                                            value={formData.gasCostPerCycle}
                                            onChange={(e) => setFormData({ ...formData, gasCostPerCycle: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-3">Estos valores se utilizarán para calcular el Margen Operativo real en tiempo real.</p>
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
