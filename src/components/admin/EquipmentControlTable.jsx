import React, { useState, useMemo } from 'react';
import { Wrench, Power, Eye, Search, Filter, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { useStorage } from '../../context/StorageContext';

export default function EquipmentControlTable({ onToggleMaintenance, onForceStop, onViewDetails }) {
    const { machines, branches, syncData } = useStorage();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [branchFilter, setBranchFilter] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleManualRefresh = () => {
        setIsRefreshing(true);
        syncData();
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const filteredMachines = useMemo(() => {
        return machines.filter(machine => {
            const matchesSearch = machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (machine.clientName && machine.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'all' || machine.status === statusFilter;
            const matchesBranch = branchFilter === 'all' || machine.branchId === branchFilter;
            return matchesSearch && matchesStatus && matchesBranch;
        });
    }, [machines, searchTerm, statusFilter, branchFilter]);

    return (
        <div className="flex flex-col h-full bg-white/40 backdrop-blur-md rounded-4xl border border-slate-100 overflow-hidden shadow-[0_8px_32px_-8px_rgba(0,0,0,0.05)]">
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-100/60 bg-white/40 flex flex-col sm:flex-row gap-6 justify-between items-center shrink-0">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-washouse-blue transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por ID, nombre o cliente..."
                            className="w-full pl-12 pr-6 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-washouse-blue outline-none transition-all placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleManualRefresh}
                        className={`p-3 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-washouse-blue hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-95 ${isRefreshing ? 'bg-blue-50 border-blue-200 shadow-inner' : ''}`}
                        title="Sincronizar Datos"
                    >
                        <RefreshCw size={20} strokeWidth={2.5} className={`${isRefreshing ? 'animate-spin text-washouse-blue' : ''}`} />
                    </button>
                    <div className="hidden xl:flex items-center gap-2.5 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.15em]">Sincronizado</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                    <div className="flex items-center gap-3 bg-slate-50/50 p-1.5 rounded-2xl border border-slate-100">
                        <Filter className="w-4 h-4 text-slate-400 ml-2" />
                        <select
                            value={branchFilter}
                            onChange={(e) => setBranchFilter(e.target.value)}
                            className="bg-transparent border-none text-[11px] font-black uppercase tracking-wider text-slate-600 outline-none focus:ring-0 cursor-pointer pr-8"
                        >
                            <option value="all">Sucursales</option>
                            {branches.map(branch => (
                                <option key={branch.id} value={branch.id}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        {['all', 'available', 'running', 'maintenance'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap border ${statusFilter === status
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                {status === 'all' ? 'Todos' :
                                    status === 'available' ? 'Libres' :
                                        status === 'running' ? 'Ocupados' : 'Técnico'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-separate border-spacing-y-2 px-6">
                    <thead className="bg-transparent sticky top-0 z-10 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">
                        <tr>
                            <th className="px-6 py-4 bg-white/80 backdrop-blur-md first:rounded-l-2xl">Equipo</th>
                            <th className="px-6 py-4 bg-white/80 backdrop-blur-md">Sucursal</th>
                            <th className="px-6 py-4 bg-white/80 backdrop-blur-md text-center">Estado</th>
                            <th className="px-6 py-4 bg-white/80 backdrop-blur-md">Cliente / Ciclo</th>
                            <th className="px-6 py-4 bg-white/80 backdrop-blur-md text-right last:rounded-r-2xl">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMachines.length > 0 ? (
                            filteredMachines.map((machine) => (
                                <tr key={machine.id} className="group transition-all duration-300">
                                    <td className="px-6 py-5 bg-white group-hover:bg-slate-50 rounded-l-2xl border-y border-l border-slate-100 group-hover:border-slate-200 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl shadow-inner ${machine.type === 'lavadora' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                                }`}>
                                                {machine.type === 'lavadora' ? <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" /> : <Power size={20} />}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 tracking-tight group-hover:text-washouse-blue transition-colors">{machine.name}</div>
                                                <div className="text-[10px] font-black text-slate-400 tracking-widest mt-0.5 opacity-70">{machine.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 bg-white group-hover:bg-slate-50 border-y border-slate-100 group-hover:border-slate-200 transition-all">
                                        <div className="text-xs font-black text-slate-600">
                                            {branches.find(b => String(b.id) === String(machine.branchId))?.name || 'Sucursal Principal'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 bg-white group-hover:bg-slate-50 border-y border-slate-100 group-hover:border-slate-200 transition-all text-center">
                                        <StatusBadge status={machine.status} className="shadow-sm" />
                                    </td>
                                    <td className="px-6 py-5 bg-white group-hover:bg-slate-50 border-y border-slate-100 group-hover:border-slate-200 transition-all">
                                        {machine.status === 'running' ? (
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-xs text-washouse-navy truncate max-w-[120px]">{machine.clientName || 'Sin Nombre'}</span>
                                                    <span className="text-[9px] font-black bg-blue-100 text-washouse-blue px-1.5 py-0.5 rounded-full animate-pulse uppercase">Activo</span>
                                                </div>
                                                <div className="w-32 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-washouse-blue rounded-full animate-infinite-loading" />
                                                </div>
                                                <span className="text-[10px] font-black text-washouse-blue">
                                                    {machine.timeLeft} min restantes
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">{machine.status === 'maintenance' ? 'Bajo Revisión' : 'Standby'}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 bg-white group-hover:bg-slate-50 rounded-r-2xl border-y border-r border-slate-100 group-hover:border-slate-200 transition-all text-right">
                                        <div className="flex justify-end gap-3 translate-x-2 group-hover:translate-x-0 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 transition-all duration-300">
                                            <button
                                                onClick={() => onViewDetails(machine.id)}
                                                className="p-2.5 text-slate-400 hover:text-washouse-blue hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-lg border border-transparent hover:border-slate-100 active:scale-90"
                                                title="Configuración"
                                            >
                                                <Eye size={20} />
                                            </button>

                                            <button
                                                onClick={() => onToggleMaintenance(machine.id)}
                                                className={`p-2.5 rounded-xl transition-all shadow-sm hover:shadow-lg border active:scale-90 ${machine.status === 'maintenance'
                                                    ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                                                    : 'bg-white text-slate-400 hover:text-orange-600 border-slate-100 hover:border-orange-100'
                                                    }`}
                                                title={machine.status === 'maintenance' ? 'Reactivar' : 'Mantenimiento'}
                                            >
                                                <Wrench size={20} strokeWidth={2.5} />
                                            </button>

                                            {machine.status === 'running' && (
                                                <button
                                                    onClick={() => onForceStop(machine.id)}
                                                    className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-xl hover:shadow-rose-500/20 border border-rose-100 active:scale-90"
                                                    title="Paro de Emergencia"
                                                >
                                                    <Power size={20} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-24 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-30">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                            <Search size={40} className="text-slate-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-black text-slate-900 uppercase tracking-widest">Sin resultados</p>
                                            <p className="text-xs text-slate-400 font-bold">Intenta ajustar los filtros de búsqueda</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100/60 bg-white/40 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex justify-between items-center shrink-0">
                <span>Mostrando {filteredMachines.length} terminales activas</span>
                <div className="flex gap-6">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Libres
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg text-washouse-blue border border-blue-100/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-washouse-blue animate-pulse" /> Ciclo
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 rounded-lg text-orange-600 border border-orange-100/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Técnico
                    </div>
                </div>
            </div>
        </div>
    );
}
