import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import KpiCard from '../components/ui/KpiCard';
import { useStorage } from '../context/StorageContext';
import { formatCurrency } from '../utils/formatCurrency';
import { useMetrics } from '../hooks/useMetrics';
import GlobalFilterBar from '../components/admin/GlobalFilterBar';
import BranchLockout from '../components/BranchLockout';
import {
    Activity, ArrowUpRight, Clock,
    LayoutGrid, DollarSign, ClipboardList,
    Percent, RefreshCw, History, FileText
} from 'lucide-react';
import EquipmentControlTable from '../components/admin/EquipmentControlTable';
import ServicesTable from '../components/admin/ServicesTable';
import InventoryTable from '../components/admin/InventoryTable';
import ShiftHistoryTable from '../components/admin/ShiftHistoryTable';
import ActivityLogTable from '../components/admin/ActivityLogTable';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        machines, sales, shifts, inventory, orders, activityLogs,
        selectedBranch, updateMachine, isBranchActive
    } = useStorage();

    if (selectedBranch !== 'all' && !isBranchActive(selectedBranch)) {
        return (
            <div className="max-w-7xl mx-auto pb-12">
                <GlobalFilterBar />
                <div className="mt-8">
                    <BranchLockout />
                </div>
            </div>
        );
    }

    const metrics = useMetrics();
    const isListView = location.pathname.endsWith('/equipment');
    const isShiftsView = location.pathname.endsWith('/shifts');
    const isLogsView = location.pathname.endsWith('/logs');

    const filteredShifts = useMemo(() =>
        shifts.filter(s => selectedBranch === 'all' || s.branchId === selectedBranch),
        [shifts, selectedBranch]
    );

    const filteredLogs = useMemo(() =>
        activityLogs.filter(l => selectedBranch === 'all' || l.branchId === selectedBranch),
        [activityLogs, selectedBranch]
    );

    const handleToggleMaintenance = (id) => {
        const machine = machines.find(m => m.id === id);
        if (!machine) return;
        if (machine.status === 'running' && !confirm('⚠️ La máquina está en uso. ¿Continuar?')) return;

        const newStatus = machine.status === 'maintenance' ? 'available' : 'maintenance';
        updateMachine(id, {
            status: newStatus,
            ...(newStatus === 'available' ? { timeLeft: 0, clientName: null, total: 0 } : {})
        });
    };

    const handleForceStop = (id) => {
        if (confirm('⚠️ ¿Detener forzosamente?')) updateMachine(id, { status: 'finished', timeLeft: 0 });
    };

    const handleViewDetailsFromControl = (id) => {
        const m = machines.find(x => x.id === id);
        alert(`ID: ${m.name}\nEstado: ${m.status}\nCliente: ${m.clientName || 'N/A'}`);
    };

    // Prepare chart data (Last 7 days)
    const chartData = useMemo(() => {
        const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            const daySales = metrics.filteredSales.filter(s => s.date.startsWith(dateStr));
            return {
                name: days[d.getDay()],
                sales: daySales.reduce((acc, s) => acc + (s.total || 0), 0),
                count: daySales.length
            };
        });
    }, [metrics.filteredSales]);

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <GlobalFilterBar />

            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit mb-10 shadow-inner border border-gray-200 overflow-x-auto no-scrollbar max-w-full">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${!isListView && !isShiftsView && !isLogsView ? 'bg-white text-washouse-blue shadow-md border border-blue-100/50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Activity size={16} strokeWidth={2.5} /> <span className="font-outfit font-bold">Resumen</span>
                </button>
                <button
                    onClick={() => navigate('/admin/dashboard/equipment')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${isListView ? 'bg-white text-washouse-blue shadow-md border border-blue-100/50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <LayoutGrid size={16} strokeWidth={2.5} /> <span className="font-outfit font-bold">Equipos</span>
                </button>
                <button
                    onClick={() => navigate('/admin/dashboard/shifts')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${isShiftsView ? 'bg-white text-washouse-blue shadow-md border border-blue-100/50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <History size={16} strokeWidth={2.5} /> <span className="font-outfit font-bold">Turnos</span>
                </button>
                <button
                    onClick={() => navigate('/admin/dashboard/logs')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${isLogsView ? 'bg-white text-washouse-blue shadow-md border border-blue-100/50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <FileText size={16} strokeWidth={2.5} /> <span className="font-outfit font-bold">Bitácora</span>
                </button>
            </div>

            {!isListView && !isShiftsView && !isLogsView && (
                <div className="space-y-10">
                    {metrics.alerts.length > 0 && (
                        <div className="flex flex-col gap-3 mb-8">
                            {metrics.alerts.map((alert, i) => (
                                <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border ${alert.type === 'marketing' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                                    <ArrowUpRight className={alert.type === 'marketing' ? '-rotate-45' : 'rotate-45'} size={18} />
                                    <span className="font-mono text-xs font-black tracking-widest bg-gray-100 px-3 py-1 rounded-lg text-gray-400 group-hover:text-washouse-navy transition-colors">
                                        {alert.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: {
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <KpiCard title="Ingresos" value={formatCurrency(metrics.totalIncome || 0)} icon={DollarSign} change="+12.5%" changeType="positive" />
                            <KpiCard title="Ingreso p/Máquina (RPMD)" value={formatCurrency(metrics.rpmd || 0)} icon={Activity} />
                            <KpiCard title="Ticket Promedio" value={formatCurrency(metrics.avgTicketsValue || 0)} icon={Percent} />
                            <KpiCard title="Utilización (%)" value={`${metrics.utilizationRate || 0}%`} icon={RefreshCw} change={`${metrics.avgTurnsPerDay || 0} v/d`} changeType={(metrics.utilizationRate || 0) > 40 ? 'positive' : 'neutral'} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <KpiCard
                                title="Tiempo de Respuesta"
                                value={`${metrics.avgTurnaroundTime || 0}h`}
                                icon={Clock}
                                change="Meta: 24h"
                                changeType={(metrics.avgTurnaroundTime || 0) <= 24 ? 'positive' : 'negative'}
                            />
                            <KpiCard
                                title="Tasa de Retención"
                                value={`${metrics.retentionRate || 0}%`}
                                icon={RefreshCw}
                                change="Clientes recurrentes"
                                changeType="neutral"
                            />
                            <KpiCard
                                title="Margen Operativo"
                                value={`${metrics.operatingMargin || 0}%`}
                                icon={Percent}
                                change="Ingresos vs Costos Var."
                                changeType={(metrics.operatingMargin || 0) > 50 ? 'positive' : 'neutral'}
                            />
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-card p-8 border-white/60 shadow-md group hover:shadow-xl transition-all duration-500">
                            <h3 className="text-[10px] font-mono font-bold text-gray-400 mb-8 uppercase tracking-[0.3em] opacity-60">Flujo de Ingresos (7 días)</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                                            tickFormatter={v => `$${v}`}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                        />
                                        <Bar dataKey="sales" fill="#0090D7" radius={[6, 6, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="glass-card p-8 border-white/60 shadow-md group hover:shadow-xl transition-all duration-500">
                            <h3 className="text-[10px] font-mono font-bold text-gray-400 mb-8 uppercase tracking-[0.3em] opacity-60">Volumen de Operaciones</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#0090D7"
                                            strokeWidth={4}
                                            dot={{ r: 6, fill: '#0090D7', strokeWidth: 3, stroke: '#fff' }}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isListView && (
                <div className="glass-card border-white/60 shadow-md overflow-hidden min-h-[600px]">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                        <h2 className="text-xl font-black text-washouse-navy font-outfit tracking-tight uppercase">Monitor de Equipamiento</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Estado en tiempo real por sucursal</p>
                    </div>
                    <EquipmentControlTable
                        onToggleMaintenance={handleToggleMaintenance}
                        onForceStop={handleForceStop}
                        onViewDetails={handleViewDetailsFromControl}
                    />
                </div>
            )}

            {isShiftsView && (
                <div className="glass-card border-white/60 shadow-md overflow-hidden min-h-[600px]">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                        <h2 className="text-xl font-black text-washouse-navy font-outfit tracking-tight uppercase">Historial de Turnos</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Cortes de caja y arqueos registrados</p>
                    </div>
                    <ShiftHistoryTable shifts={filteredShifts} />
                </div>
            )}

            {isLogsView && (
                <div className="glass-card border-white/60 shadow-md overflow-hidden min-h-[600px]">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                        <h2 className="text-xl font-black text-washouse-navy font-outfit tracking-tight uppercase">Bitácora de Actividad</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Registro de acciones críticas del sistema</p>
                    </div>
                    <ActivityLogTable logs={filteredLogs} />
                </div>
            )}
        </div>
    );
}
