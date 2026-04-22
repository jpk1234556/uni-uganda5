import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  MapPin,
  Star,
  Building,
  CheckCircle,
  Navigation,
  Loader2,
  ArrowLeft,
  Users,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { Hostel, RoomType } from "@/types";
import { toast } from "sonner";

interface HostelWithOwner extends Hostel {
  users?: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

interface ReviewWithUser {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  users?: {
    first_name: string;
    last_name: string;
  } | null;
}

interface RoomRealtimePayload {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Partial<RoomType> & { id: string };
  old: { id: string };
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const shouldFallbackToLegacyBooking = (message: string) =>
  /create_checkout_intent_from_cart|finalize_booking_intent|booking_cart_items|booking_intents|inventory_holds|phase25|42P01|PGRST202|function/i.test(
    message,
  );

const formatUGX = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));

export default function HostelDetail() {
  const { id } = useParams();
  const { user, dbUser } = useAuth();
  const navigate = useNavigate();

  const [hostel, setHostel] = useState<HostelWithOwner | null>(null);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Booking State
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    phone_number: "",
    course: "",
    move_in_date: "",
    next_of_kin: "",
    sponsor: "",
    origin: "",
    medical_history: "",
  });

  // Review State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  const fetchHostelData = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      // Fetch Hostel
      const { data: hostelData, error: hostelError } = await supabase
        .from("hostels")
        .select("*, users(first_name, last_name, email)")
        .eq("id", id)
        .eq("status", "approved")
        .single();

      if (hostelError) {
        const code = (hostelError as { code?: string }).code;
        if (code === "PGRST116") {
          toast.error("This listing is not available to students.");
          navigate("/search");
          return;
        }
        throw hostelError;
      }
      setHostel(hostelData as HostelWithOwner);

      // Fetch Rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from("room_types")
        .select("*")
        .eq("hostel_id", id)
        .order("price", { ascending: true });

      if (roomsError) throw roomsError;

      setRooms((roomsData as RoomType[]) || []);

      // Fetch Reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*, users!reviews_student_id_fkey(first_name, last_name)")
        .eq("hostel_id", id)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;

      setReviews((reviewsData as ReviewWithUser[]) || []);
    } catch (error) {
      toast.error("Failed to load hostel details");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      fetchHostelData();

      // Realtime subscription for rooms
      const roomsSubscription = supabase
        .channel(`public:room_types:hostel_id=eq.${id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "room_types",
            filter: `hostel_id=eq.${id}`,
          },
          (payload: RoomRealtimePayload) => {
            if (payload.eventType === "UPDATE") {
              setRooms((currentRooms) =>
                currentRooms.map((room) =>
                  room.id === payload.new.id
                    ? { ...room, ...payload.new }
                    : room,
                ),
              );
            } else if (payload.eventType === "INSERT") {
              setRooms((currentRooms) =>
                [...currentRooms, payload.new as RoomType].sort(
                  (a, b) => a.price - b.price,
                ),
              );
            } else if (payload.eventType === "DELETE") {
              setRooms((currentRooms) =>
                currentRooms.filter((room) => room.id !== payload.old.id),
              );
            }
          },
        )
        .subscribe();

      // Realtime subscription for reviews
      const reviewsSubscription = supabase
        .channel(`public:reviews:hostel_id=eq.${id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reviews",
            filter: `hostel_id=eq.${id}`,
          },
          () => {
            // Simplest approach: refetch the hostel data (or just reviews) when a review is added
            fetchHostelData();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(roomsSubscription);
        supabase.removeChannel(reviewsSubscription);
      };
    }
  }, [id, fetchHostelData]);

  const handleBookClick = (room: RoomType) => {
    if (!hostel || !id) return;

    if (!user) {
      toast.error("Please login to book a room");
      const redirect = encodeURIComponent(`/hostel/${id}?bookRoom=${room.id}`);
      navigate(`/auth?redirect=${redirect}`);
      return;
    }

    if (dbUser?.role !== "student") {
      toast.error("Only student accounts can book rooms.");
      navigate("/student/dashboard");
      return;
    }

    if (room.available <= 0) {
      toast.error("This room is currently full");
      return;
    }

    setSelectedRoom(room);
    setIsBookingOpen(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRoom || !hostel) return;

    if (selectedRoom.available <= 0) {
      toast.error("Sorry, this room is currently full.");
      return;
    }

    const submitLegacyBooking = async () => {
      const { error } = await supabase.from("bookings").insert({
        student_id: user.id,
        hostel_id: hostel.id,
        room_type_id: selectedRoom.id,
        phone_number: bookingForm.phone_number,
        course: bookingForm.course,
        move_in_date: bookingForm.move_in_date,
        next_of_kin: bookingForm.next_of_kin,
        sponsor: bookingForm.sponsor,
        origin: bookingForm.origin,
        medical_history: bookingForm.medical_history,
        status: "pending",
      });

      if (error) throw error;
    };

    try {
      setIsSubmitting(true);
      const { error: cartError } = await supabase
        .from("booking_cart_items")
        .upsert(
          {
            student_id: user.id,
            hostel_id: hostel.id,
            room_type_id: selectedRoom.id,
            check_in_date: bookingForm.move_in_date || null,
            duration_months: 1,
          },
          { onConflict: "student_id,room_type_id" },
        );

      if (cartError) throw cartError;

      const { data: intentId, error: intentError } = await supabase.rpc(
        "create_checkout_intent_from_cart",
        {
          p_student_id: user.id,
          p_expires_minutes: 15,
        },
      );

      if (intentError) throw intentError;
      if (!intentId) throw new Error("Failed to create checkout intent.");

      const { error: finalizeError } = await supabase.rpc(
        "finalize_booking_intent",
        {
          p_intent_id: intentId,
          p_phone_number: bookingForm.phone_number,
          p_course: bookingForm.course || null,
          p_move_in_date: bookingForm.move_in_date || null,
          p_next_of_kin: bookingForm.next_of_kin,
          p_sponsor: bookingForm.sponsor || null,
          p_origin: bookingForm.origin || null,
          p_medical_history: bookingForm.medical_history || null,
          p_special_requests: null,
        },
      );

      if (finalizeError) throw finalizeError;

      toast.success(
        "Booking request submitted via checkout flow! Waiting for owner approval.",
      );
      setIsBookingOpen(false);
      navigate("/student/dashboard");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Booking failed");

      if (shouldFallbackToLegacyBooking(message)) {
        try {
          await submitLegacyBooking();
          toast.success(
            "Booking request submitted! Waiting for owner approval.",
          );
          setIsBookingOpen(false);
          navigate("/student/dashboard");
          return;
        } catch (legacyError: unknown) {
          const legacyMessage = getErrorMessage(
            legacyError,
            "Booking failed",
          );
          if (/row-level security|permission denied|policy/i.test(legacyMessage)) {
            toast.error(
              "Booking is blocked by database permissions. Run phase22_booking_enablement.sql in Supabase and try again.",
            );
          } else {
            toast.error(legacyMessage);
          }
          return;
        }
      }

      if (/row-level security|permission denied|policy/i.test(message)) {
        toast.error(
          "Booking is blocked by database permissions. Run phase22_booking_enablement.sql in Supabase and try again.",
        );
      } else {
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hostel) return;

    try {
      setIsSubmittingReview(true);
      const { error } = await supabase.from("reviews").insert({
        hostel_id: hostel.id,
        student_id: user.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });

      if (error) throw error;

      toast.success("Review submitted! Thank you for your feedback.");
      setIsReviewOpen(false);
      setReviewForm({ rating: 5, comment: "" });
      fetchHostelData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to submit review"));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const images =
    hostel?.images && hostel.images.length > 0
      ? hostel.images
      : [];

  const validImages = images.filter(Boolean);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id, validImages.length]);

  const activeImage = validImages[currentImageIndex];

  const showPrevImage = () => {
    if (validImages.length <= 1) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? validImages.length - 1 : prev - 1,
    );
  };

  const showNextImage = () => {
    if (validImages.length <= 1) return;
    setCurrentImageIndex((prev) =>
      prev === validImages.length - 1 ? 0 : prev + 1,
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="container mx-auto px-4 py-20 text-center min-h-[60vh]">
        <h2 className="text-2xl font-bold">Hostel not found</h2>
        <Link to="/search">
          <Button className="mt-4">Back to Search</Button>
        </Link>
      </div>
    );
  }

  const mapQuery = encodeURIComponent(
    hostel.address || hostel.university || "Kampala, Uganda",
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Image Section with Carousel */}
      <div className="w-full h-[40vh] md:h-[60vh] relative bg-slate-200 group">
        {activeImage ? (
          <img
            src={activeImage}
            className="w-full h-full object-cover"
            alt={`${hostel.name} - Image ${currentImageIndex + 1}`}
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-700 font-semibold">
            No property images uploaded
          </div>
        )}

        {validImages.length > 1 && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={showPrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white border-none shadow-lg h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={showNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white border-none shadow-lg h-10 w-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4">
          <Link to="/search">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full shadow-md bg-white/90 hover:bg-white backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="absolute bottom-6 left-0 right-0 container mx-auto px-4 text-white">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {hostel.status === "approved" && (
                  <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm gap-1">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="text-white border-white/50 backdrop-blur-md bg-black/20"
                >
                  <Star className="h-3 w-3 mr-1 text-amber-400 fill-amber-400" />
                    {(hostel.rating || 0) > 0 ? hostel.rating : "-"}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 drop-shadow-md">
                {hostel.name}
              </h1>
              <p className="flex items-center gap-1.5 text-slate-200 text-lg">
                <MapPin className="h-5 w-5" />
                {hostel.address}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 inline-block">
              <p className="text-sm text-slate-300 font-medium mb-1 flex items-center gap-1">
                <Navigation className="h-4 w-4" /> Nearest Campus
              </p>
              <p className="text-xl font-bold text-white">
                {hostel.university || "University Area"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-sm bg-white p-6 rounded-2xl">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">
                About this property
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {hostel.description || "No description provided yet."}
              </p>
            </Card>

            {/* Location Map */}
            <Card className="border-0 shadow-sm bg-white p-6 rounded-2xl overflow-hidden">
              <h2 className="text-2xl font-bold mb-4 text-slate-900 flex items-center gap-2">
                <MapPin className="h-6 w-6 text-indigo-600" /> Location
              </h2>
              <div className="w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden bg-slate-100 relative shadow-inner">
                <iframe
                  src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                  title="Hostel Location Map"
                ></iframe>
              </div>
            </Card>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-2xl font-black tracking-tight text-slate-900">
                  Available Room Types
                </h3>
                <div className="text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-fit">
                  Rooms available now: {rooms.filter((r) => r.available > 0).length}/{rooms.length}
                </div>
              </div>
              {rooms.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
                  <Building className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">The owner has not listed any room types yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {rooms.map((room) => (
                    <Card
                      key={room.id}
                      className="overflow-hidden border-slate-300 bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/40"
                    >
                      <CardContent className="p-0">
                        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto]">
                          <div className="h-36 md:h-full bg-slate-100 border-b md:border-b-0 md:border-r border-slate-200">
                            {room.images && room.images.length > 0 ? (
                              <img
                                src={room.images[0]}
                                alt={room.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Building className="h-8 w-8" />
                              </div>
                            )}
                          </div>

                          <div className="p-5">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h4 className="text-lg font-bold text-slate-900">{room.name}</h4>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-semibold",
                                  room.available > 0
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-rose-200 bg-rose-50 text-rose-700",
                                )}
                              >
                                {room.available > 0 ? "Available" : "Full"}
                              </Badge>
                            </div>

                            {room.description ? (
                              <p className="text-sm text-slate-700 mb-3 leading-relaxed">{room.description}</p>
                            ) : (
                              <p className="text-sm text-slate-500 mb-3">Comfortable room option with standard amenities.</p>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                <Users className="h-3.5 w-3.5" /> Capacity: {room.capacity}
                              </span>
                              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                Slots left: {room.available}
                              </span>
                            </div>
                          </div>

                          <div className="p-5 md:border-l border-slate-200 flex md:flex-col items-center md:items-end justify-between gap-3 bg-slate-50/60">
                            <div className="text-2xl font-black text-primary">{formatUGX(room.price)}</div>
                            <Button
                              onClick={() => handleBookClick(room)}
                              disabled={room.available === 0}
                              variant={room.available > 0 ? "default" : "secondary"}
                              className={cn(
                                "w-full md:w-32 font-semibold shadow-sm",
                                room.available > 0
                                  ? "bg-primary hover:bg-primary/90 text-white"
                                  : "bg-slate-200 text-slate-500 cursor-not-allowed",
                              )}
                            >
                              {room.available > 0 ? "Book Room" : "Full"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews System */}
            <div className="space-y-4 pt-6 mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  Student Reviews
                </h3>
                {user && dbUser?.role === "student" && (
                  <Button
                    onClick={() => setIsReviewOpen(true)}
                    variant="outline"
                    className="gap-2 border-slate-200"
                  >
                    <MessageSquare className="h-4 w-4" /> Write a Review
                  </Button>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 text-center bg-transparent rounded-2xl border border-dashed border-slate-300 text-slate-500">
                  <p>No reviews yet. Be the first to review this hostel!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {reviews.map((review) => (
                    <Card
                      key={review.id}
                      className="border-slate-200 shadow-sm bg-white"
                    >
                      <div className="p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                          <div className="font-bold text-slate-900">
                            {review.users?.first_name} {review.users?.last_name}
                          </div>
                          <div className="flex items-center text-amber-500 text-sm font-medium bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                            <Star className="h-4 w-4 fill-amber-500 mr-1" />{" "}
                            {review.rating}/5
                          </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-sm">
                          {review.comment}
                        </p>
                        <p className="text-xs text-slate-400 mt-3">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm sticky top-24">
              <CardContent className="p-6">
                <div className="text-center pb-6 border-b border-slate-100 mb-6">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-slate-400">
                    {hostel.users?.first_name
                      ? hostel.users.first_name[0]
                      : "?"}
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900">
                    {hostel.users
                      ? `${hostel.users.first_name} ${hostel.users.last_name}`
                      : "Unknown Owner"}
                  </h3>
                  <p className="text-sm text-slate-500">Hostel Owner</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">
                      General Price Range
                    </p>
                    <p className="font-medium text-slate-900">
                      {hostel.price_range || "Contact for pricing"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {hostel.amenities && hostel.amenities.length > 0 ? (
                        hostel.amenities.map((amenity: string, i: number) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                          >
                            {amenity}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400">
                          Not specified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Apply for Room</DialogTitle>
            <DialogDescription>
              Submit your details to reserve the{" "}
              <span className="font-bold text-slate-900">
                {selectedRoom?.name}
              </span>{" "}
              at {hostel.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  required
                  placeholder="+256 700 000 000"
                  value={bookingForm.phone_number}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      phone_number: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Expected Move-in</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={bookingForm.move_in_date}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      move_in_date: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course">University Course (Optional)</Label>
              <Input
                id="course"
                placeholder="e.g. BSc Software Engineering"
                value={bookingForm.course}
                onChange={(e) =>
                  setBookingForm({ ...bookingForm, course: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kin">Next of Kin</Label>
                <Input
                  id="kin"
                  required
                  placeholder="Name & Contact"
                  value={bookingForm.next_of_kin}
                  onChange={(e) =>
                    setBookingForm({
                      ...bookingForm,
                      next_of_kin: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sponsor">Sponsor</Label>
                <Input
                  id="sponsor"
                  placeholder="Who pays rent?"
                  value={bookingForm.sponsor}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, sponsor: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="med">Any Medical Conditions? (Optional)</Label>
              <Input
                id="med"
                placeholder="Leave blank if none"
                value={bookingForm.medical_history}
                onChange={(e) =>
                  setBookingForm({
                    ...bookingForm,
                    medical_history: e.target.value,
                  })
                }
              />
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Confirm Application
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Write a Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience about {hostel?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReviewSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={reviewForm.rating}
                onChange={(e) =>
                  setReviewForm({
                    ...reviewForm,
                    rating: Number(e.target.value),
                  })
                }
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Very Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Poor</option>
                <option value={1}>1 - Terrible</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Your Comment</Label>
              <Textarea
                placeholder="What did you like or dislike about your stay?"
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, comment: e.target.value })
                }
                required
                className="min-h-[100px]"
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
