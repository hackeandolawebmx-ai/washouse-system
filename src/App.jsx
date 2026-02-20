import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HostLayout from './layouts/HostLayout';
import AdminLayout from './layouts/AdminLayout';
import HostDashboard from './pages/HostDashboard';
import ServiceReception from './pages/ServiceReception';
import ClientsPage from './pages/ClientsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import { StorageProvider } from './context/StorageContext';
import { AuthProvider } from './context/AuthContext';
import PageTransition from './components/PageTransition';

import StaffManagement from './pages/StaffManagement';

function AppRoutes() {
  return (
    <Routes>
      {/* Host Routes (Default) */}
      <Route path="/" element={<HostLayout />}>
        <Route index element={<HostDashboard />} />
        <Route path="services" element={<ServiceReception />} />
        <Route path="host" element={<Navigate to="/" replace />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard">
            <Route index element={<AdminDashboard />} />
            <Route path="equipment" element={<AdminDashboard />} />
          </Route>
          <Route path="staff" element={<StaffManagement />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <StorageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </StorageProvider>
  );
}

export default App;
