import { useState } from 'react';
import { Eye, Printer, MapPin } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import OrderDetailsModal from '../ui/OrderDetailsModal';
import { printServiceTicket } from '../../utils/printServiceTicket';
import { useStorage } from '../../context/StorageContext';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ServicesTable({ orders }) {
    const { branches } = useStorage();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = orders.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center gap-4">
                <input
                    type="text"
                    placeholder="Buscar por cliente o ID..."
                    className="border rounded-lg px-3 py-2 text-sm w-full max-w-sm focus:ring-2 ring-washouse-blue outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="text-sm text-gray-500">
                    Showing {filteredOrders.length} orders
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                        <tr>
                            <th className="px-6 py-3">Orden</th>
                            <th className="px-6 py-3">Cliente</th>
                            <th className="px-6 py-3">Sucursal</th>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3">Total</th>
                            <th className="px-6 py-3">Saldo</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                                    No se encontraron órdenes
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-3 font-mono text-gray-600 font-medium">
                                        #{order.id.split('-')[1]}
                                        {order.serviceLevel === 'express' && <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1 rounded font-bold">EXP</span>}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{order.customerName}</td>
                                    <td className="px-6 py-3 text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} />
                                            {branches.find(b => b.id === order.branchId)?.name || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-3">
                                        <StatusBadge status={order.status} />
                                    </td>
                                    <td className="px-6 py-3 font-medium">{formatCurrency(order.totalAmount)}</td>
                                    <td className={`px-6 py-3 font-bold ${order.balanceDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {formatCurrency(order.balanceDue)}
                                    </td>
                                    <td className="px-6 py-3 text-right space-x-2">
                                        <button
                                            onClick={() => printServiceTicket(order)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Imprimir Ticket"
                                        >
                                            <Printer size={18} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="p-1.5 text-gray-400 hover:text-washouse-blue hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Ver Detalles"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    isOpen={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
}
