import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, dbUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const dashboardPath =
    dbUser?.role === "student"
      ? "/student/dashboard"
      : dbUser?.role === "hostel_owner"
        ? "/owner/dashboard"
        : "/admin/dashboard";

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary italic">
              Uni-Nest
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/search"
              className="text-sm font-medium hover:text-primary"
            >
              Search
            </Link>
            <Link
              to="/roommates"
              className="text-sm font-medium hover:text-primary"
            >
              Roommates
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user.user_metadata?.avatar_url}
                    alt={dbUser?.first_name}
                  />
                  <AvatarFallback>
                    {dbUser?.first_name?.[0] || user.email?.[0]}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => navigate(dashboardPath)}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/auth">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button>Sign up</Button>
              </Link>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur px-4 py-4">
          <div className="flex flex-col gap-2">
            <Link
              to="/search"
              className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Search
            </Link>
            <Link
              to="/roommates"
              className="text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Roommates
            </Link>
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link
                  to="/auth"
                  className="flex-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="flex-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
