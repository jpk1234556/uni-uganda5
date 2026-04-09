import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchIcon,
  MapPin,
  Wifi,
  Shield,
  Zap,
  Car,
  Star,
  Heart,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Hostel } from "@/types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const AMENITIES = [
  { id: "wifi", label: "Free Wi-Fi", icon: Wifi },
  { id: "security", label: "24/7 Security", icon: Shield },
  { id: "power", label: "Backup Generator", icon: Zap },
  { id: "parking", label: "Parking Space", icon: Car },
];

interface HostelWithRooms extends Hostel {
  room_types?: { price: number }[];
}

export default function Search() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState([300000, 3000000]);
  const [minRating, setMinRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [universities, setUniversities] = useState<string[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all");

  const [hostels, setHostels] = useState<HostelWithRooms[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("hostel_id")
        .eq("student_id", user?.id);

      if (error) throw error;
      setFavorites(data.map((f) => f.hostel_id));
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  }, [user]);

  const fetchUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from("universities")
        .select("name")
        .order("name", { ascending: true });

      if (error) {
        // Fallback to deriving from hostels if universities table doesn't exist yet
        const { data: hostelData, error: hostelError } = await supabase
          .from("hostels")
          .select("university")
          .eq("status", "approved");

        if (hostelError) throw hostelError;
        const uniqueUnis = Array.from(
          new Set(hostelData.map((h) => h.university).filter(Boolean)),
        );
        setUniversities(uniqueUnis as string[]);
        return;
      }

      setUniversities(data.map((u) => u.name));
    } catch (error) {
      console.error("Error fetching universities:", error);
    }
  };

  useEffect(() => {
    fetchApprovedHostels();
    fetchUniversities();
    if (user) {
      fetchFavorites();
    }
  }, [user, fetchFavorites]);

  const toggleFavorite = async (e: React.MouseEvent, hostelId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please login to save hostels");
      return;
    }

    const isFavorite = favorites.includes(hostelId);

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("student_id", user.id)
          .eq("hostel_id", hostelId);

        if (error) throw error;
        setFavorites((prev) => prev.filter((id) => id !== hostelId));
        toast.success("Removed from saved hostels");
      } else {
        const { error } = await supabase.from("favorites").insert({
          student_id: user.id,
          hostel_id: hostelId,
        });

        if (error) throw error;
        setFavorites((prev) => [...prev, hostelId]);
        toast.success("Saved to your favorites!");
      }
    } catch (error) {
      toast.error("Failed to update favorites");
      console.error(error);
    }
  };

  const fetchApprovedHostels = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("hostels")
        .select("*, room_types(price)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHostels((data as HostelWithRooms[]) || []);
    } catch (error) {
      console.error("Error fetching hostels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHostels = hostels.filter((hostel) => {
    // Name or Location Match
    if (
      searchTerm &&
      !hostel.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // University Match
    if (selectedUniversity !== "all") {
      const su = selectedUniversity.toLowerCase();
      const hu = (hostel.university || "").toLowerCase();
      if (hu !== su && !su.includes(hu) && !hu.includes(su)) {
        return false;
      }
    }

    // Amenities Match
    if (selectedAmenities.length > 0) {
      const hAmenities = (hostel.amenities || []).map((a: string) =>
        a.toLowerCase(),
      );
      const hasAllAmenities = selectedAmenities.every((a) =>
        hAmenities.some((ha: string) => ha.includes(a.toLowerCase())),
      );
      if (!hasAllAmenities) return false;
    }

    // Rating Match
    if (minRating > 0 && (hostel.rating || 0) < minRating) {
      return false;
    }

    // Price Match
    if (hostel.room_types && hostel.room_types.length > 0) {
      const minHostelPrice = Math.min(...hostel.room_types.map((r) => r.price));
      if (minHostelPrice < priceRange[0] || minHostelPrice > priceRange[1]) {
        return false;
      }
    } else if (priceRange[0] > 300000) {
      // If no rooms listed, but user is looking for a specific range, hide it?
      // Or just show it if it's within a default range.
      // For now, let's just filter if we have room data.
    }

    return true;
  });

  const sortedHostels = [...filteredHostels].sort((a, b) => {
    if (sortBy === "price-asc") {
      const minA =
        a.room_types && a.room_types.length > 0
          ? Math.min(...a.room_types.map((r) => r.price))
          : Infinity;
      const minB =
        b.room_types && b.room_types.length > 0
          ? Math.min(...b.room_types.map((r) => r.price))
          : Infinity;
      return minA - minB;
    }
    if (sortBy === "price-desc") {
      const minA =
        a.room_types && a.room_types.length > 0
          ? Math.min(...a.room_types.map((r) => r.price))
          : -Infinity;
      const minB =
        b.room_types && b.room_types.length > 0
          ? Math.min(...b.room_types.map((r) => r.price))
          : -Infinity;
      return minB - minA;
    }
    if (sortBy === "rating-desc") {
      return (b.rating || 0) - (a.rating || 0);
    }
    // Default: newest (created_at desc)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in zoom-in-95 duration-500">
      <div className="rounded-[28px] border border-slate-200/80 bg-white/88 backdrop-blur-md p-4 sm:p-6 lg:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-1/4 space-y-6">
          <div className="bg-white/95 p-6 rounded-2xl shadow-md border border-slate-200 sticky top-20">
            <h3 className="font-bold text-lg text-slate-900 mb-4 tracking-tight">Filters</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">University / Area</label>
                <Select
                  value={selectedUniversity}
                  onValueChange={setSelectedUniversity}
                >
                  <SelectTrigger className="w-full bg-white text-slate-900 border-slate-200">
                    <SelectValue placeholder="Select University" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-xl z-50 border border-slate-200">
                    <SelectItem value="all">All Universities</SelectItem>
                    {universities.map((uni) => (
                      <SelectItem key={uni} value={uni}>
                        {uni}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-800">
                    Price Range (UGX)
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {priceRange[0] / 1000}k - {priceRange[1] / 1000}k
                  </span>
                </div>
                <Slider
                  defaultValue={[300000, 3000000]}
                  max={3000000}
                  min={300000}
                  step={50000}
                  value={priceRange}
                  onValueChange={setPriceRange}
                  className="py-4"
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200">
                <label className="text-sm font-semibold text-slate-800">Minimum Rating</label>
                <Select
                  value={minRating.toString()}
                  onValueChange={(v) => setMinRating(Number(v))}
                >
                  <SelectTrigger className="w-full bg-white text-slate-900 border-slate-200">
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-xl z-50 border border-slate-200">
                    <SelectItem value="0">Any Rating</SelectItem>
                    <SelectItem value="3">3+ Stars</SelectItem>
                    <SelectItem value="4">4+ Stars</SelectItem>
                    <SelectItem value="4.5">4.5+ Stars</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <label className="text-sm font-semibold text-slate-800">Amenities</label>
                {AMENITIES.map((amenity) => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity.id}
                      checked={selectedAmenities.includes(amenity.label)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedAmenities([
                            ...selectedAmenities,
                            amenity.label,
                          ]);
                        } else {
                          setSelectedAmenities(
                            selectedAmenities.filter(
                              (a) => a !== amenity.label,
                            ),
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={amenity.id}
                      className="text-sm font-medium text-slate-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                    >
                      <amenity.icon className="h-4 w-4 text-muted-foreground" />
                      {amenity.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full mt-8 bg-gradient-primary text-white hover:opacity-90 shadow-md font-semibold"
              onClick={() => {
                setSearchTerm("");
                setPriceRange([300000, 3000000]);
                setMinRating(0);
                setSelectedAmenities([]);
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>

        {/* Results Area */}
        <div className="w-full lg:w-3/4">
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by hostel name or university..."
                className="pl-10 h-12 text-base rounded-xl shadow-sm bg-white border-slate-200 text-slate-900 focus-visible:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button className="h-12 px-8 rounded-xl shadow-md bg-gradient-primary hover:opacity-90 text-white font-semibold sm:w-auto w-full">
              Search
            </Button>
          </div>

          <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">Available Hostels</h2>
              <p className="text-slate-600 font-medium">
                Showing {filteredHostels.length} available properties
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                Sort by:
              </span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-white border-slate-200 text-slate-900">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-xl z-50 border border-slate-200">
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating-desc">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center items-center flex-col gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Fetching live availability...
              </p>
            </div>
          ) : filteredHostels.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-300 rounded-xl bg-white/90">
              <p className="text-slate-600 text-lg font-medium">
                No properties match your current filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedHostels.map((hostel) => (
                <Link to={`/hostel/${hostel.id}`} key={hostel.id}>
                  <Card className="overflow-hidden bg-white border-slate-200 hover:border-primary/40 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-lg">
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                      <img
                        src={
                          hostel.images?.[0] ||
                          `https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=800`
                        }
                        alt={hostel.name}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center gap-1 text-slate-800">
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        {(hostel.rating || 0) > 0 ? hostel.rating : "New"}
                      </div>
                      <div className="absolute bottom-4 left-4 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                        {hostel.price_range || "Contact for price"}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "absolute top-4 left-4 rounded-full backdrop-blur-md transition-all",
                          favorites.includes(hostel.id)
                            ? "bg-rose-500 text-white hover:bg-rose-600"
                            : "bg-black/50 text-white hover:bg-black/70",
                        )}
                        onClick={(e) => toggleFavorite(e, hostel.id)}
                      >
                        <Heart
                          className={cn(
                            "h-5 w-5",
                            favorites.includes(hostel.id) && "fill-current",
                          )}
                        />
                      </Button>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-xl text-slate-900 group-hover:text-primary transition-colors line-clamp-1">
                          {hostel.name}
                        </h3>
                      </div>
                      <div className="flex items-center text-slate-500 mb-4 text-sm">
                        <MapPin className="h-4 w-4 mr-1 shrink-0" />
                        <span className="line-clamp-1">
                          {hostel.address || hostel.university}
                        </span>
                      </div>
                      <div className="flex gap-2 mb-1 flex-wrap">
                        {hostel.amenities?.slice(0, 3).map((amenity, i) => (
                          <span
                            key={i}
                            className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md whitespace-nowrap"
                          >
                            {amenity}
                          </span>
                        )) || (
                          <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md">
                            Basic Amenities
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
