import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function Auth({
  appType = "student",
}: {
  appType?: "student" | "owner" | "admin" | string;
}) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // For registration specifically
    const role = appType === "owner" ? "hostel_owner" : "student";
    const firstName = formData.get("first_name") as string;
    const lastName = formData.get("last_name") as string;

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Logged in successfully!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              role: role || "student", // Default to student
            },
          },
        });

        if (error) throw error;
        toast.success(
          "Registration successful! Check your email to verify your account.",
        );
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  const isOwner = appType === "owner";

  return (
    <div
      className={cn(
        "container relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0",
        isOwner && "bg-slate-950 text-white",
      )}
    >
      <div
        className={cn(
          "relative hidden h-full flex-col p-10 text-white lg:flex",
          isOwner
            ? "bg-slate-900 border-r border-white/5"
            : "bg-muted dark:border-r",
        )}
      >
        <div
          className={cn(
            "absolute inset-0",
            isOwner ? "bg-pattern-dark opacity-50" : "bg-primary/90",
          )}
        />
        {isOwner && (
          <div className="absolute inset-0 bg-gradient-to-b from-orange-600/20 to-transparent opacity-50" />
        )}
        <div className="relative z-20 flex items-center text-lg font-medium">
          <div
            className={cn(
              "p-1.5 rounded-lg flex items-center justify-center mr-3 shadow-lg",
              isOwner ? "bg-orange-600" : "bg-white/20",
            )}
          >
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="text-3xl font-black tracking-tighter uppercase">
            {appType === "owner"
              ? "UniNest_Partners"
              : appType === "admin"
                ? "UniNest_Admin"
                : "UniNest"}
          </span>
        </div>
        <div className="relative z-20 mt-auto">
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <p
              className={cn(
                "text-xl font-medium leading-relaxed",
                isOwner ? "text-slate-300 italic font-serif" : "text-lg",
              )}
            >
              {appType === "owner"
                ? "Join the network of elite property owners providing premium student accommodation across Uganda. Scale your operations with our mission-critical management suite."
                : appType === "admin"
                  ? "Secure portal for platform administration and system oversight."
                  : '"HostelUganda completely changed how I found my accommodation for the semester. No more getting scammed or walking around under the sun for hours looking for hostels."'}
            </p>
            {appType === "student" && (
              <footer className="text-sm opacity-70">
                Sofia Davis, Makerere University
              </footer>
            )}
            {isOwner && (
              <footer className="text-xs font-mono uppercase tracking-[0.3em] text-orange-500 mt-4">
                Verified_Partner_Program
              </footer>
            )}
          </motion.blockquote>
        </div>
      </div>
      <div className="lg:p-8 w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Tabs
            defaultValue="login"
            className="w-full"
            onValueChange={(v: string) => setIsLogin(v === "login")}
          >
            <TabsList
              className={cn(
                "grid w-full mb-8",
                appType === "admin" ? "grid-cols-1" : "grid-cols-2",
                isOwner
                  ? "bg-slate-900 p-1 rounded-none border border-white/10"
                  : "bg-slate-100",
              )}
            >
              <TabsTrigger
                value="login"
                className={cn(
                  isOwner &&
                    "rounded-none data-[state=active]:bg-orange-600 data-[state=active]:text-white uppercase text-[10px] font-bold tracking-widest",
                )}
              >
                Login
              </TabsTrigger>
              {appType !== "admin" && (
                <TabsTrigger
                  value="register"
                  className={cn(
                    isOwner &&
                      "rounded-none data-[state=active]:bg-orange-600 data-[state=active]:text-white uppercase text-[10px] font-bold tracking-widest",
                  )}
                >
                  Register
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="login">
              <Card
                className={cn(
                  "border-0 shadow-none bg-transparent",
                  isOwner && "text-white",
                )}
              >
                <CardHeader className="px-0">
                  <CardTitle
                    className={cn(
                      "text-2xl font-black tracking-tighter uppercase",
                      isOwner ? "text-white" : "text-slate-900",
                    )}
                  >
                    {isOwner ? "Access_Portal" : "Welcome back"}
                  </CardTitle>
                  <CardDescription
                    className={
                      isOwner
                        ? "text-slate-500 uppercase text-[10px] tracking-widest font-mono"
                        : ""
                    }
                  >
                    {isOwner
                      ? "Secure authentication required for console access."
                      : "Enter your email and password to log in to your account."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className={
                          isOwner
                            ? "uppercase text-[10px] font-bold tracking-widest text-slate-400"
                            : ""
                        }
                      >
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        className={cn(
                          isOwner &&
                            "bg-slate-900 border-white/10 rounded-none focus:ring-orange-500 text-white",
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label
                          htmlFor="password"
                          className={
                            isOwner
                              ? "uppercase text-[10px] font-bold tracking-widest text-slate-400"
                              : ""
                          }
                        >
                          Password
                        </Label>
                        <Link
                          to="/forgot-password"
                          className={cn(
                            "text-sm font-medium hover:underline",
                            isOwner ? "text-orange-500" : "text-primary",
                          )}
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className={cn(
                          isOwner &&
                            "bg-slate-900 border-white/10 rounded-none focus:ring-orange-500 text-white",
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      className={cn(
                        "w-full h-12",
                        isOwner
                          ? "bg-orange-600 hover:bg-orange-700 rounded-none uppercase font-bold tracking-widest text-xs"
                          : "",
                      )}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? isOwner
                          ? "AUTHENTICATING..."
                          : "Logging in..."
                        : isOwner
                          ? "INITIALIZE_SESSION"
                          : "Login"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card
                className={cn(
                  "border-0 shadow-none bg-transparent",
                  isOwner && "text-white",
                )}
              >
                <CardHeader className="px-0">
                  <CardTitle
                    className={cn(
                      "text-2xl font-black tracking-tighter uppercase",
                      isOwner ? "text-white" : "text-slate-900",
                    )}
                  >
                    {isOwner ? "Partner_Onboarding" : "Create an account"}
                  </CardTitle>
                  <CardDescription
                    className={
                      isOwner
                        ? "text-slate-500 uppercase text-[10px] tracking-widest font-mono"
                        : ""
                    }
                  >
                    {isOwner
                      ? "Join the UniNest partner network."
                      : "Enter your details below to create your account."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="first_name"
                          className={
                            isOwner
                              ? "uppercase text-[10px] font-bold tracking-widest text-slate-400"
                              : ""
                          }
                        >
                          First name
                        </Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          required
                          className={cn(
                            isOwner &&
                              "bg-slate-900 border-white/10 rounded-none focus:ring-orange-500 text-white",
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="last_name"
                          className={
                            isOwner
                              ? "uppercase text-[10px] font-bold tracking-widest text-slate-400"
                              : ""
                          }
                        >
                          Last name
                        </Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          required
                          className={cn(
                            isOwner &&
                              "bg-slate-900 border-white/10 rounded-none focus:ring-orange-500 text-white",
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="register_email"
                        className={
                          isOwner
                            ? "uppercase text-[10px] font-bold tracking-widest text-slate-400"
                            : ""
                        }
                      >
                        Email
                      </Label>
                      <Input
                        id="register_email"
                        name="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        className={cn(
                          isOwner &&
                            "bg-slate-900 border-white/10 rounded-none focus:ring-orange-500 text-white",
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="register_password"
                        className={
                          isOwner
                            ? "uppercase text-[10px] font-bold tracking-widest text-slate-400"
                            : ""
                        }
                      >
                        Password
                      </Label>
                      <Input
                        id="register_password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className={cn(
                          isOwner &&
                            "bg-slate-900 border-white/10 rounded-none focus:ring-orange-500 text-white",
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      className={cn(
                        "w-full h-12",
                        isOwner
                          ? "bg-orange-600 hover:bg-orange-700 rounded-none uppercase font-bold tracking-widest text-xs"
                          : "",
                      )}
                      disabled={isLoading}
                    >
                      {isLoading
                        ? isOwner
                          ? "REGISTERING..."
                          : "Creating account..."
                        : isOwner
                          ? "CREATE_PARTNER_ACCOUNT"
                          : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
