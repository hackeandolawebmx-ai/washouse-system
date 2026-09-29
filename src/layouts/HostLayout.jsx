import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../assets/WasHouse CYMK.png';
import { useAuth } from '../context/AuthContext';
import { useStorage } from '../context/StorageContext';
import ShiftModal from '../components/ui/ShiftModal';
import EndShiftModal from '../components/ui/EndShiftModal';
import BranchLockout from '../components/BranchLockout';
import { WashingMachine, ClipboardList, LogOut, BookOpen, Store, AlertTriangle } from 'lucide-react';

const TABS = [
    { to: '/sucursal', label: 'Por encargo', short: 'Encargo', icon: ClipboardList },
    { to: '/sucursal/autolavado', label: 'Autolavado', short: 'Autolavado', icon: WashingMachine },
    { to: '/sucursal/manual', label: 'Manual', short: 'Manual', icon: BookOpen }
];

export default function HostLayout() {
    const { user, isShiftOpen } = useAuth();
    const { isBranchActive, deviceBranchId, BRANCH_LICENSES, branches } = useStorage();
    const location = useLocation();
    const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);
    const headerRef = useRef(null);

    // Sucursal a la que está vinculado este dispositivo, siempre a la vista en
    // el encabezado. 'main' es el renglón técnico de respaldo (el valor por
    // defecto de un navegador nunca vinculado), así que cuenta como sin vincular.
    const branch = branches?.find(b => b.id === deviceBranchId);
    const sinVincular = !branch || deviceBranchId === 'main';

    // El manual se puede leer sin haber abierto turno: la identificación
    // (ShiftModal) tapa toda la pantalla y no dejaría consultarlo antes.
    const isManual = location.pathname === '/sucursal/manual';

    // Publica la altura real del encabezado en --host-header-h para que las
    // barras fijas de cada página se peguen justo debajo. Cambia según el
    // ancho (en tablet vertical y celular las pestañas bajan a otra línea).
    useEffect(() => {
        const el = headerRef.current;
        if (!el) return;
        const publicar = () => document.documentElement.style.setProperty('--host-header-h', `${el.offsetHeight}px`);
        publicar();
        const ro = new ResizeObserver(publicar);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    if (!isBranchActive(deviceBranchId)) {
        return <BranchLockout />;
    }

    const license = BRANCH_LICENSES[deviceBranchId];
    const daysRemaining = Math.ceil((new Date(license?.expires) - new Date()) / (1000 * 60 * 60 * 24));

    return (
        <div className="min-h-screen bg-washouse-subtle font-sans text-gray-800">
            <header ref={headerRef} className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm sticky top-0 z-50 print:hidden">
                {daysRemaining <= 7 && (
                    <div className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-1.5 text-center">
                        La suscripción de esta sucursal vence en {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}. Contacte a administración.
                    </div>
                )}

                <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap lg:flex-nowrap items-center gap-x-3 sm:gap-x-6 gap-y-2">
                    {/* Marca + sucursal */}
                    <div className="flex items-center min-w-0 shrink-0">
                        <img src={logo} alt="Washouse" className="h-8 sm:h-11 w-auto object-contain shrink-0" />
                        <div className="ml-2.5 sm:ml-4 pl-2.5 sm:pl-4 border-l border-gray-100 min-w-0">
                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400 leading-none">Sucursal</p>
                            {sinVincular ? (
                                <p
                                    className="mt-1 flex items-center gap-1.5 text-sm font-black text-amber-600 leading-none"
                                    title="Este dispositivo no está vinculado a una sucursal. Admin → Configuración → Este Dispositivo."
                                >
                                    <AlertTriangle size={15} className="shrink-0" /> Sin vincular
                                </p>
                            ) : (
                                <p className="mt-1 flex items-center gap-1.5 text-base font-black text-washouse-navy leading-none tracking-tight">
                                    <Store size={15} className="text-washouse-blue shrink-0" />
                                    {/* El logo ya dice Washouse; basta con el nombre de la sucursal */}
                                    <span className="truncate">{branch.name.replace(/^Washouse\s+/i, '')}</span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Turno — a la derecha; en pantallas angostas se queda en la primera línea */}
                    <div className="ml-auto lg:order-last flex items-center gap-2 shrink-0">
                        {isShiftOpen ? (
                            <>
                                <div className="flex items-center gap-2 sm:gap-2.5 bg-gray-50 px-2.5 sm:px-3.5 py-2 rounded-xl border border-gray-100">
                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                    <span className="flex flex-col leading-none">
                                        <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">En turno</span>
                                        <span className="text-sm font-black text-black mt-1">{user?.name}</span>
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsEndShiftModalOpen(true)}
                                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    title="Finalizar Turno"
                                    aria-label="Finalizar turno"
                                >
                                    <LogOut size={20} />
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 bg-red-50 px-3.5 py-2 rounded-xl border border-red-100">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest whitespace-nowrap">Turno cerrado</span>
                            </div>
                        )}
                    </div>

                    {/* Pestañas — en línea en escritorio, segunda fila en tablet vertical y celular */}
                    <nav aria-label="Secciones del mostrador" className="w-full lg:w-auto lg:flex-1 flex gap-1 overflow-x-auto -mx-1 px-1 lg:mx-0 lg:px-0">
                        {TABS.map(({ to, label, short, icon }) => {
                            const Icon = icon;
                            const active = location.pathname === to;
                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    aria-current={active ? 'page' : undefined}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-colors
                                        ${active ? 'bg-blue-50 text-washouse-blue' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <Icon size={17} />
                                    <span className="hidden sm:inline">{label}</span>
                                    <span className="sm:hidden">{short}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>

            <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 min-h-[calc(100vh-200px)]">
                <Outlet />
            </main>

            {!isManual && <ShiftModal />}
            <EndShiftModal
                isOpen={isEndShiftModalOpen}
                onClose={() => setIsEndShiftModalOpen(false)}
            />
        </div>
    );
}
