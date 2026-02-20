import { useMemo, useState } from 'react';
import { useStorage } from '../../../context/StorageContext';
import { useAuth } from '../../../context/AuthContext';
import { Clock, CheckCircle, Package, Truck, MessageCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';
import OrderDetailsModal from '../../ui/OrderDetailsModal';
import PaymentCollectionModal from '../PaymentCollectionModal';
import KanbanColumn from './KanbanColumn';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_COLUMNS = [
    { id: 'RECEIVED', label: 'Recibido', icon: Package, color: 'bg-gray-100 border-gray-200 text-gray-500' },
    { id: 'WASHING', label: 'Lavando', icon: Clock, color: 'bg-blue-100 border-blue-200 text-blue-500' },
    { id: 'DRYING', label: 'Secando', icon: Clock, color: 'bg-orange-100 border-orange-200 text-orange-500' },
    { id: 'IRONING', label: 'Planchando', icon: Clock, color: 'bg-purple-100 border-purple-200 text-purple-500' },
    { id: 'COMPLETED', label: 'Listo', icon: CheckCircle, color: 'bg-green-100 border-green-200 text-green-500' },
    { id: 'DELIVERED', label: 'Entregado', icon: Truck, color: 'bg-gray-200 border-gray-300 text-gray-400' }
];

export default function OrderKanban({ searchTerm }) {
    const { orders, deviceBranchId, updateOrderStatus, branches } = useStorage();
    const { user } = useAuth();

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [confirmingAdvance, setConfirmingAdvance] = useState(null);
    const [paymentModalOrder, setPaymentModalOrder] = useState(null);
    const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(null);
    const [showDeliveryPrompt, setShowDeliveryPrompt] = useState(null);

    const filteredOrders = useMemo(() => {
        return orders.filter(o =>
            o.branchId === deviceBranchId &&
            (o.customerName.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
                o.id.toLowerCase().includes(searchTerm?.toLowerCase() || ''))
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [orders, deviceBranchId, searchTerm]);

    const handleAdvanceStatus = (e, order, isConfirmed = false) => {
        const currentIndex = STATUS_COLUMNS.findIndex(c => c.id === order.status);
        if (currentIndex < STATUS_COLUMNS.length - 1) {
            const nextColumn = STATUS_COLUMNS[currentIndex + 1];

            if (!isConfirmed) {
                setConfirmingAdvance({
                    id: order.id,
                    nextStatus: nextColumn.id,
                    label: nextColumn.label
                });
                return;
            }

            // Execute logic after confirmation
            const nextStatus = nextColumn.id;

            // Logic Interception for specialized states
            if (nextStatus === 'COMPLETED') {
                updateOrderStatus(order.id, nextStatus, user?.name || 'Host');
                setShowWhatsAppPrompt(order);
                setConfirmingAdvance(null);
                return;
            }

            if (nextStatus === 'DELIVERED') {
                if (order.balanceDue > 0) {
                    setPaymentModalOrder(order);
                    setConfirmingAdvance(null);
                    return;
                }
                updateOrderStatus(order.id, nextStatus, user?.name || 'Host');
                setShowDeliveryPrompt(order);
                setConfirmingAdvance(null);
                return;
            }

            // General status update
            updateOrderStatus(order.id, nextStatus, user?.name || 'Host');
            setConfirmingAdvance(null);
        }
    };

    return (
        <div className="flex h-full gap-6 min-w-max p-6 custom-scrollbar overflow-x-auto">
            {STATUS_COLUMNS.map(column => (
                <KanbanColumn
                    key={column.id}
                    column={column}
                    orders={filteredOrders.filter(o => o.status === column.id)}
                    onSelectOrder={setSelectedOrder}
                    onAdvance={handleAdvanceStatus}
                    confirmingAdvance={confirmingAdvance}
                    onCancelAdvance={() => setConfirmingAdvance(null)}
                />
            ))}

            {/* Modals & Prompts */}
            <AnimatePresence>
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
                            const remaining = paymentModalOrder.balanceDue - amount;
                            if (remaining <= 0) {
                                updateOrderStatus(paymentModalOrder.id, 'DELIVERED', user?.name || 'Host');
                                setShowDeliveryPrompt(paymentModalOrder);
                                setPaymentModalOrder(null);
                            }
                        }}
                    />
                )}

                {/* WhatsApp Logic Interception */}
                {(showWhatsAppPrompt || showDeliveryPrompt) && (
                    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center space-y-6 border border-white/20"
                        >
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${showWhatsAppPrompt ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'}`}>
                                {showWhatsAppPrompt ? <CheckCircle size={40} /> : <Truck size={40} />}
                            </div>

                            <div>
                                <h3 className="text-2xl font-black text-washouse-navy italic">
                                    {showWhatsAppPrompt ? '¡Orden Lista!' : '¡Orden Entregada!'}
                                </h3>
                                <p className="text-sm text-gray-500 font-bold mt-2 px-4 leading-relaxed">
                                    {showWhatsAppPrompt
                                        ? 'La orden está lista para entrega. ¿Notificamos al cliente?'
                                        : 'Se ha registrado la entrega. ¿Enviamos un mensaje de agradecimiento?'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <a
                                    href={`https://wa.me/52${(showWhatsAppPrompt || showDeliveryPrompt).customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                        showWhatsAppPrompt
                                            ? `Hola ${(showWhatsAppPrompt).customerName}, tu ropa ya está lista en *${(branches.find(b => b.id === (showWhatsAppPrompt).branchId)?.name) || 'Washouse'}*!\nTotal: ${formatCurrency((showWhatsAppPrompt).totalAmount)}.\nSaldo Pendiente: ${formatCurrency((showWhatsAppPrompt).balanceDue)}.\n¡Te esperamos!`
                                            : `Hola ${(showDeliveryPrompt).customerName}, ¡gracias por visitarnos en *${(branches.find(b => b.id === (showDeliveryPrompt).branchId)?.name) || 'Washouse'}*!\nEsperamos verte pronto. ✨`
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => { setShowWhatsAppPrompt(null); setShowDeliveryPrompt(null); }}
                                    className="w-full py-4 rounded-2xl bg-green-500 text-white font-black uppercase tracking-widest text-xs hover:bg-green-600 shadow-lg shadow-green-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                                >
                                    <MessageCircle size={20} /> Notificar por WhatsApp
                                </a>
                                <button
                                    onClick={() => { setShowWhatsAppPrompt(null); setShowDeliveryPrompt(null); }}
                                    className="w-full py-4 rounded-2xl bg-gray-50 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all"
                                >
                                    No, gracias
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
