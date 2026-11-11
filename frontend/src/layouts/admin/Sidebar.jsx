import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  Image as ImageIcon,
  ChevronLeft,
} from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  {
    path: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: null,
  },
  { path: "/admin/users", label: "Users", icon: Users, permission: "user.view" },
  {
    path: "/admin/media",
    label: "Media Library",
    icon: ImageIcon,
    permission: "upload.view",
  },
  {
    path: "/admin/settings",
    label: "Settings",
    icon: Settings,
    permission: "settings.view",
  },
];

const Sidebar = ({ isGuestAdmin = false }) => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const permissions = useAuthStore((s) => s.permissions);

  // In guest admin preview mode, make all sections visible so guests can inspect all tools
  const visibleItems = isGuestAdmin
    ? NAV_ITEMS
    : NAV_ITEMS.filter(
        (item) =>
          item.permission === null ||
          (permissions && permissions.includes(item.permission)),
      );

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen z-40 flex flex-col bg-gray-900 border-r border-gray-800
        transition-all duration-300 ease-in-out sidebar-scroll overflow-y-auto
        ${sidebarOpen ? "w-60" : "w-16"}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-800 flex-shrink-0">
        <div className="flex flex-col items-center justify-center min-w-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide truncate">Admin CMS</span>
              {isGuestAdmin && (
                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Demo
                </span>
              )}
            </div>
          ) : (
            <span className="font-bold text-white tracking-wide truncate">AC</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {visibleItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-all duration-150 group relative
              ${
                isActive
                  ? "bg-primary-600/20 text-primary-400 border border-primary-500/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              }
            `}
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
            {/* Tooltip when collapsed */}
            {!sidebarOpen && (
              <div
                className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-gray-100 text-xs rounded-md
                whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50
                border border-gray-700 shadow-lg"
              >
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="p-2 border-t border-gray-800 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-gray-400
            hover:text-gray-100 hover:bg-gray-800 transition-colors text-sm"
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-300 ${!sidebarOpen ? "rotate-180" : ""}`}
          />
          {sidebarOpen && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
