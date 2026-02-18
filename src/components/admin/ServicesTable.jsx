import { useState } from 'react';
import { Eye, Printer, MapPin, Search, Inbox } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import OrderDetailsModal from '../ui/OrderDetailsModal';
import { printServiceTicket } from '../../utils/printServiceTicket';
import { useStorage } from '../../context/StorageContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { motion, AnimatePresence } from 'framer-motion';

export default function ServicesTable({ orders }) {
    const { branches } = useStorage();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredOrders = orders.filter(order =>
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/30">
                <div className="relative w-full max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por cliente o ID..."
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-washouse-blue/20 focus:border-washouse-blue outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                    Mostrando {filteredOrders.length} ordenes
                </div>
            </div>

            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs uppercase tracking-wider">Orden</th>
                            <th className="px-6 py-4 text-xs uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-4 text-xs uppercase tracking-wider">Sucursal</th>
                            <th className="px-6 py-4 text-xs uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-4 text-xs uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-xs uppercase tracking-wider">Total</th>
                            <th className="px-6 py-4 text-xs uppercase tracking-wider">Saldo</th>
                            <th className="px-6 py-4 text-xs uppercase tracking-wider text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        <AnimatePresence>
                            {filteredOrders.length === 0 ? (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-400">
                                            <div className="p-4 bg-gray-50 rounded-full mb-3">
                                                <Inbox className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="font-medium text-gray-500">No se encontraron órdenes</p>
                                            <p className="text-sm mt-1">Intenta con otros términos de búsqueda</p>
                                        </div>
                                    </td>
                                </motion.tr>
                            ) : (
                                filteredOrders.map((order, index) => (
                                    <motion.tr
                                        key={order.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-blue-50/30 transition-colors group"
                                    >
                                        <td className="px-6 py-4 font-mono text-gray-600 font-medium">
                                            <span className="group-hover:text-washouse-blue transition-colors">
                                                #{order.id.split('-')[1]}
                                            </span>
                                            {order.serviceLevel === 'express' && (
                                                <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200 font-bold shadow-sm">
                                                    EXP
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-washouse-navy transition-colors">
                                            {order.customerName}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={14} className="text-gray-400" />
                                                {branches.find(b => b.id === order.branchId)?.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {formatCurrency(order.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${order.balanceDue > 0
                                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                                    : 'bg-green-50 text-green-600 border border-green-100'
                                                }`}>
                                                {formatCurrency(order.balanceDue)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => printServiceTicket(order)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                    title="Imprimir Ticket"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-1.5 text-gray-400 hover:text-washouse-blue hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                    title="Ver Detalles"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
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
