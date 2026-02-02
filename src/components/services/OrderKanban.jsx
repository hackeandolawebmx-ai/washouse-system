import { useMemo } from 'react';
import { useStorage } from '../../context/StorageContext';
import { useAuth } from '../../context/AuthContext';
import { Clock, CheckCircle, Package, Truck, AlertCircle, MessageCircle } from 'lucide-react'; // Added MessageCircle
import { formatCurrency } from '../../utils/formatCurrency';
import OrderDetailsModal from '../ui/OrderDetailsModal';
import PaymentCollectionModal from './PaymentCollectionModal'; // Import Payment Modal
import { useState } from 'react';

const STATUS_COLUMNS = [
    { id: 'RECEIVED', label: 'Recibido', icon: Package, color: 'bg-gray-100 border-gray-200 text-gray-600' },
    { id: 'WASHING', label: 'Lavando', icon: Clock, color: 'bg-blue-50 border-blue-200 text-blue-600' },
    { id: 'DRYING', label: 'Secando', icon: Clock, color: 'bg-orange-50 border-orange-200 text-orange-600' },
    { id: 'IRONING', label: 'Planchando', icon: Clock, color: 'bg-purple-50 border-purple-200 text-purple-600' },
    { id: 'COMPLETED', label: 'Listo', icon: CheckCircle, color: 'bg-green-50 border-green-200 text-green-600' },
    { id: 'DELIVERED', label: 'Entregado', icon: Truck, color: 'bg-gray-50 border-gray-200 text-gray-400' }
];

