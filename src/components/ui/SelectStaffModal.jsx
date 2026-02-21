import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStorage } from '../../context/StorageContext';
import { Users, User, Key, ArrowRight, X, AlertCircle } from 'lucide-react';
import Button from './Button';

export default function SelectStaffModal({ isOpen, onClose, onAuthenticated }) {
    const { staff, loginHost } = useAuth();
    const { deviceBranchId } = useStorage();

    const [selectedStaff, setSelectedStaff] = useState(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    // Safety checks for staff data
    if (!staff) {
        return (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60">
                <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-washouse-blue border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-gray-500">Cargando personal...</p>
                </div>
            </div>
        );
    }

    // Filter staff available for this branch or global
    const availableStaff = staff.filter(s =>
        s && (s.branchId === 'all' || s.branchId === deviceBranchId)
    );

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        if (!selectedStaff || !pin) return;

        // Use the new loginHost logic from AuthContext
        const result = loginHost(pin);

        if (result.success && result.userData.id === selectedStaff.id) {
            onAuthenticated(result.userData);
            setPin('');
            setSelectedStaff(null);
        } else if (result.success && result.userData.id !== selectedStaff.id) {
            setError('El PIN ingresado pertenece a otro usuario.');
        } else {
            setError(result.error || 'PIN Incorrecto');
        }
        setPin('');
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                <div className="bg-gray-50/50 p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="text-washouse-blue" size={24} />
                        <h2 className="text-lg font-black text-black">Identificación de Personal</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="p-8">
                    {!selectedStaff ? (
                        <div className="space-y-4">
                            <p className="text-sm font-bold text-gray-500 mb-4 px-2 tracking-tight">Selecciona tu perfil para comenzar:</p>
                            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {availableStaff.length > 0 ? (
                                    availableStaff.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => setSelectedStaff(s)}
                                            className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-washouse-blue/30 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center font-black text-washouse-blue shadow-sm">
                                                    {s.name.charAt(0)}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-black text-black leading-none">{s.name}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">{s.role}</p>
                                                </div>
                                            </div>
                                            <ArrowRight size={18} className="text-gray-300 group-hover:text-washouse-blue transition-colors" />
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-8 px-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <AlertCircle className="mx-auto text-gray-300 mb-2" size={32} />
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">No hay personal registrado</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleLogin} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <button
                                type="button"
                                onClick={() => { setSelectedStaff(null); setPin(''); setError(''); }}
                                className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest hover:text-washouse-blue transition-colors mb-4"
                            >
                                <ArrowRight size={12} className="rotate-180" /> Cambiar Usuario
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-20 h-20 rounded-full bg-blue-50 border-4 border-white shadow-xl flex items-center justify-center font-black text-3xl text-washouse-blue mx-auto mb-4">
                                    {selectedStaff.name.charAt(0)}
                                </div>
                                <h3 className="text-xl font-black text-black leading-none">{selectedStaff.name}</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-2">Ingresa tu PIN personal</p>
                            </div>

                            <div className="relative">
                                <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    autoFocus
                                    type="password"
                                    maxLength={4}
                                    value={pin}
                                    onChange={e => {
                                        setPin(e.target.value.replace(/\D/g, ''));
                                        setError('');
                                    }}
                                    className="w-full pl-14 pr-6 py-5 rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:ring-4 focus:ring-washouse-blue/10 focus:border-washouse-blue/30 transition-all font-black text-3xl text-center tracking-[0.8em]"
                                    placeholder="****"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 animate-in shake duration-300">
                                    <AlertCircle size={18} />
                                    <p className="text-xs font-bold">{error}</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full py-5 text-lg shadow-xl shadow-blue-500/20">
                                Confirmar Identidad
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
