import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import { User, DollarSign, LogIn } from 'lucide-react';

export default function ShiftModal() {
    const { startShift, isShiftOpen } = useAuth();
    const [name, setName] = useState('');
    const [initialCash, setInitialCash] = useState('');

    if (isShiftOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !initialCash) return;

        startShift({ name, role: 'host' }, initialCash);
    };

    return (
        <div className="fixed inset-0 bg-washouse-navy/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                <div className="bg-washouse-gradient p-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                        <LogIn className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">Iniciar Turno</h2>
                    <p className="text-blue-100">Ingresa tus datos para comenzar a operar</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Operador</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-washouse-blue focus:border-transparent outline-none transition-all"
                                    placeholder="Ej. Juan Pérez"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fondo de Caja Inicial</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.1"
                                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-washouse-blue focus:border-transparent outline-none transition-all"
                                    placeholder="0.00"
                                    value={initialCash}
                                    onChange={(e) => setInitialCash(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 ml-1">Dinero en efectivo al inicio del día.</p>
                        </div>
                    </div>

                    <Button type="submit" className="w-full py-4 text-lg shadow-lg">
                        Abrir Caja y Comenzar
                    </Button>
                </form>
            </div>
        </div>
    );
}
