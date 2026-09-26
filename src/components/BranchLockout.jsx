import React from 'react';
import { ShieldAlert, Phone, Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../context/StorageContext';

export default function BranchLockout() {
    const { logout } = useAuth();
    const { deviceBranchId, branches, BRANCH_LICENSES } = useStorage();

    // Esta pantalla aparece por dos motivos distintos que conviene no
    // confundir: la sucursal existe y su licencia venció, o el dispositivo
    // apunta a una sucursal que no está registrada. Lo segundo se resuelve
    // vinculando la tablet, no pagando.
    const branchName = branches?.find(b => b.id === deviceBranchId)?.name;
    const tieneLicencia = Boolean(BRANCH_LICENSES?.[deviceBranchId]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full">
                {/* Glassmorphic Card */}
                <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-10 shadow-2xl relative overflow-hidden group">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/10 rounded-full blur-[80px] group-hover:bg-red-500/20 transition-colors duration-700"></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                            <ShieldAlert size={40} className="text-red-500" />
                        </div>

                        <h1 className="text-2xl font-black text-white mb-4 tracking-tight uppercase">
                            {tieneLicencia ? 'Servicio Suspendido' : 'Sucursal No Reconocida'}
                        </h1>

                        <div className="mb-6 inline-flex flex-col items-center gap-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
                            <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.25em]">
                                Este dispositivo apunta a
                            </span>
                            <span className="text-sm text-gray-100 font-black">
                                {branchName || deviceBranchId || 'ninguna sucursal'}
                            </span>
                        </div>

                        <p className="text-gray-400 text-sm leading-relaxed mb-10 font-medium">
                            {tieneLicencia
                                ? 'El acceso a esta sucursal ha sido restringido por falta de pago o vencimiento de licencia. Por favor, contacte al soporte técnico para restablecer el servicio.'
                                : 'Este dispositivo está vinculado a una sucursal que no está dada de alta. No es un problema de pago: un administrador debe vincularlo a la sucursal correcta desde Configuración → Este Dispositivo.'}
                        </p>

                        <div className="w-full space-y-4 mb-10">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Phone size={18} className="text-blue-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">WhatsApp</p>
                                    <p className="text-sm text-gray-200 font-black">+52 81 1234 5678</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Mail size={18} className="text-purple-400" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Email</p>
                                    <p className="text-sm text-gray-200 font-black">facturacion@washouse.com</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="flex items-center gap-2 text-gray-500 hover:text-white text-xs font-black uppercase tracking-[0.2em] transition-all group/btn"
                        >
                            <ArrowLeft size={14} className="group-hover/btn:-translate-x-1 transition-transform" />
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">
                    Washouse Management System v2.0
                </p>
            </div>
        </div>
    );
}
