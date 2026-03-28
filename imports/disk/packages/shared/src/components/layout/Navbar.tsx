import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Building2, Search, User, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, dbUser, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isOwnerApp = dbUser?.role === 'hostel_owner';
  
  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full transition-all duration-300 shadow-sm",
      isOwnerApp 
        ? "bg-slate-950/80 backdrop-blur-md border-b border-white/10 text-white" 
        : "bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 border-b border-slate-200"
    )}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg z-50">
          <div className={cn(
            "p-1.5 rounded-lg flex items-center justify-center shadow-sm",
            isOwnerApp ? "bg-orange-600" : "bg-gradient-primary"
          )}>
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className={cn(
            "text-xl font-extrabold tracking-tight",
            isOwnerApp ? "text-white" : "text-slate-900"
          )}>
            Hostel<span className={cn("font-normal", isOwnerApp ? "text-orange-500" : "text-slate-500")}>Uganda</span>
          </span>
        </Link>
        
        {/* Desktop Links */}
        <div className={cn(
          "hidden lg:flex items-center space-x-8 text-sm font-semibold",
          isOwnerApp ? "text-slate-400" : "text-slate-600"
        )}>
          {!isOwnerApp && (
            <>
              <button className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
                Universities <ChevronDown className="h-4 w-4 opacity-50" />
              </button>
              <Link to="/search" className="hover:text-primary transition-colors focus:outline-none">
                Browse Hostels
              </Link>
            </>
          )}
          {isOwnerApp && (
            <Link to="/owner/dashboard" className="text-orange-500 hover:text-orange-400 transition-colors focus:outline-none flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              Management_Console
            </Link>
          )}
        </div>

        {/* Right Side Search & Auth (Desktop) */}
        <div className="hidden lg:flex items-center space-x-4 ml-auto">
          {/* Search Input - Only for students */}
          {!isOwnerApp && (
            <div className="relative w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search hostels..." 
                className="pl-9 bg-slate-50 border-slate-200 text-slate-900 rounded-full h-10 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-none font-medium"
              />
            </div>
          )}

          {user ? (
             <div className="flex items-center gap-3">
              <span className={cn(
                "text-sm font-semibold",
                isOwnerApp ? "text-slate-300" : "text-slate-700"
              )}>
                {dbUser ? `Hi, ${dbUser.first_name}` : ""}
              </span>
              {dbUser?.role === 'super_admin' && (
                <Link to="/admin/dashboard">
                  <Button variant="default" className="rounded-full shadow-sm bg-slate-900 hover:bg-slate-800 text-white border-0 transition-transform hover:scale-105">Admin Panel</Button>
                </Link>
              )}
              {dbUser?.role === 'student' && (
                <Link to="/student/dashboard">
                  <Button variant="default" className="rounded-full shadow-sm bg-blue-600 hover:bg-blue-700 text-white border-0 transition-transform hover:scale-105">My Bookings</Button>
                </Link>
              )}
              {isOwnerApp && (
                <Button onClick={signOut} variant="ghost" className="rounded-none border-l border-white/10 text-slate-400 hover:text-orange-500 hover:bg-white/5 transition-colors font-mono text-[10px] uppercase tracking-widest px-6">
                  Terminate_Session
                </Button>
              )}
              {!isOwnerApp && (
                <Button onClick={signOut} variant="outline" className="rounded-full shadow-sm border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors">Sign Out</Button>
              )}
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="outline" className={cn(
                "rounded-full shadow-sm gap-2 transition-all",
                isOwnerApp 
                  ? "border-white/10 bg-white/5 hover:bg-white/10 text-white" 
                  : "border-slate-200 bg-white hover:bg-slate-50 hover:text-primary hover:border-primary/20 text-slate-700"
              )}>
                <User className="h-4 w-4" /> Sign In
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="lg:hidden flex items-center z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "rounded-full",
              isOwnerApp ? "text-white hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={cn(
          "lg:hidden fixed inset-0 top-20 z-40 border-t flex flex-col p-4 animate-in slide-in-from-top-4 duration-200",
          isOwnerApp ? "bg-slate-950 border-white/10" : "bg-white border-slate-100"
        )}>
          {!isOwnerApp && (
            <div className="relative w-full mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Search hostels or universities..." 
                className="w-full pl-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-12 focus-visible:ring-2 focus-visible:ring-primary transition-all shadow-none font-medium text-base"
              />
            </div>
          )}

          <div className="flex flex-col space-y-4 mb-8">
            {!isOwnerApp && (
              <>
                <Link to="/search" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-slate-700 hover:text-primary p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  Browse Hostels
                </Link>
                <button className="text-lg font-semibold text-slate-700 hover:text-primary p-2 rounded-lg hover:bg-slate-50 transition-colors text-left">
                  Universities
                </button>
              </>
            )}
            {isOwnerApp && (
              <Link to="/owner/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-orange-500 p-2 rounded-none border-l-2 border-orange-500 bg-orange-500/5 transition-colors">
                MANAGEMENT_CONSOLE
              </Link>
            )}
          </div>

          <div className={cn(
            "mt-auto border-t pt-6 flex flex-col gap-3",
            isOwnerApp ? "border-white/10" : "border-slate-100"
          )}>
             {user ? (
               <>
                 <div className={cn(
                   "text-center font-medium mb-2",
                   isOwnerApp ? "text-slate-500" : "text-slate-500"
                 )}>
                   Logged in as <span className={cn("font-bold", isOwnerApp ? "text-white" : "text-slate-900")}>{dbUser?.first_name || user.email}</span>
                 </div>
                 {dbUser?.role === 'super_admin' && (
                  <Link to="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full h-12 text-lg rounded-xl bg-slate-900 hover:bg-slate-800">Admin Panel</Button>
                  </Link>
                 )}
                 {dbUser?.role === 'student' && (
                  <Link to="/student/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full h-12 text-lg rounded-xl bg-blue-600 hover:bg-blue-700">My Bookings</Button>
                  </Link>
                 )}
                 {isOwnerApp && (
                   <Button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} variant="outline" className="w-full h-12 text-lg rounded-none border-white/10 text-orange-500 hover:bg-white/5">TERMINATE_SESSION</Button>
                 )}
                 {!isOwnerApp && (
                   <Button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} variant="outline" className="w-full h-12 text-lg rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50">Sign Out</Button>
                 )}
               </>
             ) : (
               <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                 <Button className={cn(
                   "w-full h-12 text-lg rounded-xl transition-opacity",
                   isOwnerApp ? "bg-orange-600 hover:bg-orange-700" : "bg-gradient-primary hover:opacity-90"
                 )}>
                   Sign In / Register
                 </Button>
               </Link>
             )}
          </div>
        </div>
      )}
    </nav>
  );
}
