import { useState, useMemo } from 'react';
import { useStorage } from '../context/StorageContext';
import { useMetrics } from '../hooks/useMetrics';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Download, PieChart as PieIcon, BarChart as BarIcon, Activity } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToCSV } from '../utils/exportUtils';
import GlobalFilterBar from '../components/admin/GlobalFilterBar';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

export default function ReportsPage() {
    const { sales, expenses, branches, machines, selectedBranch } = useStorage();
    const metrics = useMetrics();
    const [dateRange, setDateRange] = useState('thisMonth'); // thisMonth, lastMonth, custom
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // Utility Costs (State for P&L)
    const [utilityEstimates, setUtilityEstimates] = useState({
        water: 1500,
        electricity: 2000,
        gas: 3000
    });

    const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

    // Date Filtering Logic
    const filterDates = useMemo(() => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        if (dateRange === 'thisMonth') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        } else if (dateRange === 'lastMonth') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        } else if (dateRange === 'custom' && customStart && customEnd) {
            start = new Date(customStart);
            end = new Date(customEnd);
            end.setHours(23, 59, 59);
        }
        return { start, end };
    }, [dateRange, customStart, customEnd]);

    // Data Processing
    const reportData = useMemo(() => {
        const { start, end } = filterDates;
        const daysInPeriod = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

        const filteredSales = sales.filter(s => {
            const date = new Date(s.date);
            return date >= start && date <= end && (selectedBranch === 'all' || s.branchId === selectedBranch);
        });

        const filteredExpenses = expenses.filter(e => {
            const date = new Date(e.timestamp);
            return date >= start && date <= end && (selectedBranch === 'all' || e.branchId === selectedBranch);
        });

        const totalIncome = filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
        const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

        // --- 1. Daily Trends ---
        const dailyMap = new Map();
        filteredSales.forEach(s => {
            const day = new Date(s.date).toLocaleDateString();
            dailyMap.set(day, (dailyMap.get(day) || 0) + (s.total || 0));
        });
        const dailyTrends = Array.from(dailyMap.entries())
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // --- 2. Revenue by Machine Type ---
        const typeMap = new Map();
        filteredSales.forEach(s => {
            const type = s.machineType || 'Otros';
            typeMap.set(type, (typeMap.get(type) || 0) + (s.total || 0));
        });
        const revenueByType = Array.from(typeMap.entries()).map(([name, value]) => ({ name, value }));

        // --- 3. Turns per Day (Productivity) ---
        // Formula: Total Usage Cycles / (Number of Machines * Days)
        const branchMachines = machines.filter(m => selectedBranch === 'all' || m.branchId === selectedBranch);
        const machineTypes = ['lavadora', 'secadora'];
        const productivity = machineTypes.map(type => {
            const count = branchMachines.filter(m => m.type === type).length || 1;
            const cycles = filteredSales.filter(s => s.machineType === type).length;
            const tpd = cycles / (count * daysInPeriod);
            return {
                type: type.charAt(0).toUpperCase() + type.slice(1),
                tpd: parseFloat(tpd.toFixed(2)),
                benchmark: 3.5 // Red line goal
            };
        });

        // --- 4. Hourly Traffic ---
        const hourMap = new Array(24).fill(0);
        filteredSales.forEach(s => {
            const hour = new Date(s.date).getHours();
            hourMap[hour]++;
        });
        const hourlyTraffic = hourMap.map((count, hour) => ({
            hour: `${hour}:00`,
            orders: count
        }));

        // --- 5. Top 5 Machines ---
        const machineIncomeMap = new Map();
        filteredSales.forEach(s => {
            if (s.machineId) {
                machineIncomeMap.set(s.machineId, (machineIncomeMap.get(s.machineId) || 0) + (s.total || 0));
            }
        });
        const topMachines = Array.from(machineIncomeMap.entries())
            .map(([id, income]) => ({
                id,
                name: machines.find(m => m.id === id)?.name || `Máquina ${id}`,
                income
            }))
            .sort((a, b) => b.income - a.income)
            .slice(0, 5);

        // --- 6. Net Profit Calculation ---
        const totalEstimatedCosts = utilityEstimates.water + utilityEstimates.electricity + utilityEstimates.gas + totalExpenses;
        const netProfit = totalIncome - totalEstimatedCosts;

        return {
            sales: filteredSales,
            expenses: filteredExpenses,
            totalIncome,
            totalExpenses,
            totalEstimatedCosts,
            netProfit,
            dailyTrends,
            revenueByType,
            productivity,
            hourlyTraffic,
            topMachines,
            daysInPeriod
        };
    }, [sales, expenses, filterDates, selectedBranch, machines, utilityEstimates]);

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <GlobalFilterBar />

            {/* Header & Controls */}
            <div className="glass-card p-10 mb-10 relative overflow-hidden group shadow-xl">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-500/10 transition-colors duration-700" />

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg text-washouse-blue">
                                <Activity size={20} strokeWidth={2.5} />
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Business Intelligence</span>
                        </div>
                        <h2 className="text-5xl font-black text-washouse-navy font-outfit tracking-tighter">Inteligencia de Negocio</h2>
                        <p className="text-sm text-gray-400 font-medium mt-1">Análisis detallado de rentabilidad y rendimiento operativo</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm ring-1 ring-black/5">
                            <Calendar size={18} className="text-washouse-blue" strokeWidth={2.5} />
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-washouse-navy focus:ring-0 cursor-pointer min-w-[140px]"
                            >
                                <option value="thisMonth">Este Mes</option>
                                <option value="lastMonth">Mes Pasado</option>
                                <option value="custom">Personalizado</option>
                            </select>
                        </div>

                        {dateRange === 'custom' && (
                            <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm ring-1 ring-black/5 animate-in slide-in-from-right-4">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="text-xs font-bold border-none bg-transparent p-0 focus:ring-0"
                                />
                                <span className="text-gray-300 font-black">/</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="text-xs font-bold border-none bg-transparent p-0 focus:ring-0"
                                />
                            </div>
                        )}

                        <Button
                            variant="primary"
                            className="rounded-2xl p-4 px-6 shadow-blue-500/20 shadow-lg group/btn"
                            onClick={() => {
                                const allTransactions = [
                                    ...reportData.sales.map(s => ({
                                        Fecha: new Date(s.date).toLocaleDateString(),
                                        Tipo: 'INGRESO',
                                        Descripcion: s.description || (s.items ? `Venta: ${Object.keys(s.items).length} items` : 'Venta General'),
                                        Sucursal: branches.find(b => b.id === s.branchId)?.name || 'N/A',
                                        Monto: s.total || 0
                                    })),
                                    ...reportData.expenses.map(e => ({
                                        Fecha: new Date(e.timestamp).toLocaleDateString(),
                                        Tipo: 'GASTO',
                                        Descripcion: e.description,
                                        Sucursal: branches.find(b => b.id === e.branchId)?.name || 'N/A',
                                        Monto: (e.amount || 0) * -1
                                    }))
                                ];
                                exportToCSV(allTransactions, `Reporte_Washouse_${new Date().toISOString().split('T')[0]}`);
                            }}
                        >
                            <Download size={18} className="group-hover/btn:translate-y-0.5 transition-transform" strokeWidth={3} />
                            <span className="ml-2 font-black uppercase tracking-widest text-[10px]">Exportar Informe</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8">
                <KpiCard
                    title="Ingresos Brutos"
                    value={formatCurrency(reportData.totalIncome)}
                    icon={TrendingUp}
                    change="+15.2%"
                    changeType="positive"
                    description="Total facturado antes de gastos y costos operativos."
                />
                <KpiCard
                    title="Costos de Operación"
                    value={formatCurrency(reportData.totalEstimatedCosts)}
                    icon={TrendingDown}
                    change="+4.3%"
                    changeType="negative"
                    description="Incluye gastos registrados mas estimación de servicios."
                />
                <KpiCard
                    title="Utilidad Neta (Est.)"
                    value={formatCurrency(reportData.netProfit)}
                    icon={DollarSign}
                    change={(reportData.netProfit / (reportData.totalIncome || 1) * 100).toFixed(1) + "%"}
                    changeType={reportData.netProfit >= 0 ? "positive" : "negative"}
                    description="Beneficio real estimado tras deducir todos los costos."
                />
                <KpiCard
                    title="Días del Periodo"
                    value={reportData.daysInPeriod}
                    suffix="Días"
                    icon={Calendar}
                    change="Ciclo Activo"
                    changeType="neutral"
                    description="Ventana de tiempo seleccionada para este reporte."
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Daily Revenue Trend */}
                <div className="lg:col-span-2 glass-card p-8 border-white/60 shadow-lg relative h-full">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Performance</p>
                            <h3 className="text-xl font-black text-washouse-navy font-outfit">Tendencia de Ingresos</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">Ventas Diarias</span>
                        </div>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={reportData.dailyTrends}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0090D7" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#0090D7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#0090D7', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="glass-card p-4 border-white/80 shadow-2xl rounded-2xl!">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
                                                    <p className="text-lg font-black text-washouse-navy font-outfit">{formatCurrency(payload[0].value)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#0090D7"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Revenue Mix (Washer vs Dryer) */}
                <div className="glass-card p-8 border-white/60 shadow-lg relative flex flex-col h-full">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Distribution</p>
                        <h3 className="text-xl font-black text-washouse-navy font-outfit mb-8">Mix de Ingresos</h3>
                    </div>

                    <div className="flex-1 relative min-h-[250px]">
                        {/* Center Value */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                            <span className="text-2xl font-black text-washouse-navy font-outfit leading-none">{formatCurrency(reportData.totalIncome)}</span>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={reportData.revenueByType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="value"
                                    animationBegin={200}
                                    animationDuration={1500}
                                >
                                    {reportData.revenueByType.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="none"
                                            className="hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="glass-card p-3 border-white/80 shadow-2xl rounded-xl!">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{payload[0].name}</p>
                                                    <p className="text-sm font-black text-washouse-navy font-outfit">{formatCurrency(payload[0].value)}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100/50">
                        <div className="flex justify-between items-center bg-blue-50/30 p-4 rounded-2xl border border-blue-100/30">
                            <div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Dominante</p>
                                <p className="text-sm font-black text-washouse-navy font-outfit">
                                    {reportData.revenueByType.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
                                </p>
                            </div>
                            <div className="p-2 bg-white rounded-lg shadow-sm text-washouse-blue">
                                <Activity size={16} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Productivity (Turns Per Machine Day) */}
                <div className="glass-card p-8 border-white/60 shadow-lg relative h-full">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Efficiency</p>
                            <h3 className="text-xl font-black text-washouse-navy font-outfit">Productividad</h3>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-full border border-red-100">Meta: 3.5</span>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.productivity} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis type="number" domain={[0, 5]} hide />
                                <YAxis
                                    dataKey="type"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={90}
                                    tick={{ fontSize: 11, fontWeight: 900, fill: '#1e293b', textTransform: 'uppercase' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)', radius: 8 }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="glass-card p-3 border-white/80 shadow-2xl rounded-xl!">
                                                    <p className="text-sm font-black text-washouse-navy font-outfit">{payload[0].value} Vueltas/Día</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="tpd" name="Vueltas/Día" radius={[0, 12, 12, 0]} barSize={40}>
                                    {reportData.productivity.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.tpd >= entry.benchmark ? '#0090D7' : '#F59E0B'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose text-center">Promedio de utilización diaria por unidad en el periodo seleccionado.</p>
                    </div>
                </div>

                {/* 4. Hourly Traffic */}
                <div className="lg:col-span-2 glass-card p-8 border-white/60 shadow-lg relative h-full">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Peak Hours</p>
                        <h3 className="text-xl font-black text-washouse-navy font-outfit mb-8">Tráfico por Hora</h3>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.hourlyTraffic}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis
                                    dataKey="hour"
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
                                    interval={2}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'rgba(37, 99, 235, 0.05)', radius: 4 }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="glass-card p-3 border-white/80 shadow-2xl rounded-xl!">
                                                    <p className="text-sm font-black text-washouse-navy font-outfit">{payload[0].value} Órdenes</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="orders" name="Órdenes" fill="#0090D7" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Simplified P&L Estimates */}
            <div className="glass-card p-12 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-blue-500/10 transition-all duration-1000" />

                <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-center">
                    <div className="flex-1 w-full">
                        <div className="mb-8">
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-2">Simulador Financiero</p>
                            <h3 className="text-3xl font-black text-washouse-navy font-outfit">Estado de Resultados</h3>
                            <p className="text-sm text-gray-400 font-medium mt-2">Ajusta los costos fijos estimados para calcular tu utilidad neta real.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Agua', key: 'water', icon: '💧' },
                                { label: 'Electricidad', key: 'electricity', icon: '⚡' },
                                { label: 'Gas', key: 'gas', icon: '🔥' }
                            ].map(item => (
                                <div key={item.key} className="bg-white/50 backdrop-blur-sm p-6 rounded-4xl border border-white shadow-sm ring-1 ring-black/5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-lg">{item.icon}</span>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</label>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="text-lg font-black text-washouse-navy mr-2 opacity-50">$</span>
                                        <input
                                            type="number"
                                            value={utilityEstimates[item.key]}
                                            onChange={e => setUtilityEstimates({ ...utilityEstimates, [item.key]: parseInt(e.target.value) || 0 })}
                                            className="bg-transparent border-none p-0 text-xl font-black text-washouse-navy font-outfit focus:ring-0 w-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:w-1/3 w-full flex flex-col items-center lg:items-end justify-center py-10 px-8 bg-blue-600 rounded-[3rem] text-white shadow-2xl shadow-blue-500/30 relative overflow-hidden group/profit">
                        <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent opacity-50" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover/profit:scale-150 transition-transform duration-1000" />

                        <div className="relative z-10 text-center lg:text-right">
                            <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] mb-4">Utilidad Est. Final</p>
                            <h4 className="text-6xl font-black font-outfit tracking-tighter mb-4 leading-none">
                                {formatCurrency(reportData.netProfit)}
                            </h4>
                            <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                                <span className={`w-2 h-2 rounded-full ${reportData.netProfit >= 0 ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`} />
                                <span className="text-xs font-black uppercase tracking-widest">
                                    {((reportData.netProfit / (reportData.totalIncome || 1)) * 100).toFixed(1)}% Margen
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Machines Table */}
            <div className="glass-card overflow-hidden border-white/60 shadow-xl">
                <div className="p-8 border-b border-gray-100/50 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Assets Performance</p>
                        <h3 className="text-xl font-black text-washouse-navy font-outfit">Top 5 Máquinas Rentables</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-2xl text-washouse-blue signature-glow">
                        <TrendingUp size={20} strokeWidth={2.5} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Puesto</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Máquina</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ingresos Generados</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/50 whitespace-nowrap">
                            {reportData.topMachines.map((m, idx) => (
                                <tr key={m.id} className="group hover:bg-gray-50/80 transition-all duration-300">
                                    <td className="px-8 py-6">
                                        <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center font-black font-outfit text-washouse-navy group-hover:bg-washouse-blue group-hover:text-white group-hover:border-washouse-blue transition-all duration-500">
                                            {idx + 1}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="text-sm font-black text-washouse-navy font-outfit uppercase tracking-tight">{m.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 font-mono mt-0.5">{m.id}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="text-lg font-black text-washouse-navy font-outfit">{formatCurrency(m.income)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
