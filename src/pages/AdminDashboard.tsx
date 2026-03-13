import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Ban, UserCheck, Trash2, Home, Users, BarChart3, CreditCard } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Hostel, DBUser } from "@/types";

export default function AdminDashboard() {
  const [pendingHostels, setPendingHostels] = useState<Hostel[]>([]);
  const [allHostels, setAllHostels] = useState<Hostel[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalOwners: 0,
    activeHostels: 0,
    pendingVerifications: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch pending hostels
      const { data: pendingData, error: pendingError } = await supabase
        .from("hostels")
        .select(`*, users!hostels_owner_id_fkey(first_name, last_name, email)`)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
        
      if (pendingError) throw pendingError;
      setPendingHostels(pendingData || []);

      // 2. Fetch all hostels
      const { data: allHostelsData, error: allHostelsError } = await supabase
        .from("hostels")
        .select(`*, users!hostels_owner_id_fkey(first_name, last_name, email)`)
        .order("created_at", { ascending: false });
        
      if (allHostelsError) throw allHostelsError;
      setAllHostels(allHostelsData || []);

      // 3. Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // 4. Aggregate Metrics
      const studentCount = usersData?.filter((u: DBUser) => u.role === 'student').length || 0;
      const ownerCount = usersData?.filter((u: DBUser) => u.role === 'hostel_owner').length || 0;
      const activeHostelCount = allHostelsData?.filter((h: Hostel) => h.status === 'approved').length || 0;

      setMetrics({
        totalStudents: studentCount,
        totalOwners: ownerCount,
        activeHostels: activeHostelCount,
        pendingVerifications: pendingData?.length || 0
      });

    } catch (error: any) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateHostelStatus = async (hostelId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("hostels")
        .update({ status })
        .eq("id", hostelId);

      if (error) throw error;
      
      toast.success(`Hostel ${status} successfully`);
      fetchAdminData(); 
      
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteHostel = async (hostelId: string) => {
    if(!confirm("Are you sure you want to permanently delete this hostel?")) return;
    try {
      const { error } = await supabase
        .from("hostels")
        .delete()
        .eq("id", hostelId);

      if (error) throw error;
      toast.success("Hostel deleted successfully");
      fetchAdminData();
    } catch (error: any) {
      toast.error("Failed to delete hostel");
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean | undefined) => {
    try {
      // If undefined, assume true conceptually
      const newStatus = currentStatus === false ? true : false; 
      const { error } = await supabase
        .from("users")
        .update({ is_active: newStatus })
        .eq("id", userId);

      if (error) throw error;
      toast.success(`User account ${newStatus ? 'activated' : 'suspended'}`);
      fetchAdminData();
    } catch (error: any) {
      toast.error("Failed to update user status");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage platform users, hostels, and revenue.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Users</TabsTrigger>
          <TabsTrigger value="hostels" className="gap-2"><Home className="h-4 w-4" /> All Hostels</TabsTrigger>
          <TabsTrigger value="payments" className="gap-2"><CreditCard className="h-4 w-4" /> Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-primary/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="text-2xl font-bold">{metrics.totalStudents}</div>}
              </CardContent>
            </Card>
            <Card className="border-primary/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Owners</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="text-2xl font-bold">{metrics.totalOwners}</div>}
              </CardContent>
            </Card>
            <Card className="border-primary/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Hostels</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="text-2xl font-bold">{metrics.activeHostels}</div>}
              </CardContent>
            </Card>
            <Card className="border-primary/10 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> : <div className="text-2xl font-bold text-amber-500">{metrics.pendingVerifications}</div>}
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/10 shadow-md">
            <CardHeader>
              <CardTitle>Pending Hostel Verifications</CardTitle>
              <CardDescription>Approve or reject new property listings to ensure platform trust and quality.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : pendingHostels.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                  No pending hostels to review.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hostel Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingHostels.map((hostel: any) => (
                      <TableRow key={hostel.id}>
                        <TableCell className="font-medium">{hostel.name}</TableCell>
                        <TableCell>
                          {hostel.users ? <span>{hostel.users.first_name} {hostel.users.last_name}</span> : "Unknown"}
                        </TableCell>
                        <TableCell>{hostel.university}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button onClick={() => handleUpdateHostelStatus(hostel.id, "approved")} variant="outline" size="sm" className="hidden lg:flex gap-1 text-green-600 hover:bg-green-50">
                              <CheckCircle className="h-4 w-4" /> Approve
                            </Button>
                            <Button onClick={() => handleUpdateHostelStatus(hostel.id, "rejected")} variant="outline" size="sm" className="hidden lg:flex gap-1 text-red-600 hover:bg-red-50">
                              <XCircle className="h-4 w-4" /> Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="border-primary/10 shadow-md">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Suspend or manage user accounts across the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u: DBUser) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.first_name} {u.last_name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell className="capitalize">{u.role.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge variant={u.is_active === false ? "destructive" : "default"}>
                            {u.is_active === false ? "Suspended" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)} 
                            variant={u.is_active === false ? "outline" : "destructive"} 
                            size="sm" 
                            className="gap-1"
                            disabled={u.role === 'super_admin'}
                          >
                            {u.is_active === false ? <><UserCheck className="h-4 w-4" /> Unsuspend</> : <><Ban className="h-4 w-4" /> Suspend</>}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hostels" className="space-y-6">
          <Card className="border-primary/10 shadow-md">
            <CardHeader>
              <CardTitle>All Platform Hostels</CardTitle>
              <CardDescription>View and manage every property listed on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hostel</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allHostels.map((hostel: any) => (
                      <TableRow key={hostel.id}>
                        <TableCell className="font-medium">{hostel.name}</TableCell>
                        <TableCell>
                          {hostel.users ? `${hostel.users.first_name} ${hostel.users.last_name}` : "Unknown"}
                        </TableCell>
                        <TableCell>
                           <Badge variant={hostel.status === "approved" ? "default" : hostel.status === "pending" ? "secondary" : "destructive"}>
                              {hostel.status}
                           </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button onClick={() => handleDeleteHostel(hostel.id)} variant="destructive" size="sm" className="gap-1">
                             <Trash2 className="h-4 w-4" /> Delete
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card className="border-primary/10 shadow-md">
            <CardHeader>
              <CardTitle>Platform Revenue</CardTitle>
              <CardDescription>Track booking deposits and platform fees.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg bg-muted/20">
                  <CreditCard className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium text-foreground mb-1">Awaiting Payment Gateway Integration</h3>
                  <p className="max-w-sm mx-auto">Once Stripe is integrated, all transaction histories and platform cuts will appear here.</p>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
