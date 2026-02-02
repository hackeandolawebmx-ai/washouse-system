import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import HostLayout from './layouts/HostLayout';
import AdminLayout from './layouts/AdminLayout';
import HostDashboard from './pages/HostDashboard';
import ServiceReception from './pages/ServiceReception';
import ClientsPage from './pages/ClientsPage';
import ReportsPage from './pages/ReportsPage'; // Added
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import { StorageProvider } from './context/StorageContext';
import { AuthProvider } from './context/AuthContext';
import PageTransition from './components/PageTransition';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Host Routes (Default) */}
        <Route path="/" element={<PageTransition><HostLayout /></PageTransition>}>
          <Route index element={<HostDashboard />} />
          <Route path="services" element={<ServiceReception />} />
          <Route path="host" element={<Navigate to="/" replace />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<PageTransition><AdminLogin /></PageTransition>} />

        <Route path="/admin" element={<PageTransition><ProtectedRoute /></PageTransition>}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="reports" element={<ReportsPage />} /> {/* Added */}
          </Route>
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <StorageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </AuthProvider>
    </StorageProvider>
  );
}

export default App;
