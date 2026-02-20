import { motion } from 'framer-motion';
import OrderCard from './OrderCard';

export default function KanbanColumn({ column, orders, onSelectOrder, onAdvance, confirmingAdvance, onCancelAdvance }) {
    const Icon = column.icon;

    return (
        <div className="w-80 flex flex-col h-full bg-gray-100/40 rounded-3xl border border-gray-200/50 backdrop-blur-sm overflow-hidden">
            {/* Column Header */}
            <div className={`
                p-5 border-b border-gray-100 flex items-center justify-between 
                bg-white/40 sticky top-0 z-10
            `}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-white shadow-sm ${column.color.split(' ')[2]}`}>
                        <Icon size={18} />
                    </div>
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-washouse-navy italic">
                        {column.label}
                    </h3>
                </div>
                <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black shadow-sm text-gray-500 border border-gray-100">
                    {orders.length}
                </span>
            </div>

            {/* Cards Container */}
            <div className={`
                flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar
                ${orders.length === 0 ? 'flex flex-col items-center justify-center opacity-40 italic text-gray-400 text-xs' : ''}
            `}>
                {orders.length > 0 ? (
                    orders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onSelect={onSelectOrder}
                            onAdvance={onAdvance}
                            confirmingAdvance={confirmingAdvance}
                            onCancelAdvance={onCancelAdvance}
                        />
                    ))
                ) : (
                    <div className="text-center py-10 px-6">
                        <p className="font-bold uppercase tracking-widest text-[10px]">Sin órdenes</p>
                    </div>
                )}
            </div>

            {/* Underline shadow/decoration for the column */}
            <div className={`h-1 w-full opacity-30 ${column.color.split(' ')[0]}`} />
        </div>
    );
}
