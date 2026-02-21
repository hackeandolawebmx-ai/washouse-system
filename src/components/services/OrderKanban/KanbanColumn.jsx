import { motion } from 'framer-motion';
import OrderCard from './OrderCard';

export default function KanbanColumn({ column, orders, onSelectOrder, onAdvance, confirmingAdvance, onCancelAdvance }) {
    const Icon = column.icon;

    return (
        <div className="w-85 flex flex-col h-full bg-slate-100/30 rounded-[2.5rem] border border-slate-200/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/20">
            {/* Column Header */}
            <div className={`
                p-6 border-b border-slate-100/60 flex items-center justify-between 
                bg-white/40 sticky top-0 z-10 backdrop-blur-xl
            `}>
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 ${column.color.split(' ')[2]}`}>
                        <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-black text-[11px] uppercase tracking-[0.3em] text-washouse-navy italic leading-none">
                            {column.label}
                        </h3>
                    </div>
                </div>
                <span className="bg-slate-900 px-3 py-1 rounded-full text-[10px] font-black text-white shadow-lg shadow-slate-900/10 border border-white/20">
                    {orders.length}
                </span>
            </div>

            {/* Cards Container */}
            <div className={`
                flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar
                ${orders.length === 0 ? 'flex flex-col items-center justify-center opacity-30 grayscale' : ''}
            `}>
                {orders.length > 0 ? (
                    <motion.div layout className="space-y-4">
                        {orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onSelect={onSelectOrder}
                                onAdvance={onAdvance}
                                confirmingAdvance={confirmingAdvance}
                                onCancelAdvance={onCancelAdvance}
                            />
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-16 px-6">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                            <Icon size={24} className="text-slate-400" />
                        </div>
                        <p className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Sin órdenes</p>
                    </div>
                )}
            </div>

            {/* Bottom Accent */}
            <div className={`h-2 w-full opacity-50 ${column.color.split(' ')[0].replace('bg-', 'bg-linear-to-r from-')}`} />
        </div>
    );
}
