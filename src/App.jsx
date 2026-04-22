import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import { Toaster } from 'react-hot-toast';

// Auth pages
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';

// Public website pages
import HomePage from './features/website/HomePage';
import AboutPage from './features/website/AboutPage';
import ServicesPage from './features/website/ServicesPage';
import ProductsPage from './features/website/ProductsPage';
import ProjectsPage from './features/website/ProjectsPage';
import TeamPage from './features/website/TeamPage';
import ContactPage from './features/website/ContactPage';

// Admin pages
import AdminDashboard from './features/admin/AdminDashboard';
import AdminTickets from './features/admin/AdminTickets';
import AdminEquipment from './features/admin/AdminEquipment';
import AdminClients from './features/admin/AdminClients';
import AdminUsers from './features/admin/AdminUsers';
import AdminInventory from './features/admin/AdminInventory';

// Role dashboards
import EmployeeDashboard from './features/employee/EmployeeDashboard';
import EmployeeTickets from './features/employee/EmployeeTickets';
import EmployeeInventory from './features/employee/EmployeeInventory';
import EmployeeExpenses from './features/employee/EmployeeExpenses';
import ClientDashboard from './features/client/ClientDashboard';
import ClientEquipment from './features/client/ClientEquipment';
import ClientTickets from './features/client/ClientTickets';
import ClientInvoices from './features/client/ClientInvoices';
import AdminExpenses from './features/admin/AdminExpenses';
import AdminInvoices from './features/admin/AdminInvoices';

// Placeholder pages
import ComingSoon from './features/shared/ComingSoon';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Protected route + sidebar layout
function ProtectedLayout({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

// Public route + navbar/footer layout
function PubPage({ children }) {
  return <PublicLayout>{children}</PublicLayout>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ScrollToTop />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "'Poppins', sans-serif",
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: '10px',
              boxShadow: '0 8px 24px rgba(13,27,62,0.12), 0 2px 8px rgba(13,27,62,0.06)',
              padding: '12px 16px',
              maxWidth: 380,
            },
            success: {
              iconTheme: { primary: '#22C55E', secondary: '#fff' },
              style: {
                background: '#F0FDF4',
                color: '#166534',
                border: '1px solid #BBF7D0',
              },
            },
            error: {
              iconTheme: { primary: '#E8192C', secondary: '#fff' },
              style: {
                background: '#FEF2F2',
                color: '#991B1B',
                border: '1px solid #FECACA',
              },
            },
          }}
        />
        <Routes>
          {/* ══════════════ PUBLIC WEBSITE ══════════════ */}
          <Route path="/" element={<PubPage><HomePage /></PubPage>} />
          <Route path="/about" element={<PubPage><AboutPage /></PubPage>} />
          <Route path="/services" element={<PubPage><ServicesPage /></PubPage>} />
          <Route path="/products" element={<PubPage><ProductsPage /></PubPage>} />
          <Route path="/projects" element={<PubPage><ProjectsPage /></PubPage>} />
          <Route path="/team" element={<PubPage><TeamPage /></PubPage>} />
          <Route path="/contact" element={<PubPage><ContactPage /></PubPage>} />

          {/* ══════════════ AUTH ══════════════ */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ══════════════ ADMIN ══════════════ */}
          <Route path="/admin" element={<ProtectedLayout roles={['admin']}><AdminDashboard /></ProtectedLayout>} />
          <Route path="/admin/tickets" element={<ProtectedLayout roles={['admin']}><AdminTickets /></ProtectedLayout>} />
          <Route path="/admin/equipment" element={<ProtectedLayout roles={['admin']}><AdminEquipment /></ProtectedLayout>} />
          <Route path="/admin/clients" element={<ProtectedLayout roles={['admin']}><AdminClients /></ProtectedLayout>} />
          <Route path="/admin/users" element={<ProtectedLayout roles={['admin']}><AdminUsers /></ProtectedLayout>} />
          <Route path="/admin/inventory" element={<ProtectedLayout roles={['admin']}><AdminInventory /></ProtectedLayout>} />
          <Route path="/admin/expenses" element={<ProtectedLayout roles={['admin']}><AdminExpenses /></ProtectedLayout>} />
          <Route path="/admin/invoices" element={<ProtectedLayout roles={['admin']}><AdminInvoices /></ProtectedLayout>} />

          {/* ══════════════ EMPLOYEE ══════════════ */}
          <Route path="/employee" element={<ProtectedLayout roles={['employee', 'admin']}><EmployeeDashboard /></ProtectedLayout>} />
          <Route path="/employee/tickets" element={<ProtectedLayout roles={['employee', 'admin']}><EmployeeTickets /></ProtectedLayout>} />
          <Route path="/employee/inventory" element={<ProtectedLayout roles={['employee', 'admin']}><EmployeeInventory /></ProtectedLayout>} />
          <Route path="/employee/expenses" element={<ProtectedLayout roles={['employee', 'admin']}><EmployeeExpenses /></ProtectedLayout>} />

          {/* ══════════════ CLIENT ══════════════ */}
          <Route path="/client" element={<ProtectedLayout roles={['client', 'admin']}><ClientDashboard /></ProtectedLayout>} />
          <Route path="/client/equipment" element={<ProtectedLayout roles={['client', 'admin']}><ClientEquipment /></ProtectedLayout>} />
          <Route path="/client/tickets" element={<ProtectedLayout roles={['client', 'admin']}><ClientTickets /></ProtectedLayout>} />
          <Route path="/client/invoices" element={<ProtectedLayout roles={['client', 'admin']}><ClientInvoices /></ProtectedLayout>} />

          {/* ══════════════ FALLBACK ══════════════ */}
          <Route path="/catalog" element={<PubPage><ComingSoon title="Equipment Catalog" /></PubPage>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </QueryClientProvider>
  );
}
