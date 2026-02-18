import { useState, useMemo } from 'react';
import { useStorage } from '../context/StorageContext';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Filter, Download, PieChart as PieIcon, BarChart as BarIcon, Activity } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToCSV } from '../utils/exportUtils';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

export default function ReportsPage() {
    const { sales, expenses, branches, machines } = useStorage();
    const [dateRange, setDateRange] = useState('thisMonth'); // thisMonth, lastMonth, custom
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('all');

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
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
                <div>
                    <h2 className="text-2xl font-bold text-washouse-navy">Inteligencia de Negocio</h2>
                    <p className="text-gray-500">Análisis detallado de rentabilidad y rendimiento</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 flex-1 lg:flex-none">
                        <Filter size={16} className="text-gray-400 ml-2" />
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer min-w-[140px]"
                        >
                            <option value="all">Todas las Sucursales</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 flex-1 lg:flex-none">
                        <Calendar size={18} className="text-gray-400" />
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-white border-gray-200 rounded-xl text-sm font-medium focus:ring-washouse-blue focus:border-washouse-blue flex-1"
                        >
                            <option value="thisMonth">Este Mes</option>
                            <option value="lastMonth">Mes Pasado</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="text-sm rounded-lg border-gray-200"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="text-sm rounded-lg border-gray-200"
                            />
                        </div>
                    )}

                    <Button variant="secondary" onClick={() => {
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
                    }}>
                        <Download size={18} />
                    </Button>
                </div>
            </div>

            {/* Main KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard
                    title="Ingresos Brutos"
                    value={formatCurrency(reportData.totalIncome)}
                    icon={TrendingUp}
                    changeType="positive"
                    className="bg-white border-none shadow-sm ring-1 ring-gray-100"
                />
                <KpiCard
                    title="Costos de Operación"
                    value={formatCurrency(reportData.totalEstimatedCosts)}
                    icon={TrendingDown}
                    changeType="negative"
                    className="bg-white border-none shadow-sm ring-1 ring-gray-100"
                />
                <KpiCard
                    title="Utilidad Neta (Est.)"
                    value={formatCurrency(reportData.netProfit)}
                    icon={DollarSign}
                    changeType={reportData.netProfit >= 0 ? "positive" : "negative"}
                    className={`${reportData.netProfit >= 0 ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'} border-none shadow-lg`}
                    valueClassName={reportData.netProfit >= 0 ? 'text-white' : 'text-white'}
                />
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-400">Días del Periodo</span>
                        <div className="p-2 bg-gray-50 rounded-lg"><Calendar size={18} className="text-gray-400" /></div>
                    </div>
                    <div>
                        <div className="text-2xl font-black text-washouse-navy">{reportData.daysInPeriod} Días</div>
                        <div className="text-xs text-gray-500 mt-1">Sincronizado hoy</div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Daily Revenue Trend */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-washouse-navy flex items-center gap-2"><TrendingUp size={18} /> Tendencia de Ingresos</h3>
                        <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Ventas Diarias</span>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={reportData.dailyTrends}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" hide />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(val) => formatCurrency(val)}
                                />
                                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Revenue Mix (Washer vs Dryer) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-washouse-navy mb-6 flex items-center gap-2"><PieIcon size={18} /> Mix de Ingresos</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={reportData.revenueByType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {reportData.revenueByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val) => formatCurrency(val)} />
                                <Legend verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 pt-4 border-t text-center">
                        <div className="text-sm font-medium text-gray-500">Categoría Dominante</div>
                        <div className="text-lg font-bold text-washouse-blue uppercase">
                            {reportData.revenueByType.sort((a, b) => b.value - a.value)[0]?.name || '---'}
                        </div>
                    </div>
                </div>

                {/* 3. Productivity (Turns Per Machine Day) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-washouse-navy flex items-center gap-2"><Activity size={18} /> Productividad (Vueltas)</h3>
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Meta: 3.5</span>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.productivity} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="type" type="category" axisLine={false} tickLine={false} width={80} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="tpd" name="Vueltas/Día" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 italic text-center text-balance leading-tight">Vueltas promedio por máquina al día en el periodo de {reportData.daysInPeriod} días.</p>
                </div>

                {/* 4. Hourly Traffic */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-washouse-navy mb-6 flex items-center gap-2"><BarIcon size={18} /> Horas de Mayor Tráfico</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.hourlyTraffic}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="hour" tick={{ fontSize: 9 }} interval={2} />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none' }}
                                />
                                <Bar dataKey="orders" name="Órdenes" fill="#2563eb" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Simplified P&L Estimates */}
            <div className="bg-blue-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Estado de Resultados (Estimado)</h3>
                        <p className="text-blue-200 mb-6 max-w-md">Calcula tu utilidad neta real ajustando los costos fijos mensuales de servicios básicos.</p>

                        <div className="space-y-4 max-w-sm">
                            <div className="flex justify-between items-center group">
                                <label className="text-sm font-medium text-blue-100">Agua (Mensual)</label>
                                <input
                                    type="number"
                                    value={utilityEstimates.water}
                                    onChange={e => setUtilityEstimates({ ...utilityEstimates, water: parseInt(e.target.value) || 0 })}
                                    className="bg-blue-800/50 border-blue-700 rounded-lg p-2 text-right w-24 font-bold text-white outline-none focus:ring-2 ring-blue-400"
                                />
                            </div>
                            <div className="flex justify-between items-center group">
                                <label className="text-sm font-medium text-blue-100">Electricidad (Mensual)</label>
                                <input
                                    type="number"
                                    value={utilityEstimates.electricity}
                                    onChange={e => setUtilityEstimates({ ...utilityEstimates, electricity: parseInt(e.target.value) || 0 })}
                                    className="bg-blue-800/50 border-blue-700 rounded-lg p-2 text-right w-24 font-bold text-white outline-none focus:ring-2 ring-blue-400"
                                />
                            </div>
                            <div className="flex justify-between items-center group">
                                <label className="text-sm font-medium text-blue-100">Gas (Mensual)</label>
                                <input
                                    type="number"
                                    value={utilityEstimates.gas}
                                    onChange={e => setUtilityEstimates({ ...utilityEstimates, gas: parseInt(e.target.value) || 0 })}
                                    className="bg-blue-800/50 border-blue-700 rounded-lg p-2 text-right w-24 font-bold text-white outline-none focus:ring-2 ring-blue-400"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-center lg:items-end">
                        <div className="text-center lg:text-right">
                            <div className="text-sm text-blue-300 font-medium mb-1">Tu Utilidad Estimada</div>
                            <div className="text-5xl lg:text-7xl font-black mb-4 tracking-tighter">
                                {formatCurrency(reportData.netProfit)}
                            </div>
                            <div className="flex items-center gap-2 justify-center lg:justify-end text-sm">
                                <div className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full font-bold border border-green-500/30">
                                    {((reportData.netProfit / (reportData.totalIncome || 1)) * 100).toFixed(1)}% Margen
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Machines Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-washouse-navy flex items-center gap-2">Top 5 Máquinas Rentables</h3>
                    <TrendingUp size={16} className="text-blue-500" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Máquina</th>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4 text-right">Ingresos Generados</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reportData.topMachines.map((m, idx) => (
                                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-800 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                                            #{idx + 1}
                                        </div>
                                        {m.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{m.id}</td>
                                    <td className="px-6 py-4 text-right font-black text-blue-600">{formatCurrency(m.income)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
