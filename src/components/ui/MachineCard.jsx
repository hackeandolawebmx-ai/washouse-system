import { Wrench, Wind, Droplets } from 'lucide-react';

/**
 * Tarjeta compacta de una máquina en el tablero del mostrador.
 *
 * Pensada para verse de reojo mientras se atiende: el estado se lee por el
 * color (barra lateral y texto) y cada estado tiene UNA acción principal,
 * siempre en el mismo lugar. El tipo (lavadora/secadora) no se repite aquí
 * porque el tablero ya agrupa por carril.
 */

const STATES = {
    available: {
        label: 'Disponible', bar: 'bg-emerald-500', text: 'text-emerald-600', dot: 'bg-emerald-500',
        card: 'bg-white', action: 'Comenzar ciclo',
        button: 'bg-washouse-blue text-white hover:bg-washouse-primary-hover'
    },
    running: {
        label: 'En uso', bar: 'bg-washouse-blue', text: 'text-washouse-blue', dot: 'bg-washouse-blue animate-pulse',
        card: 'bg-white', action: 'Gestionar',
        button: 'border-2 border-washouse-blue text-washouse-blue hover:bg-blue-50'
    },
    finished: {
        label: 'Terminado', bar: 'bg-orange-500', text: 'text-orange-600', dot: 'bg-orange-500 animate-pulse',
        card: 'bg-orange-50/40', action: 'Liberar equipo',
        button: 'bg-orange-500 text-white hover:bg-orange-600'
    },
    maintenance: {
        label: 'Mantenimiento', bar: 'bg-slate-300', text: 'text-slate-500', dot: 'bg-slate-400',
        card: 'bg-slate-50', action: 'Reactivar',
        button: 'border-2 border-slate-300 text-slate-600 hover:bg-white'
    }
};

// Avance real del ciclo, a partir de la hora de inicio. Sin startDate (p. ej.
// una máquina que ya corría antes de cargar la página) no se puede calcular,
// y es mejor no dibujar una barra que una inventada.
function cycleProgress(startDate, timeLeft) {
    if (!startDate) return null;
    const elapsed = (Date.now() - new Date(startDate).getTime()) / 60000;
    if (!(elapsed >= 0)) return null;
    const total = elapsed + (timeLeft || 0);
    return total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : null;
}

export default function MachineCard({
    id, name, type, status, timeLeft, startDate, clientName,
    pendingDry, movedToDryer, fromWasherName,
    onAction, onToggleMaintenance
}) {
    const s = STATES[status] || STATES.available;
    const progress = status === 'running' ? cycleProgress(startDate, timeLeft) : null;
    const TypeIcon = type === 'secadora' ? Wind : Droplets;

    const finishedNote = movedToDryer
        ? { text: `Pasa la ropa a ${movedToDryer}`, cls: 'text-orange-600' }
        : pendingDry
            ? { text: 'Esperando secadora libre', cls: 'text-amber-600' }
            : { text: 'Ciclo terminado', cls: 'text-orange-600' };

    const primary = () => (status === 'maintenance' ? onToggleMaintenance?.(id) : onAction(id));

    return (
        <article
            aria-label={`${name}, ${s.label}${clientName ? `, ${clientName}` : ''}`}
            className={`relative h-full flex flex-col rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-shadow hover:shadow-md ${s.card}`}
        >
            <span className={`absolute inset-y-0 left-0 w-1.5 ${s.bar}`} aria-hidden="true" />

            <div className="flex-1 flex flex-col gap-3 p-4 pl-5">
                {/* Nombre y estado */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="flex items-center gap-1.5 text-2xl font-black text-washouse-navy font-outfit tracking-tight leading-none">
                            <TypeIcon size={16} className="text-gray-300 shrink-0" aria-hidden="true" />
                            <span className="truncate">{name}</span>
                        </h3>
                        <p className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                            {s.label}
                        </p>
                    </div>
                    {status !== 'maintenance' && onToggleMaintenance && (
                        <button
                            onClick={() => onToggleMaintenance(id)}
                            className="p-1.5 -mr-1 rounded-lg text-gray-300 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            title="Poner en mantenimiento"
                            aria-label={`Poner ${name} en mantenimiento`}
                        >
                            <Wrench size={16} />
                        </button>
                    )}
                </div>

                {/* Detalle según estado */}
                {status === 'running' && (
                    <div className="flex flex-col gap-2">
                        <p className="flex items-baseline gap-1.5 text-washouse-blue leading-none">
                            <span className="text-3xl font-black tabular-nums tracking-tight">{timeLeft}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">min restantes</span>
                        </p>
                        {progress !== null && (
                            <div className="h-1.5 rounded-full bg-blue-100 overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                                <div className="h-full rounded-full bg-washouse-blue transition-[width] duration-700" style={{ width: `${progress * 100}%` }} />
                            </div>
                        )}
                        {clientName && <p className="text-sm font-bold text-slate-600 truncate">{clientName}</p>}
                        {pendingDry && (
                            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <Wind size={12} className="shrink-0" /> Al terminar pasa a secadora
                            </p>
                        )}
                        {fromWasherName && (
                            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <Droplets size={12} className="shrink-0" /> Viene de {fromWasherName}
                            </p>
                        )}
                    </div>
                )}

                {status === 'finished' && (
                    <div className="flex flex-col gap-1">
                        <p className={`text-sm font-black leading-snug ${finishedNote.cls}`}>{finishedNote.text}</p>
                        {clientName && <p className="text-sm font-bold text-slate-600 truncate">{clientName}</p>}
                    </div>
                )}
            </div>

            <div className="px-4 pl-5 pb-4">
                <button
                    onClick={primary}
                    className={`w-full h-10 rounded-xl text-sm font-bold transition-colors active:scale-[0.98] ${s.button}`}
                >
                    {s.action}
                </button>
            </div>
        </article>
    );
}
