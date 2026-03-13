import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, ClipboardList, UserCircle, Loader2, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<any[]>([]); // using any[] for now
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          created_at,
          room_types ( name ),
          hostels ( name )
        `)
        .eq("student_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 pb-12">
      {/* Distinct Student Header Area */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 dark:from-blue-950/20 dark:border-blue-900/50 pt-10 pb-12 mb-8">
        <div className="container mx-auto px-4 max-w-5xl animate-in fade-in duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-full dark:bg-blue-900/50 dark:text-blue-400">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">My Dashboard</h1>
          </div>
          <p className="text-blue-800/80 dark:text-blue-300/80 max-w-2xl text-lg">Manage your booking applications, track your stays, and set up your student profile.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl">
        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1.5 shadow-sm rounded-xl h-auto flex flex-wrap max-w-fit">
            <TabsTrigger value="applications" className="gap-2 px-6 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all"><ClipboardList className="h-4 w-4" /> My Applications</TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 px-6 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all"><UserCircle className="h-4 w-4" /> Profile Details</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card className="border-blue-100/50 shadow-md bg-white">
            <CardHeader>
              <CardTitle>Recent Booking Requests</CardTitle>
              <CardDescription>Keep track of your hostel applications.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : applications.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                  <Home className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium mb-4">You haven't applied to any hostels yet.</p>
                  <Link to="/search">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all">Find a Hostel</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/10 transition-colors">
                      <div>
                        <h4 className="font-semibold text-lg">{app.hostels?.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {app.room_types?.name} &bull; {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={app.status === "approved" ? "default" : app.status === "pending" ? "outline" : "destructive"}>
                          {app.status}
                        </Badge>
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card className="border-blue-100/50 shadow-md bg-white">
            <CardHeader>
              <CardTitle>Extended Profile</CardTitle>
              <CardDescription>Your tenant detail information required for bookings.</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-sm text-muted-foreground mb-4">To speed up your hostel applications, please complete your profile details (Next of Kin, Medical History, etc.)</p>
               <Button variant="outline">Edit Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
