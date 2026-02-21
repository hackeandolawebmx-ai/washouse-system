import { motion } from 'framer-motion';
import { Clock, Package, CheckCircle, AlertCircle, MessageCircle, MoreVertical } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function OrderCard({ order, onSelect, onAdvance, confirmingAdvance, onCancelAdvance }) {
    const isExpress = order.serviceLevel === 'express';
    const isPaid = order.balanceDue <= 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
                y: -4,
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)',
                borderColor: 'rgba(0,144,215,0.3)'
            }}
            onClick={() => onSelect(order)}
            className={`
                bg-white p-5 rounded-[1.75rem] shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-slate-100 
                cursor-pointer transition-all duration-300 relative group overflow-hidden
            `}
        >
            {/* Status-based Accent Bar */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 opacity-60 ${isPaid ? 'bg-linear-to-r from-emerald-400 to-emerald-500' : 'bg-linear-to-r from-amber-400 to-amber-500'
                }`} />

            {/* Header / ID */}
            <div className="flex justify-between items-center mb-4 pt-1">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] font-mono">
                    #{order.id.split('-')[1] || order.id.slice(-4)}
                </span>
                <div className="flex items-center gap-2">
                    {isExpress && (
                        <motion.span
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="bg-orange-500 text-white text-[9px] px-2 py-0.5 rounded-full font-black tracking-tight uppercase"
                        >
                            Express
                        </motion.span>
                    )}
                    <button className="text-slate-300 hover:text-washouse-blue transition-colors p-1">
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-5">
                <h4 className="text-lg font-black text-washouse-navy leading-tight truncate tracking-tight group-hover:text-washouse-blue transition-colors" title={order.customerName}>
                    {order.customerName}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ring-4 ${isPaid ? 'bg-emerald-500 ring-emerald-50' : 'bg-amber-500 ring-amber-50 animate-pulse'}`} />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {isPaid ? 'Pagado' : `Saldo: ${formatCurrency(order.balanceDue)}`}
                    </span>
                </div>
            </div>

            {/* Order Meta */}
            <div className="flex items-center justify-between mb-5 px-3 py-2 bg-slate-50/80 rounded-2xl border border-slate-100/50 group-hover:bg-blue-50/30 group-hover:border-blue-100/30 transition-colors">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                </span>
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full" />
                <span className="text-sm font-black text-washouse-blue">
                    {formatCurrency(order.totalAmount)}
                </span>
            </div>

            {/* Operator Info */}
            {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-5 flex items-center gap-2 px-1 opacity-70">
                    <div className="w-1 h-1 rounded-full bg-blue-400" />
                    <span>Host: {order.statusHistory[order.statusHistory.length - 1].user}</span>
                </div>
            )}

            {/* Action Buttons */}
            {order.status !== 'DELIVERED' && (
                <div className="mt-2">
                    {confirmingAdvance?.id === order.id ? (
                        <div className="flex gap-2 animate-in fade-in zoom-in-95 duration-300">
                            <button
                                onClick={(e) => { e.stopPropagation(); onCancelAdvance(); }}
                                className="flex-1 py-3 bg-slate-100 text-slate-500 text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                            >
                                No
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAdvance(e, order, true); }}
                                className="flex-2 py-3 bg-washouse-blue text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
                            >
                                Sí, {confirmingAdvance.label}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => onAdvance(e, order, false)}
                            className={`
                                w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em]
                                flex items-center justify-center gap-2 transition-all duration-500
                                opacity-100 md:opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2
                                bg-slate-900 text-white hover:bg-washouse-blue hover:shadow-xl hover:shadow-blue-500/30
                            `}
                        >
                            Pasar a {confirmingAdvance?.nextStatusLabel || 'Siguiente'}
                        </button>
                    )}
                </div>
            )}
        </motion.div>
    );
}
