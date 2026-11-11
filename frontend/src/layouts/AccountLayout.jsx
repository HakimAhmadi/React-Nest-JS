import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { User, LogOut, ChevronRight, Shield, Sliders, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SAMPLE_GUEST_USER } from "@/pages/account/sampleData";

const AccountLayout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const isGuest = !isAuthenticated || !user;
  const activeUser = isGuest ? SAMPLE_GUEST_USER : user;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { name: "Profile", path: "/account/profile", icon: User },
    { name: "Security", path: "/account/security", icon: Shield },
    { name: "Preferences", path: "/account/preferences", icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#F0F0F0]">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="flex flex-col md:flex-row lg:flex-col justify-between items-start md:items-center lg:items-start gap-6 lg:gap-0">
                {/* Header Section */}
                <div className="mb-2 lg:mb-6">
                  <h1 className="text-xl lg:text-2xl font-black tracking-tighter text-black uppercase mb-1">
                    My Account
                  </h1>
                  <div className="h-1 w-10 lg:w-12 bg-black"></div>
                </div>

                {/* User Identity */}
                <div className="mb-0 lg:mb-6 lg:pb-6 lg:border-b border-gray-300 w-full">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-black flex items-center justify-center text-white text-xl lg:text-2xl font-black ring-4 ring-white shadow-2xl shrink-0 overflow-hidden">
                      {activeUser?.avatar ? (
                        <img
                          src={activeUser.avatar}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        activeUser?.name?.charAt(0) || "U"
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm lg:text-base font-black text-black leading-none mb-1 uppercase tracking-tight truncate">
                        {activeUser?.name}
                      </h3>
                      <p className="text-[8px] lg:text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate">
                        {activeUser?.email}
                      </p>
                      {isGuest ? (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 border border-amber-200">
                          <Sparkles size={9} /> Guest Preview
                        </span>
                      ) : (
                        <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-black text-white">
                          Active Member
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="mt-8 lg:mt-0 flex lg:flex-col gap-2 flex-wrap lg:overflow-visible no-scrollbar pb-4 lg:pb-0 -mx-6 px-6 lg:mx-0 lg:px-0">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between py-3 lg:py-4 px-4 lg:px-2 rounded-2xl lg:rounded-xl transition-all duration-300 group shrink-0 border lg:border-none ${
                        isActive
                          ? "bg-black text-white lg:bg-transparent lg:text-black lg:translate-x-1 border-black"
                          : "bg-white text-gray-400 border-gray-200 lg:bg-transparent lg:text-gray-400 hover:text-black lg:hover:translate-x-1"
                      }`
                    }
                  >
                    <div className="flex items-center gap-3 lg:gap-5 font-black uppercase text-[10px] lg:text-[11px] tracking-[0.2em] whitespace-nowrap">
                      <item.icon
                        size={16}
                        strokeWidth={2.5}
                        className="group-hover:scale-110 transition-transform duration-300"
                      />
                      {item.name}
                    </div>
                    <ChevronRight
                      size={14}
                      strokeWidth={3}
                      className="hidden lg:block opacity-0 group-hover:opacity-100 transition-all duration-300"
                    />
                  </NavLink>
                ))}

                {isGuest ? (
                  <div className="mt-6 pt-6 border-t border-gray-300 w-full space-y-2">
                    <Link
                      to="/login?redirect=/account/profile"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors shadow-sm"
                    >
                      <LogIn size={14} />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-gray-300 text-black rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-colors"
                    >
                      <span>Register</span>
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="mt-10 flex items-center gap-3 lg:gap-5 py-3 lg:py-4 px-4 lg:px-2 bg-white lg:bg-transparent border border-gray-200 lg:border-none rounded-2xl lg:rounded-none text-red-500 font-black uppercase text-[10px] lg:text-[11px] tracking-[0.2em] lg:hover:translate-x-1 transition-all group shrink-0"
                  >
                    <LogOut
                      size={16}
                      strokeWidth={2.5}
                      className="group-hover:rotate-12 transition-transform"
                    />
                    <span className="whitespace-nowrap">Logout</span>
                  </button>
                )}
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            {isGuest && (
              <div className="mb-6 p-4 lg:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-amber-950">
                      Guest Preview Mode Active
                    </h2>
                    <p className="text-[11px] text-amber-800 font-medium">
                      You are exploring the user account area with boilerplate sample data. Forms and switches are fully interactive.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to="/login?redirect=/account/profile"
                    className="px-3.5 py-1.5 rounded-lg bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
              <Outlet context={{ isGuest, user: activeUser }} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AccountLayout;
