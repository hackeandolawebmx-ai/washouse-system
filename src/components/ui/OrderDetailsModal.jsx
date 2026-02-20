import { X, Phone, Clock, DollarSign, Package } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { printServiceTicket } from '../../utils/printServiceTicket';
import { useStorage } from '../../context/StorageContext';
import { formatCurrency } from '../../utils/formatCurrency';
import Modal from './Modal';

export default function OrderDetailsModal({ order, isOpen, onClose }) {
    if (!order) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalle de Orden #${order.id.split('-')[1]}`}>
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Header info */}
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50/50 p-2 rounded-xl border border-gray-100/50 w-fit">
                    <Clock size={12} className="text-washouse-blue" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    <div className="w-1 h-1 bg-gray-200 rounded-full" />
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Customer Info */}
                <div className="flex items-center gap-5 glass-surface p-5 rounded-3xl border-white/60">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-washouse-blue shadow-sm border border-gray-50 group-hover:scale-105 transition-transform">
                        <Phone size={24} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-washouse-navy italic leading-none">{order.customerName}</h4>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{order.customerPhone || 'Sin teléfono asociado'}</div>
                    </div>
                    <div className="ml-auto">
                        <StatusBadge status={order.status} className="shadow-lg shadow-blue-500/10" />
                    </div>
                </div>

                {/* Items */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                        <Package size={14} className="text-washouse-blue" /> Detalle de Carga
                    </h3>
                    <div className="space-y-2 bg-gray-50/30 rounded-2xl p-4 border border-gray-100/50">
                        {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
                            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100/50 last:border-0 group">
                                <span className="text-sm font-bold text-gray-600 group-hover:text-washouse-navy transition-colors">
                                    {item.quantity} {item.type === 'weight' ? 'kg' : 'pz'} <span className="text-gray-300 mx-2">/</span> {item.name}
                                </span>
                                <span className="text-sm font-black text-washouse-blue">{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Production Timeline */}
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                        <Clock size={14} className="text-washouse-blue" /> Trazabilidad de Servicio
                    </h3>
                    <div className="space-y-0 ml-4 border-l-2 border-dashed border-gray-200 pl-8 pb-2">
                        {(order.statusHistory || []).map((entry, idx) => {
                            const isLast = idx === (order.statusHistory.length - 1);
                            return (
                                <div key={idx} className="relative mb-8 last:mb-0">
                                    {/* Dot */}
                                    <div className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full border-4 border-white shadow-md flex items-center justify-center ${isLast ? 'bg-washouse-blue' : 'bg-gray-200'}`}>
                                        {isLast && <div className="absolute inset-0 rounded-full bg-washouse-blue animate-ping opacity-25"></div>}
                                        {isLast && <Check size={10} className="text-white" />}
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isLast ? 'text-washouse-navy shadow-blue-500/5' : 'text-gray-400'}`}>
                                                {entry.status === 'RECEIVED' ? 'Recepción' :
                                                    entry.status === 'WASHING' ? 'Lavado' :
                                                        entry.status === 'DRYING' ? 'Secado' :
                                                            entry.status === 'IRONING' ? 'Planchado' :
                                                                entry.status === 'COMPLETED' ? 'Control de Calidad' :
                                                                    entry.status === 'DELIVERED' ? 'Entrega Final' : entry.status}
                                            </span>
                                            {isLast && <span className="bg-washouse-blue text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">Actual</span>}
                                        </div>
                                        <div className="flex items-center justify-between mt-1">
                                            <span className="text-xs font-black text-gray-700 italic">{entry.user}</span>
                                            <span className="text-[10px] text-gray-400 font-bold bg-white px-2 py-0.5 rounded-md border border-gray-100">
                                                {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Financials */}
                <div className="bg-washouse-navy p-8 rounded-[32px] space-y-4 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-washouse-blue/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-washouse-blue/20 transition-all duration-700" />

                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Total</span>
                        <span className="text-lg font-black text-white">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-green-400">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Anticipo</span>
                        <span className="text-sm font-black">-{formatCurrency(order.advancePayment)}</span>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Pendiente</span>
                            <span className="text-3xl font-black text-white italic tracking-tighter shadow-blue-500/50">
                                {formatCurrency(order.balanceDue)}
                            </span>
                        </div>
                        {order.balanceDue === 0 && (
                            <div className="bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/30">
                                Liquidado
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="flex gap-4 pt-4">
                    <a
                        href={`https://wa.me/52${(order.customerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                            order.status === 'DELIVERED'
                                ? `Hola ${order.customerName}, gracias por su preferencia en *Washouse*!`
                                : `Hola ${order.customerName}, tu orden *${order.id}* está ${order.status}. Saldo pendiente: ${formatCurrency(order.balanceDue)}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex-[1.5] bg-green-500 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-green-600 shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 ${!order.customerPhone ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        WhatsApp
                    </a>
                    <button
                        onClick={() => printServiceTicket(order)}
                        className="flex-1 bg-white text-washouse-navy border border-gray-200 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Reimprimir
                    </button>
                </div>
            </div>
        </Modal>
    );
}
