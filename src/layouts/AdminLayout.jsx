import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, LayoutDashboard, Settings, Users, ClipboardList } from 'lucide-react';
import logo from '../assets/logo.png';

export default function AdminLayout() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const [isDashboardOpen, setIsDashboardOpen] = useState(true);

    const NavLink = ({ to, label, icon: Icon, isSubItem = false }) => (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 
                ${isSubItem ? 'ml-9 text-sm py-2' : ''}
                ${isActive(to)
                    ? 'bg-white/10 text-white shadow-sm border border-white/10 ring-1 ring-white/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {Icon && <Icon size={isSubItem ? 16 : 20} className={isActive(to) ? 'text-washouse-sky' : ''} />}
            {label}
        </Link>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <aside className="w-64 bg-washouse-navy text-white p-6 flex flex-col">
                <div className="mb-10 flex justify-center">
                    <img src={logo} alt="Washouse Admin" className="h-32 w-auto object-contain bg-white rounded-xl p-3 shadow-lg" />
                </div>
                <nav className="space-y-1.5 flex-1">
                    <div className="text-gray-500 text-[10px] uppercase tracking-[0.2em] font-black mt-4 mb-2 px-4 opcity-80">General</div>

                    <div className="space-y-1">
                        <button
                            onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium transition-all duration-200 
                                ${isActive('/admin/dashboard')
                                    ? 'bg-white/5 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <LayoutDashboard size={20} className={isActive('/admin/dashboard') ? 'text-washouse-sky' : ''} />
                                <span>Dashboard</span>
                            </div>
                            {isDashboardOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>

                        {isDashboardOpen && (
                            <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                                <NavLink to="/admin/dashboard" label="Resumen" isSubItem />
                                <NavLink to="/admin/dashboard/equipment" label="Equipo" isSubItem />
                            </div>
                        )}
                    </div>

                    <NavLink to="/admin/clients" label="Clientes" icon={Users} />

                    <div className="text-gray-500 text-[10px] uppercase tracking-[0.2em] font-black mt-8 mb-2 px-4 opacity-80">Sistema</div>
                    <NavLink to="/admin/reports" label="Reportes" icon={ClipboardList} />
                    <NavLink to="/admin/settings" label="Configuración" icon={Settings} />
                </nav>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <Outlet />
            </main>
        </div>
    );
}
