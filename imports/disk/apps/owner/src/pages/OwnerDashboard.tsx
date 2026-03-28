import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Home,
  Users,
  Settings,
  Loader2,
  Building,
  Image as ImageIcon,
  Trash2,
  LayoutDashboard,
  Wallet,
  Clock,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Hostel, RoomType } from "@/types";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const chartData = [
  { name: "Jan", bookings: 4, revenue: 2400 },
  { name: "Feb", bookings: 7, revenue: 4200 },
  { name: "Mar", bookings: 12, revenue: 7800 },
  { name: "Apr", bookings: 9, revenue: 5400 },
  { name: "May", bookings: 15, revenue: 9000 },
  { name: "Jun", bookings: 22, revenue: 13200 },
];

interface BookingWithRelations {
  id: string;
  status: "pending" | "approved" | "rejected";
  hostels: { name: string } | null;
  users: { first_name: string; last_name: string } | null;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export default function OwnerDashboard() {
  const { user } = useAuth();

  const [properties, setProperties] = useState<Hostel[]>([]);
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Create Property State
  const [newHostel, setNewHostel] = useState({
    name: "",
    university: "",
    address: "",
    description: "",
    price_range: "",
    images: "", // comma separated URLs
  });

  // Manage Rooms State
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", price: "", capacity: "" });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: hostelsData, error: hostelsError } = await supabase
        .from("hostels")
        .select("*")
        .eq("owner_id", user?.id)
        .order("created_at", { ascending: false });

      if (hostelsError) throw hostelsError;
      setProperties(hostelsData || []);

      if (hostelsData && hostelsData.length > 0) {
        const hostelIds = hostelsData.map((h) => h.id);
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select(
            `
            *,
            hostels ( name ),
            users!bookings_student_id_fkey ( first_name, last_name )
          `,
          )
          .in("hostel_id", hostelIds)
          .order("created_at", { ascending: false });

        if (bookingsError) throw bookingsError;
        setBookings((bookingsData as BookingWithRelations[]) || []);
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

      // Subscribe to real-time changes
      const bookingsSub = supabase
        .channel("public:bookings")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bookings" },
          () => {
            fetchData();
          },
        )
        .subscribe();

      const hostelsSub = supabase
        .channel("public:hostels")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "hostels" },
          () => {
            fetchData();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(bookingsSub);
        supabase.removeChannel(hostelsSub);
      };
    }
  }, [user, fetchData]);

  // Handle Room Fetching when a hostel is selected
  useEffect(() => {
    if (selectedHostel && isRoomDialogOpen) {
      fetchRooms(selectedHostel.id);

      // Real-time updates for rooms
      const roomsSub = supabase
        .channel(`public:room_types:hostel_id=eq.${selectedHostel.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_types",
            filter: `hostel_id=eq.${selectedHostel.id}`,
          },
          () => {
            fetchRooms(selectedHostel.id);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(roomsSub);
      };
    }
  }, [selectedHostel, isRoomDialogOpen]);

  const fetchRooms = async (hostelId: string) => {
    try {
      setIsLoadingRooms(true);
      const { data, error } = await supabase
        .from("room_types")
        .select("*")
        .eq("hostel_id", hostelId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      setRooms((data as RoomType[]) || []);
    } catch (error) {
      toast.error("Failed to load rooms");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);

      const imagesArray = newHostel.images
        ? newHostel.images
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean)
        : [];

      const { error } = await supabase.from("hostels").insert({
        name: newHostel.name,
        university: newHostel.university,
        address: newHostel.address,
        description: newHostel.description,
        price_range: newHostel.price_range,
        images: imagesArray,
        owner_id: user?.id,
        status: "pending",
      });

      if (error) throw error;
      toast.success("Property submitted for review");
      setNewHostel({
        name: "",
        university: "",
        address: "",
        description: "",
        price_range: "",
        images: "",
      });
      fetchData();
      document.dispatchEvent(new MouseEvent("mousedown"));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to create property"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostel) return;
    try {
      const { error } = await supabase.from("room_types").insert({
        hostel_id: selectedHostel.id,
        name: newRoom.name,
        price: parseFloat(newRoom.price),
        capacity: parseInt(newRoom.capacity),
        available: parseInt(newRoom.capacity), // Initial available is capacity
      });
      if (error) throw error;
      toast.success("Room type added");
      setNewRoom({ name: "", price: "", capacity: "" });
      fetchRooms(selectedHostel.id);
    } catch (error: unknown) {
      toast.error(
        `Failed to add room: ${getErrorMessage(error, "Unknown error")}`,
      );
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room type?")) return;
    try {
      const { error } = await supabase
        .from("room_types")
        .delete()
        .eq("id", roomId);
      if (error) throw error;
      toast.success("Room type deleted");
      if (selectedHostel) fetchRooms(selectedHostel.id);
    } catch (error) {
      toast.error("Failed to delete room type");
    }
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);
      if (error) throw error;
      toast.success(`Booking ${status}`);
      fetchData();
    } catch {
      toast.error("Failed to update booking status");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      {/* System Status Bar */}
      <div className="bg-slate-900/80 border-b border-white/5 py-1 px-4 flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase tracking-[0.2em]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-emerald-500" />
            <span>Server_Status: Online</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-orange-500" />
            <span>Database_Sync: Active</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>Region: UG-KAMPALA-01</span>
          <span>Latency: 24ms</span>
          <span className="text-slate-400">{new Date().toISOString().split('T')[0]}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Dashboard Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">Owner_Control_Center</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
              Property_Dashboard
            </h1>
            <p className="text-slate-600 text-xs font-mono mt-1 uppercase tracking-widest">
              MANAGEMENT_SYSTEM_V2.4.0_STABLE
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-12 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-none border-b-4 border-orange-600 active:border-b-0 active:translate-y-1 transition-all font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add_New_Property
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-none border-2 border-slate-900 p-0 overflow-hidden">
                <div className="bg-slate-900 text-white p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter">Register_New_Hostel</DialogTitle>
                    <DialogDescription className="text-slate-400 text-[10px] uppercase tracking-widest font-mono">
                      Property verification protocol required.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <form onSubmit={handleCreateProperty} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Hostel_Identity</Label>
                      <Input
                        required
                        value={newHostel.name}
                        onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}
                        placeholder="E.G. CITY GATEWAY HOSTEL"
                        className="rounded-none border-slate-200 focus:ring-orange-500 uppercase text-xs"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Affiliated_Uni</Label>
                        <Input
                          required
                          value={newHostel.university}
                          onChange={(e) => setNewHostel({ ...newHostel, university: e.target.value })}
                          placeholder="E.G. MAKERERE"
                          className="rounded-none border-slate-200 focus:ring-orange-500 uppercase text-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Price_Metric</Label>
                        <Input
                          required
                          value={newHostel.price_range}
                          onChange={(e) => setNewHostel({ ...newHostel, price_range: e.target.value })}
                          placeholder="E.G. 1M - 1.5M UGX"
                          className="rounded-none border-slate-200 focus:ring-orange-500 uppercase text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Geographic_Location</Label>
                      <Input
                        required
                        value={newHostel.address}
                        onChange={(e) => setNewHostel({ ...newHostel, address: e.target.value })}
                        placeholder="E.G. KIKONI, MAKERERE"
                        className="rounded-none border-slate-200 focus:ring-orange-500 uppercase text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                        <ImageIcon className="h-3 w-3" /> Visual_Assets_CSV
                      </Label>
                      <Input
                        value={newHostel.images}
                        onChange={(e) => setNewHostel({ ...newHostel, images: e.target.value })}
                        placeholder="URL1, URL2, URL3..."
                        className="rounded-none border-slate-200 focus:ring-orange-500 text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Property_Brief</Label>
                      <Textarea
                        value={newHostel.description}
                        onChange={(e) => setNewHostel({ ...newHostel, description: e.target.value })}
                        placeholder="DESCRIBE AMENITIES, CULTURE, SAFETY..."
                        className="rounded-none border-slate-200 focus:ring-orange-500 min-h-[100px] uppercase text-xs"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={isCreating}
                      className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-none font-bold uppercase tracking-widest text-xs"
                    >
                      {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Commit_To_Review
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10"
        >
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Active_Properties", value: properties.filter(p => p.status === 'approved').length, icon: Building, color: "text-indigo-500" },
              { label: "Pending_Reviews", value: properties.filter(p => p.status === 'pending').length, icon: Clock, color: "text-amber-500" },
              { label: "Total_Bookings", value: bookings.length, icon: Users, color: "text-emerald-500" },
              { label: "Pending_Requests", value: bookings.filter(b => b.status === 'pending').length, icon: ShieldAlert, color: "text-rose-500" },
            ].map((stat, i) => (
              <Card key={i} className="rounded-none border-slate-800 bg-slate-900/50 shadow-sm hover:shadow-md transition-shadow group overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                  <stat.icon className="h-16 w-16 text-white" />
                </div>
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.label}</CardDescription>
                  <CardTitle className="text-3xl font-black tracking-tighter text-white">{stat.value}</CardTitle>
                </CardHeader>
                <div className={cn("h-1 w-full mt-2", stat.color.replace("text-", "bg-"))} />
              </Card>
            ))}
          </div>

          <Card className="rounded-none border-slate-800 bg-slate-900/50 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Revenue_Growth</CardDescription>
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              </div>
              <CardTitle className="text-2xl font-black tracking-tighter text-white">13.2M <span className="text-[10px] font-mono text-slate-500">UGX</span></CardTitle>
            </CardHeader>
            <CardContent className="flex-grow pt-4">
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="revenue" stroke="#f97316" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                <span>Jan_2026</span>
                <span>Jun_2026</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="properties" className="space-y-8">
          <TabsList className="bg-slate-900 p-1 rounded-none border border-white/5 w-full sm:w-auto overflow-x-auto flex-nowrap">
            <TabsTrigger
              value="properties"
              className="rounded-none px-8 py-3 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-slate-400"
            >
              <Home className="h-3 w-3 mr-2" /> Inventory
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="rounded-none px-8 py-3 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-slate-400"
            >
              <Users className="h-3 w-3 mr-2" /> Booking_Logs
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-none px-8 py-3 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-slate-400"
            >
              <Settings className="h-3 w-3 mr-2" /> System_Config
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="properties" className="mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="rounded-none border-white/5 bg-slate-900/50 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-white/5 bg-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-white">Property_Inventory</CardTitle>
                        <CardDescription className="text-[10px] uppercase tracking-wider text-slate-500">Manage your listed hostel profiles.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="py-20 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Accessing_Database...</span>
                      </div>
                    ) : properties.length === 0 ? (
                      <div className="py-20 text-center">
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">No_Properties_Registered</p>
                      </div>
                    ) : (
                      <Table className="font-mono">
                        <TableHeader className="bg-white/5">
                          <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-12">Property_Identity</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-12">Institution_Affiliation</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-12">Status_Code</TableHead>
                            <TableHead className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest h-12 pr-8">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {properties.map((property) => (
                            <TableRow key={property.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                              <TableCell className="py-4">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-white uppercase tracking-tight">{property.name}</span>
                                  <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">{property.address}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-[10px] text-slate-400 uppercase tracking-tight">{property.university}</TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "rounded-none text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border shadow-none",
                                    property.status === "approved" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                    property.status === "pending" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                    property.status === "rejected" && "bg-rose-500/10 text-rose-500 border-rose-500/20",
                                  )}
                                >
                                  {property.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-none border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all text-slate-400"
                                  onClick={() => {
                                    setSelectedHostel(property);
                                    setIsRoomDialogOpen(true);
                                  }}
                                >
                                  Manage_Rooms
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="bookings" className="mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="rounded-none border-white/5 bg-slate-900/50 shadow-sm overflow-hidden">
                  <CardHeader className="border-b border-white/5 bg-white/5">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-white">Booking_Request_Logs</CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-wider text-slate-500">Review and process student applications.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="py-20 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-4" />
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Accessing_Database...</span>
                      </div>
                    ) : bookings.length === 0 ? (
                      <div className="py-20 text-center">
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">No_Booking_Records_Found</p>
                      </div>
                    ) : (
                      <Table className="font-mono">
                        <TableHeader className="bg-white/5">
                          <TableRow className="hover:bg-transparent border-white/5">
                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-12">Student_Identity</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-12">Target_Property</TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest h-12">Status</TableHead>
                            <TableHead className="text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest h-12 pr-8">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.map((booking) => (
                            <TableRow key={booking.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                              <TableCell className="py-4">
                                <span className="text-xs font-bold text-white uppercase tracking-tight">
                                  {booking.users ? `${booking.users.first_name} ${booking.users.last_name}` : "ANONYMOUS_STUDENT"}
                                </span>
                              </TableCell>
                              <TableCell className="text-[10px] text-slate-400 uppercase tracking-tight">{booking.hostels?.name}</TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "rounded-none text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border shadow-none",
                                    booking.status === "approved" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                    booking.status === "pending" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                    booking.status === "rejected" && "bg-rose-500/10 text-rose-500 border-rose-500/20",
                                  )}
                                >
                                  {booking.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                {booking.status === "pending" ? (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => handleUpdateBookingStatus(booking.id, "approved")}
                                      variant="outline"
                                      size="sm"
                                      className="rounded-none border-emerald-500/20 text-emerald-500 text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      onClick={() => handleUpdateBookingStatus(booking.id, "rejected")}
                                      variant="outline"
                                      size="sm"
                                      className="rounded-none border-rose-500/20 text-rose-500 text-[9px] font-bold uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                    PROCESSED
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="rounded-none border-white/5 bg-slate-900/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-white">System_Configuration</CardTitle>
                    <CardDescription className="text-[10px] uppercase tracking-wider text-slate-500">Manage your owner profile and payout settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-6 border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center text-center">
                      <Wallet className="h-10 w-10 text-slate-700 mb-4" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-1">Financial_Integration_Pending</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest max-w-xs">
                        Payout via Mobile Money configuration is currently in development.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Manage Rooms Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden p-0 rounded-none border-2 border-slate-900">
          <div className="bg-slate-900 text-white p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter">Room_Inventory_Control</DialogTitle>
              <DialogDescription className="text-slate-400 text-[10px] uppercase tracking-widest font-mono">
                Managing: {selectedHostel?.name}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
            <div className="space-y-8">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                  <LayoutDashboard className="h-3 w-3" /> Active_Room_Types
                </h4>
                {isLoadingRooms ? (
                  <div className="py-10 flex flex-col items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-orange-500 mb-2" />
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Syncing_Data...</span>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="p-8 border border-dashed border-slate-200 text-center">
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">No_Room_Data_Available</p>
                  </div>
                ) : (
                  <div className="border border-slate-200">
                    <Table className="font-mono">
                      <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-[9px] font-bold uppercase tracking-widest h-10">Room_Type</TableHead>
                          <TableHead className="text-[9px] font-bold uppercase tracking-widest h-10">Price_UGX</TableHead>
                          <TableHead className="text-[9px] font-bold uppercase tracking-widest h-10">Capacity</TableHead>
                          <TableHead className="text-right text-[9px] font-bold uppercase tracking-widest h-10 pr-4">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rooms.map((room) => (
                          <TableRow key={room.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0">
                            <TableCell className="text-[11px] font-bold uppercase tracking-tight">{room.name}</TableCell>
                            <TableCell className="text-[11px]">{room.price.toLocaleString()}</TableCell>
                            <TableCell className="text-[11px]">{room.capacity}</TableCell>
                            <TableCell className="text-right pr-4">
                              <Button
                                onClick={() => handleDeleteRoom(room.id)}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-6 border border-slate-200">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-900 mb-4 flex items-center gap-2">
                  <Plus className="h-3 w-3" /> Add_New_Room_Configuration
                </h4>
                <form onSubmit={handleAddRoom} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Room_Identity</Label>
                    <Input
                      required
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                      placeholder="E.G. SINGLE SELF-CONTAINED"
                      className="rounded-none border-slate-200 text-xs uppercase h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Price_UGX</Label>
                    <Input
                      required
                      type="number"
                      min="0"
                      value={newRoom.price}
                      onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
                      placeholder="1500000"
                      className="rounded-none border-slate-200 text-xs h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Capacity</Label>
                    <div className="flex gap-2">
                      <Input
                        required
                        type="number"
                        min="1"
                        value={newRoom.capacity}
                        onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                        placeholder="1"
                        className="rounded-none border-slate-200 text-xs h-10"
                      />
                      <Button
                        type="submit"
                        className="shrink-0 bg-slate-900 hover:bg-slate-800 text-white rounded-none h-10 w-10 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
