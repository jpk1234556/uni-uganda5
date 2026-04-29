import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Search, User, ChevronDown, Menu, X } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import { appRoutes } from "../../lib/routes";

export default function Navbar({ appType }: { appType?: "student" | "owner" | "admin" }) {
  const { user, dbUser, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isOwnerApp = appType === "owner" || dbUser?.role === "hostel_owner";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        <BrandMark className="mr-8" />

        <div className="hidden items-center space-x-8 text-sm font-semibold text-slate-600 lg:flex">
          {!isOwnerApp && (
            <>
              <button className="flex items-center gap-1 transition-colors hover:text-primary focus:outline-none">
                Universities <ChevronDown className="h-4 w-4 opacity-50" />
              </button>
              <Link to={appRoutes.search} className="transition-colors hover:text-primary focus:outline-none">
                Browse Hostels
              </Link>
            </>
          )}
          {isOwnerApp && (
            <Link to={appRoutes.ownerDashboard} className="flex items-center gap-2 text-primary transition-colors hover:text-primary/80 focus:outline-none">
              Management Portal
            </Link>
          )}
        </div>

        <div className="ml-auto hidden items-center space-x-4 lg:flex">
          {!isOwnerApp && appType !== "admin" && (
            <div className="group relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search hostels..."
                className="h-10 rounded-full border-slate-200 bg-slate-50 pl-9 font-medium text-slate-900 shadow-none transition-all focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">
                {dbUser ? `Hi, ${dbUser.first_name}` : ""}
              </span>
              {dbUser?.role === "super_admin" && (
                <Link to={appRoutes.adminDashboard}>
                  <Button variant="default" className="rounded-full border-0 bg-slate-900 text-white shadow-sm transition-transform hover:scale-105 hover:bg-slate-800">
                    Admin Panel
                  </Button>
                </Link>
              )}
              {dbUser?.role === "student" && (
                <Link to={appRoutes.studentDashboard}>
                  <Button variant="default" className="rounded-full border-0 bg-blue-600 text-white shadow-sm transition-transform hover:scale-105 hover:bg-blue-700">
                    My Bookings
                  </Button>
                </Link>
              )}
              <Button onClick={signOut} variant="outline" className="rounded-full border-slate-200 text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-rose-600">
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to={appRoutes.auth}>
              <Button variant="outline" className="rounded-full gap-2 border-slate-200 bg-white text-slate-700 shadow-sm transition-all hover:border-primary/20 hover:bg-slate-50 hover:text-primary">
                <User className="h-4 w-4" /> Sign In
              </Button>
            </Link>
          )}
        </div>

        <div className="z-50 flex items-center lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-700 hover:bg-slate-100"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-20 z-40 flex flex-col border-t border-slate-100 bg-white p-4 duration-200 animate-in slide-in-from-top-4 lg:hidden">
          {!isOwnerApp && (
            <div className="relative mb-6 w-full">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search hostels or universities..."
                className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 pl-11 font-medium text-base text-slate-900 shadow-none transition-all focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          )}

          <div className="mb-8 flex flex-col space-y-4">
            {!isOwnerApp && (
              <>
                <Link to={appRoutes.search} onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg p-2 text-lg font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary">
                  Browse Hostels
                </Link>
                <button className="rounded-lg p-2 text-left text-lg font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-primary">
                  Universities
                </button>
              </>
            )}
            {isOwnerApp && (
              <Link to={appRoutes.ownerDashboard} onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg bg-primary/5 p-2 text-lg font-bold text-primary transition-colors">
                Management Portal
              </Link>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-6">
            {user ? (
              <>
                <div className="mb-2 text-center font-medium text-slate-500">
                  Logged in as <span className="font-bold text-slate-900">{dbUser?.first_name || user.email}</span>
                </div>
                {dbUser?.role === "super_admin" && (
                  <Link to={appRoutes.adminDashboard} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="h-12 w-full rounded-xl bg-slate-900 text-lg hover:bg-slate-800">Admin Panel</Button>
                  </Link>
                )}
                {dbUser?.role === "student" && (
                  <Link to={appRoutes.studentDashboard} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="h-12 w-full rounded-xl bg-blue-600 text-lg hover:bg-blue-700">My Bookings</Button>
                  </Link>
                )}
                <Button onClick={() => { signOut(); setIsMobileMenuOpen(false); }} variant="outline" className="h-12 w-full rounded-xl border-rose-200 text-lg text-rose-600 hover:bg-rose-50">
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to={appRoutes.auth} onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="h-12 w-full rounded-xl bg-gradient-primary text-lg transition-opacity hover:opacity-90">
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
