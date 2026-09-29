import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    DollarSign, ClipboardList, Clock, Receipt, TrendingUp, Download,
    Banknote, CreditCard, ArrowLeftRight, MessageCircle, WashingMachine, History, ChevronRight
} from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToCSV } from '../utils/exportUtils';
import { periodRange, inRange, daysInRange, localDayKey, PERIOD_OPTIONS } from '../utils/periods';
import GlobalFilterBar from '../components/admin/GlobalFilterBar';
import BranchLockout from '../components/BranchLockout';
import { DifferenceBadge } from './ShiftsPage';

const METHODS = [
    { id: 'cash', label: 'Efectivo', icon: Banknote, color: 'bg-emerald-500' },
    { id: 'card', label: 'Tarjeta', icon: CreditCard, color: 'bg-blue-500' },
    { id: 'transfer', label: 'Transferencia', icon: ArrowLeftRight, color: 'bg-purple-500' }
];

const MACHINE_STATES = [
    { id: 'available', label: 'Libres', color: 'text-emerald-600' },
    { id: 'running', label: 'En uso', color: 'text-washouse-blue' },
    { id: 'finished', label: 'Por liberar', color: 'text-amber-600' },
    { id: 'maintenance', label: 'Mantenimiento', color: 'text-red-600' }
];

const daysSince = (date) => Math.max(0, Math.floor((Date.now() - new Date(date)) / 86400000));

