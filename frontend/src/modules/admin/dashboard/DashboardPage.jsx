import React from 'react';
import { 
  Users, 
  Activity, 
  ShieldCheck, 
  Database, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
} from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, trend }) => (
  <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-primary-500/30 transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary-600/20 group-hover:text-primary-400 transition-colors">
        <Icon size={24} />
      </div>
      {change && (
        <span className={`flex items-center text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {change}
          {trend === 'up' ? <ArrowUpRight size={14} className="ml-0.5" /> : <ArrowDownRight size={14} className="ml-0.5" />}
        </span>
      )}
    </div>
    <h3 className="text-gray-500 text-xs font-black uppercase tracking-[0.2em] mb-1">{title}</h3>
    <p className="text-2xl font-black text-white">{value}</p>
  </div>
);

const DashboardPage = () => {
  // Placeholder data - In a real app, these would come from an API
  const stats = [
    { title: "Total Users", value: "1,284", change: "+12%", trend: "up", icon: Users },
    { title: "Active Sessions", value: "42", change: "+5%", trend: "up", icon: Activity },
    { title: "System Health", value: "99.9%", change: "Stable", trend: "up", icon: ShieldCheck },
    { title: "Storage Used", value: "12.4 GB", change: "-2%", trend: "down", icon: Database },
  ];

  const recentActivity = [
    { id: 1, user: "admin@example.com", action: "Updated System Settings", time: "2 mins ago" },
    { id: 2, user: "newuser@test.com", action: "User Registration", time: "15 mins ago" },
    { id: 3, user: "moderator@site.com", action: "Deleted Media Asset", time: "1 hour ago" },
    { id: 4, user: "system", action: "Database Backup Completed", time: "3 hours ago" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Command Center</h1>
        <p className="text-gray-500 text-sm font-medium mt-1 uppercase tracking-widest flex items-center gap-2">
          <Clock size={14} className="text-primary-500" /> System Overview & Real-time Analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Recent Activity</h2>
            <button className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors">View All Logs</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Operator</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {recentActivity.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-xs font-bold text-gray-300">{item.user}</td>
                    <td className="px-6 py-4 text-xs font-medium text-white">{item.action}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health Sidebar */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-2xl">
          <h2 className="text-sm font-black text-white uppercase tracking-widest mb-6">Service Status</h2>
          <div className="space-y-6">
            {[
              { name: "API Gateway", status: "Operational", color: "bg-emerald-500" },
              { name: "Authentication Service", status: "Operational", color: "bg-emerald-500" },
              { name: "Database Cluster", status: "Operational", color: "bg-emerald-500" },
              { name: "S3 Media Bucket", status: "Operational", color: "bg-emerald-500" },
              { name: "Email Server", status: "Maintenance", color: "bg-amber-500" },
            ].map((service, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${service.color} animate-pulse`}></div>
                  <span className="text-xs font-bold text-gray-300">{service.name}</span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{service.status}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Run Diagnostics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
