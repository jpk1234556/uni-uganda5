import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

interface AdminLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ sidebar, children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden relative font-sans">
      {/* Mobile Sidebar Toggle Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 z-20 shadow-sm">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-50 hover:text-primary rounded-xl transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-7 w-7 object-contain rounded-md"
          />
          <span className="font-semibold text-sm text-slate-900 tracking-tight">
            Kaju Admin
          </span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 top-16 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Fixed on Desktop, Absolute on Mobile) */}
      <div
        className={`
        fixed md:static inset-y-0 left-0 z-40 transform 
        ${isSidebarOpen ? "translate-x-0 pt-0" : "-translate-x-full"}
        md:translate-x-0 transition-transform duration-300 ease-out shadow-2xl md:shadow-none
        w-64 flex-shrink-0 bg-white text-slate-600 border-r border-slate-200 flex flex-col h-full overflow-y-auto custom-scrollbar top-16 md:top-0
      `}
      >
        <div className="md:hidden flex justify-between items-center p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <span className="text-sm font-bold text-slate-900">
            Navigation Menu
          </span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-2 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          onClick={() => {
            if (window.innerWidth < 768) setIsSidebarOpen(false);
          }}
        >
          {sidebar}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-[#F8FAFC] flex flex-col relative w-full custom-scrollbar pt-16 md:pt-0">
        {/* Subtle Grid Pattern Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative z-10 flex-1">{children}</div>
      </main>
    </div>
  );
}
