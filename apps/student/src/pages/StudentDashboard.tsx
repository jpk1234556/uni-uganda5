import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Home, ClipboardList, UserCircle, Loader2, GraduationCap, Smartphone, CheckCircle2, Heart, Trash2, MapPin, Save, User, BookOpen, Phone, HeartPulse, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function StudentDashboard() {
  const { user, dbUser } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [savedHostels, setSavedHostels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    phone_number: "",
    course: "",
    next_of_kin: "",
    medical_history: ""
  });

  useEffect(() => {
    if (dbUser) {
      setProfileForm({
        phone_number: dbUser.phone_number || "",
        course: dbUser.course || "",
        next_of_kin: dbUser.next_of_kin || "",
        medical_history: dbUser.medical_history || ""
      });
    }
  }, [dbUser]);

  // Payment UI State
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          created_at,
          room_types ( name, price ),
          hostels ( name, owner_id )
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

  const fetchSavedHostels = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingSaved(true);
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          hostels (
            id,
            name,
            address,
            university,
            images,
            price_range,
            rating
          )
        `)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedHostels(data || []);
    } catch (error) {
      console.error("Error fetching saved hostels:", error);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchSavedHostels();
    }
  }, [user, fetchApplications, fetchSavedHostels]);

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);
      
      if (error) throw error;
      setSavedHostels(prev => prev.filter(f => f.id !== favoriteId));
      toast.success("Removed from saved hostels");
    } catch (error) {
      toast.error("Failed to remove favorite");
    }
  };

  const handleOpenPayment = (app: any) => {
    setSelectedBooking(app);
    setIsPaymentOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedBooking || !user) return;
    try {
      setIsConfirming(true);
      
      // We insert a "pending" payment record. 
      // The admin will later verify the mobile money text and mark the payment and booking as "completed".
      const { error } = await supabase.from("payments").insert({
        booking_id: selectedBooking.id,
        student_id: user.id,
        hostel_owner_id: selectedBooking.hostels.owner_id,
        amount: selectedBooking.room_types.price,
        status: "pending",
        platform_fee: 0
      });

      if (error) throw error;

      toast.success("Payment details submitted! Admin will verify your transaction shortly.");
      setIsPaymentOpen(false);
      fetchApplications();
    } catch (error: any) {
      toast.error("Failed to submit payment confirmation: " + error.message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsUpdatingProfile(true);
      const { error } = await supabase
        .from("users")
        .update({
          phone_number: profileForm.phone_number,
          course: profileForm.course,
          next_of_kin: profileForm.next_of_kin,
          medical_history: profileForm.medical_history,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 pb-12">
      {/* Header Area */}
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
            <TabsTrigger value="applications" className="gap-2 px-6 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all"><ClipboardList className="h-4 w-4" /> Booking History</TabsTrigger>
            <TabsTrigger value="saved" className="gap-2 px-6 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all"><Heart className="h-4 w-4" /> Saved Hostels</TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 px-6 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all"><UserCircle className="h-4 w-4" /> Profile Details</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card className="border-blue-100/50 shadow-md bg-white">
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
              <CardDescription>Keep track of your hostel applications and stays.</CardDescription>
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
                    <div key={app.id} className="flex justify-between items-center p-5 border rounded-xl hover:shadow-md hover:border-blue-200 transition-all bg-white">
                      <div>
                        <h4 className="font-semibold text-lg text-slate-900">{app.hostels?.name}</h4>
                        <p className="text-sm text-slate-500 mb-1">
                          {app.room_types?.name} &bull; {new Date(app.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-medium text-slate-700">Price: {app.room_types?.price?.toLocaleString()} UGX</p>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <Badge variant={app.status === "approved" ? "default" : app.status === "pending" ? "outline" : app.status === "completed" ? "default" : "destructive"} 
                               className={
                                 app.status === "approved" ? "bg-amber-500 text-white" : 
                                 app.status === "completed" ? "bg-emerald-500 text-white" : ""
                               }>
                          {app.status === "approved" ? "Awaiting Payment" : app.status === "completed" ? "Paid & Confirmed" : app.status}
                        </Badge>
                        
                        {app.status === "approved" ? (
                          <Button onClick={() => handleOpenPayment(app)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 shadow-sm text-white gap-2">
                             <Smartphone className="h-4 w-4" /> Pay Now
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" className="text-blue-600">View</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved">
          <Card className="border-blue-100/50 shadow-md bg-white">
            <CardHeader>
              <CardTitle>Your Saved Hostels</CardTitle>
              <CardDescription>Hostels you've favorited for quick access.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSaved ? (
                <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : savedHostels.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                  <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <p className="text-muted-foreground font-medium mb-4">You haven't saved any hostels yet.</p>
                  <Link to="/search">
                    <Button variant="outline">Browse Hostels</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedHostels.map((item) => (
                    <div key={item.id} className="group relative flex flex-col sm:flex-row gap-4 p-4 border rounded-xl hover:shadow-md hover:border-blue-200 transition-all bg-white overflow-hidden">
                      <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <img 
                          src={item.hostels?.images?.[0] || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=200"} 
                          alt={item.hostels?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 truncate">{item.hostels?.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                          <MapPin className="h-3 w-3" /> {item.hostels?.university || item.hostels?.address}
                        </p>
                        <div className="flex items-center gap-3">
                          <Link to={`/hostel/${item.hostels?.id}`}>
                            <Button size="sm" variant="outline" className="h-8 text-xs">View Details</Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 gap-1"
                            onClick={() => removeFavorite(item.id)}
                          >
                            <Trash2 className="h-3 w-3" /> Remove
                          </Button>
                        </div>
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
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Student Profile
              </CardTitle>
              <CardDescription>Your personal and academic information required for hostel bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-700 font-medium">First Name</Label>
                    <Input id="firstName" value={dbUser?.first_name || ""} disabled className="bg-slate-50 border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-700 font-medium">Last Name</Label>
                    <Input id="lastName" value={dbUser?.last_name || ""} disabled className="bg-slate-50 border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
                    <Input id="email" value={dbUser?.email || ""} disabled className="bg-slate-50 border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-700 font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" /> Phone Number
                    </Label>
                    <Input 
                      id="phone" 
                      placeholder="+256 700 000 000" 
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="border-slate-200 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course" className="text-slate-700 font-medium flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-slate-400" /> Course of Study
                    </Label>
                    <Input 
                      id="course" 
                      placeholder="e.g. Bachelor of Computer Science" 
                      value={profileForm.course}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, course: e.target.value }))}
                      className="border-slate-200 focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nok" className="text-slate-700 font-medium flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-400" /> Next of Kin (Name & Contact)
                    </Label>
                    <Input 
                      id="nok" 
                      placeholder="e.g. John Smith (Father) - 0700..." 
                      value={profileForm.next_of_kin}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, next_of_kin: e.target.value }))}
                      className="border-slate-200 focus:border-blue-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medical" className="text-slate-700 font-medium flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-slate-400" /> Medical History / Allergies
                  </Label>
                  <Textarea 
                    id="medical" 
                    placeholder="Please list any medical conditions or allergies we should be aware of..." 
                    value={profileForm.medical_history}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, medical_history: e.target.value }))}
                    className="min-h-[100px] border-slate-200 focus:border-blue-400"
                  />
                  <p className="text-[10px] text-slate-400 italic">This information is kept confidential and shared only with hostel management upon booking.</p>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" disabled={isUpdatingProfile} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] gap-2 shadow-sm">
                    {isUpdatingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Manual Payment Verification Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
               <Smartphone className="h-5 w-5 text-emerald-500" /> Complete Payment
            </DialogTitle>
            <DialogDescription>
              Your booking for <strong className="text-slate-900">{selectedBooking?.room_types?.name}</strong> at {selectedBooking?.hostels?.name} was approved!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
             <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
                <p className="text-sm text-emerald-800 mb-1">Amount Due</p>
                <div className="text-3xl font-bold text-emerald-900">
                  {selectedBooking?.room_types?.price?.toLocaleString() || "0"} <span className="text-lg">UGX</span>
                </div>
             </div>

             <div className="space-y-4 text-sm text-slate-600">
               <p className="font-medium text-slate-900">How to pay via MTN Mobile Money / Airtel Money:</p>
               <ol className="list-decimal pl-5 space-y-2">
                 <li>Dial <strong>*165#</strong> (MTN) or <strong>*185#</strong> (Airtel)</li>
                 <li>Select <strong>Send Money</strong></li>
                 <li>Enter KAJU HOUSING Merchant Number: <strong className="text-slate-900 font-mono text-base">0700 123 456</strong></li>
                 <li>Enter the exact amount shown above.</li>
                 <li>Confirm with your PIN.</li>
               </ol>
             </div>

             <div className="bg-amber-50 p-3 rounded-md text-amber-800 text-xs flex items-start gap-2 border border-amber-200">
               <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
               <p>After sending the money, click the button below. Our admins will verify the transaction within 30 minutes and fully confirm your stay.</p>
             </div>
          </div>
          <DialogFooter>
            <Button onClick={handleConfirmPayment} disabled={isConfirming} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              {isConfirming ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              I Have Sent the Money
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
