import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import BrandMark from "@/components/layout/BrandMark";
import { appRoutes } from "@/lib/routes";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(appRoutes.home, { replace: true });
    }
  }, [navigate, user]);

  if (user) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged in successfully!");
      navigate(appRoutes.home);
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const role = formData.get("role") as string;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
        },
      },
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      toast.success(
        "Registration successful! Please check your email for verification.",
      );
    }
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="mx-auto grid min-h-[calc(100vh-16rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.75fr]">
        <Card className="overflow-hidden border-border/60 shadow-xl shadow-slate-950/5">
          <div className="border-b bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-5 text-white">
            <BrandMark compact />
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
              Log in or sign up to continue your search, manage bookings, and
              keep your shortlist in one place.
            </p>
          </div>
          <Tabs defaultValue={mode} className="p-6">
            <TabsList className="grid w-full grid-cols-2 bg-muted/70 p-1">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader className="px-0 pt-6">
                  <CardTitle className="text-2xl">Welcome back</CardTitle>
                  <CardDescription className="text-sm leading-6">
                    Log in to continue to your Uni-Nest account.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-0">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="m@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Link
                        to={appRoutes.forgotPassword}
                        className="text-xs font-medium text-primary transition hover:text-primary/80"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </CardContent>
                <CardFooter className="px-0 pb-0 pt-2">
                  <Button className="h-11 w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardHeader className="px-0 pt-6">
                  <CardTitle className="text-2xl">Create account</CardTitle>
                  <CardDescription className="text-sm leading-6">
                    Join the Uni-Nest community and start with a profile that feels complete from day one.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 px-0">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" required autoComplete="given-name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" required autoComplete="family-name" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="m@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      autoComplete="new-password"
                    />
                    <p className="text-xs leading-5 text-muted-foreground">
                      Use a password you can keep private. We’ll only use it to secure your account.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">I am a...</Label>
                    <select
                      id="role"
                      name="role"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="student">Student</option>
                      <option value="hostel_owner">Hostel Owner</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter className="px-0 pb-0 pt-2">
                  <Button className="h-11 w-full" type="submit" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Sign Up"}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Why sign in
                  </div>
                  <div className="mt-1 text-lg font-semibold text-foreground">
                    A safer path to booking
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  "Save hostels and compare them later.",
                  "Track booking requests in one place.",
                  "Keep your student profile ready for quick replies.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-slate-950 text-slate-100 shadow-sm">
            <CardContent className="space-y-3 p-5 md:p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Sparkles className="h-3.5 w-3.5" />
                Quick tip
              </span>
              <p className="text-sm leading-6 text-slate-300">
                Students get better results when their profile is complete. Owners get faster responses when their listings are clear.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
