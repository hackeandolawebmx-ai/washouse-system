import { ArrowUp, ArrowDown, Minus, Info } from 'lucide-react';
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
        <div className="glass-card p-6 border-white/60 shadow-md hover:scale-[1.02] transform transition-all duration-300 group">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</p>
                        {description && (
                            <Tooltip content={description} position="top">
                                <Info size={12} className="text-gray-300 hover:text-washouse-blue transition-colors cursor-help" />
                            </Tooltip>
                        )}
                    </div>
                    <h3 className="text-3xl font-black text-washouse-navy italic tracking-tight">{value}</h3>
                </div>
                {Icon && (
                    <div className="p-3 bg-blue-50 rounded-2xl text-washouse-blue signature-glow border border-blue-100/50">
                        <Icon size={22} strokeWidth={2.5} />
                    </div>
                )}
            </div>

            {change && (
                <div className="flex items-center gap-1.5">
                    <div className={`flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tight ${changeType === 'positive' ? 'bg-green-50 text-green-600 border border-green-100/50' :
                        changeType === 'negative' ? 'bg-red-50 text-red-600 border border-red-100/50' :
                            'bg-gray-50 text-gray-500 border border-gray-100'
                        }`}>
                        <ChangeIcon size={12} strokeWidth={3} className="mr-0.5" />
                        <span>{change}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider opacity-60">vs mes anterior</span>
                </div>
            )}
        </div>
    );
}
