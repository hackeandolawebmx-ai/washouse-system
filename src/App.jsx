import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import HostLayout from './layouts/HostLayout';
import AdminLayout from './layouts/AdminLayout';
import HostDashboard from './pages/HostDashboard';
import ServiceReception from './pages/ServiceReception';
import ClientsPage from './pages/ClientsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import InvoicesPage from './pages/InvoicesPage';
import RequestInvoicePage from './pages/RequestInvoicePage';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { StorageProvider } from './context/StorageContext';
import { AuthProvider } from './context/AuthContext';
import { InvoiceProvider } from './context/InvoiceContext';

import StaffManagement from './pages/StaffManagement';

/**
 * Contextos de la operación: al montarse descargan órdenes, ventas,
 * clientes, inventario y turnos.
 *
 * Solo envuelven las rutas de mostrador y administración. Las rutas
 * públicas quedan fuera a propósito, para que un visitante no reciba
 * datos de la operación en su navegador. Cualquier ruta pública nueva
 * va afuera de este bloque y pide lo suyo por src/lib/publicInvoice.js.
 */
function OperationalProviders() {
  return (
    <StorageProvider>
      <InvoiceProvider>
        <AuthProvider>
          <Outlet />
        </AuthProvider>
      </InvoiceProvider>
    </StorageProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* ---------- Público: sin contextos operativos ---------- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/solicitar-factura" element={<RequestInvoicePage />} />

      {/* ---------- Operación: mostrador y administración ---------- */}
      <Route element={<OperationalProviders />}>
        <Route path="/sucursal" element={<HostLayout />}>
          <Route index element={<HostDashboard />} />
          <Route path="servicios" element={<ServiceReception />} />
        </Route>

        {/* Rutas viejas del mostrador, para no romper accesos directos ya
            creados en las tablets. Se pueden quitar cuando todas estén
            apuntando a /sucursal. */}
        <Route path="/host" element={<Navigate to="/sucursal" replace />} />
        <Route path="/services" element={<Navigate to="/sucursal/servicios" replace />} />

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard">
              <Route index element={<AdminDashboard />} />
              <Route path="equipment" element={<AdminDashboard />} />
              <Route path="shifts" element={<AdminDashboard />} />
              <Route path="logs" element={<AdminDashboard />} />
            </Route>
            <Route path="staff" element={<StaffManagement />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
