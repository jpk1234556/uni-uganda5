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
  { id: "wifi", label: "Free Wi-Fi", keywords: ["wifi", "wi-fi", "internet", "network"], icon: Wifi },
  { id: "security", label: "24/7 Security", keywords: ["security", "guard", "cctv", "safe"], icon: Shield },
  { id: "power", label: "Backup Generator", keywords: ["power", "generator", "backup", "electricity"], icon: Zap },
  { id: "parking", label: "Parking Space", keywords: ["parking", "garage", "car"], icon: Car },
];

interface HostelWithRooms extends Hostel {
  room_types?: {
    name?: string;
    price: number;
    available: number;
    capacity?: number;
  }[];
}

type SortOption = "newest" | "price-asc" | "price-desc" | "rating-desc";

const parseListingPrice = (value: string | null | undefined) => {
  if (!value) return Infinity;

  const numbers = value
    .toString()
    .replace(/,/g, "")
    .match(/\d+(?:\.\d+)?/g);

  if (!numbers || numbers.length === 0) return Infinity;

  return Number(numbers[0]);
};

const getListingMinPrice = (hostel: HostelWithRooms) => {
  const roomPrices =
    hostel.room_types
      ?.map((room) => room.price || Infinity)
      .filter((price) => price !== Infinity) || [];

  if (roomPrices.length > 0) {
    return Math.min(...roomPrices);
  }

  return parseListingPrice(hostel.price_range);
};

const comparePrices = (left: number, right: number, ascending: boolean) => {
  const leftMissing = left === Infinity;
  const rightMissing = right === Infinity;

  if (leftMissing && rightMissing) return 0;
  if (leftMissing) return 1;
  if (rightMissing) return -1;

  return ascending ? left - right : right - left;
};

const matchesAmenities = (
  hostel: HostelWithRooms,
  selectedAmenities: string[],
) => {
  if (selectedAmenities.length === 0) return true;

  const hAmenities = (hostel.amenities || [])
    .map((amenity) => amenity.toLowerCase())
    .filter(Boolean);

  if (hAmenities.length === 0) {
    return false;
  }

  return selectedAmenities.every((selectedId) => {
    const amenityDef = AMENITIES.find(a => a.id === selectedId);
    if (!amenityDef) return false;

    // Check if any of the hostel's amenities contain any of our keywords
    return hAmenities.some(ha => 
      amenityDef.keywords.some(kw => ha.includes(kw))
    );
  });
};

