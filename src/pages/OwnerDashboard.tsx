import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import { Plus, Home, Users, Settings, Loader2, Building } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Hostel } from "@/types";
import { toast } from "sonner";

export default function OwnerDashboard() {
  const { user } = useAuth();
  
  const [properties, setProperties] = useState<Hostel[]>([]);
  const [bookings, setBookings] = useState<any[]>([]); // Using any[] temporarily, or define a Booking struct
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Create Form State
  const [newHostel, setNewHostel] = useState({
    name: "",
    university: "",
    address: "",
    description: "",
    price_range: ""
  });



  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch user's properties
      const { data: hostelsData, error: hostelsError } = await supabase
        .from("hostels")
        .select("*")
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false });

      if (hostelsError) throw hostelsError;
      setProperties(hostelsData || []);

      // Fetch bookings for these properties
      if (hostelsData && hostelsData.length > 0) {
        const hostelIds = hostelsData.map((h: any) => h.id);
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            *,
            hostels ( name ),
            users!bookings_student_id_fkey ( first_name, last_name )
          `)
          .in("hostel_id", hostelIds)
          .order("created_at", { ascending: false });

        if (bookingsError) throw bookingsError;
        setBookings(bookingsData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const { error } = await supabase
        .from("hostels")
        .insert({
          ...newHostel,
          owner_id: user?.id,
          status: "pending" // Let super admin approve
        });

      if (error) throw error;
      
      toast.success("Property submitted for review");
      
      // Reset form
      setNewHostel({ name: "", university: "", address: "", description: "", price_range: "" });
      
      // Refresh data
      fetchData();
      
      // Close dialog hack - click outside or rely on user to close
      document.dispatchEvent(new MouseEvent('mousedown')); 
      
    } catch (error: any) {
      console.error("Error creating property:", error);
      toast.error(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;
      
      toast.success(`Booking ${status}`);
      fetchData();
      
    } catch {
      toast.error("Failed to update booking stauts");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 pb-12">
      {/* Distinct Owner Header Area */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 dark:from-emerald-950/20 dark:border-emerald-900/50 pt-10 pb-12 mb-8">
        <div className="container mx-auto px-4 max-w-7xl animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg dark:bg-emerald-900/50 dark:text-emerald-400">
                  <Building className="h-7 w-7" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Property Dashboard</h1>
              </div>
              <p className="text-emerald-800/80 dark:text-emerald-300/80 max-w-2xl text-lg">Manage your listings, review student applications, and track your revenue.</p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all sm:text-lg sm:px-6">
                  <Plus className="h-5 w-5" /> Add New Property
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>List New Property</DialogTitle>
              <DialogDescription>
                Add a new hostel to the platform. It will be reviewed by an admin before going live.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProperty} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Hostel Name</Label>
                <Input id="name" required value={newHostel.name} onChange={(e) => setNewHostel({...newHostel, name: e.target.value})} placeholder="e.g. City Gateway Hostel" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">Nearest University</Label>
                  <Input id="university" required value={newHostel.university} onChange={(e) => setNewHostel({...newHostel, university: e.target.value})} placeholder="e.g. Makerere" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_range">Avg. Price per Semester</Label>
                  <Input id="price_range" required value={newHostel.price_range} onChange={(e) => setNewHostel({...newHostel, price_range: e.target.value})} placeholder="e.g. 1M - 1.5M UGX" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Physical Address</Label>
                <Input id="address" required value={newHostel.address} onChange={(e) => setNewHostel({...newHostel, address: e.target.value})} placeholder="e.g. Kikoni, Makerere" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Brief Description</Label>
                <Textarea id="description" value={newHostel.description} onChange={(e) => setNewHostel({...newHostel, description: e.target.value})} placeholder="Describe the amenities, culture, safety..." />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating} className="w-full">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit for Review
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1.5 shadow-sm rounded-xl h-auto flex flex-wrap max-w-fit">
            <TabsTrigger value="properties" className="gap-2 px-6 py-2.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 rounded-lg transition-all"><Home className="h-4 w-4" /> Properties</TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2 px-6 py-2.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 rounded-lg transition-all"><Users className="h-4 w-4" /> Bookings</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 px-6 py-2.5 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 rounded-lg transition-all"><Settings className="h-4 w-4" /> Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            <Card className="border-emerald-100/50 shadow-md bg-white">
             {isLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
             ) : (
             <>
                <CardHeader>
                  <CardTitle>My Properties</CardTitle>
                  <CardDescription>View and manage all your hostel listings.</CardDescription>
                </CardHeader>
                <CardContent>
                  {properties.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                        You have not listed any properties yet.
                      </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Property Name</TableHead>
                          <TableHead>University Info</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {properties.map((property) => (
                          <TableRow key={property.id}>
                            <TableCell className="font-medium">{property.name}</TableCell>
                            <TableCell>{property.university}</TableCell>
                            <TableCell>
                              <Badge variant={property.status === "approved" ? "default" : property.status === "pending" ? "secondary" : "destructive"}>
                                {property.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">Manage Rooms</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
             </>
             )}
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card className="border-emerald-100/50 shadow-md bg-white">
            {isLoading ? (
               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
             ) : (
              <>
                <CardHeader>
                  <CardTitle>Booking Requests</CardTitle>
                  <CardDescription>Approve or reject student booking applications.</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
                        No bookings found for your properties.
                      </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                                {booking.users ? `${booking.users.first_name} ${booking.users.last_name}` : "Unknown Student"}
                            </TableCell>
                            <TableCell>{booking.hostels?.name}</TableCell>
                            <TableCell>
                              <Badge variant={booking.status === "approved" ? "default" : booking.status === "pending" ? "outline" : "destructive"}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {booking.status === "pending" && (
                                <div className="flex justify-end gap-2">
                                  <Button onClick={() => handleUpdateBookingStatus(booking.id, "approved")} variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">Approve</Button>
                                  <Button onClick={() => handleUpdateBookingStatus(booking.id, "rejected")} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">Reject</Button>
                                </div>
                              )}
                              {booking.status !== "pending" && (
                                <Button variant="ghost" size="sm">View Details</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card className="border-emerald-100/50 shadow-md bg-white">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your owner profile and payout settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Settings configuration goes here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
