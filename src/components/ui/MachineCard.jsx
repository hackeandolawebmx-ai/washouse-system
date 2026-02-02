import StatusBadge from './StatusBadge';
import Button from './Button';
import Tooltip from './Tooltip';
import { Timer, Power, Droplets, Wind } from 'lucide-react';

export default function MachineCard({ id, name, type, status, timeLeft, onAction, variant = 'default', ...props }) {
    const isAvailable = status === 'available';

    /* Determine status color for accent */
    const statusColors = {
        'available': 'border-t-4 border-green-500',
        'running': 'border-t-4 border-blue-600',
        'finished': 'border-t-4 border-orange-500',
        'maintenance': 'border-t-4 border-gray-400'
    };

    if (variant === 'compact') {
        return (
            <div className={`
                bg-white rounded-lg shadow-sm border border-gray-100 p-4 
                transition-all hover:bg-gray-50 flex items-center justify-between
                ${statusColors[status]}
            `}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${type === 'lavadora' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {type === 'lavadora' ? <Droplets size={20} /> : <Wind size={20} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-washouse-navy">{name}</h3>
                        <div className="flex items-center gap-2">
                            {status === 'running' ? (
                                <span className="text-sm font-bold text-washouse-blue flex items-center">
                                    <Timer className="w-3 h-3 mr-1" /> {timeLeft}m
                                </span>
                            ) : (
                                <span className="text-xs text-gray-500">{isAvailable ? 'Listo' : 'Ocupado'}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <StatusBadge status={status} />
                    <Button
                        size="sm"
                        variant={isAvailable ? 'primary' : 'secondary'}
                        onClick={() => onAction(id)}
                        disabled={status === 'maintenance'}
                        className="px-3"
                    >
                        <Power size={16} />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`
            bg-white rounded-xl shadow-sm border border-gray-100 p-6 
            transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden
            ${statusColors[status] || 'border-t-4 border-gray-200'}
        `}
        >
            {/* Background Icon Decoration */}
            <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                {type === 'lavadora' ? <Droplets size={120} /> : <Wind size={120} />}
            </div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center">
                    <Tooltip content={type === 'lavadora' ? 'Lavadora' : 'Secadora'} position="top">
                        <div className={`p-3 rounded-lg mr-4 ${type === 'lavadora' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {type === 'lavadora' ? <Droplets size={28} /> : <Wind size={28} />}
                        </div>
                    </Tooltip>
                    <div>
                        <h3 className="font-bold text-lg text-washouse-navy">{name}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">{type}</p>
                    </div>
                </div>
                <StatusBadge status={status} />
            </div>

            <div className="mb-6">
                {status === 'running' ? (
                    <div className="flex flex-col text-washouse-blue">
                        <div className="flex items-center">
                            <Timer className="w-5 h-5 mr-2" />
                            <span className="text-2xl font-bold">{timeLeft} min</span>
                        </div>
                        {/* Display Client Name if available */}
                        {props.clientName && (
                            <p className="text-xs font-medium text-gray-500 mt-1">
                                Cliente: {props.clientName}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-400 text-sm">
                        {isAvailable ? 'Lista para usar' : 'Esperando acción'}
                    </div>
                )}
            </div>

            <Button
                variant={isAvailable ? 'primary' : 'secondary'}
                onClick={() => onAction(id)}
                disabled={status === 'maintenance'}
                className="w-full justify-center flex items-center"
            >
                <Power className="w-4 h-4 mr-2" />
                {isAvailable ? 'Iniciar' : 'Ver Detalles'}
            </Button>
        </div>
    );
}
