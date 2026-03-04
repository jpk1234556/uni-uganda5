import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Auth() {
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
    const role = formData.get("role") as string;
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
              role: role || 'student', // Default to student
            }
          }
        });

        if (error) throw error;
        toast.success("Registration successful! Check your email to verify your account.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during authentication.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container relative flex pt-20 flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary/90" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <span className="text-3xl font-extrabold tracking-tight">UniNest</span>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "UniNest completely changed how I found my accommodation for the semester. No more getting scammed or walking around under the sun for hours looking for hostels."
            </p>
            <footer className="text-sm">Sofia Davis, Makerere University</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8 w-full max-w-md mx-auto">
        <Tabs defaultValue="login" className="w-full" onValueChange={(v: string) => setIsLogin(v === 'login')}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl font-semibold tracking-tight">Welcome back</CardTitle>
                <CardDescription>Enter your email and password to log in to your account.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border-0 shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-2xl font-semibold tracking-tight">Create an account</CardTitle>
                <CardDescription>Enter your details below to create your account.</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First name</Label>
                      <Input id="first_name" name="first_name" required pattern="[A-Za-z-]+" title="First name must contain only letters" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last name</Label>
                      <Input id="last_name" name="last_name" required pattern="[A-Za-z-]+" title="Last name must contain only letters" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">I am a...</Label>
                    <select id="role" name="role" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                      <option value="student">Student looking for a hostel</option>
                      <option value="hostel_owner">Hostel Owner listing properties</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register_email">Email</Label>
                    <Input id="register_email" name="email" type="email" placeholder="m@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register_password">Password</Label>
                    <Input id="register_password" name="password" type="password" required minLength={6} title="Password must be at least 6 characters long." />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
