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
import { Menu, LogOut, LayoutDashboard, Search, Sparkles, Users } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import { appRoutes } from "@/lib/routes";

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
    <nav className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-18 items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <BrandMark />
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link
              to="/search"
              className="transition-colors hover:text-foreground"
            >
              Search
            </Link>
            <Link
              to="/roommates"
              className="transition-colors hover:text-foreground"
            >
              Roommates
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="hidden lg:flex items-center gap-2">
            <Link to={appRoutes.search}>
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Search hostels
              </Button>
            </Link>
            <Link to={appRoutes.roommates}>
              <Button variant="ghost" className="gap-2">
                <Users className="h-4 w-4" />
                Roommates
              </Button>
            </Link>
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-10 w-10 rounded-full ring-2 ring-transparent transition hover:ring-primary/20">
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
            className="md:hidden shrink-0"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/70 bg-background/95 px-4 py-4 backdrop-blur">
          <div className="flex flex-col gap-3 text-sm font-medium text-foreground">
            <Link
              to="/search"
              className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Search className="h-4 w-4 text-muted-foreground" />
              Search
            </Link>
            <Link
              to="/roommates"
              className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              Roommates
            </Link>
            {user && (
              <Link
                to={dashboardPath}
                className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                Dashboard
              </Link>
            )}
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
            <div className="rounded-2xl border border-border/70 bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
              <Sparkles className="mb-2 h-4 w-4 text-primary" />
              Start with search, then save hostels and move into booking from your dashboard.
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
