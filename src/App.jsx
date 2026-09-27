import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { StorageProvider } from './context/StorageContext';
import { AuthProvider } from './context/AuthContext';
import { InvoiceProvider } from './context/InvoiceContext';

/**
 * Cada página se carga en su propio chunk, para que entrar a un área no
 * descargue las otras dos: un visitante de la landing no necesita el
 * asistente de órdenes del mostrador ni Recharts del panel de admin, y
 * viceversa.
 *
 * Los layouts (HostLayout/AdminLayout) también van lazy, y no solo por
 * peso propio: HostLayout importa ShiftModal/EndShiftModal, que usan
 * framer-motion. Si el layout fuera un import estático aquí, arrastraría
 * framer-motion al chunk de entrada y Vite lo precargaría (modulepreload)
 * en TODAS las rutas, landing incluida, sin importar que LandingPage
 * nunca lo use.
 */
const HostLayout = lazy(() => import('./layouts/HostLayout'));
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));

const LandingPage = lazy(() => import('./pages/LandingPage'));
const RequestInvoicePage = lazy(() => import('./pages/RequestInvoicePage'));

const HostDashboard = lazy(() => import('./pages/HostDashboard'));
const ServiceReception = lazy(() => import('./pages/ServiceReception'));

const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StaffManagement = lazy(() => import('./pages/StaffManagement'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-washouse-subtle">
      <div className="w-10 h-10 border-4 border-washouse-blue/20 border-t-washouse-blue rounded-full animate-spin" />
    </div>
  );
}

/**
 * Contextos de la operación: al montarse descargan órdenes, ventas,
 * clientes, inventario y turnos.
 *
 * Solo envuelven las rutas de mostrador y administración. Las rutas
 * públicas quedan fuera a propósito, para que un visitante no reciba
 * datos de la operación en su navegador. Cualquier ruta pública nueva
 * va afuera de este bloque y pide lo suyo por src/lib/publicData.js.
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
    <Suspense fallback={<RouteLoader />}>
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
    </Suspense>
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
