import { useMemo, useState } from 'react';
import { X, WashingMachine } from 'lucide-react';
import { useStorage } from '../../../context/StorageContext';
import { machineStatusLabel } from '../../../utils/labels';

const byNumber = (a, b) =>
    parseInt(a.name.match(/\d+/)?.[0] || '0', 10) - parseInt(b.name.match(/\d+/)?.[0] || '0', 10);

export default function AssignWasherModal({ order, onClose, onAssign }) {
    const { machines } = useStorage();
    const [saving, setSaving] = useState(false);

    const washers = useMemo(() => machines
        .filter(m => m.branchId === order.branchId && m.type === 'lavadora')
        .sort(byNumber), [machines, order.branchId]);
    const available = washers.filter(m => m.status === 'available');

    const pick = async (machine) => {
        setSaving(true);
        const ok = await onAssign(machine);
        setSaving(false);
        if (ok === false) alert(`${machine.name} ya no está libre. Elige otra.`);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="assign-washer-title"
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-5 border-b flex items-start justify-between gap-4">
                    <div>
                        <h3 id="assign-washer-title" className="text-lg font-black text-washouse-navy">Asignar lavadora</h3>
                        <p className="text-sm text-gray-500 mt-0.5">{order.customerName} · <span className="font-mono">{order.id}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400" aria-label="Cerrar"><X size={18} /></button>
                </div>

                <div className="p-6">
                    {washers.length === 0 ? (
                        <p className="text-sm text-gray-500">Esta sucursal no tiene lavadoras dadas de alta.</p>
                    ) : (
                        <>
                            {available.length === 0 && (
                                <p className="mb-4 text-sm font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                                    Ahora no hay lavadoras libres. Libera una en Autolavado o espera a que termine un ciclo.
                                </p>
                            )}
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {washers.map(m => {
                                    const free = m.status === 'available';
                                    return (
                                        <button
                                            key={m.id}
                                            disabled={!free || saving}
                                            onClick={() => pick(m)}
                                            className={`rounded-2xl border-2 p-3 text-center transition-all ${free
                                                ? 'border-emerald-200 bg-emerald-50/50 hover:border-washouse-blue hover:bg-blue-50 active:scale-95'
                                                : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'}`}
                                        >
                                            <WashingMachine size={22} className={`mx-auto ${free ? 'text-emerald-600' : 'text-gray-400'}`} />
                                            <div className="font-black text-washouse-navy mt-1">{m.name}</div>
                                            <div className={`text-[10px] font-bold uppercase tracking-wide ${free ? 'text-emerald-700' : 'text-gray-400'}`}>
                                                {free ? 'Libre' : machineStatusLabel(m.status)}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-400 mt-4">
                                La lavadora arranca en Autolavado con el nombre del cliente. Si la orden lleva secado, al terminar pasa sola a una secadora.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
