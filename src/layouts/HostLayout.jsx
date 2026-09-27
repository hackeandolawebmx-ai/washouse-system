import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../assets/WasHouse CYMK.png';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../context/StorageContext';
import ShiftModal from '../components/ui/ShiftModal';
import EndShiftModal from '../components/ui/EndShiftModal';
import BranchLockout from '../components/BranchLockout';
import { WashingMachine, ClipboardList, LogOut, BookOpen, Store, AlertTriangle } from 'lucide-react';

export default function HostLayout() {
    const { user, isShiftOpen } = useAuth();
    const { isBranchActive, deviceBranchId, BRANCH_LICENSES, branches } = useStorage();

    // Sucursal a la que está vinculado este dispositivo, siempre a la vista en
    // el encabezado. 'main' es el renglón técnico de respaldo (el valor por
    // defecto de un navegador nunca vinculado), así que cuenta como sin vincular.
    const branch = branches?.find(b => b.id === deviceBranchId);
    const sinVincular = !branch || deviceBranchId === 'main';
    const location = useLocation();
    const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);

    // El manual se puede leer sin haber abierto turno: la identificación
    // (ShiftModal) tapa toda la pantalla y no dejaría consultarlo antes.
    const isManual = location.pathname === '/sucursal/manual';

    if (!isBranchActive(deviceBranchId)) {
        return <BranchLockout />;
    }

    const license = BRANCH_LICENSES[deviceBranchId];
    const expires = new Date(license?.expires);
    const now = new Date();
    const daysRemaining = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));

    return (
        <div className="min-h-screen bg-washouse-subtle font-sans text-gray-800">
            {/* Professional Clean White Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-50 transition-all duration-300 print:hidden">
                {daysRemaining <= 7 && (
                    <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 text-center animate-pulse">
                        Aviso: La suscripción de esta sucursal vence en {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}. Contacte a administración.
                    </div>
                )}
                <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center group cursor-default min-w-0">
                        <img src={logo} alt="Washouse" className="h-10 sm:h-14 w-auto object-contain shrink-0 transition-transform duration-500 group-hover:scale-105" />
                        <div className="ml-4 sm:ml-5 pl-4 sm:pl-5 border-l border-gray-100 min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400 leading-none">Sucursal</p>
                            {sinVincular ? (
                                <p
                                    className="mt-1.5 flex items-center gap-1.5 text-sm font-black text-amber-600 leading-none"
                                    title="Este dispositivo no está vinculado a una sucursal. Admin → Configuración → Este Dispositivo."
                                >
                                    <AlertTriangle size={15} className="shrink-0" /> Sin vincular
                                </p>
                            ) : (
                                <p className="mt-1.5 flex items-center gap-1.5 text-base sm:text-lg font-black text-washouse-navy leading-none tracking-tight">
                                    <Store size={16} className="text-washouse-blue shrink-0" />
                                    {/* El logo ya dice Washouse; basta con el nombre de la sucursal */}
                                    <span className="truncate">{branch.name.replace(/^Washouse\s+/i, '')}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* User Profile / Status Indicator */}
                    {isShiftOpen ? (
                        <div className="flex items-center space-x-5">
                            <div className="flex items-center space-x-4 bg-gray-50/50 px-5 py-2.5 rounded-2xl border border-gray-100 shadow-inner group transition-all hover:bg-white hover:shadow-md cursor-default">
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)] animate-pulse"></div>
                                <div className="flex flex-col text-left">
                                    <span className="text-[9px] text-gray-400 font-black uppercase leading-none mb-1 tracking-widest">En turno</span>
                                    <span className="text-sm font-black text-black leading-none">{user?.name}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEndShiftModalOpen(true)}
                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 active:scale-90"
                                title="Finalizar Turno"
                            >
                                <LogOut size={22} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3 bg-red-50/50 px-5 py-2.5 rounded-full border border-red-100 animate-in fade-in slide-in-from-right-4">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]"></div>
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Acceso Restringido • Turno Cerrado</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-6 mt-8 mb-6 print:hidden">
                <nav className="flex flex-wrap gap-3 bg-gray-100/30 p-1.5 rounded-2xl w-fit border border-gray-200/50 shadow-sm backdrop-blur-sm">
                    <Link
                        to="/sucursal"
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300
                            ${location.pathname === '/sucursal'
                                ? 'bg-white shadow-lg shadow-blue-500/10 text-washouse-blue ring-1 ring-gray-100'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
                    >
                        <WashingMachine size={18} className={location.pathname === '/sucursal' ? 'animate-bounce' : ''} />
                        Lavado Asistido
                    </Link>
                    <Link
                        to="/sucursal/servicios"
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300
                            ${location.pathname === '/sucursal/servicios'
                                ? 'bg-white shadow-lg shadow-blue-500/10 text-washouse-blue ring-1 ring-gray-100'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
                    >
                        <ClipboardList size={18} className={location.pathname === '/sucursal/servicios' ? 'animate-pulse' : ''} />
                        Servicios Programados
                    </Link>
                    <Link
                        to="/sucursal/manual"
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300
                            ${isManual
                                ? 'bg-white shadow-lg shadow-blue-500/10 text-washouse-blue ring-1 ring-gray-100'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
                    >
                        <BookOpen size={18} />
                        Manual
                    </Link>
                </nav>
            </div>

            <main className="px-6 pb-6 max-w-7xl mx-auto animate-fadeIn min-h-[calc(100vh-200px)]">
                <Outlet />
            </main>

            {/* Session Modals moved to bottom for proper stacking context */}
            {!isManual && <ShiftModal />}
            <EndShiftModal
                isOpen={isEndShiftModalOpen}
                onClose={() => setIsEndShiftModalOpen(false)}
            />
        </div>
    );
}
