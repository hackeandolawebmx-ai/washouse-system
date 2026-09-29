import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStorage } from '../context/StorageContext';
import {
    Building, Smartphone, Database, Receipt, ClipboardList,
    Plus, Edit2, Trash2, Download, RefreshCcw,
    ShieldCheck, MapPin, CheckCircle2
} from 'lucide-react';
import Button from '../components/ui/Button';
import BranchModal from '../components/admin/BranchModal';
import ActivityLogTable from '../components/admin/ActivityLogTable';

const TAB_IDS = ['branches', 'tax', 'logs', 'device', 'system'];
export default function SettingsPage() {
    const {
        branches, addBranch, updateBranch, deleteBranch,
        inventory,
        deviceBranchId, setDeviceBranch,
        taxConfig, updateTaxConfig,
        syncData, logActivity, BRANCH_LICENSES, isBranchActive,
        machines, sales, shifts, orders, expenses, customerOverrides, activityLogs
    } = useStorage();

    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = TAB_IDS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'branches';
    const setActiveTab = (tab) => setSearchParams(tab === 'branches' ? {} : { tab }, { replace: true });

    const handleExportBackup = () => {
        // Data now lives in Supabase; export straight from context state
        // rather than localStorage, which only holds branches/machines cache.
        const data = {
            washouse_branches: branches,
            washouse_machines: machines,
            washouse_sales: sales,
            washouse_shifts: shifts,
            washouse_logs: activityLogs,
            washouse_inventory: inventory,
            washouse_orders: orders,
            washouse_expenses: expenses,
            washouse_customer_overrides: customerOverrides
        };

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
        // Ventas, órdenes, inventario, gastos, turnos y personal viven en Supabase;
        // esto solo limpia la caché local del navegador (sesión, filtros, etc.),
        // no borra datos del negocio.
        if (window.confirm('Esto cerrará la sesión y limpiará la caché local de este navegador. Los datos del negocio (ventas, órdenes, inventario, etc.) están en la nube y no se verán afectados. ¿Continuar?')) {
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
                <p className="text-gray-500">Sucursales, IVA, bitácora y herramientas de este equipo</p>
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
                        active={activeTab === 'tax'}
                        onClick={() => setActiveTab('tax')}
                        icon={Receipt}
                        label="IVA"
                        desc="Cómo se cobra"
                    />
                    <TabButton
                        active={activeTab === 'logs'}
                        onClick={() => setActiveTab('logs')}
                        icon={ClipboardList}
                        label="Bitácora"
                        desc="Actividad del sistema"
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
                                {branches.map(branch => {
                                    const license = BRANCH_LICENSES[branch.id];
                                    const isSuspended = license?.status === 'suspended';

                                    return (
                                        <div key={branch.id} className={`p-5 rounded-2xl border transition-all group ${isSuspended ? 'bg-red-50/30 border-red-100 opacity-80' : 'border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 rounded-xl shadow-sm ${isSuspended ? 'bg-red-100 text-red-600' : 'bg-white text-washouse-blue'}`}>
                                                    <Building />
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
                                            <h3 className={`font-bold transition-colors ${isSuspended ? 'text-red-900 line-through decoration-red-300' : 'text-washouse-navy'}`}>
                                                {branch.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <MapPin size={12} /> {branch.address}
                                            </p>

                                            {isSuspended ? (
                                                <div className="mt-6 space-y-3">
                                                    <span className="text-[10px] font-black bg-red-600 text-white px-3 py-1.5 rounded-xl uppercase flex items-center gap-2 w-fit shadow-lg shadow-red-200">
                                                        Licencia Suspendida
                                                    </span>
                                                    <a
                                                        href={`https://wa.me/528186811851?text=Hola!%20Deseo%20reactivar%20la%20licencia%20de%20mi%20sucursal:%20${encodeURIComponent(branch.name)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
                                                    >
                                                        <Smartphone size={14} /> Solicitar Reactivación
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                                        <ShieldCheck size={10} /> Licencia Activa
                                                    </span>
                                                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase">
                                                        Corte: {license?.expires || 'N/A'}
                                                    </span>
                                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">
                                                        ${(branch.waterCostPerCycle || 0) + (branch.electricityCostPerCycle || 0) + (branch.gasCostPerCycle || 0)}/Ciclo
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tax' && (
                        <div className="max-w-2xl py-2">
                            <h2 className="text-2xl font-black text-washouse-navy mb-1">Modelo de IVA</h2>
                            <p className="text-gray-500 mb-8">Define cómo se cobra el IVA en el mostrador.</p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => updateTaxConfig({ mode: 'added_on_invoice' })}
                                    className={`w-full text-left p-6 rounded-3xl border-2 transition-all ${taxConfig.mode === 'added_on_invoice'
                                        ? 'border-washouse-blue bg-blue-50/50 ring-4 ring-blue-500/10'
                                        : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-black text-washouse-navy">Se agrega al facturar</span>
                                        {taxConfig.mode === 'added_on_invoice' && (
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-washouse-blue text-white px-3 py-1 rounded-full">Activo</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Los precios del catálogo son sin IVA. En el paso de pago se pregunta si el
                                        cliente requiere factura y, de ser así, se le suma el {Math.round(taxConfig.rate * 100)}%.
                                    </p>
                                </button>

                                <button
                                    onClick={() => updateTaxConfig({ mode: 'included' })}
                                    className={`w-full text-left p-6 rounded-3xl border-2 transition-all ${taxConfig.mode === 'included'
                                        ? 'border-washouse-blue bg-blue-50/50 ring-4 ring-blue-500/10'
                                        : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-black text-washouse-navy">IVA incluido en los precios</span>
                                        {taxConfig.mode === 'included' && (
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-washouse-blue text-white px-3 py-1 rounded-full">Activo</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Un solo precio para todos. Las facturas desglosan el IVA hacia atrás, sin
                                        cambiar el monto que paga el cliente.
                                    </p>
                                </button>

                                <div className="p-6 rounded-3xl border border-gray-100 bg-white">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                                        Tasa de IVA
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.5"
                                            value={Math.round(taxConfig.rate * 1000) / 10}
                                            onChange={e => {
                                                const pct = parseFloat(e.target.value);
                                                if (!isNaN(pct) && pct >= 0 && pct <= 100) {
                                                    updateTaxConfig({ rate: pct / 100 });
                                                }
                                            }}
                                            className="w-32 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-washouse-blue/20 font-black text-lg"
                                        />
                                        <span className="font-black text-gray-400 text-lg">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-xl font-bold text-washouse-navy">Bitácora de actividad</h2>
                                <p className="text-sm text-gray-400">Aperturas y cierres de turno, accesos de administrador y cambios importantes.</p>
                            </div>
                            <ActivityLogTable logs={activityLogs} />
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
                                {branches.filter(b => isBranchActive(b.id)).map(branch => (
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
                                    Esto cambia la sucursal que muestra el mostrador en este dispositivo y las máquinas que puede operar.
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
                                        <p className="text-sm text-red-700">Limpia la sesión y caché local de este dispositivo.</p>
                                    </div>
                                </div>
                                <p className="text-xs text-red-600/70 mb-6 leading-relaxed">
                                    Los datos del negocio (ventas, órdenes, inventario, facturas) viven en Supabase y no se ven afectados. Utiliza esta opción solo si este dispositivo presenta errores de sesión o sincronización local.
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
