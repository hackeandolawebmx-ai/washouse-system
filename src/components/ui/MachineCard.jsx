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
            accent: 'bg-emerald-500',
            glow: 'shadow-emerald-500/10',
            text: 'text-emerald-600',
            bg: 'bg-emerald-50/50',
            gradient: 'from-emerald-400 to-emerald-500'
        },
        'running': {
            accent: 'bg-washouse-blue',
            glow: 'shadow-blue-500/20',
            text: 'text-washouse-blue',
            bg: 'bg-blue-50/50',
            gradient: 'from-blue-400 to-blue-500'
        },
        'finished': {
            accent: 'bg-orange-500',
            glow: 'shadow-orange-500/20',
            text: 'text-orange-600',
            bg: 'bg-orange-50/50',
            gradient: 'from-orange-400 to-orange-500'
        },
        'maintenance': {
            accent: 'bg-slate-400',
            glow: 'shadow-slate-400/10',
            text: 'text-slate-500',
            bg: 'bg-slate-100/50',
            gradient: 'from-slate-400 to-slate-500'
        }
    };

    const style = statusStyles[status] || statusStyles['available'];

    if (variant === 'compact') {
        return (
            <motion.div
                whileHover={{ scale: 1.01, boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}
                className={`
                    bg-white rounded-3xl p-5 flex items-center justify-between
                    border border-slate-100 transition-all duration-300 relative overflow-hidden group
                `}
            >
                {/* Accent Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-linear-to-b ${style.gradient}`} />

                <div className="flex items-center gap-4 min-w-0 flex-1 mr-4 ml-2">
                    <div className={`p-3 rounded-2xl shrink-0 shadow-inner ${type === 'lavadora' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                        {type === 'lavadora' ? <Droplets size={20} strokeWidth={2.5} /> : <Wind size={20} strokeWidth={2.5} />}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-black text-sm text-washouse-navy font-outfit tracking-tight truncate">{name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            {status === 'running' ? (
                                <span className="text-[10px] font-bold text-washouse-blue flex items-center whitespace-nowrap font-mono tracking-tighter">
                                    <Timer className="w-3.5 h-3.5 mr-1" /> {timeLeft}m RESTANTES
                                </span>
                            ) : (
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest opacity-70">{type}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={status} size="sm" />
                    <Button
                        size="sm"
                        variant={isAvailable ? 'primary' : 'outline'}
                        onClick={() => onAction(id)}
                        disabled={status === 'maintenance'}
                        className="w-10 h-10 p-0 flex items-center justify-center rounded-2xl active:scale-90 shadow-lg shadow-blue-500/10"
                    >
                        <Power size={18} />
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -6, boxShadow: '0 30px 60px -12px rgba(0,0,0,0.12)' }}
            className={`
                glass-card p-8 flex flex-col h-full relative overflow-hidden group border-white/60
                ${style.glow}
            `}
        >
            {/* Background Animation for Running state */}
            {status === 'running' && (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"
                />
            )}

            {/* Background Icon Decoration */}
            <div className={`absolute -right-8 -bottom-8 opacity-5 pointer-events-none transition-transform duration-700 group-hover:scale-125 group-hover:-rotate-12 ${style.text}`}>
                {type === 'lavadora' ? <Droplets size={160} strokeWidth={1} /> : <Wind size={160} strokeWidth={1} />}
            </div>

            {/* Accent Side Bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 bg-linear-to-b ${style.gradient} opacity-80`} />

            <div className="flex justify-between items-start mb-8 relative z-10 gap-2 ml-1">
                <div className="flex items-center min-w-0">
                    <Tooltip content={type === 'lavadora' ? 'Lavadora' : 'Secadora'} position="top">
                        <div className={`p-5 rounded-3xl mr-5 shrink-0 shadow-inner border border-white/50 ${type === 'lavadora' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {type === 'lavadora' ? <Droplets size={36} strokeWidth={2.5} /> : <Wind size={36} strokeWidth={2.5} />}
                        </div>
                    </Tooltip>
                    <div className="min-w-0">
                        <h3 className="font-black text-2xl text-washouse-navy font-outfit tracking-tight truncate pr-1" title={name}>{name}</h3>
                        <p className="text-xs text-slate-400 uppercase font-black tracking-widest mt-1 opacity-70 leading-none">{type}</p>
                    </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-4">
                    <StatusBadge status={status} className="shadow-lg shadow-black/5" />
                    {onToggleMaintenance && (
                        <button
                            onClick={() => onToggleMaintenance(id)}
                            className={`p-2.5 rounded-2xl transition-all active:scale-95 ${status === 'maintenance' ? 'bg-orange-100 text-orange-600 shadow-md ring-4 ring-orange-50' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100/80 border border-slate-100 hover:border-slate-200'}`}
                            title={status === 'maintenance' ? 'Reactivar equipo' : 'Poner en Mantenimiento'}
                        >
                            <Wrench size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="mb-10 flex-1 relative z-10 ml-1">
                {status === 'running' ? (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col text-washouse-blue"
                    >
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tighter leading-none">{timeLeft}</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60 leading-none">MINUTOS</span>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-none mt-1">RESTANTES</span>
                            </div>
                        </div>

                        {/* Progress Bar Visual */}
                        <div className="w-full h-1.5 bg-blue-100 rounded-full mt-6 overflow-hidden">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: timeLeft * 60, ease: "linear" }}
                                className="h-full bg-washouse-blue rounded-full shadow-[0_0_10px_rgba(0,144,215,0.4)]"
                            />
                        </div>

                        {props.clientName && (
                            <div className="flex items-center gap-3 mt-6 px-4 py-2 rounded-2xl bg-blue-50/50 border border-blue-100/30 w-fit group-hover:bg-blue-100/40 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(0,144,215,0.6)] animate-pulse" />
                                <p className="text-xs font-black text-slate-500 truncate max-w-[150px]">
                                    {props.clientName}
                                </p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="flex items-center gap-3 text-slate-400 font-black uppercase tracking-[0.2em] text-[11px] h-full pt-4">
                        <div className={`w-3 h-3 rounded-full ring-4 ${isAvailable ? 'bg-emerald-500 ring-emerald-50 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse' : 'bg-slate-300 ring-slate-50'}`} />
                        <span className="opacity-60">{isAvailable ? 'Disponible p/ Sucursal' : 'Fuera de Servicio'}</span>
                    </div>
                )}
            </div>

            <div className="relative z-10 ml-1">
                <Button
                    variant={isAvailable ? 'primary' : 'outline'}
                    onClick={() => onAction(id)}
                    disabled={status === 'maintenance'}
                    className={`
                        w-full py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px]
                        shadow-2xl transition-all duration-500 active:scale-95
                        ${isAvailable ? 'shadow-blue-500/25' : 'bg-white/40 backdrop-blur-xl border-slate-100 hover:bg-slate-50 hover:border-slate-200'}
                    `}
                >
                    {status === 'finished' ? (
                        <span className="flex items-center gap-3">
                            <RotateCcw className="w-4 h-4 stroke-[3px]" /> Liberar Equipo
                        </span>
                    ) : (
                        <span className="flex items-center gap-3">
                            <Power className="w-4 h-4 stroke-[3px]" /> {isAvailable ? 'Comenzar Ciclo' : 'Gestionar'}
                        </span>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}
