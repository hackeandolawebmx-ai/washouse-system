import { useState, useMemo } from 'react';
import { useStorage } from '../context/StorageContext';
import { useMetrics } from '../hooks/useMetrics';
import { Search, User, Phone, DollarSign, Calendar, MessageCircle, Edit2, Save, X, Clock } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ClientHistoryModal from '../components/clients/ClientHistoryModal';
import { formatCurrency } from '../utils/formatCurrency';
import GlobalFilterBar from '../components/admin/GlobalFilterBar';

export default function ClientsPage() {
    const { orders, customerOverrides, updateCustomerOverride, branches, selectedBranch } = useStorage();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingClient, setEditingClient] = useState(null);
    const [historyClient, setHistoryClient] = useState(null); // State for history modal
    const [editForm, setEditForm] = useState({});

    // ... (rest of logic) ...


    // 1. Aggregate Client Data from Orders
    const clients = useMemo(() => {
        const clientMap = new Map();

        // Process orders
        orders.forEach(order => {
            const rawPhone = order.customerPhone || '';
            const phone = rawPhone.replace(/\D/g, '');
            if (!phone) return;

            if (!clientMap.has(phone)) {
                // Initialize
                const overrides = customerOverrides || {};
                const override = overrides[phone] || {};
                clientMap.set(phone, {
                    phone,
                    displayPhone: rawPhone,
                    name: override.name || order.customerName, // Prefer manual override
                    originalName: order.customerName, // Keep original from first/last order
                    totalSpent: 0,
                    debt: 0,
                    visitCount: 0,
                    lastVisit: order.createdAt,
                    firstVisit: order.createdAt,
                    registrationBranchId: override.registrationBranchId || order.branchId, // First order's branch is registration
                    notes: override.notes || '',
                    weight: override.weight || '',
                    height: override.height || '',
                    orders: []
                });
            }

            const client = clientMap.get(phone);

            // Update stats
            client.totalSpent += order.totalAmount;
            client.debt += order.balanceDue;
            client.visitCount += 1;
            client.orders.push(order);

            // Update last/first visit
            if (new Date(order.createdAt) > new Date(client.lastVisit)) {
                client.lastVisit = order.createdAt;
                // Update name if we don't have an override, assuming newest order has most current name
                if (!customerOverrides?.[phone]?.name) {
                    client.name = order.customerName;
                }
            }
            if (new Date(order.createdAt) < new Date(client.firstVisit)) {
                client.firstVisit = order.createdAt;
                // If override doesn't exist, oldest order wins for registration
                if (!customerOverrides?.[phone]?.registrationBranchId) {
                    client.registrationBranchId = order.branchId;
                }
            }
        });

        // Convert to array and sort by last visit (recent first)
        return Array.from(clientMap.values()).sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit));
    }, [orders, customerOverrides]);

    // 2. Filter
    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
        const matchesBranch = selectedBranch === 'all' || c.registrationBranchId === selectedBranch;
        return matchesSearch && matchesBranch;
    });

    const startEdit = (client) => {
        setEditingClient(client.phone);
        setEditForm({
            name: client.name,
            notes: client.notes,
            weight: client.weight || '',
            height: client.height || ''
        });
    };

    const saveEdit = (phone) => {
        updateCustomerOverride(phone, editForm);
        setEditingClient(null);
    };

    return (
        <PageTransition>
            <div className="space-y-6">
                <GlobalFilterBar />

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Directorio de Clientes</h1>
                        <p className="text-gray-500 text-sm">Gestiona la información y deudas de tus clientes frecuentes.</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o teléfono..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Clients Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">
                                <tr>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Sucursal</th>
                                    <th className="px-6 py-4">Última Visita</th>
                                    <th className="px-6 py-4 text-center">Visitas</th>
                                    <th className="px-6 py-4 text-right">Gasto Total</th>
                                    <th className="px-6 py-4 text-right">Deuda Actual</th>
                                    <th className="px-6 py-4">Notas</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredClients.map(client => {
                                    const isEditing = editingClient === client.phone;

                                    return (
                                        <tr key={client.phone} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${client.debt > 0 ? 'bg-red-500' : 'bg-blue-500'}`}>
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        {isEditing ? (
                                                            <input
                                                                type="text"
                                                                className="border rounded px-2 py-1 text-sm w-full mb-1"
                                                                value={editForm.name}
                                                                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <div className="font-bold text-gray-800">{client.name}</div>
                                                        )}
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Phone size={10} /> {client.displayPhone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-tight ${client.registrationBranchId === 'main' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        client.registrationBranchId === 'semillero' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                            'bg-green-50 text-green-700 border-green-100'
                                                        }`}>
                                                        {branches.find(b => b.id === client.registrationBranchId)?.name || 'Desconocido'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-gray-400" />
                                                    {new Date(client.lastVisit).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                                                    {client.visitCount}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-700">
                                                {formatCurrency(client.totalSpent)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {client.debt > 0 ? (
                                                    <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
                                                        {formatCurrency(client.debt)}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600 text-xs font-bold">Al corriente</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                className="border rounded px-2 py-1 text-xs w-16"
                                                                placeholder="KG"
                                                                value={editForm.weight}
                                                                onChange={e => setEditForm({ ...editForm, weight: e.target.value })}
                                                            />
                                                            <input
                                                                type="text"
                                                                className="border rounded px-2 py-1 text-xs w-16"
                                                                placeholder="CM"
                                                                value={editForm.height}
                                                                onChange={e => setEditForm({ ...editForm, height: e.target.value })}
                                                            />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className="border rounded px-2 py-1 text-xs w-full"
                                                            placeholder="Agregar nota..."
                                                            value={editForm.notes}
                                                            onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1">
                                                        {(client.weight || client.height) && (
                                                            <div className="text-[10px] uppercase font-bold text-gray-400">
                                                                {client.weight ? `${client.weight}kg` : ''} {client.height ? ` / ${client.height}cm` : ''}
                                                            </div>
                                                        )}
                                                        <span className={`${!client.notes ? 'text-gray-300 text-xs' : 'text-gray-500'}`}>
                                                            {client.notes || 'Sin notas'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={() => saveEdit(client.phone)} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Guardar">
                                                                <Save size={16} />
                                                            </button>
                                                            <button onClick={() => setEditingClient(null)} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Cancelar">
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEdit(client)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Editar">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => setHistoryClient(client)} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded" title="Ver Historial">
                                                                <Clock size={16} />
                                                            </button>
                                                            <a
                                                                href={`https://wa.me/52${client.phone}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                                                                title="WhatsApp"
                                                            >
                                                                <MessageCircle size={16} />
                                                            </a>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredClients.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-gray-500">
                                            No se encontraron clientes que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* KPI Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <User size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-800">{clients.length}</div>
                            <div className="text-sm text-gray-500">Clientes Únicos</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(clients.reduce((sum, c) => sum + c.debt, 0))}
                            </div>
                            <div className="text-sm text-gray-500">Deuda Total Pendiente</div>
                        </div>
                    </div>
                </div>

                <ClientHistoryModal
                    client={historyClient}
                    isOpen={!!historyClient}
                    onClose={() => setHistoryClient(null)}
                />
            </div>
        </PageTransition>
    );
}
