import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
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
            <ShiftModal />
            <EndShiftModal
                isOpen={isEndShiftModalOpen}
                onClose={() => setIsEndShiftModalOpen(false)}
            />

            {/* Professional Header with Gradient */}
            <header className="bg-washouse-gradient shadow-lg relative z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                            <img src={logo} alt="Washouse" className="h-12 w-auto object-contain drop-shadow-md" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">WASHOUSE</h1>
                            <p className="text-blue-100 text-xs font-medium tracking-wider uppercase">Sistema de Control Operativo</p>
                        </div>
                    </div>

                    {/* User Profile / Status Indicator */}
                    {isShiftOpen ? (
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                <div className="flex flex-col text-left">
                                    <span className="text-xs text-blue-200 font-medium leading-none mb-0.5">Operador</span>
                                    <span className="text-sm font-bold text-white leading-none">{user?.name}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEndShiftModalOpen(true)}
                                className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Cerrar Turno"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 bg-red-500/20 px-4 py-2 rounded-full border border-red-500/30 backdrop-blur-sm">
                            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                            <span className="text-sm font-medium text-white">Turno Cerrado</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="max-w-7xl mx-auto px-6 mt-6 mb-4">
                <div className="flex space-x-2 bg-white/50 p-1 rounded-xl w-fit backdrop-blur-sm shadow-sm border border-white/60">
                    <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${location.pathname === '/' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <WashingMachine size={18} /> Lavado Asistido
                    </Link>
                    <Link to="/services" className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${location.pathname === '/services' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <ClipboardList size={18} /> Servicios Programados
                    </Link>
                </div>
            </div>

            <main className="px-6 pb-6 max-w-7xl mx-auto animate-fadeIn min-h-[calc(100vh-200px)]">
                <Outlet />
            </main>
        </div>
    );
}
