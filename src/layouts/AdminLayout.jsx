import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, LayoutDashboard, Settings, Users, ClipboardList } from 'lucide-react';
import logo from '../assets/WasHouse CYMK.png';

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
        <div className="min-h-screen flex">
            {/* Standard Sidebar - Stripped for Debugging */}
            <aside className="w-72 bg-washouse-navy flex flex-col border-r border-white/5 relative">
                {/* Brand Identity Section */}
                <div className="p-8 mb-6 flex flex-col items-center">
                    <img
                        src={logo}
                        alt="Washouse Admin"
                        className="h-28 w-auto object-contain bg-white rounded-3xl p-5 relative z-10 border border-gray-100"
                    />
                    <div className="flex flex-col items-center gap-1 mt-4">
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] italic">Admin Control</span>
                    </div>
                </div>

                <nav className="space-y-1.5 flex-1 px-4 overflow-y-auto">
                    <div className="text-gray-500/80 text-[9px] uppercase tracking-[0.25em] font-black mt-4 mb-3 px-4">
                        General
                    </div>

                    <div className="space-y-1">
                        <button
                            onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
                                ${isActive('/admin/dashboard')
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-3">
                                <LayoutDashboard size={18} />
                                <span className="italic">Dashboard</span>
                            </div>
                            <ChevronDown size={14} className={`transition-transform ${isDashboardOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDashboardOpen && (
                            <div className="space-y-1 mt-1 pl-4 ml-6 border-l border-white/5">
                                <NavLink to="/admin/dashboard" label="Resumen" isSubItem />
                                <NavLink to="/admin/dashboard/equipment" label="Estado de Equipos" isSubItem />
                            </div>
                        )}
                    </div>

                    <NavLink to="/admin/staff" label="Personal" icon={Users} />
                    <NavLink to="/admin/clients" label="Base de Clientes" icon={Users} />

                    <div className="text-gray-500/80 text-[9px] uppercase tracking-[0.25em] font-black mt-10 mb-3 px-4">
                        Sistema
                    </div>
                    <NavLink to="/admin/reports" label="Reportes" icon={ClipboardList} />
                    <NavLink to="/admin/settings" label="Configuración" icon={Settings} />
                </nav>

                <div className="p-6 mt-auto">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center gap-3">
                        <div className="w-9 h-9 bg-washouse-blue/20 rounded-xl flex items-center justify-center text-washouse-blue font-black text-xs">
                            AD
                        </div>
                        <div className="text-[10px] font-black text-white uppercase tracking-widest">Admin</div>
                    </div>
                </div>
            </aside>
            <main className="flex-1 bg-white overflow-y-auto">
                <div className="p-8 md:p-12 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
