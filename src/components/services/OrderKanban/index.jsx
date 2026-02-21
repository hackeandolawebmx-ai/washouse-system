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
    { id: 'RECEIVED', label: 'Recibido', icon: Package, color: 'bg-slate-100 border-slate-200 text-slate-500' },
    { id: 'WASHING', label: 'Lavando', icon: Clock, color: 'bg-blue-100 border-blue-200 text-blue-500' },
    { id: 'DRYING', label: 'Secando', icon: Clock, color: 'bg-orange-100 border-orange-200 text-orange-500' },
    { id: 'IRONING', label: 'Planchando', icon: Clock, color: 'bg-purple-100 border-purple-200 text-purple-500' },
    { id: 'COMPLETED', label: 'Listo', icon: CheckCircle, color: 'bg-emerald-100 border-emerald-200 text-emerald-500' },
    { id: 'DELIVERED', label: 'Entregado', icon: Truck, color: 'bg-slate-200 border-slate-300 text-slate-400' }
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
                    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-500">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-white p-10 rounded-4xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] max-w-sm w-full text-center space-y-8 border border-white/20 relative overflow-hidden"
                        >
                            {/* Decorative Background Element */}
                            <div className={`absolute top-0 left-0 right-0 h-2 opacity-80 ${showWhatsAppPrompt ? 'bg-linear-to-r from-emerald-400 to-emerald-500' : 'bg-linear-to-r from-blue-400 to-blue-500'}`} />

                            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner ${showWhatsAppPrompt ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                                {showWhatsAppPrompt ? <CheckCircle size={48} strokeWidth={2.5} /> : <Truck size={48} strokeWidth={2.5} />}
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-3xl font-black text-washouse-navy tracking-tight">
                                    {showWhatsAppPrompt ? '¡Orden Lista!' : '¡Orden Entregada!'}
                                </h3>
                                <p className="text-sm text-slate-500 font-bold px-4 leading-relaxed opacity-80 uppercase tracking-wide">
                                    {showWhatsAppPrompt
                                        ? 'La ropa ya pasó a inspección final. ¿Notificamos al cliente?'
                                        : 'Se ha registrado la salida. ¿Enviamos un mensaje de cortesía?'}
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 pt-4">
                                <a
                                    href={`https://wa.me/52${(showWhatsAppPrompt || showDeliveryPrompt).customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                        showWhatsAppPrompt
                                            ? `Hola ${(showWhatsAppPrompt).customerName}, tu ropa ya está lista en *${(branches.find(b => b.id === (showWhatsAppPrompt).branchId)?.name) || 'Washouse'}*!\nTotal: ${formatCurrency((showWhatsAppPrompt).totalAmount)}.\nSaldo Pendiente: ${formatCurrency((showWhatsAppPrompt).balanceDue)}.\n¡Te esperamos!`
                                            : `Hola ${(showDeliveryPrompt).customerName}, ¡gracias por visitarnos en *${(branches.find(b => b.id === (showDeliveryPrompt).branchId)?.name) || 'Washouse'}*!\nEsperamos verte pronto. ✨`
                                    )}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() => { setShowWhatsAppPrompt(null); setShowDeliveryPrompt(null); }}
                                    className="w-full py-5 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-[0.2em] text-[11px] hover:bg-emerald-600 shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 transition-all active:scale-95"
                                >
                                    <MessageCircle size={20} strokeWidth={3} /> Enviar WhatsApp
                                </a>
                                <button
                                    onClick={() => { setShowWhatsAppPrompt(null); setShowDeliveryPrompt(null); }}
                                    className="w-full py-5 rounded-2xl bg-slate-50 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-100 transition-all active:scale-95"
                                >
                                    Continuar sin avisar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
