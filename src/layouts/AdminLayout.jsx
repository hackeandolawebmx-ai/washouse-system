import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, Users, UserCog, FileText, Menu, X, BookOpen, LogOut, WashingMachine, History, Tags } from 'lucide-react';
import { useInvoice } from '../context/InvoiceContext';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/WasHouse CYMK.png';

// Fuera de AdminLayout: declarado adentro, React lo trataba como un componente
// nuevo en cada render y desmontaba/montaba todos los enlaces del menú.
const isActivePath = (pathname, path) => pathname === path || pathname.startsWith(path + '/');

function NavLink({ to, label, icon: Icon, isSubItem = false, badge = 0 }) {
    const { pathname } = useLocation();
    const active = isActivePath(pathname, to);
    return (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200
                ${isSubItem ? 'ml-9 text-sm py-2' : ''}
                ${active
                    ? 'bg-white/10 text-white shadow-sm border border-white/10 ring-1 ring-white/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {Icon && <Icon size={isSubItem ? 16 : 20} className={active ? 'text-washouse-sky' : ''} />}
            <span className="flex-1">{label}</span>
            {badge > 0 && (
                <span className="min-w-5 h-5 px-1.5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-black">
                    {badge}
                </span>
            )}
        </Link>
    );
}

function SectionLabel({ children }) {
    return (
        <div className="text-gray-500/80 text-[9px] uppercase tracking-[0.25em] font-black pt-6 pb-2 px-4 first:pt-2">
            {children}
        </div>
    );
}

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { logoutAdmin } = useAuth();
    const { invoiceRequests } = useInvoice();
    const pendingInvoiceRequests = invoiceRequests.filter(r => r.status === 'pending').length;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen flex">
            {/* Mobile top bar */}
            <div className="md:hidden print:hidden fixed top-0 inset-x-0 z-30 h-16 bg-washouse-navy flex items-center justify-between px-4 border-b border-white/5">
                <img src={logo} alt="Washouse · Administración" className="h-9 w-auto object-contain bg-white rounded-lg p-1" />
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="relative p-2 text-white hover:bg-white/10 rounded-xl transition-colors"
                    aria-label="Abrir menú"
                >
                    <Menu size={24} />
                    {pendingInvoiceRequests > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-washouse-navy" />
                    )}
                </button>
            </div>

            {/* Mobile backdrop */}
            {isSidebarOpen && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    className="md:hidden fixed inset-0 bg-black/50 z-40"
                />
            )}

            {/* Sidebar - off-canvas drawer on mobile, static on desktop */}
            <aside
                className={`w-72 bg-washouse-navy flex flex-col border-r border-white/5 fixed inset-y-0 left-0 z-50 overflow-y-auto print:hidden
                    transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 md:static md:z-auto`}
            >
                <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="md:hidden absolute top-4 right-4 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    aria-label="Cerrar menú"
                >
                    <X size={20} />
                </button>

                {/* Brand Identity Section */}
                <div className="p-8 mb-6 flex flex-col items-center">
                    <img
                        src={logo}
                        alt="Washouse · Administración"
                        className="h-28 w-auto object-contain bg-white rounded-3xl p-5 relative z-10 border border-gray-100"
                    />
                    <div className="flex flex-col items-center gap-1 mt-4">
                        <span className="text-[10px] font-bold text-white uppercase tracking-[0.3em] font-mono">Administración</span>
                    </div>
                </div>

                <nav className="space-y-1 flex-1 px-4 overflow-y-auto" aria-label="Menú de administración">
                    <SectionLabel>Operación</SectionLabel>
                    <NavLink to="/admin/dashboard" label="Inicio" icon={LayoutDashboard} />
                    <NavLink to="/admin/equipment" label="Equipos" icon={WashingMachine} />
                    <NavLink to="/admin/shifts" label="Cortes de caja" icon={History} />

                    <SectionLabel>Negocio</SectionLabel>
                    <NavLink to="/admin/clients" label="Clientes" icon={Users} />
                    <NavLink to="/admin/invoices" label="Facturación" icon={FileText} badge={pendingInvoiceRequests} />
                    <NavLink to="/admin/catalog" label="Precios y catálogo" icon={Tags} />
                    <NavLink to="/admin/staff" label="Personal" icon={UserCog} />

                    <SectionLabel>Sistema</SectionLabel>
                    <NavLink to="/admin/settings" label="Configuración" icon={Settings} />
                    <NavLink to="/admin/manual" label="Manual" icon={BookOpen} />
                </nav>

                <div className="p-6 mt-auto">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-washouse-blue/20 rounded-xl flex items-center justify-center text-washouse-blue font-black text-xs">
                                AD
                            </div>
                            <div className="text-[10px] font-black text-white uppercase tracking-widest">Administrador</div>
                        </div>
                        <button
                            onClick={() => {
                                logoutAdmin();
                                navigate('/admin/login', { replace: true });
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-red-500/80 hover:border-red-500/80 transition-colors"
                        >
                            <LogOut size={14} /> Cerrar sesión
                        </button>
                    </div>
                </div>
            </aside>
            <main className="flex-1 bg-white overflow-y-auto pt-16 md:pt-0 print:overflow-visible print:pt-0">
                <div className="p-6 md:p-12 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
