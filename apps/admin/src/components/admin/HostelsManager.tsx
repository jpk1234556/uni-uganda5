import { useState, useEffect, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Trash2, MapPin, Plus, Image as ImageIcon, Building2, LayoutPanelLeft, Edit, ExternalLink, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Hostel } from "@/types";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function HostelsManager() {
  const { user, dbUser } = useAuth();
  
  const [hostels, setHostels] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Property State
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditingHostel, setIsEditingHostel] = useState(false);
  
  // Wizard state additions
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [createdHostelId, setCreatedHostelId] = useState<string | null>(null);

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
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

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
        .select(`*, users(first_name, last_name, email)`)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setHostels(data || []);
    } catch (error) {
      toast.error("Failed to load hostels");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);

      if (!user?.id) throw new Error("Your session is not ready. Please sign in again and retry.");
      if (dbUser?.role && dbUser.role !== "super_admin") throw new Error("Only super admins can manage hostels.");

      const ownerId = (newHostel.owner_id || user.id || "").trim();
      if (!ownerId) throw new Error("Please assign an owner.");
      
      const imagesArray = newHostel.images ? newHostel.images.split(",").map(i => i.trim()).filter(Boolean) : [];
      const amenitiesArray = newHostel.amenities ? newHostel.amenities.split(",").map(a => a.trim()).filter(Boolean) : [];

      const payload = {
          name: newHostel.name,
          university: newHostel.university,
          address: newHostel.address,
          description: newHostel.description,
          price_range: newHostel.price_range,
          images: imagesArray,
          amenities: amenitiesArray,
          owner_id: ownerId,
          status: "approved"
      };

      if (isEditingHostel && createdHostelId) {
        const { error } = await supabase.from("hostels").update(payload).eq("id", createdHostelId);
        if (error) throw error;
        toast.success("Hostel updated successfully!");
        setWizardStep(3);
        fetchHostels();
      } else {
        const { data, error } = await supabase.from("hostels").insert(payload).select().single();
        if (error) throw error;
        toast.success("Hostel created! Now configure the rooms.");
        setCreatedHostelId(data.id);
        setWizardStep(3);
        fetchHostels();
      }
    } catch (error: any) {
      console.error(error);
      const code = error?.code as string | undefined;
      const message = (error?.message || "").toString();
      const details = (error?.details || "").toString();
      let friendly = "Failed to save property. Please verify all required fields and permissions.";
      if (code === "42501" || /row-level security|permission denied/i.test(message)) friendly = "Action denied by database permissions. Your account must be super_admin to manage hostels.";
      else if (code === "23503" || /hostels_owner_id_fkey|foreign key/i.test(message + details)) friendly = "Owner profile is invalid or missing. Pick a valid owner from the list or repair the admin user profile in public.users.";
      else if (code === "23502" || /null value/i.test(message)) friendly = "A required hostel field is missing. Fill all required fields and try again.";
      else if (message) friendly = message;
      toast.error(friendly);
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

  const openEditHostel = (hostel: any) => {
    setIsEditingHostel(true);
    setCreatedHostelId(hostel.id);
    setNewHostel({
      name: hostel.name || "",
      university: hostel.university || "",
      address: hostel.address || "",
      description: hostel.description || "",
      price_range: hostel.price_range || "",
      images: (hostel.images || []).join(", "),
      amenities: (hostel.amenities || []).join(", "),
      owner_id: hostel.owner_id || ""
    });
    setWizardStep(2);
    setIsCreateDialogOpen(true);
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

  const handleSaveRoom = async (e: React.FormEvent, targetHostelId?: string) => {
    e.preventDefault();
    const hId = targetHostelId || selectedHostel?.id;
    if (!hId) return;
    try {
      const roomImagesArray = newRoom.images ? newRoom.images.split(",").map(i => i.trim()).filter(Boolean) : [];
      const payload = {
        name: newRoom.name,
        price: parseFloat(newRoom.price),
        capacity: parseInt(newRoom.capacity),
        available: parseInt(newRoom.capacity),
        description: newRoom.description || null,
        images: roomImagesArray.length > 0 ? roomImagesArray : null
      };

      if (editingRoomId) {
         const { error } = await supabase.from("room_types").update(payload).eq("id", editingRoomId);
         if (error) throw error;
         toast.success("Room type updated");
      } else {
         const { error } = await supabase.from("room_types").insert({ hostel_id: hId, ...payload });
         if (error) throw error;
         toast.success("Room type added");
      }
      setEditingRoomId(null);
      setNewRoom({ name: "", price: "", capacity: "", description: "", images: "" });
      fetchRooms(hId);
    } catch (error: any) {
      toast.error("Failed to save room: " + error.message);
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

  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }} 
        className="space-y-6"
      >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            <span className="text-sm font-bold text-slate-500 tracking-wide">Inventory Control</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Hostel Management</h2>
          <p className="text-slate-500 text-sm mt-1">Property registry and inventory system</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-500">Filter By Uni:</span>
            <select 
              value={selectedUniversity} 
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            >
              <option value="all">All Universities</option>
              {universities.map(uni => (
                <option key={uni} value={uni}>{uni}</option>
              ))}
            </select>
          </div>

          <Button onClick={() => {
            setIsCreateDialogOpen(true);
            setTimeout(() => triggerRef.current?.click(), 0);
          }} className="gap-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl transition-all h-10 px-6 shadow-sm">
            <Plus className="h-4 w-4" /> Register New Property
          </Button>
      </div>
    </div>

      <Card className="border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <span className="text-sm font-medium text-slate-500">Loading Inventory Data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-slate-600 h-11">Property Name</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 h-11">Location</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 h-11">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-600 h-11 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHostels.map((hostel) => (
                  <TableRow key={hostel.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">
                          {hostel.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 tracking-tight">{hostel.name}</span>
                          <span className="text-xs text-slate-500 font-medium">ID: {hostel.id.split('-')[0]}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-slate-400" /> 
                        {hostel.university || hostel.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold shadow-sm",
                        hostel.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        hostel.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-rose-50 text-rose-700 border-rose-200'
                      )}>
                        {hostel.status === 'approved' ? 'Active' : hostel.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end items-center gap-2">
                        {hostel.status === 'pending' && (
                          <div className="flex gap-2 mr-2">
                            <Button onClick={() => handleUpdateStatus(hostel.id, "approved")} variant="outline" className="h-8 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-600 hover:text-white rounded-lg px-3 transition-colors">
                              Approve
                            </Button>
                            <Button onClick={() => handleUpdateStatus(hostel.id, "rejected")} variant="outline" className="h-8 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-600 hover:text-white rounded-lg px-3 transition-colors">
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        <Button 
                          variant="outline" 
                          className="h-8 text-xs font-semibold text-primary border-slate-200 hover:border-primary hover:bg-primary/5 rounded-lg px-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedHostel(hostel);
                            setIsRoomDialogOpen(true);
                          }}
                        >
                          <LayoutPanelLeft className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Rooms</span>
                        </Button>
                        
                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => window.open(`/hostel/${hostel.id}`, "_blank")}>
                           <Eye className="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => openEditHostel(hostel)}>
                           <Edit className="h-4 w-4" />
                        </Button>

                        <Button onClick={() => {
                          if (window.confirm("Are you sure you want to permanently delete this hostel?")) {
                            handleDelete(hostel.id);
                          }
                        }} variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
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
    </motion.div>

      {/* Property Creation Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setWizardStep(1);
            setCreatedHostelId(null);
            setIsEditingHostel(false);
            setNewHostel({ name: "", university: "", address: "", description: "", price_range: "", images: "", amenities: "", owner_id: "" });
          }
        }}>
        <DialogTrigger ref={triggerRef} style={{ display: "none" }} />
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-0 shadow-2xl bg-white">
          <DialogHeader className="border-b border-slate-100 pb-4 bg-slate-50 -mx-6 px-6 -mt-6 pt-6 rounded-t-2xl relative">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 tracking-tight">
              <Building2 className="h-5 w-5 text-primary"/>
              {wizardStep === 1 && "Step 1: Assign Owner & University"}
              {wizardStep === 2 && "Step 2: Property Details"}
              {wizardStep === 3 && "Step 3: Room Inventory"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 font-medium">
              {wizardStep === 1 && "Assign an owner and link a university to this property."}
              {wizardStep === 2 && "Configure the hostel's profile and marketing details."}
              {wizardStep === 3 && "Create internal room types and their capacities."}
            </DialogDescription>
            <div className="absolute top-6 right-6 text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">
              Step {wizardStep} of 3
            </div>
          </DialogHeader>

          <div className="py-4 max-h-[60vh] overflow-y-auto px-1">
            {wizardStep === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setWizardStep(2); }} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="owner" className="text-sm font-semibold text-slate-700">Assign Owner</Label>
                  <select 
                    id="owner" 
                    value={newHostel.owner_id} 
                    onChange={(e) => setNewHostel({...newHostel, owner_id: e.target.value})}
                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  >
                    <option value="">Default to Me (Admin)</option>
                    {owners.map(owner => (
                      <option key={owner.id} value={owner.id}>
                        {owner.first_name} {owner.last_name} ({owner.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 font-medium">If no owner is selected, the platform super-admin assumes control.</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="university" className="text-sm font-semibold text-slate-700">Nearest University</Label>
                  <div className="relative">
                    <Input 
                      id="university" 
                      required 
                      value={newHostel.university} 
                      onChange={(e) => setNewHostel({...newHostel, university: e.target.value})} 
                      placeholder="e.g. Makerere University" 
                      className="rounded-xl border-slate-200 text-sm bg-white shadow-sm pr-8 h-11" 
                    />
                    {universities.length > 0 && (
                      <select 
                        className="absolute right-0 top-0 h-full w-8 opacity-0 cursor-pointer"
                        onChange={(e) => setNewHostel({...newHostel, university: e.target.value})}
                      >
                        <option value="">Select Existing</option>
                        {universities.map(uni => (
                          <option key={uni} value={uni}>{uni}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                
                <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t border-slate-100">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl h-11 shadow-sm transition-transform hover:scale-[1.02]">
                    Continue to Details
                  </Button>
                </DialogFooter>
              </form>
            )}

            {wizardStep === 2 && (
              <form onSubmit={handleSaveProperty} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700">Hostel Name</Label>
                  <Input id="name" required value={newHostel.name} onChange={(e) => setNewHostel({...newHostel, name: e.target.value})} placeholder="e.g. City Gateway Hostel" className="rounded-xl border-slate-200 text-sm h-11 bg-white shadow-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_range" className="text-sm font-semibold text-slate-700">Estimated Price Range (UGX)</Label>
                    <Input id="price_range" required value={newHostel.price_range} onChange={(e) => setNewHostel({...newHostel, price_range: e.target.value})} placeholder="1M - 1.5M" className="rounded-xl border-slate-200 text-sm h-11 bg-white shadow-sm" />
                  </div>
                  <div className="space-y-2">
                     <Label htmlFor="images" className="flex items-center gap-1 text-sm font-semibold text-slate-700">
                       <ImageIcon className="h-4 w-4 text-primary"/> Media Image URLs
                     </Label>
                     <Input id="images" value={newHostel.images} onChange={(e) => setNewHostel({...newHostel, images: e.target.value})} placeholder="https://..., https://..." className="rounded-xl border-slate-200 text-sm h-11 bg-white shadow-sm" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold text-slate-700">Physical Address</Label>
                  <Input id="address" required value={newHostel.address} onChange={(e) => setNewHostel({...newHostel, address: e.target.value})} placeholder="e.g. Kikoni, Makerere" className="rounded-xl border-slate-200 text-sm h-11 bg-white shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amenities" className="text-sm font-semibold text-slate-700">Amenities (Comma separated)</Label>
                  <Input id="amenities" value={newHostel.amenities} onChange={(e) => setNewHostel({...newHostel, amenities: e.target.value})} placeholder="WiFi, Security, Power" className="rounded-xl border-slate-200 text-sm h-11 bg-white shadow-sm" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-slate-700">Property Description</Label>
                  <Textarea id="description" value={newHostel.description} onChange={(e) => setNewHostel({...newHostel, description: e.target.value})} placeholder="Describe the hostel, its vibes, and rules..." className="rounded-xl border-slate-200 text-sm h-28 bg-white shadow-sm custom-scrollbar" />
                </div>
                <DialogFooter className="flex flex-row gap-3 sticky bottom-0 bg-white pt-4 border-t border-slate-100 mt-6">
                  <Button type="button" variant="outline" onClick={() => setWizardStep(1)} className="w-1/3 text-slate-700 border-slate-200 text-sm font-bold rounded-xl h-11 hover:bg-slate-50">
                    Go Back
                  </Button>
                  <Button type="submit" disabled={isCreating} className="w-2/3 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl h-11 shadow-sm transition-transform hover:scale-[1.02]">
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isEditingHostel ? "Update Registry" : "Commit to Registry"}
                  </Button>
                </DialogFooter>
              </form>
            )}

            {wizardStep === 3 && (
              <div className="space-y-6">
                {rooms.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Deployed Inventories</h4>
                    <div className="max-h-[120px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 shadow-sm">
                      <Table>
                        <TableBody>
                          {rooms.map(room => (
                            <TableRow key={room.id} className="hover:bg-slate-100 border-slate-200">
                              <TableCell className="text-xs font-semibold text-slate-900">{room.name}</TableCell>
                              <TableCell className="text-xs text-slate-600">{room.price.toLocaleString()} UGX</TableCell>
                              <TableCell className="text-xs text-slate-600">Cap:{room.capacity}</TableCell>
                              <TableCell className="text-right">
                                <Button type="button" onClick={() => {
                                  setEditingRoomId(room.id);
                                  setNewRoom({
                                    name: room.name || "",
                                    price: room.price?.toString() || "",
                                    capacity: room.capacity?.toString() || "",
                                    description: room.description || "",
                                    images: (room.images || []).join(", ")
                                  });
                                }} variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg mr-1">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button type="button" onClick={() => handleDeleteRoom(room.id)} variant="ghost" className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-100 rounded-lg">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 p-5 border border-slate-200 rounded-xl shadow-sm">
                  <h4 className="text-sm font-bold text-slate-900 mb-4">Add Room Type</h4>
                  <div className="flex gap-2 mb-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => setNewRoom({ ...newRoom, name: "Single Room", capacity: "1" })} className="rounded-lg text-xs font-semibold h-8 border-slate-300 text-slate-700 hover:bg-white hover:text-primary">
                      Preset: Single
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setNewRoom({ ...newRoom, name: "Double Room", capacity: "2" })} className="rounded-lg text-xs font-semibold h-8 border-slate-300 text-slate-700 hover:bg-white hover:text-primary">
                      Preset: Double
                    </Button>
                  </div>
                  <form onSubmit={(e) => createdHostelId && handleSaveRoom(e, createdHostelId)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-700">Type Label</Label>
                        <Input required value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} placeholder="e.g. Single VIP" className="bg-white rounded-lg border-slate-200 text-sm h-10 shadow-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-700">Capacity</Label>
                          <Input required type="number" min="1" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} placeholder="1" className="bg-white rounded-lg border-slate-200 text-sm h-10 shadow-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-slate-700">Price</Label>
                          <Input required type="number" min="0" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} placeholder="UGX" className="bg-white rounded-lg border-slate-200 text-sm h-10 shadow-sm" />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2 gap-2">
                      {editingRoomId && (
                        <Button type="button" variant="ghost" onClick={() => {
                          setEditingRoomId(null);
                          setNewRoom({ name: "", price: "", capacity: "", description: "", images: "" });
                        }} className="text-slate-600 h-9 rounded-lg px-4 hover:bg-slate-100">Cancel</Button>
                      )}
                      <Button type="submit" className="bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg h-9 px-5 shadow-sm transition-transform hover:scale-[1.02]">
                        <Plus className="h-4 w-4 mr-1.5" /> {editingRoomId ? "Update Type" : "Add Room Type"}
                      </Button>
                    </div>
                  </form>
                </div>
                
                <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t border-slate-100 mt-4">
                  <Button onClick={() => setIsCreateDialogOpen(false)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl h-11 shadow-sm transition-transform hover:scale-[1.02]">
                    Finish Setup
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Rooms Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border-0 shadow-2xl bg-white p-0">
          <DialogHeader className="border-b border-slate-100 p-6 bg-slate-50 relative">
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">Room Inventory: {selectedHostel?.name}</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 mt-1">Manage physical units and pricing structure</DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-8">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Existing Inventory Types</h4>
              {isLoadingRooms ? (
                 <div className="py-10 flex flex-col justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-primary mb-2" /><span className="text-sm text-slate-500">Loading units...</span></div>
              ) : rooms.length === 0 ? (
                 <p className="text-sm text-slate-500 bg-slate-50 rounded-xl py-8 border border-dashed border-slate-200 text-center font-medium">No inventory data configured for this property.</p>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50 border-b border-slate-200">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-semibold text-slate-600 h-10">Unit Type</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 h-10">Unit Price</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-600 h-10">Capacity</TableHead>
                        <TableHead className="h-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rooms.map(room => (
                        <TableRow key={room.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                          <TableCell className="text-sm font-bold text-slate-800">{room.name}</TableCell>
                          <TableCell className="text-sm font-medium text-slate-600">{Number(room.price || 0).toLocaleString()} UGX</TableCell>
                          <TableCell className="text-sm font-medium text-slate-600">{room.capacity || 1} Beds</TableCell>
                          <TableCell className="text-right">
                            <Button type="button" onClick={() => {
                                setEditingRoomId(room.id);
                                setNewRoom({
                                  name: room.name || "",
                                  price: room.price?.toString() || "",
                                  capacity: room.capacity?.toString() || "",
                                  description: room.description || "",
                                  images: (room.images || []).join(", ")
                                });
                            }} variant="ghost" className="text-slate-400 hover:text-primary hover:bg-primary/10 p-0 h-8 w-8 rounded-lg mr-1">
                               <Edit className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => handleDeleteRoom(room.id)} variant="ghost" className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-0 h-8 w-8 rounded-lg">
                               <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="border border-slate-200 bg-slate-50 rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Add New Inventory Unit</h4>
              <form onSubmit={handleSaveRoom} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Unit Label</Label>
                    <Input required value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} placeholder="e.g. Single Self" className="bg-white rounded-lg border-slate-200 text-sm h-11 shadow-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Price (UGX)</Label>
                    <Input required type="number" min="0" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} placeholder="1,500,000" className="bg-white rounded-lg border-slate-200 text-sm h-11 shadow-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Bed Count / Capacity</Label>
                    <Input required type="number" min="1" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} placeholder="1" className="bg-white rounded-lg border-slate-200 text-sm h-11 shadow-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Media Asset URLs (Comma-separated)</Label>
                    <Input value={newRoom.images} onChange={e => setNewRoom({...newRoom, images: e.target.value})} placeholder="https://room-img.jpg" className="bg-white rounded-lg border-slate-200 text-sm h-11 shadow-sm focus:ring-primary focus:border-primary" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-xs font-semibold text-slate-700">Unit Description</Label>
                    <Textarea value={newRoom.description} onChange={e => setNewRoom({...newRoom, description: e.target.value})} placeholder="Describe specific unit features..." className="bg-white rounded-lg border-slate-200 text-sm resize-none h-24 shadow-sm focus:ring-primary focus:border-primary" />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-200 mt-4 gap-3">
                   {editingRoomId && (
                     <Button type="button" variant="ghost" onClick={() => {
                        setEditingRoomId(null);
                        setNewRoom({ name: "", price: "", capacity: "", description: "", images: "" });
                     }} className="text-slate-600 text-sm font-bold rounded-xl h-11 px-6 hover:bg-slate-100">
                       Cancel Action
                     </Button>
                   )}
                   <Button type="submit" className="bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-xl h-11 px-6 shadow-sm gap-2 transition-transform hover:scale-[1.02]">
                     <Plus className="h-4 w-4" /> {editingRoomId ? "Update Inventory Unit" : "Add Unit"}
                   </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