export default function Search() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000000]);
  const [minRating, setMinRating] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedRoomType, setSelectedRoomType] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
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
        .select("*, room_types(name, price, available, capacity)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn(
          "Primary fetch in Search failed, trying fallback...",
          error,
        );
        const fallback = await supabase
          .from("hostels")
          .select("*")
          .eq("status", "approved");

        if (fallback.error) {
          console.error("Fallback fetch also failed:", fallback.error);
        } else {
          setHostels((fallback.data as HostelWithRooms[]) || []);
        }
      } else {
        setHostels((data as HostelWithRooms[]) || []);
      }
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
      !(hostel.name || "").toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(hostel.university || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) &&
      !(hostel.address || "").toLowerCase().includes(searchTerm.toLowerCase())
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
    if (!matchesAmenities(hostel, selectedAmenities)) {
      return false;
    }

    // Room Type / Category Match
    if (selectedRoomType !== "all") {
      const targetRoomType = selectedRoomType.toLowerCase();
      const hasRoomType = (hostel.room_types || []).some((room) =>
        (room.name || "").toLowerCase().includes(targetRoomType),
      );
      if (!hasRoomType) {
        return false;
      }
    }

    // Availability Match
    if (availabilityFilter === "available-only") {
      const hasAvailability = (hostel.room_types || []).some(
        (room) => (room.available || 0) > 0,
      );
      if (!hasAvailability) {
        return false;
      }
    }

    // Rating Match
    if (minRating > 0 && (hostel.rating || 0) < minRating) {
      return false;
    }

    // Price Match
    const listingPrice = getListingMinPrice(hostel);
    if (listingPrice !== Infinity) {
      if (listingPrice < priceRange[0] || (priceRange[1] < 10000000 && listingPrice > priceRange[1])) {
        return false;
      }
    }

    return true;
  });

  const sortedHostels = [...filteredHostels].sort((a, b) => {
    if (sortBy === "price-asc") {
      return comparePrices(getListingMinPrice(a), getListingMinPrice(b), true);
    }
    if (sortBy === "price-desc") {
      return comparePrices(getListingMinPrice(a), getListingMinPrice(b), false);
    }
    if (sortBy === "rating-desc") {
      return (b.rating || 0) - (a.rating || 0);
    }
    // Default: newest (created_at desc)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const roomTypeOptions = Array.from(
    new Set(
      hostels
        .flatMap((hostel) => hostel.room_types || [])
        .map((room) => room.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const activeFilters = [
    searchTerm,
    selectedUniversity !== "all" ? selectedUniversity : null,
    selectedRoomType !== "all" ? selectedRoomType : null,
    availabilityFilter === "available-only" ? "Available now" : null,
    minRating > 0 ? `${minRating}+ stars` : null,
    selectedAmenities.length > 0
      ? `${selectedAmenities.length} amenities`
      : null,
  ].filter(Boolean) as string[];

  const resetFilters = () => {
    setSearchTerm("");
    setPriceRange([0, 10000000]);
    setMinRating(0);
    setSelectedAmenities([]);
    setSelectedRoomType("all");
    setAvailabilityFilter("all");
    setSelectedUniversity("all");
    setSortBy("newest");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in zoom-in-95 duration-500">
      <div className="rounded-[28px] border border-slate-300/80 bg-white/96 backdrop-blur-lg p-4 sm:p-6 lg:p-8 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full lg:w-1/4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-300 sticky top-20">
              <h3 className="font-black text-2xl text-slate-900 mb-6 tracking-tight flex items-center gap-2">
                Filters
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900">
                    University / Area
                  </label>
                  <Select
                    value={selectedUniversity}
                    onValueChange={setSelectedUniversity}
                  >
                    <SelectTrigger className="w-full h-11 bg-white text-slate-900 border-slate-300">
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
                    <label className="text-sm font-bold text-slate-900">
                      Price Range (UGX)
                    </label>
                    <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {priceRange[0] === 0 ? "0" : `${priceRange[0] / 1000}k`} - {priceRange[1] >= 10000000 ? "10M+" : `${priceRange[1] / 1000}k`}
                    </span>
                  </div>
                  <Slider
                    defaultValue={[0, 10000000]}
                    max={10000000}
                    min={0}
                    step={50000}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="py-4"
                  />
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <label className="text-sm font-bold text-slate-900">
                    Minimum Rating
                  </label>
                  <Select
                    value={minRating.toString()}
                    onValueChange={(v) => setMinRating(Number(v))}
                  >
                    <SelectTrigger className="w-full h-11 bg-white text-slate-900 border-slate-300">
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
                  <label className="text-sm font-bold text-slate-900">
                    Amenities
                  </label>
                  {AMENITIES.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={amenity.id}
                        checked={selectedAmenities.includes(amenity.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAmenities([
                              ...selectedAmenities,
                              amenity.id,
                            ]);
                          } else {
                            setSelectedAmenities(
                              selectedAmenities.filter(
                                (a) => a !== amenity.id,
                              ),
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={amenity.id}
                        className="text-sm font-semibold text-slate-800 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <amenity.icon className="h-4 w-4 text-slate-500" />
                        {amenity.label}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <label className="text-sm font-bold text-slate-900">
                    Room Type / Category
                  </label>
                  <Select
                    value={selectedRoomType}
                    onValueChange={setSelectedRoomType}
                  >
                    <SelectTrigger className="w-full h-11 bg-white text-slate-900 border-slate-300">
                      <SelectValue placeholder="Any room type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-xl z-50 border border-slate-200 max-h-72">
                      <SelectItem value="all">All room types</SelectItem>
                      {roomTypeOptions.map((roomType) => (
                        <SelectItem key={roomType} value={roomType}>
                          {roomType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <label className="text-sm font-bold text-slate-900">
                    Availability
                  </label>
                  <Select
                    value={availabilityFilter}
                    onValueChange={setAvailabilityFilter}
                  >
                    <SelectTrigger className="w-full h-11 bg-white text-slate-900 border-slate-300">
                      <SelectValue placeholder="All hostels" />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-xl z-50 border border-slate-200">
                      <SelectItem value="all">All hostels</SelectItem>
                      <SelectItem value="available-only">
                        Available now
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold py-6 text-base rounded-xl transition-all"
                onClick={resetFilters}
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
                  className="pl-10 h-12 text-base rounded-xl shadow-sm bg-white border-slate-300 placeholder:text-slate-500 text-slate-900 focus-visible:ring-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button className="h-12 px-8 rounded-xl shadow-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold sm:w-auto w-full transition-all">
                Search
              </Button>
            </div>

            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">
                  Available Hostels
                </h2>
                <p className="text-slate-600 font-medium text-lg mt-1">
                  Showing <span className="font-bold text-indigo-600">{filteredHostels.length}</span> available properties
                </p>
                {activeFilters.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeFilters.map((filter) => (
                      <span
                        key={filter}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {filter}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Sort by:
                </span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] h-11 bg-white border-slate-300 text-slate-900">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-white shadow-xl z-50 border border-slate-200">
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-asc">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-desc">
                      Price: High to Low
                    </SelectItem>
                    <SelectItem value="rating-desc">Highest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 flex justify-center items-center flex-col gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-slate-700 font-semibold">
                  Fetching live availability...
                </p>
              </div>
            ) : filteredHostels.length === 0 ? (
              <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                <div className="bg-white h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                  <SearchIcon className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No properties found</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  className="mt-6 rounded-xl border-slate-300 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedHostels.map((hostel) => (
                  <Link to={`/hostel/${hostel.id}`} key={hostel.id}>
                    <Card className="overflow-hidden bg-white border-slate-300 hover:border-primary/50 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-lg">
                      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                        {hostel.images?.[0] ? (
                          <img
                            src={hostel.images[0]}
                            alt={hostel.name}
                            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 font-semibold bg-slate-100">
                            No image uploaded
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold shadow-sm flex items-center gap-1 text-slate-900">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          {(hostel.rating || 0) > 0 ? hostel.rating : "-"}
                        </div>
                        <div className="absolute bottom-4 left-4 bg-primary/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                          {hostel.price_range || "Price not set"}
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
                        <div className="flex items-center text-slate-700 mb-4 text-sm font-medium">
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
                              No amenities listed
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
