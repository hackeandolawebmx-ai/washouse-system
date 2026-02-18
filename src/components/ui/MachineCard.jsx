import StatusBadge from './StatusBadge';
import Button from './Button';
import Tooltip from './Tooltip';
import { Timer, Power, Droplets, Wind, RotateCcw, Wrench } from 'lucide-react';

export default function MachineCard({ id, name, type, status, timeLeft, onAction, onToggleMaintenance, variant = 'default', ...props }) {
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
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                    <div className={`p-2 rounded-md shrink-0 ${type === 'lavadora' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {type === 'lavadora' ? <Droplets size={20} /> : <Wind size={20} />}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-base text-washouse-navy truncate">{name}</h3>
                        <div className="flex items-center gap-2">
                            {status === 'running' ? (
                                <span className="text-sm font-bold text-washouse-blue flex items-center whitespace-nowrap">
                                    <Timer className="w-3 h-3 mr-1" /> {timeLeft}m
                                </span>
                            ) : (
                                <span className="text-xs text-gray-500 truncate">{isAvailable ? 'Listo' : 'Ocupado'}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={status} />
                    {onToggleMaintenance && (
                        <button
                            onClick={() => onToggleMaintenance(id)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${status === 'maintenance' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-100'}`}
                            title={status === 'maintenance' ? 'Reactivar equipo' : 'Poner en mantenimiento'}
                        >
                            <Wrench size={14} />
                        </button>
                    )}
                    <Button
                        size="sm"
                        variant={isAvailable ? 'primary' : 'secondary'}
                        onClick={() => onAction(id)}
                        disabled={status === 'maintenance'}
                        className="w-8 h-8 p-0 flex items-center justify-center rounded-full"
                    >
                        <Power size={14} />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`
            bg-white rounded-xl shadow-sm border border-gray-100 p-6 
            transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden flex flex-col h-full
            ${statusColors[status] || 'border-t-4 border-gray-200'}
        `}
        >
            {/* Background Icon Decoration */}
            <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
                {type === 'lavadora' ? <Droplets size={120} /> : <Wind size={120} />}
            </div>

            <div className="flex justify-between items-start mb-4 relative z-10 gap-2">
                <div className="flex items-center min-w-0">
                    <Tooltip content={type === 'lavadora' ? 'Lavadora' : 'Secadora'} position="top">
                        <div className={`p-3 rounded-lg mr-3 shrink-0 ${type === 'lavadora' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {type === 'lavadora' ? <Droplets size={28} /> : <Wind size={28} />}
                        </div>
                    </Tooltip>
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg text-washouse-navy truncate pr-1" title={name}>{name}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold truncate">{type}</p>
                    </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                    <StatusBadge status={status} />
                    {onToggleMaintenance && (
                        <button
                            onClick={() => onToggleMaintenance(id)}
                            className={`p-1.5 rounded-full transition-colors ${status === 'maintenance' ? 'bg-orange-100 text-orange-600' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                            title={status === 'maintenance' ? 'Reactivar equipo' : 'Poner en mantenimiento'}
                        >
                            <Wrench size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-6 flex-1">
                {status === 'running' ? (
                    <div className="flex flex-col text-washouse-blue">
                        <div className="flex items-center">
                            <Timer className="w-5 h-5 mr-2" />
                            <span className="text-2xl font-bold">{timeLeft} min</span>
                        </div>
                        {/* Display Client Name if available */}
                        {props.clientName && (
                            <p className="text-xs font-medium text-gray-500 mt-1 truncate" title={props.clientName}>
                                Cliente: {props.clientName}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="text-gray-400 text-sm h-full flex items-center">
                        {isAvailable ? 'Lista para usar' : 'Esperando acción'}
                    </div>
                )}
            </div>

            <Button
                variant={isAvailable ? 'primary' : 'outline'}
                onClick={() => onAction(id)}
                disabled={status === 'maintenance'}
                className={`w-full justify-center flex items-center ${!isAvailable ? 'bg-white hover:bg-gray-50' : ''}`}
            >
                {status === 'finished' ? (
                    <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Liberar
                    </>
                ) : (
                    <>
                        <Power className="w-4 h-4 mr-2" />
                        {isAvailable ? 'Iniciar' : 'Ver Detalles'}
                    </>
                )}
            </Button>
        </div>
    );
}
