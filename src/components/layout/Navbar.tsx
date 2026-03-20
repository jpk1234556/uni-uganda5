import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Building2, Search, User, ChevronDown, Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, dbUser, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 border-b border-slate-200 transition-all duration-300 shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-8 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg z-50">
          <div className="bg-gradient-primary p-1.5 rounded-lg flex items-center justify-center shadow-sm">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">Hostel<span className="font-normal text-slate-500">Uganda</span></span>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex items-center space-x-8 text-sm font-semibold text-slate-600">
          <button className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
            Universities <ChevronDown className="h-4 w-4 opacity-50" />
          </button>
          <Link to="/search" className="hover:text-primary transition-colors focus:outline-none">
            Browse Hostels
          </Link>
        </div>

        {/* Right Side Search & Auth (Desktop) */}
        <div className="hidden lg:flex items-center space-x-4 ml-auto">
          {/* Search Input */}
          <div className="relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search hostels..." 
              className="pl-9 bg-slate-50 border-slate-200 text-slate-900 rounded-full h-10 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all shadow-none font-medium"
            />
          </div>

          {user ? (
             <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">
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
              <Button onClick={signOut} variant="outline" className="rounded-full shadow-sm border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition-colors">Sign Out</Button>
            </div>
          ) : (
            <Link to="/auth">
              <Button variant="outline" className="rounded-full shadow-sm border-slate-200 bg-white hover:bg-slate-50 hover:text-primary hover:border-primary/20 text-slate-700 gap-2 transition-all">
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
            className="text-slate-700 hover:bg-slate-100 rounded-full"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-20 bg-white z-40 border-t border-slate-100 flex flex-col p-4 animate-in slide-in-from-top-4 duration-200">
          <div className="relative w-full mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Search hostels or universities..." 
              className="w-full pl-11 bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-12 focus-visible:ring-2 focus-visible:ring-primary transition-all shadow-none font-medium text-base"
            />
          </div>

          <div className="flex flex-col space-y-4 mb-8">
            <Link to="/search" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-semibold text-slate-700 hover:text-primary p-2 rounded-lg hover:bg-slate-50 transition-colors">
              Browse Hostels
            </Link>
            <button className="text-lg font-semibold text-slate-700 hover:text-primary p-2 rounded-lg hover:bg-slate-50 transition-colors text-left">
              Universities
            </button>
          </div>

          <div className="mt-auto border-t border-slate-100 pt-6 flex flex-col gap-3">
             {user ? (
               <>
                 <div className="text-center font-medium text-slate-500 mb-2">
                   Logged in as <span className="font-bold text-slate-900">{dbUser?.first_name || user.email}</span>
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
                 <Button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} variant="outline" className="w-full h-12 text-lg rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50">Sign Out</Button>
               </>
             ) : (
               <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                 <Button className="w-full h-12 text-lg rounded-xl bg-gradient-primary hover:opacity-90 transition-opacity">
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
