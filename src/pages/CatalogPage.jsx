import { useState } from 'react';
import { Plus, Edit2, Trash2, Zap } from 'lucide-react';
import { useStorage } from '../context/StorageContext';
import Button from '../components/ui/Button';
import ProductModal from '../components/admin/ProductModal';
import ServiceModal from '../components/admin/ServiceModal';
import { formatCurrency } from '../utils/formatCurrency';
import { USUARIO_ADMIN } from '../utils/labels';

const CATEGORIES = {
    self_service: 'Autoservicio',
    wash: 'Lavado',
    special: 'Especiales',
    iron: 'Planchado',
    fixing: 'Compostura'
};

const TABS = [
    { id: 'services', label: 'Servicios' },
    { id: 'inventory', label: 'Insumos' }
];

export default function CatalogPage() {
    const {
        branches, isBranchActive,
        inventory, addProduct, updateProduct, loadStandardInventoryInAllBranches,
        services, addService, updateService, deleteService
    } = useStorage();

    const [tab, setTab] = useState('services');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editingService, setEditingService] = useState(null);
    const [inventoryBranch, setInventoryBranch] = useState('all');

    const branchName = (id) => (branches.find(b => b.id === id)?.name || id || '').replace(/^Washouse\s+/i, '');

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="mb-6">
                <h1 className="text-3xl font-black text-washouse-navy mb-1">Precios y catálogo</h1>
                <p className="text-gray-500">Lo que se cobra en el mostrador. Los cambios aplican a las órdenes nuevas; las ya registradas conservan su precio.</p>
            </div>

            <div className="flex gap-2 mb-6" role="tablist">
                {TABS.map(t => (
                    <button
                        key={t.id}
                        role="tab"
                        aria-selected={tab === t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${tab === t.id ? 'bg-washouse-navy text-white' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                {tab === 'services' && (
                    <div className="space-y-6">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <p className="text-sm text-gray-400">Iguales en todas las sucursales.</p>
                            <Button onClick={() => { setEditingService(null); setIsServiceModalOpen(true); }}>
                                <Plus size={18} className="mr-2" /> Nuevo servicio
                            </Button>
                        </div>

                        <div className="border rounded-2xl overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th className="px-6 py-4">Servicio</th>
                                        <th className="px-6 py-4">Categoría</th>
                                        <th className="px-6 py-4">Se cobra por</th>
                                        <th className="px-6 py-4 text-right">Precio</th>
                                        <th className="px-6 py-4 text-right"><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {services.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-3">
                                                    <span className="text-xl">{item.icon}</span>
                                                    <span className="font-bold text-washouse-navy">{item.name}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700">
                                                    {CATEGORIES[item.category] || item.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">{item.type === 'weight' ? 'Kilo' : 'Pieza'}</td>
                                            <td className="px-6 py-4 text-right font-bold text-washouse-blue tabular-nums whitespace-nowrap">
                                                {item.weightBrackets?.length > 0 && <span className="text-gray-400 text-xs font-bold mr-1">Desde</span>}
                                                {formatCurrency(item.price)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-1 justify-end">
                                                    <button
                                                        onClick={() => { setEditingService(item); setIsServiceModalOpen(true); }}
                                                        className="p-1.5 text-gray-400 hover:text-washouse-blue"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => { if (confirm(`¿Eliminar "${item.name}"?`)) deleteService(item.id); }}
                                                        className="p-1.5 text-gray-400 hover:text-red-600"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'inventory' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <p className="text-sm text-gray-400">Existencias y precio de venta por sucursal.</p>
                            <div className="flex flex-wrap items-center gap-3">
                                <select
                                    value={inventoryBranch}
                                    onChange={(e) => setInventoryBranch(e.target.value)}
                                    aria-label="Sucursal"
                                    className="text-xs font-bold bg-gray-100 border-none rounded-xl px-4 py-2.5 text-gray-600"
                                >
                                    <option value="all">Todas las sucursales</option>
                                    {branches.filter(b => isBranchActive(b.id)).map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <Button variant="secondary" onClick={() => loadStandardInventoryInAllBranches()}>
                                    <Zap size={18} className="mr-2" /> Cargar en todas
                                </Button>
                                <Button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}>
                                    <Plus size={18} className="mr-2" /> Agregar insumo
                                </Button>
                            </div>
                        </div>

                        <div className="border rounded-2xl overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th className="px-6 py-4">Insumo</th>
                                        {inventoryBranch === 'all' && <th className="px-6 py-4">Sucursal</th>}
                                        <th className="px-6 py-4 text-right">Existencia</th>
                                        <th className="px-6 py-4 text-right">Costo</th>
                                        <th className="px-6 py-4 text-right">Precio</th>
                                        <th className="px-6 py-4 text-right"><span className="sr-only">Acciones</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {inventory
                                        .filter(p => inventoryBranch === 'all' || p.branchId === inventoryBranch)
                                        .map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <span className="flex items-center gap-3">
                                                        <span className="text-xl">{item.icon}</span>
                                                        <span className="font-bold text-washouse-navy">{item.name}</span>
                                                    </span>
                                                </td>
                                                {inventoryBranch === 'all' && (
                                                    <td className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">{branchName(item.branchId)}</td>
                                                )}
                                                <td className={`px-6 py-4 text-right tabular-nums font-bold ${item.stock <= 5 ? 'text-red-500' : 'text-gray-600'}`}>{item.stock}</td>
                                                <td className="px-6 py-4 text-right tabular-nums text-gray-400">{formatCurrency(item.cost || 0)}</td>
                                                <td className="px-6 py-4 text-right tabular-nums font-bold text-washouse-blue">{formatCurrency(item.price)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => { setEditingProduct(item); setIsProductModalOpen(true); }}
                                                        className="p-1.5 text-gray-400 hover:text-washouse-blue"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSave={editingProduct ? (data) => updateProduct(editingProduct.id, data) : (data) => addProduct(data, USUARIO_ADMIN, inventoryBranch === 'all' ? 'main' : inventoryBranch)}
                productToEdit={editingProduct}
                branchId={inventoryBranch === 'all' ? (editingProduct?.branchId || 'main') : inventoryBranch}
            />
            <ServiceModal
                isOpen={isServiceModalOpen}
                onClose={() => setIsServiceModalOpen(false)}
                onSave={editingService ? (data) => updateService(editingService.id, data) : addService}
                serviceToEdit={editingService}
            />
        </div>
    );
}
