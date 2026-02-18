import React from 'react';
import { X, Wrench } from 'lucide-react';
import EquipmentControlTable from '../admin/EquipmentControlTable';

export default function EquipmentControlModal({ isOpen, onClose, onToggleMaintenance, onForceStop, onViewDetails }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-washouse-navy p-4 flex justify-between items-center text-white shrink-0">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-washouse-sky" />
                            Control de Equipos
                        </h2>
                        <p className="text-gray-300 text-sm opacity-80">Gestión centralizada de lavadoras y secadoras</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-hidden">
                    <EquipmentControlTable
                        onToggleMaintenance={onToggleMaintenance}
                        onForceStop={onForceStop}
                        onViewDetails={onViewDetails}
                    />
                </div>
            </div>
        </div>
    );
}
