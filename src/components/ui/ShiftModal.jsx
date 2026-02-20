import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import IconInput from './IconInput';
import SelectStaffModal from './SelectStaffModal';
import { User, DollarSign, LogIn, Key } from 'lucide-react';

export default function ShiftModal() {
    const { startShift, isShiftOpen } = useAuth();
    const [authenticatedUser, setAuthenticatedUser] = useState(null);
    const [initialCash, setInitialCash] = useState('');

    if (isShiftOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!authenticatedUser || !initialCash) return;

        startShift(authenticatedUser, initialCash);
        setAuthenticatedUser(null);
        setInitialCash('');
    };

    if (!authenticatedUser) {
        return (
            <SelectStaffModal
                isOpen={true}
                onClose={() => { }} // Mandatory identification
                onAuthenticated={(user) => {
                    setAuthenticatedUser(user);
                }}
            />
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-100 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                <div className="bg-washouse-gradient p-8 text-center relative">
                    <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md border border-white/30 shadow-inner">
                        <DollarSign className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Apertura de Caja</h2>
                    <p className="text-blue-100 font-bold text-sm tracking-wide mt-1">Sessión iniciada como: <span className="text-white underline">{authenticatedUser?.name}</span></p>

                    <button
                        onClick={() => setAuthenticatedUser(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                        title="Cambiar Usuario"
                    >
                        <User size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1">Fondo Inicial en Efectivo</label>
                        <div className="relative group">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center group-focus-within:bg-washouse-blue/10 transition-colors">
                                <DollarSign className="text-gray-400 group-focus-within:text-washouse-blue transition-colors" size={20} />
                            </div>
                            <input
                                autoFocus
                                type="number"
                                required
                                min="0"
                                step="0.1"
                                placeholder="0.00"
                                value={initialCash}
                                onChange={(e) => setInitialCash(e.target.value)}
                                className="w-full pl-18 pr-6 py-5 rounded-2xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-washouse-blue/10 focus:border-washouse-blue/30 transition-all font-black text-2xl"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold mt-3 ml-2 flex items-center gap-2 italic">
                            * Registra el monto exacto antes de la primera venta.
                        </p>
                    </div>

                    <Button type="submit" className="w-full py-5 text-lg shadow-xl shadow-blue-500/20 font-black">
                        Abrir Turno y Comenzar
                    </Button>

                    <button
                        type="button"
                        onClick={() => setAuthenticatedUser(null)}
                        className="w-full text-center text-xs font-black text-gray-400 hover:text-washouse-blue uppercase tracking-widest transition-colors"
                    >
                        Seleccionar otro usuario
                    </button>
                </form>
            </div>
        </div>
    );
}
