import { ArrowUp, ArrowDown, Minus, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import Skeleton from './Skeleton';
import Tooltip from './Tooltip';

export default function KpiCard({ title, value, change, changeType = 'neutral', icon: Icon, loading, description }) {
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

    if (loading) {
        return (
            <div className="glass-card p-6 border-white/40 shadow-blue-500/5">
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
            className="glass-card p-8 border-white/60 shadow-md relative overflow-hidden group cursor-pointer"
        >
            {/* Background Glow Effect */}
            <div className="absolute -inset-1 bg-linear-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:via-blue-500/5 transition-all duration-700 blur-2xl" />

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] opacity-80">{title}</p>
                            {description && (
                                <Tooltip content={description} position="top">
                                    <Info size={12} className="text-gray-300 hover:text-washouse-blue transition-colors cursor-help" />
                                </Tooltip>
                            )}
                        </div>
                        <h3 className="text-4xl font-black text-washouse-navy italic tracking-tighter leading-tight">{value}</h3>
                    </div>
                    {Icon && (
                        <div className="p-4 bg-blue-50/50 rounded-2xl text-washouse-blue signature-glow border border-blue-100/30 group-hover:scale-110 transition-transform duration-500">
                            <Icon size={24} strokeWidth={2.5} />
                        </div>
                    )}
                </div>

                {change && (
                    <div className="flex items-center gap-2">
                        <div className={`flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${changeType === 'positive' ? 'bg-green-50 text-green-600 border border-green-100/50' :
                            changeType === 'negative' ? 'bg-red-50 text-red-600 border border-red-100/50' :
                                'bg-gray-50 text-gray-500 border border-gray-100'
                            }`}>
                            <ChangeIcon size={12} strokeWidth={3} className="mr-1" />
                            <span>{change}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-40">vs mes anterior</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
