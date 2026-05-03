import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface BookingWithRelations {
  id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  hostels: { name: string } | null;
  users: { first_name: string; last_name: string } | null;
}

interface SelectedRoomImage {
  file: File;
  previewUrl: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const formatUGX = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));

const MAX_ROOM_IMAGES = 8;
const ROOM_IMAGE_BUCKET = "room-images";

const buildStoragePath = (hostelId: string, fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `${hostelId}/${id}.${extension}`;
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

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [createdHostelId, setCreatedHostelId] = useState<string | null>(null);

  // Manage Rooms State
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: "", price: "", capacity: "" });
  const roomFileInputRef = useRef<HTMLInputElement>(null);
  const [isRoomDragActive, setIsRoomDragActive] = useState(false);
  const [selectedRoomImages, setSelectedRoomImages] = useState<
    SelectedRoomImage[]
  >([]);
  const selectedRoomImagesRef = useRef<SelectedRoomImage[]>([]);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownedHostelIdsRef = useRef<Set<string>>(new Set());

  // Image editor / reorder state
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomType | null>(null);
  const [editingImages, setEditingImages] = useState<string[]>([]);
  const dragIndexRef = useRef<number | null>(null);

  const bookingTrendData = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-UG", { month: "short" });
    const now = new Date();
    const buckets = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth() + 1}`,
        name: formatter.format(date),
        count: 0,
      };
    });

    bookings.forEach((booking) => {
      const date = new Date(booking.created_at);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const target = buckets.find((bucket) => bucket.key === key);
      if (target) target.count += 1;
    });

    return buckets;
  }, [bookings]);

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
      ownedHostelIdsRef.current = new Set(
        (hostelsData || []).map((hostel) => hostel.id),
      );

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
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const scheduleDataRefresh = useCallback(() => {
    if (
      refreshTimeoutRef.current &&
      typeof refreshTimeoutRef.current === "number"
    ) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, 250);
  }, [fetchData]);

  // Debounce room updates with longer delay to avoid rapid refetches on bulk changes
  const scheduleRoomRefresh = useCallback((hostelId: string) => {
    // Use object-based timeout storage to handle multiple room refresh timers
    if (
      refreshTimeoutRef.current &&
      typeof refreshTimeoutRef.current === "object"
    ) {
      const timeoutKey = `room-${hostelId}`;
      clearTimeout(
        (refreshTimeoutRef.current as Record<string, number>)[timeoutKey],
      );
      (refreshTimeoutRef.current as Record<string, number>)[timeoutKey] =
        window.setTimeout(() => {
          fetchRooms(hostelId);
          delete (refreshTimeoutRef.current as Record<string, number>)[
            timeoutKey
          ];
        }, 500);
    } else {
      // Initialize object-based storage on first use
      refreshTimeoutRef.current = {
        [`room-${hostelId}`]: window.setTimeout(() => {
          fetchRooms(hostelId);
        }, 500),
      } as any;
    }
  }, []);

  const clearSelectedRoomImages = useCallback(() => {
    setSelectedRoomImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
  }, []);

  const removeSelectedRoomImage = useCallback((index: number) => {
    setSelectedRoomImages((prev) => {
      const image = prev[index];
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  }, []);

  useEffect(() => {
    selectedRoomImagesRef.current = selectedRoomImages;
  }, [selectedRoomImages]);

  useEffect(() => {
    return () => {
      selectedRoomImagesRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });

      if (refreshTimeoutRef.current) {
        if (typeof refreshTimeoutRef.current === "number") {
          clearTimeout(refreshTimeoutRef.current);
        } else {
          // Clear all debounce timers stored in object
          Object.values(refreshTimeoutRef.current).forEach((timeout) => {
            if (typeof timeout === "number") {
              clearTimeout(timeout);
            }
          });
        }
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();

      // Subscribe to real-time changes for owned hostels only
      // Construct channel name with specific hostel IDs to reduce payload scope
      const ownedHostelIds = Array.from(ownedHostelIdsRef.current);
      const bookingChannels = ownedHostelIds
        .map((id) => ({
          event: "*" as const,
          schema: "public",
          table: "bookings",
          filter: `hostel_id=eq.${id}`,
        }))
        .slice(0, 10); // Limit to 10 channels to avoid too many subscriptions

      const bookingsSub = supabase.channel(
        `owner-bookings-${user.id}:${ownedHostelIds.slice(0, 3).join("-")}`,
      );
      bookingChannels.forEach((channelConfig) => {
        bookingsSub.on("postgres_changes", channelConfig, () => {
          scheduleDataRefresh();
        });
      });
      bookingsSub.subscribe();

      const hostelsSub = supabase
        .channel(`public:hostels:owner_id=eq.${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "hostels",
            filter: `owner_id=eq.${user.id}`,
          },
          () => {
            scheduleDataRefresh();
          },
        )
        .subscribe();

      return () => {
        if (refreshTimeoutRef.current) {
          if (typeof refreshTimeoutRef.current === "number") {
            clearTimeout(refreshTimeoutRef.current);
          } else {
            // Clear all debounce timers
            Object.values(refreshTimeoutRef.current).forEach((timeout) => {
              clearTimeout(timeout as any);
            });
          }
        }
        bookingsSub.unsubscribe();
        hostelsSub.unsubscribe();
      };
    }
  }, [user, fetchData, scheduleDataRefresh]);

  // Handle Room Fetching when a hostel is selected
  useEffect(() => {
    if (selectedHostel && isRoomDialogOpen) {
      fetchRooms(selectedHostel.id);

      // Real-time updates for rooms with debouncing to avoid rapid refetches
      const roomsSub = supabase
        .channel(`room-types:hostel_id=eq.${selectedHostel.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_types",
            filter: `hostel_id=eq.${selectedHostel.id}`,
          },
          () => {
            scheduleRoomRefresh(selectedHostel.id);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(roomsSub);
      };
    }
  }, [selectedHostel, isRoomDialogOpen, scheduleRoomRefresh]);

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
    if (!user) {
      toast.error("You must be signed in to add a property.");
      return;
    }

    try {
      setIsCreating(true);

      const imagesArray = newHostel.images
        ? newHostel.images
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean)
        : [];

      const { data, error } = await supabase
        .from("hostels")
        .insert({
          name: newHostel.name,
          university: newHostel.university,
          address: newHostel.address,
          description: newHostel.description,
          price_range: newHostel.price_range,
          images: imagesArray,
          owner_id: user?.id,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      toast.success(
        "Property submitted for super admin approval. Now, let's configure your rooms.",
      );
      setCreatedHostelId(data.id);
      setWizardStep(3);
      fetchData();
    } catch (error: unknown) {
      console.error("handleCreateProperty error:", error);
      toast.error(getErrorMessage(error, "Failed to create property"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleIncomingRoomFiles = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;

    const files = Array.from(incoming);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length !== files.length) {
      toast.error("Only image files are allowed.");
    }

    if (imageFiles.length === 0) return;

    if (selectedRoomImages.length + imageFiles.length > MAX_ROOM_IMAGES) {
      toast.error(`You can attach up to ${MAX_ROOM_IMAGES} images per room.`);
      return;
    }

    const nextImages = imageFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedRoomImages((prev) => [...prev, ...nextImages]);
    toast.success(`${imageFiles.length} room image(s) attached.`);
  };

  const uploadRoomImages = async (hostelId: string) => {
    if (selectedRoomImages.length === 0) {
      return [] as string[];
    }

    const uploadResults = await Promise.all(
      selectedRoomImages.map(async (image) => {
        const objectPath = buildStoragePath(hostelId, image.file.name);
        const { error: uploadError } = await supabase.storage
          .from(ROOM_IMAGE_BUCKET)
          .upload(objectPath, image.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from(ROOM_IMAGE_BUCKET)
          .getPublicUrl(objectPath);

        return data.publicUrl;
      }),
    );

    return uploadResults;
  };

  const handleAddRoom = async (e: React.FormEvent, targetHostelId?: string) => {
    e.preventDefault();
    const hId = targetHostelId || selectedHostel?.id;
    if (!hId) {
      toast.error("Select a property first before adding rooms.");
      return;
    }
    try {
      const roomImagesArray = await uploadRoomImages(hId);
      const { error } = await supabase.from("room_types").insert({
        hostel_id: hId,
        name: newRoom.name,
        price: parseFloat(newRoom.price),
        capacity: parseInt(newRoom.capacity, 10),
        available: parseInt(newRoom.capacity, 10), // Initial available is capacity
        images: roomImagesArray.length > 0 ? roomImagesArray : null,
      });
      if (error) throw error;
      toast.success("Room type added");
      setNewRoom({ name: "", price: "", capacity: "" });
      clearSelectedRoomImages();
      fetchRooms(hId);
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

  // Open image editor with room images preloaded
  const openImageEditor = (room: RoomType) => {
    setEditingRoom(room);
    setEditingImages(room.images ? [...room.images] : []);
    setImageEditorOpen(true);
  };

  const onDragStartImage = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    try {
      e.dataTransfer?.setData("text/plain", String(index));
    } catch {}
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOverImage = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDropImage = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === undefined) return;
    if (fromIndex === targetIndex) return;
    setEditingImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    dragIndexRef.current = null;
  };

  const saveImageOrder = async () => {
    if (!editingRoom || !selectedHostel) return;
    try {
      const payload = editingImages.length > 0 ? editingImages : null;
      const { error } = await supabase
        .from("room_types")
        .update({ images: payload })
        .eq("id", editingRoom.id);
      if (error) throw error;
      toast.success("Saved image order");
      setImageEditorOpen(false);
      fetchRooms(selectedHostel.id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save image order");
    }
  };

  const setImageAsPrimary = (index: number) => {
    if (index === 0) return;
    setEditingImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.unshift(moved);
      return next;
    });
    toast.success("Image set as primary");
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

  const openPropertyWizard = () => {
    if (!user) {
      toast.error("You must be signed in to add a property.");
      return;
    }

    setWizardStep(1);
    setCreatedHostelId(null);
    clearSelectedRoomImages();
    setNewHostel({
      name: "",
      university: "",
      address: "",
      description: "",
      price_range: "",
      images: "",
    });
    setIsWizardOpen(true);
  };

  const openManageRooms = (property: Hostel) => {
    setSelectedHostel(property);
    setIsRoomDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* System Status Bar */}
      <div className="bg-white border-b border-slate-200 py-2 px-4 flex items-center justify-between text-xs font-medium text-slate-600 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span>Server Status: {isLoading ? "Syncing" : "Live"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
            <span>Database Sync: Realtime</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 whitespace-nowrap">
          <span>Profile: {user?.email || "Unknown owner"}</span>
          <span className="text-slate-400">
            {new Date().toISOString().split("T")[0]}
          </span>
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
              <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              <span className="text-sm font-bold text-primary tracking-wide">
                Owner Control Center
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">
              Property Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage your hostel listings, bookings, and revenue from one
              powerful dashboard.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Dialog
              open={isWizardOpen}
              onOpenChange={(open) => {
                setIsWizardOpen(open);
                if (!open) {
                  setWizardStep(1);
                  setCreatedHostelId(null);
                  clearSelectedRoomImages();
                  setNewHostel({
                    name: "",
                    university: "",
                    address: "",
                    description: "",
                    price_range: "",
                    images: "",
                  });
                }
              }}
            >
              <Button
                type="button"
                onClick={openPropertyWizard}
                className="relative z-10 h-12 px-6 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md transition-all font-semibold text-sm flex items-center gap-2 pointer-events-auto"
              >
                <Plus className="h-5 w-5" /> Add New Property
              </Button>
              <DialogContent className="sm:max-w-[600px] rounded-2xl border-0 shadow-2xl p-0 overflow-hidden bg-white">
                <div className="bg-slate-50 border-b border-slate-100 text-slate-900 p-6 relative">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold tracking-tight">
                      {wizardStep === 1 && "Step 1: University Alliance"}
                      {wizardStep === 2 && "Step 2: Property Details"}
                      {wizardStep === 3 && "Step 3: Room Setup"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 text-base">
                      {wizardStep === 1 &&
                        "Link this property to a nearby institution."}
                      {wizardStep === 2 &&
                        "Enter the physical and visual details."}
                      {wizardStep === 3 &&
                        "Configure the available room types."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="absolute top-6 right-6 text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    Step {wizardStep} of 3
                  </div>
                </div>

                <div className="p-6">
                  {wizardStep === 1 && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        setWizardStep(2);
                      }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">
                          Affiliated University
                        </Label>
                        <Input
                          required
                          value={newHostel.university}
                          onChange={(e) =>
                            setNewHostel({
                              ...newHostel,
                              university: e.target.value,
                            })
                          }
                          placeholder="e.g. Makerere University"
                          className="rounded-xl border-slate-200 focus-visible:ring-primary h-12 bg-slate-50"
                        />
                        <p className="text-xs text-slate-500 font-medium">
                          Which university is this hostel primarily serving?
                        </p>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-base shadow-sm"
                        >
                          Continue to Details
                        </Button>
                      </DialogFooter>
                    </form>
                  )}

                  {wizardStep === 2 && (
                    <form onSubmit={handleCreateProperty} className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700">
                            Hostel Name
                          </Label>
                          <Input
                            required
                            value={newHostel.name}
                            onChange={(e) =>
                              setNewHostel({
                                ...newHostel,
                                name: e.target.value,
                              })
                            }
                            placeholder="e.g. City Gateway Hostel"
                            className="rounded-xl border-slate-200 focus-visible:ring-primary h-12 bg-slate-50"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700">
                              Price Range
                            </Label>
                            <Input
                              required
                              value={newHostel.price_range}
                              onChange={(e) =>
                                setNewHostel({
                                  ...newHostel,
                                  price_range: e.target.value,
                                })
                              }
                              placeholder="e.g. 1M - 1.5M UGX/sem"
                              className="rounded-xl border-slate-200 focus-visible:ring-primary h-12 bg-slate-50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <ImageIcon className="h-4 w-4" /> Photos (URLs)
                            </Label>
                            <Input
                              value={newHostel.images}
                              onChange={(e) =>
                                setNewHostel({
                                  ...newHostel,
                                  images: e.target.value,
                                })
                              }
                              placeholder="URL1, URL2 (Comma separated)"
                              className="rounded-xl border-slate-200 focus-visible:ring-primary h-12 bg-slate-50"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700">
                            Address & Location
                          </Label>
                          <Input
                            required
                            value={newHostel.address}
                            onChange={(e) =>
                              setNewHostel({
                                ...newHostel,
                                address: e.target.value,
                              })
                            }
                            placeholder="e.g. Kikoni, Kampala"
                            className="rounded-xl border-slate-200 focus-visible:ring-primary h-12 bg-slate-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-slate-700">
                            Description & Amenities
                          </Label>
                          <Textarea
                            value={newHostel.description}
                            onChange={(e) =>
                              setNewHostel({
                                ...newHostel,
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe your hostel's amenities, security features, and rules..."
                            className="rounded-xl border-slate-200 focus-visible:ring-primary min-h-[100px] bg-slate-50"
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setWizardStep(1)}
                          className="w-1/3 h-12 rounded-xl font-bold text-sm shadow-sm"
                        >
                          Go Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={isCreating}
                          className="w-2/3 h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-sm shadow-sm"
                        >
                          {isCreating ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          ) : null}
                          Save & Continue
                        </Button>
                      </DialogFooter>
                    </form>
                  )}

                  {wizardStep === 3 && (
                    <div className="space-y-6">
                      {rooms.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">
                            Added Rooms
                          </h4>
                          <div className="max-h-[120px] overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                            <Table>
                              <TableBody>
                                {rooms.map((room) => (
                                  <TableRow
                                    key={room.id}
                                    className="hover:bg-slate-50/50"
                                  >
                                      <TableCell className="py-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                            {room.images?.[0] ? (
                                              <img
                                                src={room.images[0]}
                                                alt={room.name}
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                                <ImageIcon className="h-4 w-4" />
                                              </div>
                                            )}
                                          </div>
                                          <span className="min-w-0 truncate text-xs font-bold text-slate-900">
                                            {room.name}
                                          </span>
                                        </div>
                                      </TableCell>
                                    <TableCell className="text-xs py-2 text-slate-500">
                                      {formatUGX(room.price)}
                                    </TableCell>
                                    <TableCell className="text-xs py-2 text-slate-500">
                                      Cap: {room.capacity}
                                    </TableCell>
                                    <TableCell className="text-right py-2">
                                      <Button
                                        onClick={() =>
                                          handleDeleteRoom(room.id)
                                        }
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-rose-500 hover:bg-rose-50 rounded-lg"
                                      >
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

                      <div className="bg-slate-50 p-5 border border-slate-200 rounded-xl">
                        <h4 className="text-sm font-semibold text-slate-900 mb-4">
                          Add Room Type
                        </h4>

                        <div className="flex gap-2 mb-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs h-8 border-slate-200 font-medium text-slate-600 bg-white shadow-sm"
                            onClick={() =>
                              setNewRoom({
                                ...newRoom,
                                name: "Single Room",
                                capacity: "1",
                              })
                            }
                          >
                            Preset: Single
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs h-8 border-slate-200 font-medium text-slate-600 bg-white shadow-sm"
                            onClick={() =>
                              setNewRoom({
                                ...newRoom,
                                name: "Double Room",
                                capacity: "2",
                              })
                            }
                          >
                            Preset: Double
                          </Button>
                        </div>

                        <form
                          onSubmit={(e) =>
                            createdHostelId && handleAddRoom(e, createdHostelId)
                          }
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-600">
                                Type Label
                              </Label>
                              <Input
                                required
                                value={newRoom.name}
                                onChange={(e) =>
                                  setNewRoom({
                                    ...newRoom,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="e.g. Single VIP"
                                className="bg-white rounded-lg border-slate-200 h-10 shadow-sm"
                              />
                            </div>
                            <div className="col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">
                                  Capacity
                                </Label>
                                <Input
                                  required
                                  type="number"
                                  min="1"
                                  value={newRoom.capacity}
                                  onChange={(e) =>
                                    setNewRoom({
                                      ...newRoom,
                                      capacity: e.target.value,
                                    })
                                  }
                                  placeholder="1"
                                  className="bg-white rounded-lg border-slate-200 h-10 shadow-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-600">
                                  Price (UGX)
                                </Label>
                                <Input
                                  required
                                  type="number"
                                  min="0"
                                  value={newRoom.price}
                                  onChange={(e) =>
                                    setNewRoom({
                                      ...newRoom,
                                      price: e.target.value,
                                    })
                                  }
                                  placeholder="0"
                                  className="bg-white rounded-lg border-slate-200 h-10 shadow-sm"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5 text-primary" />{" "}
                                Room Images
                              </Label>
                              <input
                                ref={roomFileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) =>
                                  handleIncomingRoomFiles(e.target.files)
                                }
                              />
                              <div
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setIsRoomDragActive(true);
                                }}
                                onDragLeave={() => setIsRoomDragActive(false)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setIsRoomDragActive(false);
                                  handleIncomingRoomFiles(e.dataTransfer.files);
                                }}
                                className={cn(
                                  "rounded-xl border border-dashed p-3 text-center transition-colors",
                                  isRoomDragActive
                                    ? "border-primary bg-primary/5"
                                    : "border-slate-300 bg-white",
                                )}
                              >
                                <p className="text-xs text-slate-600 mb-2">
                                  Drag and drop room images here
                                </p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={() =>
                                    roomFileInputRef.current?.click()
                                  }
                                >
                                  Choose From Files
                                </Button>
                              </div>
                              {selectedRoomImages.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                  {selectedRoomImages.map((image, idx) => (
                                    <div
                                      key={`${idx}-${image.previewUrl.slice(0, 30)}`}
                                      className="relative rounded-md overflow-hidden border border-slate-200"
                                    >
                                      <img
                                        src={image.previewUrl}
                                        alt={`room-upload-${idx + 1}`}
                                        className="h-14 w-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white text-[10px]"
                                        onClick={() =>
                                          removeSelectedRoomImage(idx)
                                        }
                                      >
                                        x
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg h-9 px-4 shadow-sm"
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add Room Type
                            </Button>
                          </div>
                        </form>
                      </div>

                      <DialogFooter className="mt-8 border-t border-slate-100 pt-6">
                        <Button
                          onClick={() => {
                            clearSelectedRoomImages();
                            setIsWizardOpen(false);
                          }}
                          className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base shadow-md"
                        >
                          Finish Setup
                        </Button>
                      </DialogFooter>
                    </div>
                  )}
                </div>
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
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                label: "Active Properties",
                value: properties.filter((p) => p.status === "approved").length,
                icon: Building,
                color: "text-indigo-600",
                bg: "bg-indigo-100",
              },
              {
                label: "Pending Reviews",
                value: properties.filter((p) => p.status === "pending").length,
                icon: Clock,
                color: "text-amber-600",
                bg: "bg-amber-100",
              },
              {
                label: "Total Bookings",
                value: bookings.length,
                icon: Users,
                color: "text-emerald-600",
                bg: "bg-emerald-100",
              },
              {
                label: "Pending Requests",
                value: bookings.filter((b) => b.status === "pending").length,
                icon: ShieldAlert,
                color: "text-rose-600",
                bg: "bg-rose-100",
              },
            ].map((stat, i) => (
              <Card
                key={i}
                className="rounded-2xl border border-slate-200/60 shadow-md bg-white hover:shadow-lg transition-all"
              >
                <CardContent className="p-6 flex items-center gap-5">
                  <div className={cn("p-4 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("h-7 w-7", stat.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="rounded-2xl border border-slate-200/60 shadow-md bg-white flex flex-col justify-between">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-sm font-semibold text-slate-500">
                  Booking Trend (Last 6 Months)
                </CardDescription>
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 mt-2">
                {bookings.length}{" "}
                <span className="text-base text-slate-500 font-medium">
                  Total Bookings
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow pt-4">
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bookingTrendData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#f97316"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f97316"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#f97316"
                      fillOpacity={1}
                      fill="url(#colorRev)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex items-center justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                <span>{bookingTrendData[0]?.name || "-"}</span>
                <span>
                  {bookingTrendData[bookingTrendData.length - 1]?.name || "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="properties" className="space-y-8">
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-full overflow-x-auto flex-nowrap">
            <TabsTrigger
              value="properties"
              className="rounded-lg px-5 sm:px-8 py-3 text-sm font-semibold whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-slate-600"
            >
              <Home className="h-4 w-4 mr-2" /> Inventory
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="rounded-lg px-5 sm:px-8 py-3 text-sm font-semibold whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-slate-600"
            >
              <Users className="h-4 w-4 mr-2" /> Booking Logs
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-lg px-5 sm:px-8 py-3 text-sm font-semibold whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-slate-600"
            >
              <Settings className="h-4 w-4 mr-2" /> System Config
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
                <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-md overflow-hidden">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-900">
                          Property Inventory
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-medium">
                          Manage your listed hostel profiles.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="py-20 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <span className="text-sm font-medium text-slate-500">
                          Fetching Data...
                        </span>
                      </div>
                    ) : properties.length === 0 ? (
                      <div className="py-20 text-center">
                        <p className="text-sm font-medium text-slate-500">
                          No Properties Registered
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="text-xs font-semibold text-slate-600 h-12">
                              Property Name
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 h-12">
                              Institution Affiliation
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 h-12">
                              System Status
                            </TableHead>
                            <TableHead className="text-right text-xs font-semibold text-slate-600 h-12 pr-8">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {properties.map((property) => (
                            <TableRow
                              key={property.id}
                              className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                            >
                              <TableCell className="py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-900">
                                    {property.name}
                                  </span>
                                  <span className="text-xs text-slate-500 mt-0.5">
                                    {property.address}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm font-medium text-slate-600">
                                {property.university}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "rounded-md text-xs font-semibold px-2.5 py-1 border shadow-sm",
                                    property.status === "approved" &&
                                      "bg-emerald-50 text-emerald-700 border-emerald-200",
                                    property.status === "pending" &&
                                      "bg-amber-50 text-amber-700 border-amber-200",
                                    property.status === "rejected" &&
                                      "bg-rose-50 text-rose-700 border-rose-200",
                                  )}
                                >
                                  {property.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                <Button
                                  type="button"
                                  className="bg-primary hover:bg-primary/90 text-white rounded-lg shadow-md text-sm font-bold px-4 py-2 transition-all hover:scale-105"
                                  onClick={() => openManageRooms(property)}
                                >
                                  <LayoutDashboard className="h-4 w-4 mr-2" />
                                  Rooms
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
                <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-md overflow-hidden">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-lg font-bold text-slate-900">
                      Booking Request Logs
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium">
                      Review and process student applications.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="py-20 flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                        <span className="text-sm font-medium text-slate-500">
                          Fetching Data...
                        </span>
                      </div>
                    ) : bookings.length === 0 ? (
                      <div className="py-20 text-center">
                        <p className="text-sm font-medium text-slate-500">
                          No Booking Records Found
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="text-xs font-semibold text-slate-600 h-12">
                              Student Name
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 h-12">
                              Target Property
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-slate-600 h-12">
                              Status
                            </TableHead>
                            <TableHead className="text-right text-xs font-semibold text-slate-600 h-12 pr-8">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.map((booking) => (
                            <TableRow
                              key={booking.id}
                              className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                            >
                              <TableCell className="py-4">
                                <span className="text-sm font-bold text-slate-900">
                                  {booking.users
                                    ? `${booking.users.first_name} ${booking.users.last_name}`
                                    : "Anonymous Student"}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm font-medium text-slate-600">
                                {booking.hostels?.name}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={cn(
                                    "rounded-md text-xs font-semibold px-2.5 py-1 border shadow-sm",
                                    booking.status === "approved" &&
                                      "bg-emerald-50 text-emerald-700 border-emerald-200",
                                    booking.status === "pending" &&
                                      "bg-amber-50 text-amber-700 border-amber-200",
                                    booking.status === "rejected" &&
                                      "bg-rose-50 text-rose-700 border-rose-200",
                                  )}
                                >
                                  {booking.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right pr-8">
                                {booking.status === "pending" ? (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() =>
                                        handleUpdateBookingStatus(
                                          booking.id,
                                          "approved",
                                        )
                                      }
                                      variant="outline"
                                      size="sm"
                                      className="rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all text-xs font-semibold"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleUpdateBookingStatus(
                                          booking.id,
                                          "rejected",
                                        )
                                      }
                                      variant="outline"
                                      size="sm"
                                      className="rounded-lg border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-all text-xs font-semibold"
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-semibold text-slate-500">
                                    Processed
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
                <Card className="rounded-2xl border border-slate-200/60 bg-white shadow-md">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-lg font-bold text-slate-900">
                      System Configuration
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium">
                      Manage your owner profile and payout settings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div className="p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
                      <Wallet className="h-12 w-12 text-slate-400 mb-4" />
                      <h4 className="text-sm font-bold text-slate-900 mb-1">
                        Financial Integration Pending
                      </h4>
                      <p className="text-sm text-slate-500 font-medium max-w-xs">
                        Payout via Mobile Money configuration is currently in
                        development.
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
      <Dialog
        open={isRoomDialogOpen}
        onOpenChange={(open) => {
          setIsRoomDialogOpen(open);
          if (!open) {
            setIsRoomDragActive(false);
            clearSelectedRoomImages();
            setNewRoom({ name: "", price: "", capacity: "" });
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 rounded-2xl border-0 shadow-2xl bg-white fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw]">
          <div className="bg-slate-50 border-b border-slate-100 text-slate-900 p-6 relative">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Room Inventory Control
              </DialogTitle>
              <DialogDescription className="text-slate-500 text-base font-medium">
                Managing: {selectedHostel?.name}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-primary" /> Active
                  Room Types
                </h4>
                {isLoadingRooms ? (
                  <div className="py-10 flex flex-col items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                    <span className="text-xs font-semibold text-slate-500">
                      Syncing Data...
                    </span>
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="p-12 border border-dashed border-slate-300 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 text-center">
                    <LayoutDashboard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-600 mb-1">
                      No Rooms Yet
                    </p>
                    <p className="text-xs text-slate-500">
                      Add your first room type below to get started.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs font-semibold text-slate-600 h-10">
                            Room Type
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 h-10">
                            Price (UGX)
                          </TableHead>
                          <TableHead className="text-xs font-semibold text-slate-600 h-10">
                            Capacity
                          </TableHead>
                          <TableHead className="text-right text-xs font-semibold text-slate-600 h-10 pr-4">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rooms.map((room) => (
                          <TableRow
                            key={room.id}
                            className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0 transition-colors"
                          >
                            <TableCell className="text-sm font-semibold text-slate-900">
                              {room.name}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {formatUGX(room.price)}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                              {room.capacity}
                            </TableCell>
                            <TableCell className="text-right pr-4 flex items-center justify-end gap-2">
                              <Button
                                onClick={() => openImageEditor(room)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"
                                title="Edit photos"
                              >
                                <ImageIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteRoom(room.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
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

              <div className="bg-slate-50 p-6 border border-slate-200 rounded-2xl shadow-sm">
                <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" /> Add New Room
                  Configuration
                </h4>
                <form
                  onSubmit={handleAddRoom}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end"
                >
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs font-semibold text-slate-600">
                      Room Label
                    </Label>
                    <Input
                      required
                      value={newRoom.name}
                      onChange={(e) =>
                        setNewRoom({ ...newRoom, name: e.target.value })
                      }
                      placeholder="e.g. Single Self-Contained"
                      className="rounded-lg border-slate-200 text-sm h-10 bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">
                      Price (UGX)
                    </Label>
                    <Input
                      required
                      type="number"
                      min="0"
                      value={newRoom.price}
                      onChange={(e) =>
                        setNewRoom({ ...newRoom, price: e.target.value })
                      }
                      placeholder="1500000"
                      className="rounded-lg border-slate-200 text-sm h-10 bg-white shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">
                      Capacity
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        required
                        type="number"
                        min="1"
                        value={newRoom.capacity}
                        onChange={(e) =>
                          setNewRoom({ ...newRoom, capacity: e.target.value })
                        }
                        placeholder="1"
                        className="rounded-lg border-slate-200 text-sm h-10 bg-white shadow-sm"
                      />
                      <Button
                        type="submit"
                        className="shrink-0 bg-primary hover:bg-primary/90 text-white rounded-lg h-10 w-10 p-0 shadow-sm transition-transform hover:scale-105"
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

      {/* Image Editor Dialog */}
      <Dialog
        open={imageEditorOpen}
        onOpenChange={(open) => {
          setImageEditorOpen(open);
          if (!open) {
            setEditingRoom(null);
            setEditingImages([]);
            dragIndexRef.current = null;
          }
        }}
      >
        <DialogContent className="max-w-2xl p-0 rounded-2xl border-0 shadow-2xl bg-white">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Edit Room Photos</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Drag to reorder or click "Set as Primary" to choose the listing thumbnail.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {!editingRoom ? (
                <div className="py-8 text-center text-sm text-slate-500">No room selected.</div>
              ) : editingImages.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No photos for this room.</div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-3">
                    {editingImages.map((src, idx) => (
                      <div
                        key={`${src}-${idx}`}
                        draggable
                        onDragStart={(e) => onDragStartImage(e, idx)}
                        onDragOver={onDragOverImage}
                        onDrop={(e) => onDropImage(e, idx)}
                        className={cn("relative rounded-md overflow-hidden group", idx === 0 ? "ring-2 ring-primary" : "border border-slate-200")}
                      >
                        <img src={src} alt={`photo-${idx + 1}`} className="h-28 w-full object-cover" />
                        {idx === 0 && (
                          <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            ✨ Primary
                          </div>
                        )}
                        <div className="absolute left-1 top-1 text-[11px] bg-black/50 text-white px-2 py-0.5 rounded font-semibold">{idx + 1}</div>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => setImageAsPrimary(idx)}
                            className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold"
                          >
                            Set as Primary
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 font-medium text-center">The first image appears in hostel listings. Drag to reorder or click "Set as Primary" above.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setImageEditorOpen(false)}
                className="h-10"
              >
                Cancel
              </Button>
              <Button type="button" className="h-10" onClick={saveImageOrder}>
                Save Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
