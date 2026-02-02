import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Lock, ShieldCheck } from 'lucide-react';

export default function AdminLogin() {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const { loginAdmin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (loginAdmin(pin)) {
            navigate('/admin/dashboard');
        } else {
            setError('PIN Incorrecto');
            setPin('');
        }
    };

    return (
        <div className="min-h-screen bg-washouse-navy flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
                <div className="bg-gray-50 p-6 text-center border-b border-gray-100">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-washouse-blue" />
                    </div>
                    <h2 className="text-2xl font-bold text-washouse-navy">Acceso Administrativo</h2>
                    <p className="text-gray-500 text-sm">Ingresa el PIN de seguridad</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 text-center">PIN de Acceso</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                            <input
                                type="password"
                                required
                                maxLength="4"
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-washouse-blue focus:border-transparent outline-none transition-all text-center text-2xl tracking-widest"
                                placeholder="••••"
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value);
                                    setError('');
                                }}
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center mt-2 font-medium">{error}</p>}
                    </div>

                    <Button type="submit" className="w-full py-4 text-lg shadow-lg">
                        Ingresar al Dashboard
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="text-gray-400 hover:text-washouse-blue text-sm font-medium transition-colors"
                        >
                            Volver a Operaciones
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
