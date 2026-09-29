import { Filter, Calendar } from 'lucide-react';
import { useStorage } from '../../context/StorageContext';
import { PERIOD_OPTIONS } from '../../utils/periods';

// El selector de periodo solo aparece cuando la pantalla lo usa (pasa
// period/onPeriodChange); la sucursal es global a todo el admin.
export default function GlobalFilterBar({ period, onPeriodChange, customStart, customEnd, onCustomChange, children }) {
    const { branches, selectedBranch, setSelectedBranch, isBranchActive } = useStorage();

    return (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 glass-card p-5 border-white/60 shadow-md mb-8">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/50 rounded-2xl border border-white shadow-sm text-washouse-blue">
                    <Filter size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-washouse-navy font-outfit tracking-tight">Filtros</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    aria-label="Sucursal"
                    className="bg-white border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-widest text-washouse-navy cursor-pointer px-4 py-3 shadow-sm w-full sm:w-auto"
                >
                    <option value="all">Todas las sucursales</option>
                    {branches.filter(b => isBranchActive(b.id)).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>

                {onPeriodChange && (
                    <label className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-1 shadow-sm w-full sm:w-auto">
                        <Calendar size={16} className="text-washouse-blue shrink-0" strokeWidth={2.5} />
                        <select
                            value={period}
                            onChange={(e) => onPeriodChange(e.target.value)}
                            aria-label="Periodo"
                            className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-washouse-navy cursor-pointer py-2 flex-1 min-w-0"
                        >
                            {PERIOD_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                    </label>
                )}

                {onPeriodChange && period === 'custom' && (
                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-sm">
                        <input type="date" aria-label="Desde" value={customStart} onChange={(e) => onCustomChange(e.target.value, customEnd)} className="text-xs font-bold bg-transparent" />
                        <span className="text-gray-300 font-black">–</span>
                        <input type="date" aria-label="Hasta" value={customEnd} onChange={(e) => onCustomChange(customStart, e.target.value)} className="text-xs font-bold bg-transparent" />
                    </div>
                )}

                {children}
            </div>
        </div>
    );
}
