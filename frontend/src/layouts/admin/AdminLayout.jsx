import { Outlet, Link } from "react-router-dom";
import { Sparkles, LogIn, ArrowLeft } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useUIStore } from "@/store/uiStore";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/utils/permissions";

/**
 * AdminLayout — the shell wrapping all admin pages.
 * Accessible to authenticated admins and in interactive preview mode for guests.
 */
const AdminLayout = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const { isAuthenticated } = useAuth();
  const isAdmin = useIsAdmin();

  const isGuestAdmin = !isAuthenticated || !isAdmin;

  return (
    <div className="min-h-screen bg-gray-950 flex text-gray-100">
      <Sidebar isGuestAdmin={isGuestAdmin} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? "ml-60" : "ml-16"}`}
      >
        <Topbar isGuestAdmin={isGuestAdmin} />
        <main className="flex-1 pt-20 p-6 overflow-auto max-w-[1700px] w-full mx-auto">
          {isGuestAdmin && (
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                    Admin Preview Mode Active
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Public Demonstration
                    </span>
                  </h2>
                  <p className="text-[11px] text-amber-200/80 font-medium mt-0.5">
                    Exploring the administrative CMS with sample system records. Changes to users, media, and settings will be simulated locally.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/"
                  className="px-3.5 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-gray-700"
                >
                  <ArrowLeft size={12} />
                  <span>Main Site</span>
                </Link>
                <Link
                  to="/login?redirect=/admin"
                  className="px-3.5 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md shadow-primary-600/20"
                >
                  <LogIn size={12} />
                  <span>Admin Sign In</span>
                </Link>
              </div>
            </div>
          )}

          <Outlet context={{ isGuestAdmin }} />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
