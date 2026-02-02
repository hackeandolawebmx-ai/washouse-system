import { Outlet, Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function AdminLayout() {
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const NavLink = ({ to, label }) => (
        <Link
            to={to}
            className={`block px-4 py-2 rounded-lg font-medium transition-all duration-200 
                ${isActive(to)
                    ? 'bg-white/10 text-white shadow-sm border border-white/10 translate-x-1'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {label}
        </Link>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <aside className="w-64 bg-washouse-navy text-white p-6 flex flex-col">
                <div className="mb-10 flex justify-center">
                    <img src={logo} alt="Washouse Admin" className="h-32 w-auto object-contain bg-white rounded-xl p-3 shadow-lg" />
                </div>
                <nav className="space-y-2 flex-1">
                    <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-4 px-4">General</div>
                    <NavLink to="/admin/dashboard" label="Dashboard" />
                    <NavLink to="/admin/clients" label="Clientes" />
                    <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mt-8 mb-4 px-4">Sistema</div>
                    <NavLink to="/admin/reports" label="Reportes" />
                    <NavLink to="/admin/settings" label="Configuración" />
                </nav>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <Outlet />
            </main>
        </div>
    );
}
