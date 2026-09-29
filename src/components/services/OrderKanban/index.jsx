import { useMemo, useState } from 'react';
import { useStorage } from '../../../context/StorageContext';
import { useAuth } from '../../../context/AuthContext';
import { CheckCircle, Package, Truck, MessageCircle, WashingMachine } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';
import OrderDetailsModal from '../../ui/OrderDetailsModal';
import PaymentCollectionModal from '../PaymentCollectionModal';
import KanbanColumn from './KanbanColumn';
import AssignWasherModal from './AssignWasherModal';
import { motion, AnimatePresence } from 'framer-motion';

import { USUARIO_MOSTRADOR } from '../../../utils/labels';
const STATUS_COLUMNS = [
    { id: 'RECEIVED', label: 'Recibido', icon: Package, color: 'bg-slate-100 border-slate-200 text-slate-500' },
    { id: 'WASHING', label: 'En máquina', icon: WashingMachine, color: 'bg-blue-100 border-blue-200 text-blue-500' },
    { id: 'COMPLETED', label: 'Terminado', icon: CheckCircle, color: 'bg-emerald-100 border-emerald-200 text-emerald-500' }
];

export default function OrderKanban({ searchTerm }) {
    const { orders, machines, deviceBranchId, updateOrderStatus, assignWasherToOrder, branches } = useStorage();
    const { user } = useAuth();

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [confirmingAdvance, setConfirmingAdvance] = useState(null);
    const [paymentModalOrder, setPaymentModalOrder] = useState(null);
    const [showWhatsAppPrompt, setShowWhatsAppPrompt] = useState(null);
    const [showDeliveryPrompt, setShowDeliveryPrompt] = useState(null);
    const [assigningOrder, setAssigningOrder] = useState(null);

    const filteredOrders = useMemo(() => {
        return orders.filter(o =>
            o.branchId === deviceBranchId &&
            (o.customerName.toLowerCase().includes(searchTerm?.toLowerCase() || '') ||
                o.id.toLowerCase().includes(searchTerm?.toLowerCase() || ''))
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [orders, deviceBranchId, searchTerm]);

    // El tablero solo MUESTRA dos columnas (Recibido, Terminado): una orden
    // Entregada no encaja en ninguna, asi que desaparece del tablero sin
    // borrarse -- sigue en el historial del cliente y en los reportes.
    //
    // Pero el FLUJO real tiene un paso mas alla de Terminado: que el cliente
    // recogio su ropa. Ese tercer estado (DELIVERED) ya existia en todo el
    // resto del sistema -- StatusBadge, el historial de OrderDetailsModal,
    // el directorio de clientes -- menos aqui: nada lo disparaba.
    // Antes, una orden Terminada mostraba un boton que no hacia nada porque
    // handleAdvanceStatus solo conocia RECEIVED/COMPLETED. ORDER_FLOW es el
    // flujo completo (a diferencia de STATUS_COLUMNS, que es solo lo que se
    // dibuja) y es lo que decide a donde avanza cada tarjeta.
    // label es como se llama CADA estado (a donde se llega), no el estado de
    // origen -- next.label / actionLabel muestran el destino de la transicion.
    const ORDER_FLOW = [
        { id: 'RECEIVED', label: 'Recibido' },
        { id: 'WASHING', label: 'En máquina' },
        { id: 'COMPLETED', label: 'Terminado' },
        { id: 'DELIVERED', label: 'Entregado' }
    ];
    const nextStep = (status) => {
        const i = ORDER_FLOW.findIndex(s => s.id === status);
        return (i === -1 || i === ORDER_FLOW.length - 1) ? null : ORDER_FLOW[i + 1];
    };
    // Texto del boton en reposo: para las demas columnas es "Pasar a X"; para
    // marcar la entrega se lee mejor como una accion propia.
    const actionLabel = (status) => {
        if (status === 'RECEIVED') return 'Asignar lavadora';
        if (status === 'COMPLETED') return 'Marcar como Entregado';
        return `Pasar a ${nextStep(status)?.label || ''}`;
    };

    // Planchado, compostura y otros encargos que no pasan por lavadora.
    const secondaryAction = (order) => order.status === 'RECEIVED'
        ? { label: 'Terminado sin lavadora', onClick: () => setConfirmingAdvance({ id: order.id, nextStatus: 'COMPLETED', label: 'Terminado' }) }
        : null;

    // Dónde va la ropa: la lavadora asignada o, en Lavado y secado, la
    // secadora a la que pasó sola (dryerQueue le copia el orderId).
    const machineInfo = (order) => {
        if (order.status !== 'WASHING') return null;
        const withOrder = machines.filter(m => m.orderId === order.id);
        const running = withOrder.find(m => m.status === 'running');
        if (running) {
            const verb = running.type === 'secadora' ? 'secando' : 'lavando';
            return { tone: 'blue', text: `${running.name} · ${verb}${running.timeLeft > 0 ? ` · ${running.timeLeft} min` : ''}` };
        }
        const waitingDryer = withOrder.find(m => m.status === 'finished' && m.pendingDry);
        if (waitingDryer) return { tone: 'amber', text: `${waitingDryer.name} terminó · esperando secadora` };
        const finished = withOrder.find(m => m.status === 'finished');
        if (finished) return { tone: 'green', text: `Listo en ${finished.name} · sácala y libera el equipo` };
        const assigned = machines.find(m => m.id === order.machineId);
        return { tone: 'green', text: assigned ? `Salió de ${assigned.name}` : 'Máquina liberada' };
    };

    const handleAdvanceStatus = (e, order, isConfirmed = false) => {
        let next = nextStep(order.status);
        if (!next) return; // ya esta Entregado, no hay mas pasos

        // La confirmación puede venir de la acción secundaria (Terminado sin
        // lavadora), que salta un paso: manda lo que se confirmó.
        if (isConfirmed && confirmingAdvance?.id === order.id) {
            next = ORDER_FLOW.find(s => s.id === confirmingAdvance.nextStatus) || next;
        }

        if (next.id === 'WASHING') {
            setAssigningOrder(order);
            return;
        }

        if (!isConfirmed) {
            setConfirmingAdvance({ id: order.id, nextStatus: next.id, label: next.label });
            return;
        }

        if (next.id === 'COMPLETED') {
            updateOrderStatus(order.id, 'COMPLETED', user?.name || USUARIO_MOSTRADOR);
            setShowWhatsAppPrompt(order);
            setConfirmingAdvance(null);
            return;
        }

        // El saldo se cobra al entregar (el cliente paga al recoger), no al
        // terminar: una orden sin anticipo tiene que poder marcarse lista y
        // avisarse por WhatsApp antes de que el cliente llegue.
        if (next.id === 'DELIVERED') {
            if (order.balanceDue > 0) {
                setPaymentModalOrder(order);
                setConfirmingAdvance(null);
                return;
            }
            updateOrderStatus(order.id, 'DELIVERED', user?.name || USUARIO_MOSTRADOR);
            setShowDeliveryPrompt(order);
            setConfirmingAdvance(null);
            return;
        }

        updateOrderStatus(order.id, next.id, user?.name || USUARIO_MOSTRADOR);
        setConfirmingAdvance(null);
    };

    return (
        <div className="grid gap-6 lg:grid-cols-3 items-start">
            {STATUS_COLUMNS.map(column => (
                <KanbanColumn
                    key={column.id}
                    column={column}
                    orders={filteredOrders.filter(o => o.status === column.id)}
                    onSelectOrder={setSelectedOrder}
                    onAdvance={handleAdvanceStatus}
                    confirmingAdvance={confirmingAdvance}
                    onCancelAdvance={() => setConfirmingAdvance(null)}
                    canAdvance={(status) => Boolean(nextStep(status))}
                    actionLabel={actionLabel}
                    secondaryAction={secondaryAction}
                    machineInfo={machineInfo}
                />
            ))}

            {assigningOrder && (
                <AssignWasherModal
                    order={assigningOrder}
                    onClose={() => setAssigningOrder(null)}
                    onAssign={async (machine) => {
                        const ok = await assignWasherToOrder(assigningOrder.id, machine.id, user?.name || USUARIO_MOSTRADOR);
                        if (ok) setAssigningOrder(null);
                        return ok;
                    }}
                />
            )}

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
                                updateOrderStatus(paymentModalOrder.id, 'DELIVERED', user?.name || USUARIO_MOSTRADOR);
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

                            <div className={`w-24 h-24 rounded-4xl flex items-center justify-center mx-auto shadow-inner ${showWhatsAppPrompt ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
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
                                    href={`https://wa.me/52${((showWhatsAppPrompt || showDeliveryPrompt)?.customerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                                        showWhatsAppPrompt
                                            ? `Hola ${(showWhatsAppPrompt)?.customerName || 'Cliente'}, tu ropa ya está lista en *${(branches.find(b => b.id === (showWhatsAppPrompt)?.branchId)?.name) || 'Washouse'}*!\nTotal: ${formatCurrency((showWhatsAppPrompt)?.totalAmount)}.\nSaldo Pendiente: ${formatCurrency((showWhatsAppPrompt)?.balanceDue)}.\n¡Te esperamos!`
                                            : `Hola ${(showDeliveryPrompt)?.customerName || 'Cliente'}, ¡gracias por visitarnos en *${(branches.find(b => b.id === (showDeliveryPrompt)?.branchId)?.name) || 'Washouse'}*!\nEsperamos verte pronto. ✨`
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