export default function AdminDashboard() {
    const {
        sales, expenses, orders, machines, shifts, branches,
        selectedBranch, isBranchActive
    } = useStorage();

    const [period, setPeriod] = useState('month');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const range = useMemo(() => periodRange(period, customStart, customEnd), [period, customStart, customEnd]);
    const periodLabel = PERIOD_OPTIONS.find(o => o.id === period)?.label || '';
    const inBranch = (item) => selectedBranch === 'all' || item.branchId === selectedBranch;
    const branchName = (id) => (branches.find(b => b.id === id)?.name || id || '').replace(/^Washouse\s+/i, '');

    const data = useMemo(() => {
        const periodSales = sales.filter(s => inBranch(s) && inRange(s.date, range));
        const periodExpenses = expenses.filter(e => inBranch(e) && inRange(e.timestamp, range));
        const periodOrders = orders.filter(o => inBranch(o) && inRange(o.createdAt, range));

        const income = periodSales.reduce((acc, s) => acc + (s.amount || 0), 0);
        const expenseTotal = periodExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

        const byMethod = METHODS.map(m => ({
            ...m,
            total: periodSales.filter(s => s.method === m.id).reduce((acc, s) => acc + (s.amount || 0), 0)
        }));
        const otherMethods = income - byMethod.reduce((acc, m) => acc + m.total, 0);

        const paidOrders = periodOrders.filter(o => (o.balanceDue || 0) <= 0);

        // Por cobrar es un saldo: cuenta todo lo que se debe hoy, sin importar
        // en qué periodo se registró la orden.
        const receivables = orders
            .filter(o => inBranch(o) && (o.balanceDue || 0) > 0)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        const dailyTotals = new Map(daysInRange(range).map(d => [d, 0]));
        periodSales.forEach(s => {
            const key = localDayKey(s.date);
            if (dailyTotals.has(key)) dailyTotals.set(key, dailyTotals.get(key) + (s.amount || 0));
        });
        const daily = Array.from(dailyTotals.entries()).map(([key, total]) => {
            const [, m, d] = key.split('-');
            return { name: `${Number(d)}/${Number(m)}`, total };
        });

        const branchMachines = machines.filter(inBranch);
        const machineCounts = MACHINE_STATES.map(st => ({
            ...st,
            count: branchMachines.filter(m => m.status === st.id).length
        }));

        const lastShiftByBranch = new Map();
        shifts
            .filter(s => inBranch(s) && s.endedAt)
            .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
            .forEach(s => { if (!lastShiftByBranch.has(s.branchId)) lastShiftByBranch.set(s.branchId, s); });

        return {
            periodSales,
            periodExpenses,
            income,
            expenseTotal,
            profit: income - expenseTotal,
            byMethod,
            otherMethods,
            orderCount: periodOrders.length,
            paidCount: paidOrders.length,
            pendingCount: periodOrders.length - paidOrders.length,
            receivables,
            receivableTotal: receivables.reduce((acc, o) => acc + (o.balanceDue || 0), 0),
            daily,
            machineCounts,
            machineTotal: branchMachines.length,
            lastShifts: Array.from(lastShiftByBranch.values())
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sales, expenses, orders, machines, shifts, selectedBranch, range]);

    if (selectedBranch !== 'all' && !isBranchActive(selectedBranch)) {
        return (
            <div className="max-w-7xl mx-auto pb-12">
                <GlobalFilterBar />
                <div className="mt-8"><BranchLockout /></div>
            </div>
        );
    }

    const handleExport = () => {
        exportToCSV([
            ...data.periodSales.map(s => ({
                Fecha: new Date(s.date).toLocaleString('es-MX'),
                Tipo: 'INGRESO',
                Metodo: METHODS.find(m => m.id === s.method)?.label || s.method || '',
                Descripcion: s.description || 'Venta',
                Sucursal: branchName(s.branchId),
                Monto: s.amount || 0
            })),
            ...data.periodExpenses.map(e => ({
                Fecha: new Date(e.timestamp).toLocaleString('es-MX'),
                Tipo: 'GASTO',
                Metodo: '',
                Descripcion: e.description,
                Sucursal: branchName(e.branchId),
                Monto: -(e.amount || 0)
            }))
        ], `Washouse_${localDayKey(range.start)}_a_${localDayKey(range.end)}`);
    };

    return (
        <div className="max-w-7xl mx-auto pb-12 space-y-8">
            <GlobalFilterBar
                period={period}
                onPeriodChange={setPeriod}
                customStart={customStart}
                customEnd={customEnd}
                onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }}
            >
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-washouse-blue text-white rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-washouse-navy transition-colors"
                >
                    <Download size={16} strokeWidth={2.5} /> Exportar
                </button>
            </GlobalFilterBar>

            {/* Tarjetas principales */}
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
                <StatCard icon={DollarSign} label="Ingresos" value={formatCurrency(data.income)} note={periodLabel} />
                <StatCard
                    icon={ClipboardList}
                    label="Órdenes"
                    value={data.orderCount}
                    note={`${data.paidCount} pagadas · ${data.pendingCount} con saldo`}
                />
                <StatCard
                    icon={Clock}
                    label="Por cobrar"
                    value={formatCurrency(data.receivableTotal)}
                    note={`${data.receivables.length} ${data.receivables.length === 1 ? 'orden' : 'órdenes'} · al día de hoy`}
                    tone={data.receivableTotal > 0 ? 'amber' : 'neutral'}
                />
                <StatCard icon={Receipt} label="Gastos" value={formatCurrency(data.expenseTotal)} note="Registrados en caja" />
                <StatCard
                    icon={TrendingUp}
                    label="Utilidad"
                    value={formatCurrency(data.profit)}
                    note="Ingresos − gastos registrados"
                    tone={data.profit < 0 ? 'red' : 'green'}
                    className="col-span-2 xl:col-span-1"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Ingresos por día */}
                <section className="lg:col-span-2 glass-card p-6 border-white/60 shadow-md">
                    <h3 className="text-sm font-black text-washouse-navy uppercase tracking-widest mb-6">Ingresos por día</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.daily}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} interval="preserveStartEnd" minTickGap={12} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} tickFormatter={v => `$${v}`} width={56} />
                                <Tooltip formatter={(v) => [formatCurrency(v), 'Ingresos']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="total" fill="#0090D7" radius={[6, 6, 0, 0]} maxBarSize={32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Por método de pago */}
                <section className="glass-card p-6 border-white/60 shadow-md">
                    <h3 className="text-sm font-black text-washouse-navy uppercase tracking-widest mb-6">Por método de pago</h3>
                    <div className="space-y-5">
                        {data.byMethod.map(m => {
                            const pct = data.income > 0 ? (m.total / data.income) * 100 : 0;
                            return (
                                <div key={m.id}>
                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                        <span className="flex items-center gap-2 font-bold text-gray-600"><m.icon size={16} /> {m.label}</span>
                                        <span className="font-black text-washouse-navy tabular-nums">{formatCurrency(m.total)}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                        <div className={`h-full ${m.color}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                        {data.otherMethods > 0.009 && (
                            <p className="text-xs text-gray-400">Otros métodos: {formatCurrency(data.otherMethods)}</p>
                        )}
                        <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                            Solo el efectivo entra al cajón; tarjeta y transferencia se cuadran contra el banco.
                        </p>
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Por cobrar */}
                <section className="lg:col-span-2 glass-card p-6 border-white/60 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-washouse-navy uppercase tracking-widest">Por cobrar</h3>
                        <span className="text-sm font-black text-amber-700 tabular-nums">{formatCurrency(data.receivableTotal)}</span>
                    </div>
                    {data.receivables.length === 0 ? (
                        <p className="text-sm text-gray-400 py-8 text-center">Ninguna orden tiene saldo pendiente.</p>
                    ) : (
                        <div className="max-h-80 overflow-y-auto -mx-2 custom-scrollbar">
                            <table className="w-full text-sm">
                                <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="text-left px-2 py-2">Cliente</th>
                                        <th className="text-left px-2 py-2 hidden sm:table-cell">Folio</th>
                                        {selectedBranch === 'all' && <th className="text-left px-2 py-2 hidden md:table-cell">Sucursal</th>}
                                        <th className="text-right px-2 py-2">Días</th>
                                        <th className="text-right px-2 py-2">Saldo</th>
                                        <th className="px-2 py-2"><span className="sr-only">WhatsApp</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.receivables.map(o => {
                                        const days = daysSince(o.createdAt);
                                        const phone = (o.customerPhone || '').replace(/\D/g, '');
                                        const msg = `Hola ${o.customerName}, te recordamos que tu orden *${o.id}* en Washouse tiene un saldo pendiente de ${formatCurrency(o.balanceDue)}. ¡Gracias!`;
                                        return (
                                            <tr key={o.id}>
                                                <td className="px-2 py-2.5 font-bold text-washouse-navy">{o.customerName}</td>
                                                <td className="px-2 py-2.5 font-mono text-xs text-gray-500 hidden sm:table-cell">{o.id}</td>
                                                {selectedBranch === 'all' && <td className="px-2 py-2.5 text-xs text-gray-500 hidden md:table-cell">{branchName(o.branchId)}</td>}
                                                <td className={`px-2 py-2.5 text-right tabular-nums font-bold ${days >= 7 ? 'text-red-600' : 'text-gray-500'}`}>{days}</td>
                                                <td className="px-2 py-2.5 text-right tabular-nums font-black text-amber-700">{formatCurrency(o.balanceDue)}</td>
                                                <td className="px-2 py-2.5 text-right">
                                                    {phone && (
                                                        <a
                                                            href={`https://wa.me/52${phone}?text=${encodeURIComponent(msg)}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Recordar por WhatsApp"
                                                            className="inline-flex p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50"
                                                        >
                                                            <MessageCircle size={16} />
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <div className="space-y-6">
                    {/* Equipos */}
                    <section className="glass-card p-6 border-white/60 shadow-md">
                        <SectionLink to="/admin/equipment" icon={WashingMachine} title="Equipos" />
                        <div className="grid grid-cols-2 gap-3">
                            {data.machineCounts.map(st => (
                                <div key={st.id} className="rounded-xl bg-gray-50 px-3 py-2.5">
                                    <div className={`text-2xl font-black tabular-nums ${st.count > 0 ? st.color : 'text-gray-300'}`}>{st.count}</div>
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{st.label}</div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Último corte */}
                    <section className="glass-card p-6 border-white/60 shadow-md">
                        <SectionLink to="/admin/shifts" icon={History} title="Último corte de caja" />
                        {data.lastShifts.length === 0 ? (
                            <p className="text-sm text-gray-400">Aún no hay cortes registrados.</p>
                        ) : (
                            <div className="space-y-3">
                                {data.lastShifts.map(s => (
                                    <div key={s.id} className="text-sm">
                                        {selectedBranch === 'all' && <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{branchName(s.branchId)}</div>}
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-washouse-navy">{s.closedBy || 'Sin nombre'}</span>
                                            <span className="font-black tabular-nums">{formatCurrency(s.totalSales || 0)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">{new Date(s.endedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                            <DifferenceBadge value={s.difference} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

const TONES = {
    neutral: 'text-washouse-navy',
    amber: 'text-amber-700',
    green: 'text-emerald-700',
    red: 'text-red-600'
};

function StatCard({ icon: Icon, label, value, note, tone = 'neutral', className = '' }) {
    return (
        <div className={`glass-card p-4 sm:p-5 border-white/60 shadow-md flex flex-col gap-3 min-w-0 ${className}`}>
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] truncate">{label}</span>
                <Icon size={18} className="text-washouse-blue shrink-0" strokeWidth={2.5} />
            </div>
            <div className={`text-2xl sm:text-3xl font-black font-outfit tracking-tighter tabular-nums leading-none ${TONES[tone]}`}>{value}</div>
            <div className="text-xs font-bold text-gray-400">{note}</div>
        </div>
    );
}

function SectionLink({ to, icon: Icon, title }) {
    return (
        <Link to={to} className="flex items-center justify-between mb-4 group">
            <h3 className="flex items-center gap-2 text-sm font-black text-washouse-navy uppercase tracking-widest">
                <Icon size={16} className="text-washouse-blue" /> {title}
            </h3>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-washouse-blue transition-colors" />
        </Link>
    );
}
