import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import {
    Building, Package, Smartphone, Database,
    Plus, Edit2, Trash2, Download, RefreshCcw,
    ShieldCheck, MapPin, CheckCircle2
} from 'lucide-react';
import Button from '../components/ui/Button';
import BranchModal from '../components/admin/BranchModal';
import ProductModal from '../components/admin/ProductModal';
import { SERVICES_CATALOG } from '../data/catalog';

export default function SettingsPage() {
    const {
        branches, addBranch, updateBranch, deleteBranch,
        inventory, addProduct, updateProduct, deleteProduct,
        deviceBranchId, setDeviceBranch,
        syncData, logActivity
    } = useStorage();

    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [activeTab, setActiveTab] = useState('branches'); // branches, products, device, system

    const handleExportBackup = () => {
        const data = {};
        const keys = [
            'washouse_branches', 'washouse_machines', 'washouse_sales',
            'washouse_shifts', 'washouse_logs', 'washouse_inventory',
            'washouse_orders', 'washouse_expenses', 'washouse_customer_overrides'
        ];

        keys.forEach(key => {
            const val = localStorage.getItem(key);
            if (val) data[key] = JSON.parse(val);
        });

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `washouse_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        logActivity('SISTEMA_EXPORTADO', 'Backup manual de base de datos generado');
    };

    const handleResetSystem = () => {
        if (window.confirm('¿ESTÁS SEGURO? Esta acción eliminará permanentemente todos los datos de ventas, clientes y turnos de este navegador. Las sucursales se mantendrán.')) {
            const currentDeviceBranch = localStorage.getItem('washouse_device_branch');
            localStorage.clear();
            if (currentDeviceBranch) localStorage.setItem('washouse_device_branch', currentDeviceBranch);
            window.location.reload();
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-washouse-navy mb-2">Configuración del Sistema</h1>
                <p className="text-gray-500">Administra sucursales, inventario y herramientas de mantenimiento</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Vertical Tabs */}
                <div className="w-full lg:w-64 space-y-1">
                    <TabButton
                        active={activeTab === 'branches'}
                        onClick={() => setActiveTab('branches')}
                        icon={Building}
                        label="Sucursales"
                        desc="Gestionar sedes"
                    />
                    <TabButton
                        active={activeTab === 'products'}
                        onClick={() => setActiveTab('products')}
                        icon={Package}
                        label="Catálogo"
                        desc="Servicios y productos"
                    />
                    <TabButton
                        active={activeTab === 'device'}
                        onClick={() => setActiveTab('device')}
                        icon={Smartphone}
                        label="Este Dispositivo"
                        desc="App local"
                    />
                    <TabButton
                        active={activeTab === 'system'}
                        onClick={() => setActiveTab('system')}
                        icon={Database}
                        label="Mantenimiento"
                        desc="Base de datos"
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
                    {activeTab === 'branches' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-washouse-navy">Gestión de Sucursales</h2>
                                    <p className="text-sm text-gray-400">Controla las ubicaciones físicas de tu negocio</p>
                                </div>
                                <Button onClick={() => { setEditingBranch(null); setIsBranchModalOpen(true); }}>
                                    <Plus size={18} className="mr-2" /> Nueva Sucursal
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {branches.map(branch => (
                                    <div key={branch.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                                <Building className="text-washouse-blue" />
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setEditingBranch(branch); setIsBranchModalOpen(true); }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm('¿Eliminar sucursal?')) deleteBranch(branch.id); }}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-washouse-navy">{branch.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            <MapPin size={12} /> {branch.address}
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                                                Activa
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-washouse-navy">Catálogo Maestro</h2>
                                    <p className="text-sm text-gray-400">Define productos y precios base para el sistema</p>
                                </div>
                                <Button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}>
                                    <Plus size={18} className="mr-2" /> Agregar Item
                                </Button>
                            </div>

                            <div className="border rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                        <tr>
                                            <th className="px-6 py-4">Item</th>
                                            <th className="px-6 py-4">Categoría</th>
                                            <th className="px-6 py-4">Precio</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {/* Combined Services + Inventory */}
                                        {[
                                            ...SERVICES_CATALOG.map(s => ({ ...s, isService: true })),
                                            ...inventory.filter(p => !p.branchId || p.branchId === 'main')
                                        ].map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <span className="text-xl">{item.icon}</span>
                                                    <span className="font-bold text-washouse-navy">{item.name}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.isService ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-bold text-washouse-blue">${item.price}</td>
                                                <td className="px-6 py-4 text-right">
                                                    {!item.isService && (
                                                        <button
                                                            onClick={() => { setEditingProduct(item); setIsProductModalOpen(true); }}
                                                            className="p-1.5 text-gray-400 hover:text-washouse-blue"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'device' && (
                        <div className="max-w-md mx-auto py-8 text-center">
                            <div className="w-20 h-20 bg-washouse-blue/10 text-washouse-blue rounded-full flex items-center justify-center mx-auto mb-6">
                                <Smartphone size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-washouse-navy mb-2">Vinculación de Dispositivo</h2>
                            <p className="text-gray-500 mb-8">Selecciona la sucursal que este dispositivo (computadora o tablet) está operando actualmente.</p>

                            <div className="space-y-3">
                                {branches.map(branch => (
                                    <button
                                        key={branch.id}
                                        onClick={() => setDeviceBranch(branch.id)}
                                        className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${deviceBranchId === branch.id
                                            ? 'border-washouse-blue bg-washouse-blue/5 shadow-inner'
                                            : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${deviceBranchId === branch.id ? 'bg-washouse-blue animate-pulse' : 'bg-gray-300'}`}></div>
                                            <span className={`font-bold ${deviceBranchId === branch.id ? 'text-washouse-blue' : 'text-gray-600'}`}>
                                                {branch.name}
                                            </span>
                                        </div>
                                        {deviceBranchId === branch.id && <CheckCircle2 size={20} className="text-washouse-blue" />}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl text-left">
                                <p className="text-xs text-orange-800 leading-relaxed font-medium">
                                    <span className="font-black uppercase mr-1">Aviso:</span>
                                    Esto cambiará la vista de "Host" y las máquinas que este dispositivo puede controlar directamente.
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-8">
                            <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Download size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-washouse-navy mb-2">Respaldo Total</h3>
                                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                                    Descarga toda la base de datos (ventas, clientes, facturas) en un archivo JSON seguro.
                                </p>
                                <Button onClick={handleExportBackup} variant="secondary">
                                    Exportar Base de Datos
                                </Button>
                            </div>

                            <div className="p-8 bg-red-50 border border-red-100 rounded-3xl">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                                        <RefreshCcw size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-900">Reset de Fábrica</h3>
                                        <p className="text-sm text-red-700">Zona de peligro: Borra todos los datos del navegador.</p>
                                    </div>
                                </div>
                                <p className="text-xs text-red-600/70 mb-6 leading-relaxed">
                                    Utiliza esta opción solo si necesitas limpiar completamente el historial de ventas o si el sistema presenta errores graves de sincronización.
                                </p>
                                <button
                                    onClick={handleResetSystem}
                                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-sm transition-all shadow-lg shadow-red-200"
                                >
                                    Realizar Reset Maestro
                                </button>
                            </div>

                            <div className="flex items-center gap-3 justify-center text-gray-300 text-[10px] font-bold uppercase tracking-widest">
                                <ShieldCheck size={14} /> Sistema Protegido v2.0
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <BranchModal
                isOpen={isBranchModalOpen}
                onClose={() => setIsBranchModalOpen(false)}
                onSave={editingBranch ? (data) => updateBranch(editingBranch.id, data) : addBranch}
                branchToEdit={editingBranch}
            />
            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSave={editingProduct ? (data) => updateProduct(editingProduct.id, data) : addProduct}
                productToEdit={editingProduct}
            />
        </div>
    );
}

function TabButton({ active, onClick, icon: Icon, label, desc }) {
    return (
        <button
            onClick={onClick}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-left ${active
                ? 'bg-washouse-navy text-white shadow-xl shadow-washouse-navy/20 scale-[1.02]'
                : 'text-gray-400 hover:bg-gray-100'
                }`}
        >
            <div className={`p-2 rounded-xl ${active ? 'bg-white/10' : 'bg-gray-100'}`}>
                <Icon size={20} className={active ? 'text-washouse-sky' : 'text-gray-400'} />
            </div>
            <div>
                <div className={`font-bold text-sm ${active ? 'text-white' : 'text-washouse-navy'}`}>{label}</div>
                <div className={`text-[10px] uppercase font-bold tracking-tight ${active ? 'text-washouse-sky' : 'text-gray-400'}`}>{desc}</div>
            </div>
        </button>
    );
}
