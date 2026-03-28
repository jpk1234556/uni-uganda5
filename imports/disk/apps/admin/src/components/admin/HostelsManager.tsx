import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, MapPin, Plus, Image as ImageIcon, Building2, LayoutPanelLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Hostel } from "@/types";

export default function HostelsManager() {
  const { user } = useAuth();
  
  const [hostels, setHostels] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Property State
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all");
  const [universities, setUniversities] = useState<string[]>([]);
  const [newHostel, setNewHostel] = useState({
    name: "",
    university: "",
    address: "",
    description: "",
    price_range: "",
    images: "",
    amenities: "",
    owner_id: ""
  });

  // Manage Rooms State
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", price: "", capacity: "", description: "", images: "" });

  useEffect(() => { 
    fetchHostels(); 
    fetchOwners();
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from("universities")
        .select("name")
        .order("name", { ascending: true });
      
      if (error) {
        // Fallback to deriving from hostels
        const { data: hostelData } = await supabase.from("hostels").select("university");
        const uniqueUnis = Array.from(new Set((hostelData || []).map(h => h.university).filter(Boolean)));
        setUniversities(uniqueUnis as string[]);
        return;
      }
      
      setUniversities(data.map(u => u.name));
    } catch (error) {
      console.error("Error fetching universities:", error);
    }
  };

  const fetchOwners = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email")
        .eq("role", "hostel_owner")
        .eq("is_active", true);
      if (error) throw error;
      setOwners(data || []);
    } catch (error) {
      console.error("Error fetching owners:", error);
    }
  };

  const fetchHostels = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("hostels")
        .select(`*, users!hostels_owner_id_fkey(first_name, last_name, email)`)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setHostels(data || []);
    } catch (error) {
      toast.error("Failed to load hostels");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      
      const imagesArray = newHostel.images
        ? newHostel.images.split(",").map(i => i.trim()).filter(Boolean)
        : [];
      
      const amenitiesArray = newHostel.amenities
        ? newHostel.amenities.split(",").map(a => a.trim()).filter(Boolean)
        : [];

      const { error } = await supabase
        .from("hostels")
        .insert({
          name: newHostel.name,
          university: newHostel.university,
          address: newHostel.address,
          description: newHostel.description,
          price_range: newHostel.price_range,
          images: imagesArray,
          amenities: amenitiesArray,
          owner_id: newHostel.owner_id || user?.id, // Use selected owner or fallback to admin
          status: "approved" // Auto-approve since admin creates it
        });

      if (error) throw error;
      toast.success("Hostel securely added to platform");
      
      setNewHostel({ name: "", university: "", address: "", description: "", price_range: "", images: "", amenities: "", owner_id: "" });
      setIsCreateDialogOpen(false);
      fetchHostels();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateStatus = async (hostelId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase.from("hostels").update({ status }).eq("id", hostelId);
      if (error) throw error;
      toast.success(`Hostel ${status} successfully`);
      fetchHostels(); 
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (hostelId: string) => {
    try {
      const { error } = await supabase.from("hostels").delete().eq("id", hostelId);
      if (error) throw error;
      toast.success("Hostel deleted completely");
      fetchHostels();
    } catch (error) {
      toast.error("Failed to delete hostel");
    }
  };

  const filteredHostels = hostels.filter(h => 
    selectedUniversity === "all" || h.university === selectedUniversity
  );

  // ----------------------------------------------------------------------
  // Room Management Logic
  // ----------------------------------------------------------------------
  useEffect(() => {
    if (selectedHostel && isRoomDialogOpen) {
      fetchRooms(selectedHostel.id);
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
      setRooms(data || []);
    } catch (error) {
      toast.error("Failed to load rooms");
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHostel) return;
    try {
      const roomImagesArray = newRoom.images ? newRoom.images.split(",").map(i => i.trim()).filter(Boolean) : [];
      
      const { error } = await supabase.from("room_types").insert({
        hostel_id: selectedHostel.id,
        name: newRoom.name,
        price: parseFloat(newRoom.price),
        capacity: parseInt(newRoom.capacity),
        available: parseInt(newRoom.capacity),
        description: newRoom.description || null,
        images: roomImagesArray.length > 0 ? roomImagesArray : null
      });
      if (error) throw error;
      toast.success("Room type added");
      setNewRoom({ name: "", price: "", capacity: "", description: "", images: "" });
      fetchRooms(selectedHostel.id);
    } catch (error: any) {
      toast.error("Failed to add room: " + error.message);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if(!confirm("Are you sure you want to delete this room type?")) return;
    try {
      const { error } = await supabase.from("room_types").delete().eq("id", roomId);
      if (error) throw error;
      toast.success("Room type deleted");
      if (selectedHostel) fetchRooms(selectedHostel.id);
    } catch (error) {
      toast.error("Failed to delete room type");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }} 
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Inventory_Control</span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Hostel_Management</h2>
          <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest">PROPERTY_REGISTRY_AND_INVENTORY_SYSTEM</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter_By_Uni:</span>
            <select 
              value={selectedUniversity} 
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="h-9 px-3 bg-white border border-slate-200 text-[10px] uppercase focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="all">ALL_UNIVERSITIES</option>
              {universities.map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-none shadow-sm transition-all h-10 px-6">
              <Plus className="h-4 w-4" /> Register_New_Property
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-none border-slate-200 font-mono">
            <DialogHeader className="border-b border-slate-100 pb-4">
              <DialogTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <Building2 className="h-4 w-4 text-indigo-500"/> Create_Official_Profile
              </DialogTitle>
              <DialogDescription className="text-[10px] uppercase tracking-wider text-slate-400">
                ADMIN_OVERRIDE: Instant approval protocol active.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProperty} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label htmlFor="owner" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Assign_Owner</Label>
                <select 
                  id="owner" 
                  required 
                  value={newHostel.owner_id} 
                  onChange={(e) => setNewHostel({...newHostel, owner_id: e.target.value})}
                  className="w-full h-9 px-3 bg-white border border-slate-200 text-xs uppercase focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                >
                  <option value="">SELECT_OWNER</option>
                  {owners.map(owner => (
                    <option key={owner.id} value={owner.id}>
                      {owner.first_name} {owner.last_name} ({owner.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Hostel_Name</Label>
                <Input id="name" required value={newHostel.name} onChange={(e) => setNewHostel({...newHostel, name: e.target.value})} placeholder="CITY_GATEWAY_HOSTEL" className="rounded-none border-slate-200 text-xs uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Nearest_University</Label>
                  <div className="relative">
                    <Input 
                      id="university" 
                      required 
                      value={newHostel.university} 
                      onChange={(e) => setNewHostel({...newHostel, university: e.target.value})} 
                      placeholder="MAKERERE" 
                      className="rounded-none border-slate-200 text-xs uppercase pr-8" 
                    />
                    {universities.length > 0 && (
                      <select 
                        className="absolute right-0 top-0 h-full w-8 opacity-0 cursor-pointer"
                        onChange={(e) => setNewHostel({...newHostel, university: e.target.value})}
                      >
                        <option value="">SELECT_EXISTING</option>
                        {universities.map(uni => (
                          <option key={uni} value={uni}>{uni}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_range" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Avg_Price_Range</Label>
                  <Input id="price_range" required value={newHostel.price_range} onChange={(e) => setNewHostel({...newHostel, price_range: e.target.value})} placeholder="1M_-_1.5M_UGX" className="rounded-none border-slate-200 text-xs uppercase" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Physical_Address</Label>
                <Input id="address" required value={newHostel.address} onChange={(e) => setNewHostel({...newHostel, address: e.target.value})} placeholder="KIKONI_MAKERERE" className="rounded-none border-slate-200 text-xs uppercase" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amenities" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Amenities_List</Label>
                <Input id="amenities" value={newHostel.amenities} onChange={(e) => setNewHostel({...newHostel, amenities: e.target.value})} placeholder="WIFI,SECURITY,POWER" className="rounded-none border-slate-200 text-xs uppercase" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="images" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <ImageIcon className="h-3 w-3"/> Media_Assets_URLs
                </Label>
                <Input id="images" value={newHostel.images} onChange={(e) => setNewHostel({...newHostel, images: e.target.value})} placeholder="HTTPS://IMAGE1.JPG" className="rounded-none border-slate-200 text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Property_Brief</Label>
                <Textarea id="description" value={newHostel.description} onChange={(e) => setNewHostel({...newHostel, description: e.target.value})} placeholder="DESCRIBE_AMENITIES_CULTURE_SAFETY" className="rounded-none border-slate-200 text-xs uppercase h-24" />
              </div>
              <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t border-slate-100">
                <Button type="submit" disabled={isCreating} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-none h-10">
                  {isCreating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                  Commit_To_Registry
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      <Card className="border-slate-200 rounded-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mb-3" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Streaming_Inventory_Data...</span>
            </div>
          ) : (
            <Table className="font-mono">
              <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Property_Identity</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Geographic_Data</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">System_Status</TableHead>
                  <TableHead className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10 pr-6">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHostels.map((hostel) => (
                  <TableRow key={hostel.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 bg-slate-100 border border-slate-200 text-slate-600 rounded flex items-center justify-center text-[10px] font-bold">
                          {hostel.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">{hostel.name}</span>
                          <span className="text-[9px] text-slate-400 tracking-widest">ID: {hostel.id.split('-')[0]}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-500 uppercase tracking-tight">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 text-slate-400" /> 
                        {hostel.university || hostel.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest",
                        hostel.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        hostel.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                        'bg-rose-50 text-rose-600 border-rose-100'
                      )}>
                        {hostel.status === 'approved' ? 'Active' : hostel.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-2">
                        {hostel.status === 'pending' && (
                          <div className="flex gap-2 mr-2">
                            <Button onClick={() => handleUpdateStatus(hostel.id, "approved")} variant="outline" className="h-7 text-[9px] font-bold uppercase tracking-widest text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-none px-3">
                              Approve
                            </Button>
                            <Button onClick={() => handleUpdateStatus(hostel.id, "rejected")} variant="outline" className="h-7 text-[9px] font-bold uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50 rounded-none px-3">
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        <Button 
                          variant="outline" 
                          className="h-7 text-[9px] font-bold uppercase tracking-widest text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-none px-3"
                          onClick={() => {
                            setSelectedHostel(hostel);
                            setIsRoomDialogOpen(true);
                          }}
                        >
                          <LayoutPanelLeft className="h-3.5 w-3.5 mr-1.5" /> Rooms
                        </Button>

                        <Button onClick={() => {
                          if (window.confirm("Are you sure you want to permanently delete this hostel?")) {
                            handleDelete(hostel.id);
                          }
                        }} variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                           <Trash2 className="h-3.5 w-3.5" />
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

      {/* Manage Rooms Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-none border-slate-200 font-mono">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="text-xs font-bold uppercase tracking-widest">Admin_Room_Config: {selectedHostel?.name}</DialogTitle>
            <DialogDescription className="text-[10px] uppercase tracking-wider text-slate-400">Inventory_Modification_Protocol</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-6">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Existing_Inventory</h4>
              {isLoadingRooms ? (
                 <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-indigo-500" /></div>
              ) : rooms.length === 0 ? (
                 <p className="text-[10px] text-slate-400 uppercase tracking-widest italic py-4 border border-dashed border-slate-200 text-center">No_Inventory_Detected</p>
              ) : (
                <Table className="border border-slate-100">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest h-8">Type_Label</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest h-8">Unit_Price</TableHead>
                      <TableHead className="text-[9px] font-bold uppercase tracking-widest h-8">Capacity</TableHead>
                      <TableHead className="h-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map(room => (
                      <TableRow key={room.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="text-[10px] font-bold text-slate-700 uppercase">{room.name}</TableCell>
                        <TableCell className="text-[10px] font-bold text-slate-600">{room.price.toLocaleString()} UGX</TableCell>
                        <TableCell className="text-[10px] font-bold text-slate-600">{room.capacity} UNIT</TableCell>
                        <TableCell className="text-right">
                          <Button onClick={() => handleDeleteRoom(room.id)} variant="ghost" className="text-rose-500 hover:bg-rose-50 p-0 h-6 w-6 rounded">
                             <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="border border-slate-200 bg-slate-50/50 p-5">
              <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-4">Add_New_Inventory_Unit</h4>
              <form onSubmit={handleAddRoom} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-1">
                    <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Unit_Label</Label>
                    <Input required value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} placeholder="SINGLE_SELF" className="bg-white rounded-none border-slate-200 text-[10px] h-9 uppercase" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Price_UGX</Label>
                    <Input required type="number" min="0" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} placeholder="1500000" className="bg-white rounded-none border-slate-200 text-[10px] h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Bed_Count</Label>
                    <Input required type="number" min="1" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} placeholder="1" className="bg-white rounded-none border-slate-200 text-[10px] h-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Media_Assets (URLs)</Label>
                  <Input value={newRoom.images} onChange={e => setNewRoom({...newRoom, images: e.target.value})} placeholder="HTTPS://ROOM-IMG.JPG" className="bg-white rounded-none border-slate-200 text-[10px] h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Unit_Description</Label>
                  <Textarea value={newRoom.description} onChange={e => setNewRoom({...newRoom, description: e.target.value})} placeholder="DESCRIBE_UNIT_FEATURES" className="bg-white rounded-none border-slate-200 text-[10px] resize-none h-20 uppercase" />
                </div>
                <div className="flex justify-end pt-2">
                   <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-none h-9 px-6 shadow-sm gap-2">
                     <Plus className="h-3.5 w-3.5" /> Commit_Unit
                   </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
