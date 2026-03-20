import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";

interface AdminLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function AdminLayout({ sidebar, children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden relative">
      
      {/* Mobile Sidebar Toggle Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 shadow-sm flex items-center px-4 z-20">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Menu className="h-6 w-6" />
        </button>
        <span className="font-bold text-slate-900 ml-2 tracking-tight">Admin<span className="font-normal text-slate-500">Panel</span></span>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 top-16 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Fixed on Desktop, Absolute on Mobile) */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 transform 
        ${isSidebarOpen ? "translate-x-0 pt-0" : "-translate-x-full"}
        md:translate-x-0 transition-transform duration-300 ease-out shadow-xl md:shadow-none
        w-64 flex-shrink-0 bg-[#0B1120] text-slate-300 border-r border-slate-800 flex flex-col h-full overflow-y-auto custom-scrollbar top-16 md:top-0
      `}>
        <div className="md:hidden flex justify-between items-center p-4 border-b border-slate-800/50 bg-[#0B1120] sticky top-0 z-10">
           <span className="text-sm font-bold text-white uppercase tracking-wider">Menu</span>
           <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white bg-slate-800/50 p-1.5 rounded-md transition-colors">
             <X className="h-5 w-5" />
           </button>
        </div>
        <div onClick={() => { if(window.innerWidth < 768) setIsSidebarOpen(false); }}>
          {sidebar}
        </div>
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 flex flex-col relative w-full custom-scrollbar pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
