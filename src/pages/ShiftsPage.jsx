import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import GlobalFilterBar from '../components/admin/GlobalFilterBar';
import { formatCurrency } from '../utils/formatCurrency';

const fmt = (value) => new Date(value).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

const hasCount = (s) => s.finalCash !== null && s.finalCash !== undefined;

export function DifferenceBadge({ value }) {
    if (value === null || value === undefined) return <span className="text-gray-300">—</span>;
    const n = Number(value);
    if (Math.abs(n) < 0.005) return <span className="font-bold text-emerald-600">Cuadró</span>;
    return (
        <span className={`font-black tabular-nums ${n < 0 ? 'text-red-600' : 'text-amber-600'}`}>
            {n > 0 ? '+' : ''}{formatCurrency(n)} {n < 0 ? 'faltante' : 'sobrante'}
        </span>
    );
}

const duration = (start, end) => {
    const minutes = Math.round((new Date(end) - new Date(start)) / 60000);
    if (!Number.isFinite(minutes) || minutes < 0) return '—';
    return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

export default function ShiftsPage() {
    const { shifts, branches, selectedBranch } = useStorage();
    const branchName = (id) => (branches.find(b => b.id === id)?.name || id || '').replace(/^Washouse\s+/i, '');

    const rows = useMemo(() => shifts
        .filter(s => s.endedAt && (selectedBranch === 'all' || s.branchId === selectedBranch))
        .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt)),
    [shifts, selectedBranch]);

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <GlobalFilterBar />
            <div className="glass-card border-white/60 shadow-md overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                    <h1 className="text-xl font-black text-washouse-navy font-outfit tracking-tight uppercase">Cortes de caja</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Turnos cerrados, del más reciente al más antiguo</p>
                    <p className="text-xs text-gray-400 mt-2">Efectivo esperado = fondo inicial + ventas en efectivo − gastos.</p>
                </div>
                {rows.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No hay cortes de caja registrados.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                                <tr>
                                    <th className="px-6 py-4">Cierre</th>
                                    {selectedBranch === 'all' && <th className="px-6 py-4">Sucursal</th>}
                                    <th className="px-6 py-4">Responsable</th>
                                    <th className="px-6 py-4">Duración</th>
                                    <th className="px-6 py-4 text-right">Fondo inicial</th>
                                    <th className="px-6 py-4 text-right">Ventas</th>
                                    <th className="px-6 py-4 text-right">Efectivo esperado</th>
                                    <th className="px-6 py-4 text-right">Contado</th>
                                    <th className="px-6 py-4 text-right">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{fmt(s.endedAt)}</td>
                                        {selectedBranch === 'all' && <td className="px-6 py-4">{branchName(s.branchId)}</td>}
                                        <td className="px-6 py-4">{s.closedBy || 'Sin nombre'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{duration(s.startTime, s.endedAt)}</td>
                                        <td className="px-6 py-4 text-right tabular-nums">{formatCurrency(s.initialCash || 0)}</td>
                                        <td className="px-6 py-4 text-right tabular-nums">
                                            <div className="font-bold text-washouse-navy">{formatCurrency(s.totalSales || 0)}</div>
                                            {hasCount(s) && (
                                                <div className="text-[11px] text-gray-400 whitespace-nowrap">
                                                    Efec. {formatCurrency(s.cashSales || 0)} · Tarj. {formatCurrency(s.cardSales || 0)} · Transf. {formatCurrency(s.transferSales || 0)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums">{hasCount(s) ? formatCurrency(s.expectedDrawer || 0) : <span className="text-gray-300">—</span>}</td>
                                        <td className="px-6 py-4 text-right tabular-nums">{hasCount(s) ? formatCurrency(s.finalCash) : <span className="text-gray-300">—</span>}</td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap"><DifferenceBadge value={s.difference} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
