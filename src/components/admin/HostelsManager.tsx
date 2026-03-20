import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [isLoading, setIsLoading] = useState(true);

  // Create Property State
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newHostel, setNewHostel] = useState({
    name: "",
    university: "",
    address: "",
    description: "",
    price_range: "",
    images: "" 
  });

  // Manage Rooms State
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", price: "", capacity: "" });

  useEffect(() => { fetchHostels(); }, []);

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

      const { error } = await supabase
        .from("hostels")
        .insert({
          name: newHostel.name,
          university: newHostel.university,
          address: newHostel.address,
          description: newHostel.description,
          price_range: newHostel.price_range,
          images: imagesArray,
          owner_id: user?.id, // Super Admin is the owner
          status: "approved" // Auto-approve since admin creates it
        });

      if (error) throw error;
      toast.success("Hostel securely added to platform");
      
      setNewHostel({ name: "", university: "", address: "", description: "", price_range: "", images: "" });
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
    if(!confirm("Are you sure you want to permanently delete this hostel?")) return;
    try {
      const { error } = await supabase.from("hostels").delete().eq("id", hostelId);
      if (error) throw error;
      toast.success("Hostel deleted completely");
      fetchHostels();
    } catch (error) {
      toast.error("Failed to delete hostel");
    }
  };

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
      const { error } = await supabase.from("room_types").insert({
        hostel_id: selectedHostel.id,
        name: newRoom.name,
        price: parseFloat(newRoom.price),
        capacity: parseInt(newRoom.capacity),
        available: parseInt(newRoom.capacity)
      });
      if (error) throw error;
      toast.success("Room type added");
      setNewRoom({ name: "", price: "", capacity: "" });
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Hostels Management</h2>
          <p className="text-muted-foreground mt-2">Create new listings, approve pending ones, and manage room inventory.</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all">
              <Plus className="h-5 w-5" /> Add New Hostel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-indigo-500"/> Create Official Profile</DialogTitle>
              <DialogDescription>
                As a Super Admin, any property you create is instantly approved and published.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProperty} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
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
                <Label htmlFor="images" className="flex items-center gap-1"><ImageIcon className="h-4 w-4 text-muted-foreground"/> Image URLs (comma separated)</Label>
                <Input id="images" value={newHostel.images} onChange={(e) => setNewHostel({...newHostel, images: e.target.value})} placeholder="https://image1.jpg, https://image2.jpg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Brief Description</Label>
                <Textarea id="description" value={newHostel.description} onChange={(e) => setNewHostel({...newHostel, description: e.target.value})} placeholder="Describe the amenities, culture, safety..." />
              </div>
              <DialogFooter className="sticky bottom-0 bg-white pt-2">
                <Button type="submit" disabled={isCreating} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Publish Hostel Directly
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-indigo-100/50 shadow-md bg-white">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead>Hostel Name</TableHead>
                  <TableHead>University Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hostels.map((hostel) => (
                  <TableRow key={hostel.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900">{hostel.name}</TableCell>
                    <TableCell className="text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {hostel.university || hostel.address}
                    </TableCell>
                    <TableCell>
                      <Badge variant={hostel.status === "approved" ? "default" : hostel.status === "pending" ? "secondary" : "destructive"}
                             className={
                               hostel.status === "approved" ? "bg-emerald-500 hover:bg-emerald-600" :
                               hostel.status === "pending" ? "bg-amber-100 text-amber-800 hover:bg-amber-200" : ""
                             }>
                        {hostel.status === "approved" ? "Active" : hostel.status === "pending" ? "Pending" : "Rejected"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {hostel.status === 'pending' && (
                          <div className="flex gap-2 mr-2">
                            <Button onClick={() => handleUpdateStatus(hostel.id, "approved")} variant="outline" size="sm" className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                              Approve
                            </Button>
                            <Button onClick={() => handleUpdateStatus(hostel.id, "rejected")} variant="outline" size="sm" className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50">
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                          onClick={() => {
                            setSelectedHostel(hostel);
                            setIsRoomDialogOpen(true);
                          }}
                        >
                          <LayoutPanelLeft className="h-4 w-4 mr-1" /> Rooms
                        </Button>

                        <Button onClick={() => handleDelete(hostel.id)} variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                           <Trash2 className="h-4 w-4" />
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Admin: Manage Rooms for {selectedHostel?.name}</DialogTitle>
            <DialogDescription>Add or remove room types and pricing. Students will select from these options.</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Existing Rooms</h4>
            {isLoadingRooms ? (
               <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
            ) : rooms.length === 0 ? (
               <p className="text-sm text-muted-foreground italic mb-4">No rooms added yet. This property will not be bookable.</p>
            ) : (
              <Table className="mb-6">
                <TableHeader>
                  <TableRow>
                    <TableHead>Type/Name</TableHead>
                    <TableHead>Price (UGX)</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map(room => (
                    <TableRow key={room.id}>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell>{room.price.toLocaleString()}</TableCell>
                      <TableCell>{room.capacity}</TableCell>
                      <TableCell className="text-right">
                        <Button onClick={() => handleDeleteRoom(room.id)} variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 p-1 h-8 w-8">
                           <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="border-t pt-4 mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-semibold mb-4 text-indigo-800">Add New Room Type</h4>
              <form onSubmit={handleAddRoom} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Room Name</Label>
                  <Input required value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} placeholder="Single Self-Contained" className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Price (UGX)</Label>
                  <Input required type="number" min="0" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} placeholder="1500000" className="bg-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Beds</Label>
                  <div className="flex gap-2">
                    <Input required type="number" min="1" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} placeholder="1" className="bg-white" />
                    <Button type="submit" size="icon" className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
