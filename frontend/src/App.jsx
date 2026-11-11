import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import MainLayout from "./layouts/MainLayout";
import AccountLayout from "./layouts/AccountLayout";
import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import SupportPage from "./pages/common/SupportPage";
import NotFound from "./pages/common/NotFound";
import Profile from "./pages/account/Profile";
import Security from "./pages/account/Security";
import Preferences from "./pages/account/Preferences";

import FullPageSpinner from "./components/common/FullPageSpinner";
import { useAuthBootstrap } from "./hooks/useAuth";

// Lazy-loaded Admin CMS pages
const AdminLayout = lazy(() => import("./layouts/admin/AdminLayout"));
const DashboardPage = lazy(() => import("./modules/admin/dashboard/DashboardPage"));
const UsersPage = lazy(() => import("./modules/admin/users/UsersPage"));
const MediaPage = lazy(() => import("./modules/admin/media/MediaPage"));
const SettingsPage = lazy(() => import("./modules/admin/settings/SettingsPage"));

function App() {
  // Exchanges the httpOnly refresh cookie for an access token on load.
  useAuthBootstrap();

  return (
    <>
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />

            <Route path="contact" element={<SupportPage />} />
            <Route path="about" element={<SupportPage />} />
            <Route path="privacy" element={<SupportPage />} />
            <Route path="terms" element={<SupportPage />} />
            <Route path="support" element={<SupportPage />} />

            <Route path="account" element={<AccountLayout />}>
              <Route index element={<Navigate to="profile" replace />} />
              <Route path="profile" element={<Profile />} />
              <Route path="security" element={<Security />} />
              <Route path="preferences" element={<Preferences />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid #27272a",
          },
        }}
      />
    </>
  );
}

export default App;
