import { useState, useMemo } from 'react';
import { useStorage } from '../context/StorageContext';
import { Calendar, DollarSign, TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import Button from '../components/ui/Button';
import { formatCurrency } from '../utils/formatCurrency';
import { exportToCSV } from '../utils/exportUtils';

export default function ReportsPage() {
    const { sales, expenses, branches } = useStorage();
    const [dateRange, setDateRange] = useState('thisMonth'); // thisMonth, lastMonth, custom
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('all');

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
        const netProfit = totalIncome - totalExpenses;

        return {
            sales: filteredSales,
            expenses: filteredExpenses,
            totalIncome,
            totalExpenses,
            netProfit
        };
    }, [sales, expenses, filterDates, selectedBranch]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-washouse-navy">Reportes Financieros</h2>
                    <p className="text-gray-500">Análisis detallado de ingresos y egresos</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <Filter size={16} className="text-gray-400 ml-2" />
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                        >
                            <option value="all">Todas las Sucursales</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-white border-gray-200 rounded-lg text-sm focus:ring-washouse-blue focus:border-washouse-blue"
                    >
                        <option value="thisMonth">Este Mes</option>
                        <option value="lastMonth">Mes Pasado</option>
                        <option value="custom">Personalizado</option>
                    </select>

                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-2">
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

                    <Button variant="secondary" className="ml-2" onClick={() => {
                        const allTransactions = [
                            ...reportData.sales.map(s => ({
                                Fecha: new Date(s.date).toLocaleDateString(),
                                Hora: new Date(s.date).toLocaleTimeString(),
                                Tipo: 'INGRESO',
                                Descripcion: s.items ? `Venta: ${Object.keys(s.items).length} items` : 'Venta General',
                                Sucursal: branches.find(b => b.id === s.branchId)?.name || 'N/A',
                                Monto: s.total || 0,
                                ID: s.id
                            })),
                            ...reportData.expenses.map(e => ({
                                Fecha: new Date(e.timestamp).toLocaleDateString(),
                                Hora: new Date(e.timestamp).toLocaleTimeString(),
                                Tipo: 'GASTO',
                                Descripcion: e.description,
                                Sucursal: branches.find(b => b.id === e.branchId)?.name || 'N/A',
                                Monto: (e.amount || 0) * -1,
                                ID: e.id
                            }))
                        ].sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));

                        exportToCSV(allTransactions, `Reporte_Financiero_${new Date().toISOString().split('T')[0]}`);
                    }}>
                        <Download size={16} className="mr-2" />
                        Exportar CSV
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard
                    title="Ingresos Totales"
                    value={formatCurrency(reportData.totalIncome)}
                    icon={TrendingUp}
                    changeType="positive"
                    className="border-l-4 border-l-green-500"
                />
                <KpiCard
                    title="Gastos Operativos"
                    value={formatCurrency(reportData.totalExpenses)}
                    icon={TrendingDown}
                    changeType="negative"
                    className="border-l-4 border-l-red-500"
                />
                <KpiCard
                    title="Utilidad Neta"
                    value={formatCurrency(reportData.netProfit)}
                    icon={DollarSign}
                    changeType={reportData.netProfit >= 0 ? "positive" : "negative"}
                    className={`border-l-4 ${reportData.netProfit >= 0 ? 'border-l-washouse-blue' : 'border-l-orange-500'}`}
                />
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Desglose de Movimientos</h3>
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {reportData.sales.length + reportData.expenses.length} Transacciones
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3">Tipo</th>
                                <th className="px-6 py-3">Descripción</th>
                                <th className="px-6 py-3">Sucursal</th>
                                <th className="px-6 py-3 text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(() => {
                                // Combine and sort
                                const allTransactions = [
                                    ...reportData.sales.map(s => ({ ...s, type: 'INCOME', timestamp: s.date })),
                                    ...reportData.expenses.map(e => ({ ...e, type: 'EXPENSE', timestamp: e.timestamp }))
                                ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                                if (allTransactions.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                                No hay movimientos en este periodo
                                            </td>
                                        </tr>
                                    );
                                }

                                return allTransactions.map((t, idx) => (
                                    <tr key={`${t.id}-${idx}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-3 text-gray-500">
                                            {new Date(t.timestamp).toLocaleDateString()} <span className="text-xs text-gray-400">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'INCOME' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {t.type === 'INCOME' ? 'INGRESO' : 'GASTO'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-900 font-medium">
                                            {t.description || (t.items ? `Venta: ${Object.keys(t.items).length} items` : 'Venta General')}
                                        </td>
                                        <td className="px-6 py-3 text-gray-500">
                                            {branches.find(b => b.id === t.branchId)?.name || 'N/A'}
                                        </td>
                                        <td className={`px-6 py-3 text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(Math.abs(t.amount || t.total || 0))}
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
