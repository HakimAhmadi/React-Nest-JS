import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  User,
  Lock,
  Settings,
  Layers,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Search,
  Mail,
  Plus,
  RefreshCw,
  Sliders,
  Sparkles,
  ArrowRight,
  Database,
  Globe,
  Smartphone,
  Cpu,
  FileText,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  FolderOpen,
  Users as UsersIcon,
  HelpCircle as SupportIcon,
  LogOut,
  LogIn,
} from "lucide-react";
import toast from "react-hot-toast";

import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import FormAlert from "@/components/ui/FormAlert";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Table from "@/components/ui/Table";
import TableSkeleton from "@/components/ui/TableSkeleton";

import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/utils/permissions";

export default function Home() {
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);
  const roles = useAuthStore((s) => s.roles);
  const permissions = useAuthStore((s) => s.permissions);
  const isAuthenticated = useAuthStore((s) => Boolean(s.accessToken));
  const isAdmin = useIsAdmin();

  // Component showcase interactive state
  const [btnLoading, setBtnLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableSortBy, setTableSortBy] = useState("name");
  const [tableSortDir, setTableSortDir] = useState("asc");
  const [tablePage, setTablePage] = useState(1);
  const [sampleInputValue, setSampleInputValue] = useState("");

  // Sample data for Table showcase
  const sampleUsers = [
    {
      id: 1,
      name: "Admin User",
      email: "admin@example.com",
      role: "SUPER_ADMIN",
      status: "active",
      joined: "2026-01-15",
    },
    {
      id: 2,
      name: "Jane Cooper",
      email: "jane.cooper@example.com",
      role: "ADMIN",
      status: "active",
      joined: "2026-02-01",
    },
    {
      id: 3,
      name: "Alex Morgan",
      email: "alex.m@example.com",
      role: "USER",
      status: "pending",
      joined: "2026-02-18",
    },
    {
      id: 4,
      name: "Devon Lane",
      email: "devon@example.com",
      role: "USER",
      status: "suspended",
      joined: "2026-03-04",
    },
  ];

  const tableColumns = [
    {
      key: "name",
      label: "Name / Email",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-gray-100">{row.name}</div>
          <div className="text-xs text-gray-400">{row.email}</div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.role === "SUPER_ADMIN"
              ? "info"
              : row.role === "ADMIN"
                ? "warning"
                : "default"
          }
        >
          {row.role}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.status === "active"
              ? "success"
              : row.status === "pending"
                ? "warning"
                : "danger"
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toast(`Viewing ${row.name}`)}
            icon={Eye}
          />
          <Button
            size="sm"
            variant="danger"
            onClick={() => setConfirmOpen(true)}
            icon={Trash2}
          />
        </div>
      ),
    },
  ];

  const handleTableSort = (key) => {
    if (tableSortBy === key) {
      setTableSortDir(tableSortDir === "asc" ? "desc" : "asc");
    } else {
      setTableSortBy(key);
      setTableSortDir("asc");
    }
  };

  const handleConfirmAction = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setConfirmLoading(false);
      setConfirmOpen(false);
      toast.success("Action confirmed successfully!");
    }, 1000);
  };

  return (
    <div className="bg-[#0c0d0e] text-gray-100 min-h-screen">
      {/* ── Top Hero & Status Banner ─────────────────────────────────── */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 border-b border-gray-800 bg-gradient-to-b from-black via-gray-950 to-[#0c0d0e]">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-600/10 border border-primary-500/20 text-primary-400 text-xs font-semibold uppercase tracking-wider mb-6">
                <Sparkles size={14} /> Full-Stack Boilerplate & Component Showcase
              </div>
              <h1 className="text-4xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[1.0] mb-6">
                Generic Full-Stack <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">
                  Development Template
                </span>
              </h1>
              <p className="text-base lg:text-lg text-gray-400 font-medium max-w-2xl leading-relaxed mb-8">
                Explore the complete application architecture. Below you will find quick links to all routes divided by access level (Guest, Authenticated User, and Admin Portal) alongside live interactive samples of every UI component.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="#pages-directory"
                  className="bg-primary-600 hover:bg-primary-500 text-white px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary-600/20 transition-all flex items-center gap-2"
                >
                  <FolderOpen size={16} /> Page Links Directory
                </a>
                <a
                  href="#components-showcase"
                  className="bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-7 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <Layers size={16} /> Component Showcase
                </a>
              </div>
            </div>

            {/* Current Session Widget */}
            <div className="w-full lg:w-96 bg-gray-900/90 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isAuthenticated ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                    Session Status
                  </span>
                </div>
                <Badge variant={isAuthenticated ? (isAdmin ? "info" : "success") : "default"}>
                  {isAuthenticated ? (isAdmin ? "Admin Active" : "User Active") : "Guest / Public"}
                </Badge>
              </div>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-bold text-white truncate">
                      {user?.name || user?.firstName ? `${user.firstName || ""} ${user.lastName || ""}` : "Authenticated User"}
                    </div>
                    <div className="text-xs text-gray-400 truncate">{user?.email || "No email"}</div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      Assigned Roles
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {roles.length > 0 ? (
                        roles.map((r) => (
                          <Badge key={r} variant="info">
                            {r}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </div>
                    {permissions.length > 0 && (
                      <div className="text-[10px] text-gray-400 mt-1">
                        {permissions.length} permissions active
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    {isAdmin && (
                      <Link to="/admin">
                        <Button variant="primary" size="sm" className="w-full" icon={Shield}>
                          Go to Admin Portal
                        </Button>
                      </Link>
                    )}
                    <Link to="/account/profile">
                      <Button variant="secondary" size="sm" className="w-full" icon={User}>
                        My Account Profile
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full"
                      icon={LogOut}
                      onClick={() => logout()}
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    You are unauthenticated. You can explore all user and admin modules below in interactive guest preview mode.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link to="/account/profile">
                      <Button variant="outline" size="sm" className="w-full text-[10px]" icon={User}>
                        User Demo
                      </Button>
                    </Link>
                    <Link to="/admin/dashboard">
                      <Button variant="outline" size="sm" className="w-full text-[10px]" icon={Shield}>
                        Admin Demo
                      </Button>
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2 pt-1 border-t border-gray-800">
                    <Link to="/login">
                      <Button variant="primary" size="sm" className="w-full" icon={LogIn}>
                        Sign In / Login
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button variant="secondary" size="sm" className="w-full" icon={Plus}>
                        Create Account
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 1: Page Links Directory ─────────────────────────── */}
      <section id="pages-directory" className="py-20 max-w-[1500px] mx-auto px-6 lg:px-12">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-400 mb-2">
            <FolderOpen size={16} /> Route Navigation Index
          </div>
          <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tight text-white">
            Available Pages & Access Levels
          </h2>
          <p className="text-sm text-gray-400 mt-2 max-w-xl">
            Quickly jump to any section of the boilerplate. Pages are grouped by permission level.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Guest / Public */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-7 flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-800 flex items-center justify-center text-primary-400">
                  <Globe size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Guest / Public</h3>
                  <span className="text-xs text-gray-400 font-medium">Unauthenticated access</span>
                </div>
              </div>
              <Badge variant="default">Public</Badge>
            </div>

            <ul className="space-y-3 flex-1">
              {[
                { title: "Home Page", path: "/", desc: "Showcase & boilerplate overview" },
                { title: "Sign In / Login", path: "/login", desc: "User credential login" },
                { title: "Registration", path: "/register", desc: "New account creation" },
                { title: "Forgot Password", path: "/forgot-password", desc: "Reset link request" },
                { title: "Reset Password", path: "/reset-password", desc: "Token confirmation form" },
                { title: "About / Documentation", path: "/about", desc: "General information" },
                { title: "Support Center", path: "/support", desc: "FAQ and help center" },
                { title: "Contact Us", path: "/contact", desc: "Inquiry submission" },
                { title: "Terms of Service", path: "/terms", desc: "Legal agreement" },
                { title: "Privacy Policy", path: "/privacy", desc: "Data & privacy policies" },
              ].map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="group block p-3 rounded-2xl bg-gray-950/50 hover:bg-gray-800/80 border border-gray-800/80 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-200 group-hover:text-primary-400 transition-colors">
                        {item.title}
                      </span>
                      <code className="text-[10px] text-gray-400 font-mono bg-gray-800/60 px-2 py-0.5 rounded">
                        {item.path}
                      </code>
                    </div>
                    <p className="text-xs text-gray-400 leading-snug">{item.desc}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: User Portal (Guest Accessible with Sample Data) */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-7 flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-800 flex items-center justify-center text-emerald-400">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">User Portal</h3>
                  <span className="text-xs text-gray-400 font-medium">Guest Preview + Logged In</span>
                </div>
              </div>
              <Badge variant="success">Sample Preview</Badge>
            </div>

            <ul className="space-y-3 flex-1">
              {[
                {
                  title: "User Profile Settings",
                  path: "/account/profile",
                  desc: "Personal details, avatar upload & contact info",
                },
                {
                  title: "Security & Authentication",
                  path: "/account/security",
                  desc: "Password update, 2FA toggle & active sessions",
                },
                {
                  title: "User Preferences",
                  path: "/account/preferences",
                  desc: "Notification settings, email digests & themes",
                },
                {
                  title: "Account Area Root",
                  path: "/account",
                  desc: "Account dashboard layout & navigation",
                },
              ].map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="group block p-3 rounded-2xl bg-gray-950/50 hover:bg-gray-800/80 border border-gray-800/80 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-200 group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </span>
                      <code className="text-[10px] text-gray-400 font-mono bg-gray-800/60 px-2 py-0.5 rounded">
                        {item.path}
                      </code>
                    </div>
                    <p className="text-xs text-gray-400 leading-snug">{item.desc}</p>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <span className="font-bold">Visible to All:</span> Guests explore with interactive sample data and local simulation; authenticated users persist changes directly to the backend database.
            </div>
          </div>

          {/* Column 3: Admin Portal (Guest Accessible with Sample Data) */}
          <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-7 flex flex-col">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-800 flex items-center justify-center text-indigo-400">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Admin CMS Portal</h3>
                  <span className="text-xs text-gray-400 font-medium">Guest Preview + Administrator</span>
                </div>
              </div>
              <Badge variant="info">Sample Preview</Badge>
            </div>

            <ul className="space-y-3 flex-1">
              {[
                {
                  title: "Admin Dashboard",
                  path: "/admin/dashboard",
                  desc: "KPIs, registration volume & system stats",
                },
                {
                  title: "User Management",
                  path: "/admin/users",
                  desc: "Search, filter, roles & user activation",
                },
                {
                  title: "Media & Uploads",
                  path: "/admin/media",
                  desc: "Server asset storage & uploads inspector",
                },
                {
                  title: "System Settings",
                  path: "/admin/settings",
                  desc: "System metadata, flags & configs",
                },
              ].map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="group block p-3 rounded-2xl bg-gray-950/50 hover:bg-gray-800/80 border border-gray-800/80 hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-200 group-hover:text-indigo-400 transition-colors">
                        {item.title}
                      </span>
                      <code className="text-[10px] text-gray-400 font-mono bg-gray-800/60 px-2 py-0.5 rounded">
                        {item.path}
                      </code>
                    </div>
                    <p className="text-xs text-gray-400 leading-snug">{item.desc}</p>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
              <span className="font-bold">Visible to All:</span> Guests explore with interactive sample records, simulated CRUD actions, and demo metrics; authenticated administrators interact with live database records.
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Complete Component Showcase ──────────────────── */}
      <section id="components-showcase" className="py-20 border-t border-gray-800 bg-gray-950/50">
        <div className="max-w-[1500px] mx-auto px-6 lg:px-12">
          <div className="mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-400 mb-2">
              <Layers size={16} /> UI Kit Showcase
            </div>
            <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tight text-white">
              Component Library & Interactive Samples
            </h2>
            <p className="text-sm text-gray-400 mt-2 max-w-2xl">
              Preview how each component renders within this boilerplate. Test variants, sizes, loading states, and dialog interactions.
            </p>
          </div>

          <div className="space-y-16">
            {/* 1. Buttons */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-800">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">Button Component</h3>
                  <code className="text-xs text-primary-400 font-mono">import Button from "@/components/ui/Button";</code>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={RefreshCw}
                    onClick={() => setBtnLoading(!btnLoading)}
                  >
                    Toggle Loading State: {btnLoading ? "ON" : "OFF"}
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Variants</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" loading={btnLoading}>Primary Variant</Button>
                    <Button variant="secondary" loading={btnLoading}>Secondary Variant</Button>
                    <Button variant="danger" loading={btnLoading}>Danger Variant</Button>
                    <Button variant="ghost" loading={btnLoading}>Ghost Variant</Button>
                    <Button variant="primary" disabled>Disabled State</Button>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Sizes & Icons</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm" icon={Plus}>Small Button (sm)</Button>
                    <Button size="md" icon={Shield}>Medium Button (md)</Button>
                    <Button size="lg" icon={Sparkles}>Large Button (lg)</Button>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Tooltips</div>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm" variant="secondary" tooltip="Tooltip on Top" tooltipLocation="top">Hover Top</Button>
                    <Button size="sm" variant="secondary" tooltip="Tooltip on Bottom" tooltipLocation="bottom">Hover Bottom</Button>
                    <Button size="sm" variant="secondary" tooltip="Tooltip on Left" tooltipLocation="left">Hover Left</Button>
                    <Button size="sm" variant="secondary" tooltip="Tooltip on Right" tooltipLocation="right">Hover Right</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Badges */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8">
              <div className="pb-6 mb-6 border-b border-gray-800">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Badge Component</h3>
                <code className="text-xs text-primary-400 font-mono">import Badge from "@/components/ui/Badge";</code>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Badge Variants</div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="default">Default Badge</Badge>
                  <Badge variant="success">Success Badge</Badge>
                  <Badge variant="warning">Warning Badge</Badge>
                  <Badge variant="danger">Danger Badge</Badge>
                  <Badge variant="info">Info Badge</Badge>
                </div>
              </div>
            </div>

            {/* 3. Inputs & Form Alerts */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8">
              <div className="pb-6 mb-6 border-b border-gray-800">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Input & FormAlert Components</h3>
                <code className="text-xs text-primary-400 font-mono">import Input from "@/components/ui/Input"; import FormAlert from "@/components/ui/FormAlert";</code>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                  <Input
                    label="Standard Text Input"
                    placeholder="Enter your name..."
                    value={sampleInputValue}
                    onChange={(e) => setSampleInputValue(e.target.value)}
                    helper="Help text guides the user on expected values."
                  />
                  <Input
                    label="Input With Left Icon"
                    placeholder="search@example.com"
                    leftIcon={Mail}
                    required
                  />
                  <Input
                    label="Input With Right Icon"
                    placeholder="Search keywords..."
                    rightIcon={Search}
                  />
                </div>

                <div className="space-y-4">
                  <Input
                    label="Input With Validation Error"
                    defaultValue="invalid_email"
                    error="Please provide a valid email address."
                    required
                  />
                  <Input
                    label="Disabled Input State"
                    defaultValue="Locked field value"
                    disabled
                  />
                </div>
              </div>

              <div className="border-t border-gray-800 pt-6">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">FormAlert Feedback Banners</div>
                <div className="space-y-3 max-w-xl">
                  <FormAlert
                    tone="error"
                    message="Error: Could not authenticate credentials. Please review the inputs and try again."
                  />
                  <FormAlert
                    tone="success"
                    message="Success: Your security settings and password have been updated."
                  />
                </div>
              </div>
            </div>

            {/* 4. Modals & Confirm Dialogs */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8">
              <div className="pb-6 mb-6 border-b border-gray-800">
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Modal & ConfirmDialog Components</h3>
                <code className="text-xs text-primary-400 font-mono">import Modal from "@/components/ui/Modal"; import ConfirmDialog from "@/components/ui/ConfirmDialog";</code>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" icon={Eye} onClick={() => setModalOpen(true)}>
                  Open Interactive Modal
                </Button>
                <Button variant="danger" icon={Trash2} onClick={() => setConfirmOpen(true)}>
                  Open Confirmation Dialog
                </Button>
              </div>

              {/* Demo Modal */}
              <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Sample Accessible Dialog"
                size="md"
              >
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">
                    This modal component includes accessible focus-trapping, escape key handling, scroll locking, and screen-reader headings.
                  </p>
                  <Input
                    label="Sample Field Inside Dialog"
                    placeholder="Type anything here..."
                  />
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <Button variant="secondary" onClick={() => setModalOpen(false)}>
                      Dismiss
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setModalOpen(false);
                        toast.success("Modal action saved!");
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Modal>

              {/* Demo ConfirmDialog */}
              <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmAction}
                title="Confirm Destructive Action"
                message="Are you sure you want to delete this sample record? This action demonstrates the confirmation flow."
                confirmLabel="Confirm Delete"
                loading={confirmLoading}
              />
            </div>

            {/* 5. Table & TableSkeleton */}
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-800">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">Table & TableSkeleton</h3>
                  <code className="text-xs text-primary-400 font-mono">import Table from "@/components/ui/Table"; import TableSkeleton from "@/components/ui/TableSkeleton";</code>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={RefreshCw}
                    onClick={() => setTableLoading(!tableLoading)}
                  >
                    Toggle Table Skeleton: {tableLoading ? "ON" : "OFF"}
                  </Button>
                </div>
              </div>

              {tableLoading ? (
                <TableSkeleton rows={4} columns={4} />
              ) : (
                <div className="border border-gray-800 rounded-2xl overflow-hidden bg-gray-950/60">
                  <Table
                    columns={tableColumns}
                    data={sampleUsers}
                    sortBy={tableSortBy}
                    sortDir={tableSortDir}
                    onSort={handleTableSort}
                    currentPage={tablePage}
                    totalItems={sampleUsers.length}
                    pageSize={10}
                    onPageChange={(page) => setTablePage(page)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
