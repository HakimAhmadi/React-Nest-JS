import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import { useAuth } from "./context/AuthContext";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AccountLayout from "./layouts/AccountLayout";
import AdminLayout from "./layouts/admin/AdminLayout";

// Public Pages
import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import SupportPage from "./pages/common/SupportPage";

// Profile Pages
import Profile from "./pages/account/Profile";

// Admin Pages
import UsersPage from "./modules/admin/users/UsersPage";
import MediaPage from "./modules/admin/media/MediaPage";
import SettingsPage from "./modules/admin/settings/SettingsPage";
import DashboardPage from "./modules/admin/dashboard/DashboardPage";

// Guards
import ProtectedRoute from "./components/common/ProtectedRoute";
import { isAdmin } from "./utils/permissions";

// Redirect admin to /admin if they land on home
const HomeRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  const userIsAdmin = user?.roles?.some(r => ['ADMIN', 'SUPER_ADMIN'].includes(r));

  if (isAuthenticated && userIsAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return <Home />;
};

function App() {
  return (
    <>
      <Routes>
        {/* Main Application Layout */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="reset-password" element={<ResetPassword />} />
          
          {/* Static Pages */}
          <Route path="contact" element={<SupportPage />} />
          <Route path="about" element={<SupportPage />} />
          <Route path="privacy" element={<SupportPage />} />
          <Route path="terms" element={<SupportPage />} />

          {/* User Account Section */}
          <Route
            path="account"
            element={
              <ProtectedRoute>
                <AccountLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Administration Section */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid #27272a',
          },
        }}
      />
    </>
  );
}

export default App;
