import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../assets/WasHouse CYMK.png';
import { useAuth } from '../context/AuthContext';
import ShiftModal from '../components/ui/ShiftModal';
import EndShiftModal from '../components/ui/EndShiftModal';
import { WashingMachine, Power, User, ClipboardList, LogOut } from 'lucide-react';

export default function HostLayout() {
    const { user, isShiftOpen } = useAuth();
    const location = useLocation();
    const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-washouse-subtle font-sans text-gray-800">
            {/* Professional Clean White Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center group cursor-default">
                        <img src={logo} alt="Washouse" className="h-14 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
                        <div className="ml-5 pl-5 border-l border-gray-100 hidden md:block">
                            <h2 className="text-[11px] font-black text-black tracking-[0.4em] leading-none uppercase italic">Sistema</h2>
                            <p className="text-[9px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-1.5 opacity-70">Gestión de Lavandería</p>
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
            <div className="max-w-7xl mx-auto px-6 mt-8 mb-6">
                <nav className="flex space-x-3 bg-gray-100/30 p-1.5 rounded-2xl w-fit border border-gray-200/50 shadow-sm backdrop-blur-sm">
                    <Link
                        to="/"
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300
                            ${location.pathname === '/'
                                ? 'bg-white shadow-lg shadow-blue-500/10 text-washouse-blue ring-1 ring-gray-100'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
                    >
                        <WashingMachine size={18} className={location.pathname === '/' ? 'animate-bounce' : ''} />
                        Lavado Asistido
                    </Link>
                    <Link
                        to="/services"
                        className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all duration-300
                            ${location.pathname === '/services'
                                ? 'bg-white shadow-lg shadow-blue-500/10 text-washouse-blue ring-1 ring-gray-100'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
                    >
                        <ClipboardList size={18} className={location.pathname === '/services' ? 'animate-pulse' : ''} />
                        Servicios Programados
                    </Link>
                </nav>
            </div>

            <main className="px-6 pb-6 max-w-7xl mx-auto animate-fadeIn min-h-[calc(100vh-200px)]">
                <Outlet />
            </main>

            {/* Session Modals moved to bottom for proper stacking context */}
            <ShiftModal />
            <EndShiftModal
                isOpen={isEndShiftModalOpen}
                onClose={() => setIsEndShiftModalOpen(false)}
            />
        </div>
    );
}