export default function OrderKanban({ searchTerm }) {
    const { orders, deviceBranchId, updateOrderStatus, branches } = useStorage();
    const { user } = useAuth(); // Get authenticated user
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [paymentModalOrder, setPaymentModalOrder] = useState(null);
    const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(null); // Order to show prompt for
    const [showDeliveryPrompt, setShowDeliveryPrompt] = useState(null);

    const filteredOrders = useMemo(() => {
        return orders.filter(o =>
            o.branchId === deviceBranchId &&
            (o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.id.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [orders, deviceBranchId, searchTerm]);

    const getOrdersByStatus = (status) => filteredOrders.filter(o => o.status === status);

    const handleAdvanceStatus = (e, order) => {
        e.stopPropagation();
        const currentIndex = STATUS_COLUMNS.findIndex(c => c.id === order.status);
        if (currentIndex < STATUS_COLUMNS.length - 1) {
            const nextStatus = STATUS_COLUMNS[currentIndex + 1].id;

            // Logic Interception

            // 1. Moving to COMPLETED -> Prompt WhatsApp
            if (nextStatus === 'COMPLETED') {
                updateOrderStatus(order.id, nextStatus, user?.name || 'Host');
                setShowWhatsAppPrompt(order);
                return;
            }

            // 2. Moving to DELIVERED
            if (nextStatus === 'DELIVERED') {
                // Check Balance
                if (order.balanceDue > 0) {
                    setPaymentModalOrder(order); // Open Payment Modal
                    return;
                }
                // If no balance, prompt for delivery notification
                if (confirm(`¿Entregar orden ${order.id}?`)) {
                    updateOrderStatus(order.id, nextStatus, user?.name || 'Host');
                    setShowDeliveryPrompt(order);
                }
                return;
            }

            // Default behavior
            if (confirm(`¿Avanzar orden ${order.id} a ${STATUS_COLUMNS[currentIndex + 1].label}?`)) {
                updateOrderStatus(order.id, nextStatus, user?.name || 'Host');
            }
        }
    };

    return (
        <>
            <div className="flex h-full gap-4 min-w-max p-4">
                {STATUS_COLUMNS.map(column => (
                    <div key={column.id} className="w-72 flex flex-col h-full bg-gray-50/50 rounded-xl border border-gray-100">
                        {/* Column Header */}
                        <div className={`p-3 border-b flex items-center gap-2 font-bold ${column.color.replace('bg-', 'text-').split(' ')[0]}`}>
                            <column.icon size={18} />
                            {column.label}
                            <span className="ml-auto bg-white px-2 py-0.5 rounded-full text-xs shadow-sm text-gray-600">
                                {getOrdersByStatus(column.id).length}
                            </span>
                        </div>

                        {/* Cards Container */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-3">
                            {getOrdersByStatus(column.id).map(order => (
                                <div
                                    key={order.id}
                                    onClick={() => setSelectedOrder(order)}
                                    className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono text-gray-400">#{order.id.split('-')[1]}</span>
                                        {order.serviceLevel === 'express' && (
                                            <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded font-bold">EXPRESS</span>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-gray-800 truncate">{order.customerName}</h4>
                                    <div className="text-sm text-gray-500 mb-3">{order.items.length} items • {order.balanceDue > 0 ? `Deb: ${formatCurrency(order.balanceDue)}` : 'Pagado'}</div>

                                    {order.status !== 'DELIVERED' && (
                                        <button
                                            onClick={(e) => handleAdvanceStatus(e, order)}
                                            className="w-full py-1.5 bg-gray-50 hover:bg-blue-50 text-blue-600 text-xs font-bold rounded flex items-center justify-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Avanzar <CheckCircle size={12} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modals */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    isOpen={!!selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}

            {paymentModalOrder && (
                <PaymentCollectionModal
                    order={paymentModalOrder}
                    isOpen={!!paymentModalOrder}
                    onClose={() => setPaymentModalOrder(null)}
                    onPaymentComplete={(amount) => {
                        // Check if fully paid, then advance
                        const remaining = paymentModalOrder.balanceDue - amount;
                        if (remaining <= 0) {
                            updateOrderStatus(paymentModalOrder.id, 'DELIVERED', user?.name || 'Host');
                            setShowDeliveryPrompt(paymentModalOrder); // Show Thank You Prompt
                            setPaymentModalOrder(null);
                        } else {
                            alert('Aún queda saldo pendiente. No se puede entregar.');
                            // Usually we might keep modal open or just update parent state to reflect new balance
                            // For now we close and require user to click advance again if they want to pay more.
                            // But actually `onPaymentComplete` happens after context update.
                            // We need the *updated* order or just rely on the math here. 
                            // The modal will check validity.
                        }
                    }}
                />
            )}

            {showWhatsAppPrompt && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold">¡Orden Lista!</h3>
                        <p className="text-gray-500">La orden ha pasado a estado "Listo". ¿Deseas notificar al cliente?</p>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowWhatsAppPrompt(null)}
                                className="flex-1 py-2 rounded-lg border font-medium hover:bg-gray-50"
                            >
                                No notificar
                            </button>
                            <a
                                href={`https://wa.me/52${showWhatsAppPrompt.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${showWhatsAppPrompt.customerName}, tu ropa ya está lista para recoger en *${(branches.find(b => b.id === showWhatsAppPrompt.branchId)?.name) || 'Washouse'}*! Total: ${formatCurrency(showWhatsAppPrompt.totalAmount)}. Saldo Pendiente: ${formatCurrency(showWhatsAppPrompt.balanceDue)}. Te esperamos!`)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setShowWhatsAppPrompt(null)}
                                className="flex-1 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={18} /> WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {showDeliveryPrompt && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm text-center space-y-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                            <Truck size={32} />
                        </div>
                        <h3 className="text-xl font-bold">¡Orden Entregada!</h3>
                        <p className="text-gray-500">¿Deseas enviar un mensaje de agradecimiento?</p>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowDeliveryPrompt(null)}
                                className="flex-1 py-2 rounded-lg border font-medium hover:bg-gray-50"
                            >
                                No notificar
                            </button>
                            <a
                                href={`https://wa.me/52${showDeliveryPrompt.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${showDeliveryPrompt.customerName}, gracias por confiar en *${(branches.find(b => b.id === showDeliveryPrompt.branchId)?.name) || 'Washouse'}*! Esperamos verte pronto.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => setShowDeliveryPrompt(null)}
                                className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={18} /> WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
