import { 
  BarChart3, 
  Users, 
  Home, 
  Calendar, 
  CreditCard, 
  Star, 
  ShieldAlert, 
  Settings,
  ShieldCheck,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isPathActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuItems = [
    { id: "dashboard", label: "DASHBOARD", icon: BarChart3, path: "/admin/dashboard" },
    { id: "users", label: "USER_MANAGEMENT", icon: Users, path: "/admin/users" },
    { id: "universities", label: "UNIVERSITY_REGISTRY", icon: ShieldCheck, path: "/admin/universities" },
    { id: "hostels", label: "HOSTEL_INVENTORY", icon: Home, path: "/admin/hostels" },
    { id: "verification", label: "VERIFICATION_QUEUE", icon: ShieldCheck, path: "/admin/verification" },
    { id: "bookings", label: "BOOKING_LOGS", icon: Calendar, path: "/admin/bookings" },
    { id: "payments", label: "FINANCIAL_RECORDS", icon: CreditCard, path: "/admin/payments" },
    { id: "reviews", label: "USER_FEEDBACK", icon: Star, path: "/admin/reviews" },
    { id: "reports", label: "SYSTEM_REPORTS", icon: ShieldAlert, path: "/admin/reports" },
  ];

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to log out");
    }
  };

  return (
    <div className="flex flex-col h-full w-64 shrink-0 bg-[#0B1120] border-r border-slate-800 overflow-y-auto">
      <div className="px-6 py-8 mb-4 flex flex-col gap-4 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm text-white leading-tight tracking-widest uppercase">KAJU_HOUSING_ADMIN</span>
            <span className="text-[10px] text-slate-500 font-mono tracking-tighter">v2.4.0_STABLE</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-mono text-emerald-500/80 uppercase tracking-widest">System_Online</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Core_Modules</span>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isPathActive(item.path);
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded text-[11px] font-mono transition-all duration-150 group border border-transparent",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.05)]" 
                  : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 hover:border-slate-700/50"
              )}
            >
              <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400")} />
              <span className="tracking-wider">{item.label}</span>
              {isActive && <div className="ml-auto h-1 w-1 rounded-full bg-indigo-400 shadow-[0_0_5px_rgba(99,102,241,0.5)]" />}
            </Link>
          );
        })}
      </nav>
      
      <div className="px-3 py-6 mt-auto border-t border-slate-800/50 space-y-1">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Maintenance</span>
        </div>
        <Link
          to="/admin/settings"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded text-[11px] font-mono transition-all duration-150 group border border-transparent",
            isPathActive("/admin/settings")
              ? "bg-slate-800 text-white border-slate-700" 
              : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 hover:border-slate-700/50"
          )}
        >
          <Settings className="h-4 w-4 text-slate-600 group-hover:text-slate-400" />
          <span className="tracking-wider">SYSTEM_CONFIG</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded text-[11px] font-mono text-rose-500/70 hover:bg-rose-500/5 hover:text-rose-400 hover:border-rose-500/20 border border-transparent transition-all duration-150 group"
        >
          <LogOut className="h-4 w-4" />
          <span className="tracking-wider">TERMINATE_SESSION</span>
        </button>
      </div>
    </div>
  );
}
