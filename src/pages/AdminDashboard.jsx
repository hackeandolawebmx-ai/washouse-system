import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import KpiCard from '../components/ui/KpiCard';
import Tabs from '../components/ui/Tabs';
import ShiftHistoryTable from '../components/admin/ShiftHistoryTable';
import InventoryTable from '../components/admin/InventoryTable';
import ServicesTable from '../components/admin/ServicesTable';
import ProductModal from '../components/admin/ProductModal';
import ActivityLogTable from '../components/admin/ActivityLogTable';
import BranchModal from '../components/admin/BranchModal';
import { useStorage } from '../context/StorageContext';

import { useRef } from 'react';
import {
    LayoutDashboard,
    Settings,
    Users,
    Store,
    Package,
    TrendingUp,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Activity,
    Clock,
    Download,
    Upload,
    Pencil,
    Trash2,
    PackagePlus,
    ClipboardList,
    Percent
} from 'lucide-react'; // Add icons
import { formatCurrency } from '../utils/formatCurrency';

export default function AdminDashboard() {
    const { sales, shifts, inventory, orders, activityLogs, branches, addProduct, updateProduct, deleteProduct, importInventory, addBranch, updateBranch, deleteBranch, loadStandardInventory, deviceBranchId, setDeviceBranch, expenses } = useStorage();
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingBranch, setEditingBranch] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState('all');
    const fileInputRef = useRef(null);

    // Export Logic
    const handleExport = () => {
        const dataToExport = selectedBranch === 'all' ? inventory : filteredInventory;
        if (!dataToExport.length) {
            alert('No hay productos para exportar');
            return;
        }

        const headers = ['id', 'name', 'price', 'stock', 'icon', 'branchId'];
        const csvContent = "\uFEFF" + [
            headers.join(','),
            ...dataToExport.map(row => headers.map(fieldName => {
                const val = row[fieldName] || '';
                // Escape quotes and handle commas
                const stringVal = String(val).replace(/"/g, '""');
                return `"${stringVal}"`;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `inventario_${selectedBranch}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Import Logic
    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const lines = text.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());

                const products = lines.slice(1).filter(l => l.trim()).map(line => {
                    // Match quotes properly or simple split if simple CSV
                    const values = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
                    const product = {};
                    headers.forEach((h, i) => {
                        if (h === 'price' || h === 'stock') {
                            product[h] = parseFloat(values[i]) || 0;
                        } else {
                            product[h] = values[i];
                        }
                    });
                    return product;
                });

                const result = importInventory(products);
                alert(`Importación completada:\nAgregados: ${result.added}\nActualizados: ${result.updated}`);

            } catch (err) {
                console.error(err);
                alert('Error al leer el archivo CSV. Asegúrate que el formato sea correcto.');
            }
            e.target.value = ''; // Reset input
        };
        reader.readAsText(file);
    };

    // Filter data based on branch
    const filteredSales = useMemo(() =>
        selectedBranch === 'all' ? sales : sales.filter(s => s.branchId === selectedBranch),
        [sales, selectedBranch]);

    const filteredShifts = useMemo(() =>
        selectedBranch === 'all' ? shifts : shifts.filter(s => s.branchId === selectedBranch),
        [shifts, selectedBranch]);

    const filteredInventory = useMemo(() =>
        selectedBranch === 'all' ? inventory : inventory.filter(p => p.branchId === selectedBranch),
        [inventory, selectedBranch]);

    const filteredLogs = useMemo(() =>
        selectedBranch === 'all' ? activityLogs : activityLogs.filter(l => l.branchId === selectedBranch),
        [activityLogs, selectedBranch]);

    const filteredOrders = useMemo(() =>
        selectedBranch === 'all' ? orders : orders.filter(o => o.branchId === selectedBranch),
        [orders, selectedBranch]);

    const filteredExpenses = useMemo(() =>
        selectedBranch === 'all' ? expenses : expenses.filter(e => e.branchId === selectedBranch),
        [expenses, selectedBranch]);

    // Calculate metrics
    const metrics = useMemo(() => {
        if (!filteredSales.length) return { revenue: 0, count: 0, avg: 0, responseTime: '0h' };

        const totalRevenue = filteredSales.reduce((acc, sale) => acc + (sale.total || 0), 0);
        const avgTicket = totalRevenue / filteredSales.length;

        // Calculate Average Response Time
        const completedOrders = filteredOrders.filter(o => o.status === 'COMPLETED' || o.status === 'DELIVERED');
        let totalTimeMs = 0;
        let countedOrders = 0;

        completedOrders.forEach(order => {
            const start = new Date(order.createdAt).getTime();
            // Find when it was completed
            const completionEvent = order.statusHistory?.find(h => h.status === 'COMPLETED' || h.status === 'DELIVERED');

            if (completionEvent && start) {
                const end = new Date(completionEvent.timestamp).getTime();
                const diff = end - start;
                if (diff > 0) {
                    totalTimeMs += diff;
                    countedOrders++;
                }
            }
        });

        let responseTimeStr = 'N/A';
        if (countedOrders > 0) {
            const avgMs = totalTimeMs / countedOrders;
            const hours = Math.floor(avgMs / (1000 * 60 * 60));
            const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
            responseTimeStr = `${hours}h ${minutes}m`;
        }

        return {
            revenue: totalRevenue,
            count: filteredSales.length,
            avg: avgTicket,
            responseTime: responseTimeStr
        };
    }, [filteredSales, filteredOrders]);

    // Prepare chart data (Last 7 days)
    const chartData = useMemo(() => {
        const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d;
        });

        return last7Days.map(date => {
            const dayName = days[date.getDay()];
            const dateStr = date.toISOString().split('T')[0];

            // Filter sales for this day
            const dailySales = filteredSales.filter(s => s.date.startsWith(dateStr));
            const dailyTotal = dailySales.reduce((acc, s) => acc + (s.total || 0), 0);

            return {
                name: dayName,
                sales: dailyTotal,
                count: dailySales.length
            };
        });
    }, [filteredSales]);

    const tabItems = [
        {
            label: 'Resumen',
            content: (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* KPIs Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <KpiCard
                            title="Ingresos Totales"
                            value={formatCurrency(metrics.revenue)}
                            change="--%"
                            changeType="neutral"
                            icon={DollarSign}
                            description="Suma total de todas las ventas registradas en el periodo seleccionado."
                        />
                        <KpiCard
                            title="Ventas Totales"
                            value={metrics.count}
                            change="--%"
                            changeType="positive"
                            icon={Activity}
                            description="Número total de transacciones completadas (órdenes y ventas directas)."
                        />
                        <KpiCard
                            title="Ticket Promedio"
                            value={formatCurrency(metrics.avg)}
                            change="--%"
                            changeType="positive"
                            icon={Percent}
                            description="Promedio de ingreso por venta (Total Ingresos / Total Ventas)."
                        />
                        <KpiCard
                            title="Tiempo Respuesta"
                            value={metrics.responseTime}
                            change="Promedio"
                            changeType="neutral"
                            icon={Clock}
                            description="Tiempo promedio entre la recepción de la orden y su finalización."
                        />
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sales Chart */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 mb-6 uppercase tracking-wider">Ingresos (Últimos 7 días)</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                        <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(value) => `$${value}`} />
                                        <Tooltip
                                            formatter={(value) => [`$${value}`, 'Ingresos']}
                                            labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                                        />
                                        <Bar dataKey="sales" fill="#00A3E0" radius={[4, 4, 0, 0]} name="Ingresos" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Activity Chart */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-bold text-gray-500 mb-6 uppercase tracking-wider">Volumen de Ventas</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                                        <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                        <Tooltip
                                            formatter={(value) => [value, 'Ventas']}
                                            labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                                        />
                                        <Line type="monotone" dataKey="count" stroke="#5AC8BE" strokeWidth={3} dot={{ r: 4 }} name="Ventas" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            label: 'Servicios',
            content: (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold text-washouse-navy">Órdenes de Servicio</h3>
                            <p className="text-sm text-gray-500">Gestión de lavandería por encargo</p>
                        </div>
                    </div>

                    {/* Metrics could go here */}

                    <ServicesTable orders={filteredOrders || []} />
                </div>
            )
        },
        {
            label: 'Operaciones',
            content: (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    {/* Inventory Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-washouse-navy">Inventario de Productos</h3>
                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />
                                <button
                                    onClick={() => loadStandardInventory(selectedBranch)}
                                    className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                    title="Cargar productos base si faltan"
                                >
                                    <PackagePlus size={16} /> Cargar Estándar
                                </button>
                                <button
                                    onClick={handleImportClick}
                                    className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    <Upload size={16} /> Importar
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 bg-white text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    <Download size={16} /> Exportar
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingProduct(null);
                                        setIsProductModalOpen(true);
                                    }}
                                    className="bg-washouse-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    + Nuevo Producto
                                </button>
                            </div>
                        </div>
                        <InventoryTable
                            products={filteredInventory}
                            onEdit={(product) => {
                                setEditingProduct(product);
                                setIsProductModalOpen(true);
                            }}
                            onDelete={(id) => {
                                if (confirm('¿Seguro que deseas eliminar este producto?')) {
                                    deleteProduct(id);
                                }
                            }}
                        />
                    </div>

                    {/* Shift History */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-washouse-navy">Historial de Turnos</h3>
                        <ShiftHistoryTable shifts={filteredShifts} />
                    </div>
                </div>
            )
        },
        {
            label: 'Actividad',
            content: (
                <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                    {/* Activity Log */}
                    <div className="space-y-4">
                        <ActivityLogTable logs={filteredLogs} />
                    </div>

                    {/* Device Configuration */}
                    <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-bold text-washouse-navy mb-4">Configuración del Dispositivo</h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            Vincula este navegador a una sucursal específica. Esto bloqueará la vista del Host a esta ubicación.
                        </p>
                        <div className="flex items-center gap-4">
                            <select
                                value={deviceBranchId}
                                onChange={(e) => setDeviceBranch(e.target.value)}
                                className="rounded-lg border-gray-300 shadow-sm focus:border-washouse-blue focus:ring-washouse-blue"
                            >
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                                Dispositivo Vinculado
                            </span>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-washouse-navy">Dashboard Administrativo</h2>
                    <p className="text-gray-500">Métricas clave de rendimiento y operación</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-white p-1 rounded-lg border border-gray-200 flex items-center shadow-sm">
                        <span className="px-3 text-sm text-gray-500 font-medium">Sucursal:</span>
                        <select
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="border-none bg-transparent py-1 pl-2 pr-8 text-sm font-bold text-washouse-navy focus:ring-0 cursor-pointer"
                        >
                            <option value="all">Todas las Sucursales</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => {
                            const branch = branches.find(b => b.id === selectedBranch);
                            if (branch) {
                                setEditingBranch(branch);
                                setIsBranchModalOpen(true);
                            }
                        }}
                        disabled={selectedBranch === 'all'}
                        className={`p-2 rounded-lg border border-gray-200 transition-colors shadow-sm ${selectedBranch === 'all'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-washouse-blue hover:bg-blue-50'
                            }`}
                        title="Editar Sucursal"
                    >
                        <Pencil size={20} />
                    </button>
                    <button
                        onClick={() => {
                            if (selectedBranch === 'main') {
                                alert('No puedes eliminar la sucursal principal');
                                return;
                            }
                            if (confirm('¿Estás seguro de eliminar esta sucursal? Se borrarán todos sus datos (inventario, máquinas, turnos).')) {
                                deleteBranch(selectedBranch);
                                setSelectedBranch('all');
                            }
                        }}
                        disabled={selectedBranch === 'all' || selectedBranch === 'main'}
                        className={`p-2 rounded-lg border border-gray-200 transition-colors shadow-sm ${selectedBranch === 'all' || selectedBranch === 'main'
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-red-500 hover:bg-red-50'
                            }`}
                        title="Eliminar Sucursal"
                    >
                        <Trash2 size={20} />
                    </button>
                    <button
                        onClick={() => {
                            setEditingBranch(null);
                            setIsBranchModalOpen(true);
                        }}
                        className="bg-white p-2 rounded-lg border border-gray-200 text-washouse-blue hover:bg-blue-50 transition-colors shadow-sm"
                        title="Nueva Sucursal"
                    >
                        +
                    </button>
                </div>
            </div>

            <Tabs items={tabItems} />

            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                productToEdit={editingProduct}
                onSave={(product) => {
                    if (editingProduct) {
                        updateProduct(editingProduct.id, product);
                    } else {
                        addProduct(product);
                    }
                }}
            />

            <BranchModal
                isOpen={isBranchModalOpen}
                onClose={() => {
                    setIsBranchModalOpen(false);
                    setEditingBranch(null);
                }}
                branchToEdit={editingBranch}
                onSave={(branchData) => {
                    if (editingBranch) {
                        updateBranch(editingBranch.id, branchData);
                    } else {
                        addBranch(branchData);
                    }
                    setIsBranchModalOpen(false);
                    setEditingBranch(null);
                }}
            />
        </div>
    );
}
