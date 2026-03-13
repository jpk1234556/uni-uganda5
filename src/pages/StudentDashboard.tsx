import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, ClipboardList, UserCircle, Loader2 } from "lucide-react";
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
    <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">Manage your booking applications and profile.</p>
      </div>

      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="applications" className="gap-2"><ClipboardList className="h-4 w-4" /> My Applications</TabsTrigger>
          <TabsTrigger value="profile" className="gap-2"><UserCircle className="h-4 w-4" /> Profile Details</TabsTrigger>
        </TabsList>

        <TabsContent value="applications">
          <Card className="border-primary/10 shadow-md">
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
                    <Button>Find a Hostel</Button>
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
          <Card className="border-primary/10 shadow-md">
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
  );
}
