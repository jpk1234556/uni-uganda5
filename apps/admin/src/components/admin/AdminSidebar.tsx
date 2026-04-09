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
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isPathActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      path: "/admin/dashboard",
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      path: "/admin/users",
    },
    {
      id: "universities",
      label: "University Registry",
      icon: ShieldCheck,
      path: "/admin/universities",
    },
    {
      id: "hostels",
      label: "Hostel Inventory",
      icon: Home,
      path: "/admin/hostels",
    },
    {
      id: "verification",
      label: "Verification Queue",
      icon: ShieldCheck,
      path: "/admin/verification",
    },
    {
      id: "bookings",
      label: "Booking Logs",
      icon: Calendar,
      path: "/admin/bookings",
    },
    {
      id: "payments",
      label: "Financial Records",
      icon: CreditCard,
      path: "/admin/payments",
    },
    {
      id: "reviews",
      label: "User Feedback",
      icon: Star,
      path: "/admin/reviews",
    },
    {
      id: "reports",
      label: "System Reports",
      icon: ShieldAlert,
      path: "/admin/reports",
    },
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
    <div className="flex flex-col h-full w-64 shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
      <div className="px-6 py-8 mb-4 flex flex-col gap-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Kaju Housing Logo"
            className="h-10 w-10 object-contain rounded-xl shadow-sm"
          />
          <div className="flex flex-col">
            <span className="font-bold text-base text-slate-900 leading-tight tracking-tight">
              Kaju Housing
            </span>
            <span className="text-xs text-slate-500 font-medium tracking-tight">
              System Admin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full w-fit">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold text-emerald-700 tracking-wide">
            System Online
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        <div className="px-3 mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Core Modules
          </span>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isPathActive(item.path);

          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group border border-transparent",
                isActive
                  ? "bg-primary text-white shadow-md relative overflow-hidden"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-primary",
                )}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-6 mt-auto border-t border-slate-100 space-y-1 bg-slate-50/50">
        <div className="px-3 mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Maintenance
          </span>
        </div>
        <Link
          to="/admin/settings"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group border",
            isPathActive("/admin/settings")
              ? "bg-primary text-white border-primary shadow-md"
              : "border-transparent text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-200 hover:shadow-sm",
          )}
        >
          <Settings
            className={cn(
              "h-5 w-5 transition-colors",
              isPathActive("/admin/settings")
                ? "text-white"
                : "text-slate-400 group-hover:text-slate-600",
            )}
          />
          <span>System Config</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-start gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-transparent hover:border-rose-100 transition-all duration-200 group"
        >
          <LogOut className="h-5 w-5 text-rose-500 group-hover:text-rose-600" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
