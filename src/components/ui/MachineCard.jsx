import { motion } from 'framer-motion';
import StatusBadge from './StatusBadge';
import Button from './Button';
import Tooltip from './Tooltip';
import { Timer, Power, Droplets, Wind, RotateCcw, Wrench } from 'lucide-react';

export default function MachineCard({ id, name, type, status, timeLeft, onAction, onToggleMaintenance, variant = 'default', ...props }) {
    const isAvailable = status === 'available';

    // Status-specific accent colors and glows
    const statusStyles = {
        'available': {
            accent: 'bg-green-500',
            glow: 'shadow-green-500/10',
            text: 'text-green-600',
            bg: 'bg-green-50/50'
        },
        'running': {
            accent: 'bg-washouse-blue',
            glow: 'shadow-blue-500/20',
            text: 'text-washouse-blue',
            bg: 'bg-blue-50/50'
        },
        'finished': {
            accent: 'bg-orange-500',
            glow: 'shadow-orange-500/20',
            text: 'text-orange-600',
            bg: 'bg-orange-50/50'
        },
        'maintenance': {
            accent: 'bg-gray-400',
            glow: 'shadow-gray-400/10',
            text: 'text-gray-500',
            bg: 'bg-gray-100/50'
        }
    };

    const style = statusStyles[status] || statusStyles['available'];

    if (variant === 'compact') {
        return (
            <motion.div
                whileHover={{ scale: 1.01 }}
                className={`
                    glass-surface rounded-xl p-4 flex items-center justify-between
                    transition-all duration-300 relative overflow-hidden group
                `}
            >
                {/* Accent Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.accent}`} />

                <div className="flex items-center gap-3 min-w-0 flex-1 mr-4 ml-2">
                    <div className={`p-2 rounded-lg shrink-0 ${type === 'lavadora' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {type === 'lavadora' ? <Droplets size={18} /> : <Wind size={18} />}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-sm text-washouse-navy truncate">{name}</h3>
                        <div className="flex items-center gap-2">
                            {status === 'running' ? (
                                <span className="text-xs font-bold text-washouse-blue flex items-center whitespace-nowrap">
                                    <Timer className="w-3 h-3 mr-1" /> {timeLeft}m
                                </span>
                            ) : (
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">{isAvailable ? 'Listo' : status}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={status} size="sm" />
                    <Button
                        size="sm"
                        variant={isAvailable ? 'primary' : 'secondary'}
                        onClick={() => onAction(id)}
                        disabled={status === 'maintenance'}
                        className="w-8 h-8 p-0 flex items-center justify-center rounded-full active:scale-90"
                    >
                        <Power size={14} />
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            className={`
                glass-card p-6 flex flex-col h-full relative overflow-hidden group
                ${style.glow}
            `}
        >
            {/* Background Decoration */}
            <div className={`absolute -right-6 -bottom-6 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12 ${style.text}`}>
                {type === 'lavadora' ? <Droplets size={140} /> : <Wind size={140} />}
            </div>

            {/* Accent Side Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 ${style.accent}`} />

            <div className="flex justify-between items-start mb-6 relative z-10 gap-2 ml-1">
                <div className="flex items-center min-w-0">
                    <Tooltip content={type === 'lavadora' ? 'Lavadora' : 'Secadora'} position="top">
                        <div className={`p-4 rounded-2xl mr-4 shrink-0 shadow-inner ${type === 'lavadora' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {type === 'lavadora' ? <Droplets size={32} /> : <Wind size={32} />}
                        </div>
                    </Tooltip>
                    <div className="min-w-0">
                        <h3 className="font-black text-xl text-washouse-navy truncate pr-1" title={name}>{name}</h3>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mt-1">{type}</p>
                    </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-3">
                    <StatusBadge status={status} />
                    {onToggleMaintenance && (
                        <button
                            onClick={() => onToggleMaintenance(id)}
                            className={`p-2 rounded-xl transition-all ${status === 'maintenance' ? 'bg-orange-100 text-orange-600 shadow-sm' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100/50'}`}
                            title={status === 'maintenance' ? 'Reactivar equipo' : 'Mantenimiento'}
                        >
                            <Wrench size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-8 flex-1 relative z-10 ml-1">
                {status === 'running' ? (
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col text-washouse-blue"
                    >
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black tracking-tighter">{timeLeft}</span>
                            <span className="text-sm font-black uppercase tracking-widest opacity-70">min</span>
                        </div>
                        {props.clientName && (
                            <div className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-lg bg-blue-50/50 border border-blue-100/50 w-fit">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                <p className="text-xs font-bold text-gray-500 truncate max-w-[150px]">
                                    {props.clientName}
                                </p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="flex items-center gap-2 text-gray-400 font-bold uppercase tracking-widest text-[10px] h-full">
                        <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                        {isAvailable ? 'Listo para sucursal' : 'Fuera de combate'}
                    </div>
                )}
            </div>

            <div className="relative z-10 ml-1">
                <Button
                    variant={isAvailable ? 'primary' : 'outline'}
                    onClick={() => onAction(id)}
                    disabled={status === 'maintenance'}
                    className={`
                        w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs
                        shadow-lg transition-all duration-300 active:scale-95
                        ${isAvailable ? 'shadow-blue-500/20' : 'bg-white/50 backdrop-blur-sm border-gray-100 hover:bg-white'}
                    `}
                >
                    {status === 'finished' ? (
                        <span className="flex items-center gap-2">
                            <RotateCcw className="w-4 h-4" /> Liberar Equipo
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Power className="w-4 h-4" /> {isAvailable ? 'Comenzar Ciclo' : 'Gestionar'}
                        </span>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
