import { useNavigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import KpiCard from '../components/ui/KpiCard';
import { useStorage } from '../context/StorageContext';
import { formatCurrency } from '../utils/formatCurrency';
import { useMetrics } from '../hooks/useMetrics';
import GlobalFilterBar from '../components/admin/GlobalFilterBar';
import {
    Activity, ArrowUpRight, Clock,
    LayoutGrid, DollarSign, ClipboardList,
    Percent, RefreshCw
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
        selectedBranch, updateMachine
    } = useStorage();

    const metrics = useMetrics();
    const isListView = location.pathname.endsWith('/equipment');

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

            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit mb-10 shadow-inner border border-gray-200">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${!isListView ? 'bg-white text-washouse-blue shadow-md border border-blue-100/50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <Activity size={16} strokeWidth={2.5} /> <span className="italic">Resumen Ejecutivo</span>
                </button>
                <button
                    onClick={() => navigate('/admin/dashboard/equipment')}
                    className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${isListView ? 'bg-white text-washouse-blue shadow-md border border-blue-100/50' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <LayoutGrid size={16} strokeWidth={2.5} /> <span className="italic">Control de Equipos</span>
                </button>
            </div>

            {!isListView ? (
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <KpiCard title="Ingresos" value={formatCurrency(metrics.totalIncome)} icon={DollarSign} change="+12.5%" changeType="positive" />
                        <KpiCard title="Órdenes Totales" value={metrics.orderCount} icon={ClipboardList} change="+5" changeType="positive" />
                        <KpiCard title="Ticket Promedio" value={formatCurrency(metrics.avgTicketsValue)} icon={Percent} />
                        <KpiCard title="Productividad" value={`${metrics.avgTurnsPerDay} v/d`} icon={RefreshCw} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="glass-card p-8 border-white/60 shadow-md group hover:shadow-xl transition-all duration-500">
                            <h3 className="text-[10px] font-black text-gray-400 mb-8 uppercase tracking-[0.3em] opacity-60">Flujo de Ingresos (7 días)</h3>
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
                            <h3 className="text-[10px] font-black text-gray-400 mb-8 uppercase tracking-[0.3em] opacity-60">Volumen de Operaciones</h3>
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
            ) : (
                <div className="glass-card border-white/60 shadow-md overflow-hidden min-h-[600px]">
                    <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                        <h2 className="text-xl font-black text-washouse-navy italic tracking-tight uppercase">Monitor de Equipamiento</h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Estado en tiempo real por sucursal</p>
                    </div>
                    <EquipmentControlTable
                        onToggleMaintenance={handleToggleMaintenance}
                        onForceStop={handleForceStop}
                        onViewDetails={handleViewDetailsFromControl}
                    />
                </div>
            )}
        </div>
    );
}
