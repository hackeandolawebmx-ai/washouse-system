import { ArrowUp, ArrowDown, Minus, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Skeleton from './Skeleton';
import Tooltip from './Tooltip';

export default function KpiCard({ title, value, change, changeType = 'neutral', icon: Icon, loading, description, suffix }) {
    const changeColors = {
        positive: 'text-green-600',
        negative: 'text-red-600',
        neutral: 'text-gray-500',
    };

    const ChangeIcon = {
        positive: ArrowUp,
        negative: ArrowDown,
        neutral: Minus,
    }[changeType];

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] }
        },
        hover: {
            y: -8,
            scale: 1.02,
            transition: { duration: 0.4, ease: "easeOut" }
        }
    };

    const getFontSize = (val) => {
        const str = String(val);
        if (str.length > 15) return 'text-base';
        if (str.length > 12) return 'text-lg';
        if (str.length > 9) return 'text-xl';
        if (str.length > 7) return 'text-2xl';
        return 'text-3xl';
    };

    if (loading) {
        return (
            <div className="glass-card p-4 border-white/40 shadow-blue-500/5">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-full">
                        <Skeleton variant="text" width="40%" className="mb-2" />
                        <Skeleton variant="text" width="60%" height="2rem" />
                    </div>
                    <Skeleton variant="circular" width="2.5rem" height="2.5rem" className="ml-4 rounded-xl" />
                </div>
                <div className="flex items-center mt-2">
                    <Skeleton variant="text" width="30%" />
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            className="glass-card p-5 border-white/60 shadow-md relative overflow-hidden group cursor-pointer h-full flex flex-col justify-between"
        >
            {/* Background Glow Effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:via-blue-500/5 transition-all duration-700 blur-2xl" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] opacity-80 leading-tight">{title}</p>
                            {description && (
                                <Tooltip content={description} position="top">
                                    <Info size={12} className="text-gray-300 hover:text-washouse-blue transition-colors cursor-help shrink-0" />
                                </Tooltip>
                            )}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <h3 className={`${getFontSize(value)} font-black text-washouse-navy font-outfit tracking-tighter leading-none`}>
                                {value}
                            </h3>
                            {suffix && <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest shrink-0">{suffix}</span>}
                        </div>
                    </div>
                    {Icon && (
                        <div className="p-3 bg-blue-50/50 rounded-2xl text-washouse-blue signature-glow border border-blue-100/30 group-hover:scale-110 transition-transform duration-500 shrink-0">
                            <Icon size={20} strokeWidth={2.5} />
                        </div>
                    )}
                </div>

                {change && (
                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <div className={`flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${changeType === 'positive' ? 'bg-green-50 text-green-600 border border-green-100/50' :
                                changeType === 'negative' ? 'bg-red-50 text-red-600 border border-red-100/50' :
                                    'bg-gray-50 text-gray-500 border border-gray-100'
                            }`}>
                            <ChangeIcon size={10} strokeWidth={3} className="mr-1" />
                            <span>{change}</span>
                        </div>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-40">vs mes ant.</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
