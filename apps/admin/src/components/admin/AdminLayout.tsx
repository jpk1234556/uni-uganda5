import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

interface AdminLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ sidebar, children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#F8FAFC] overflow-hidden relative font-sans">
      
      {/* Mobile Sidebar Toggle Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-[#0B1120] border-b border-slate-800 flex items-center px-4 z-20">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-slate-400 hover:bg-slate-800 rounded transition-colors">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-mono text-[11px] font-bold text-white ml-3 tracking-[0.2em] uppercase">KAJU_HOUSING_ADMIN</span>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 top-14 bg-black/40 backdrop-blur-[2px] z-30 md:hidden animate-in fade-in duration-200" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Fixed on Desktop, Absolute on Mobile) */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 transform 
        ${isSidebarOpen ? "translate-x-0 pt-0" : "-translate-x-full"}
        md:translate-x-0 transition-transform duration-300 ease-out shadow-2xl md:shadow-none
        w-64 flex-shrink-0 bg-[#0B1120] text-slate-300 border-r border-slate-800 flex flex-col h-full overflow-y-auto custom-scrollbar top-14 md:top-0
      `}>
        <div className="md:hidden flex justify-between items-center p-4 border-b border-slate-800/50 bg-[#0B1120] sticky top-0 z-10">
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Navigation_Menu</span>
           <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white bg-slate-800/50 p-1.5 rounded transition-colors">
             <X className="h-4 w-4" />
           </button>
        </div>
        <div onClick={() => { if(window.innerWidth < 768) setIsSidebarOpen(false); }}>
          {sidebar}
        </div>
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#F8FAFC] flex flex-col relative w-full custom-scrollbar pt-14 md:pt-0">
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
