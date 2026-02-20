import { motion } from 'framer-motion';
import { Clock, Package, CheckCircle, AlertCircle, MessageCircle, MoreVertical } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatCurrency';

export default function OrderCard({ order, onSelect, onAdvance, confirmingAdvance, onCancelAdvance }) {
    const isExpress = order.serviceLevel === 'express';
    const isPaid = order.balanceDue <= 0;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2, shadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
            onClick={() => onSelect(order)}
            className={`
                bg-white p-4 rounded-xl shadow-sm border border-gray-100 
                cursor-pointer transition-all duration-300 relative group
            `}
        >
            {/* Header / ID */}
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest font-mono">
                    #{order.id.split('-')[1] || order.id.slice(-4)}
                </span>
                <div className="flex items-center gap-1.5">
                    {isExpress && (
                        <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black tracking-tighter uppercase animate-pulse">
                            Express
                        </span>
                    )}
                    <button className="text-gray-300 hover:text-gray-600 transition-colors p-1">
                        <MoreVertical size={14} />
                    </button>
                </div>
            </div>

            {/* Customer Info */}
            <div className="mb-4">
                <h4 className="font-black text-washouse-navy italic leading-tight truncate" title={order.customerName}>
                    {order.customerName}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        {isPaid ? 'Pagado' : `Saldo: ${formatCurrency(order.balanceDue)}`}
                    </span>
                </div>
            </div>

            {/* Order Meta */}
            <div className="flex items-center justify-between mb-4 px-2 py-1.5 bg-gray-50/50 rounded-lg border border-gray-100/50">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
                </span>
                <div className="w-1 h-1 bg-gray-200 rounded-full" />
                <span className="text-[10px] font-bold text-washouse-blue">
                    {formatCurrency(order.totalAmount)}
                </span>
            </div>

            {/* Operator Info */}
            {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5 px-1">
                    <div className="w-1 h-1 rounded-full bg-blue-300" />
                    <span>Host: {order.statusHistory[order.statusHistory.length - 1].user}</span>
                </div>
            )}

            {/* Action Buttons */}
            {order.status !== 'DELIVERED' && (
                <div className="mt-2">
                    {confirmingAdvance?.id === order.id ? (
                        <div className="flex gap-2 animate-in slide-in-from-bottom-2 duration-300">
                            <button
                                onClick={(e) => { e.stopPropagation(); onCancelAdvance(); }}
                                className="flex-1 py-2 bg-gray-100 text-gray-500 text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-gray-200 transition-all"
                            >
                                No
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onAdvance(e, order, true); }}
                                className="flex-2 py-2 bg-washouse-blue text-white text-[10px] font-black rounded-lg uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                            >
                                Sí, {confirmingAdvance.label}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => onAdvance(e, order, false)}
                            className={`
                                w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em]
                                flex items-center justify-center gap-2 transition-all duration-300
                                opacity-100 md:opacity-0 group-hover:opacity-100
                                bg-gray-50 text-gray-400 hover:bg-washouse-blue hover:text-white hover:shadow-lg hover:shadow-blue-500/10 border border-gray-200/50 hover:border-transparent
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
