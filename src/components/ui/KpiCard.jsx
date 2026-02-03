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
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-full">
                        <Skeleton variant="text" width="40%" className="mb-2" />
                        <Skeleton variant="text" width="60%" height="2rem" />
                    </div>
                    <Skeleton variant="circular" width="2.5rem" height="2.5rem" className="ml-4" />
                </div>
                <div className="flex items-center mt-2">
                    <Skeleton variant="text" width="30%" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        {description && (
                            <Tooltip content={description} position="top">
                                <Info size={14} className="text-gray-400 hover:text-washouse-blue cursor-help" />
                            </Tooltip>
                        )}
                    </div>
                    <h3 className="text-2xl font-bold text-washouse-navy">{value}</h3>
                </div>
                {Icon && <div className="p-2 bg-blue-50 rounded-lg text-washouse-blue"><Icon size={20} /></div>}
            </div>

            {change && (
                <div className={`flex items-center text-sm font-medium ${changeColors[changeType]}`}>
                    <ChangeIcon size={16} className="mr-1" />
                    <span>{change}</span>
                    <span className="text-gray-400 ml-2 font-normal">vs mes anterior</span>
                </div>
            )}
        </div>
    );
}
