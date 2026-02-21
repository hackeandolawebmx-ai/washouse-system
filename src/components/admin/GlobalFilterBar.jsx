import React from 'react';
import { Filter, Calendar } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';

export default function GlobalFilterBar() {
    const { branches, selectedBranch, setSelectedBranch } = useStorage();

    return (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 glass-card p-6 border-white/60 shadow-md mb-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/50 rounded-2xl border border-white shadow-sm signature-glow text-washouse-blue">
                    <Filter size={22} strokeWidth={2.5} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-washouse-navy font-outfit tracking-tight">Filtro Inteligente</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black opacity-60">Consolidado en tiempo real</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                {/* Branch Selector */}
                <div className="flex items-center gap-3 bg-white p-1.5 px-4 rounded-2xl border border-gray-100 flex-1 lg:flex-none transition-all hover:shadow-lg focus-within:ring-4 ring-gray-100 group shadow-sm">
                    <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-washouse-navy focus:ring-0 cursor-pointer min-w-[200px] py-2"
                    >
                        <option value="all">Todas las Sucursales</option>
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                {/* Period Display */}
                <div className="flex items-center gap-3 bg-gray-50/50 p-2.5 px-5 rounded-2xl border border-gray-100 text-gray-400 group/period transition-colors hover:text-gray-500">
                    <Calendar size={16} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Periodo: Este Mes</span>
                </div>
            </div>
        </div>
    );
}
