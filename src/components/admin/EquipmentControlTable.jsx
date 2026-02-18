import React, { useState, useMemo } from 'react';
import { Wrench, Power, Eye, Search, Filter, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { useStorage } from '../../context/StorageContext';

export default function EquipmentControlTable({ onToggleMaintenance, onForceStop, onViewDetails }) {
    const { machines, branches, syncData } = useStorage();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
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
            return matchesSearch && matchesStatus;
        });
    }, [machines, searchTerm, statusFilter]);

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center shrink-0">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar equipo..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-washouse-blue focus:border-transparent outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleManualRefresh}
                        className={`p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-washouse-blue hover:border-blue-200 transition-all ${isRefreshing ? 'bg-blue-50' : ''}`}
                        title="Actualizar datos"
                    >
                        <RefreshCw size={18} className={`${isRefreshing ? 'animate-spin text-washouse-blue' : ''}`} />
                    </button>
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-100">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">En Vivo</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                    <Filter className="w-4 h-4 text-gray-500 shrink-0" />
                    <div className="flex gap-1">
                        {['all', 'available', 'running', 'maintenance', 'finished'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1 text-xs font-medium rounded-full transition-all whitespace-nowrap border ${statusFilter === status
                                    ? 'bg-washouse-blue text-white border-washouse-blue shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {status === 'all' ? 'Todos' :
                                    status === 'available' ? 'Disponibles' :
                                        status === 'running' ? 'En Uso' :
                                            status === 'maintenance' ? 'Mantenimiento' : 'Finalizados'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-3 border-b">Equipo</th>
                            <th className="px-6 py-3 border-b">Sucursal</th>
                            <th className="px-6 py-3 border-b">Estado</th>
                            <th className="px-6 py-3 border-b">Cliente Actual</th>
                            <th className="px-6 py-3 border-b">Tiempo Restante</th>
                            <th className="px-6 py-3 border-b text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredMachines.length > 0 ? (
                            filteredMachines.map((machine) => (
                                <tr key={machine.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${machine.type === 'lavadora' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                                                }`}>
                                                {machine.type === 'lavadora' ? '💧' : '💨'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{machine.name}</div>
                                                <div className="text-xs text-gray-500 capitalize">{machine.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-700">
                                            {branches.find(b => String(b.id) === String(machine.branchId))?.name || 'Sucursal Principal'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={machine.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                        {machine.clientName ? (
                                            <span className="font-medium text-gray-700">{machine.clientName}</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-sm">
                                        {machine.status === 'running' ? (
                                            <span className="font-bold text-washouse-blue animate-pulse">
                                                {machine.timeLeft} min
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                            <button
                                                onClick={() => onViewDetails(machine.id)}
                                                className="p-1.5 text-gray-500 hover:text-washouse-blue hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                                title="Ver Detalles"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            <button
                                                onClick={() => onToggleMaintenance(machine.id)}
                                                className={`p-1.5 rounded-lg transition-colors border ${machine.status === 'maintenance'
                                                    ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100'
                                                    : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50 border-transparent hover:border-orange-200'
                                                    }`}
                                                title={machine.status === 'maintenance' ? 'Reactivar Equipo' : 'Poner en Mantenimiento'}
                                            >
                                                <Wrench size={18} />
                                            </button>

                                            {(machine.status === 'running') && (
                                                <button
                                                    onClick={() => onForceStop(machine.id)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                                                    title="Forzar Detención"
                                                >
                                                    <Power size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <Search className="w-8 h-8 opacity-20" />
                                        <p>No se encontraron equipos.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 text-xs text-gray-500 flex justify-between items-center shrink-0">
                <span>Mostrando {filteredMachines.length} equipos</span>
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Disponible</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> En Uso</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Mantenimiento</div>
                </div>
            </div>
        </div>
    );
}
