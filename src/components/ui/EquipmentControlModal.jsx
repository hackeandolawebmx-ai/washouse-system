import React from 'react';
import { X, Wrench } from 'lucide-react';
import EquipmentControlTable from '../admin/EquipmentControlTable';

export default function EquipmentControlModal({ isOpen, onClose, onToggleMaintenance, onForceStop, onViewDetails }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-in fade-in duration-500">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-white/20"
            >
                {/* Header */}
                <div className="bg-linear-to-r from-washouse-navy to-slate-900 p-8 flex justify-between items-center text-white shrink-0 relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                <Wrench className="w-6 h-6 text-washouse-sky" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter">
                                    Control de Equipos
                                </h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-70">Monitoreo y gestión en tiempo real</p>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative z-10 p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-95 group">
                        <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Table Area */}
                <div className="flex-1 overflow-hidden bg-slate-50/30">
                    <EquipmentControlTable
                        onToggleMaintenance={onToggleMaintenance}
                        onForceStop={onForceStop}
                        onViewDetails={onViewDetails}
                    />
                </div>
            </motion.div>
        </div>
    );
}
