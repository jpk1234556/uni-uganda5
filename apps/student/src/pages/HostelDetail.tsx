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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
        .select("*, users!hostels_owner_id_fkey(first_name, last_name, email)")
        .eq("id", id)
        .single();

      if (hostelError) throw hostelError;
      setHostel(hostelData as HostelWithOwner);

      // Fetch Rooms
      const { data: roomsData } = await supabase
        .from("room_types")
        .select("*")
        .eq("hostel_id", id)
        .order("price", { ascending: true });

      setRooms((roomsData as RoomType[]) || []);

      // Fetch Reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*, users!reviews_student_id_fkey(first_name, last_name)")
        .eq("hostel_id", id)
        .order("created_at", { ascending: false });

      setReviews((reviewsData as ReviewWithUser[]) || []);
    } catch (error) {
      toast.error("Failed to load hostel details");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

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
    if (!user) {
      toast.error("Please login to book a room");
      navigate("/auth");
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

    try {
      setIsSubmitting(true);
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

      toast.success("Booking request submitted! Waiting for owner approval.");
      setIsBookingOpen(false);
      navigate("/student/dashboard");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Booking failed");
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

  const images =
    hostel.images && hostel.images.length > 0
      ? hostel.images
      : [
          "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=2000&auto=format&fit=crop",
        ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero Image Section with Carousel */}
      <div className="w-full h-[40vh] md:h-[60vh] relative bg-slate-200 group">
        <Carousel className="w-full h-full" opts={{ loop: true }}>
          <CarouselContent className="h-full ml-0">
            {images.map((image, index) => (
              <CarouselItem key={index} className="h-full pl-0">
                <img
                  src={image}
                  className="w-full h-full object-cover"
                  alt={`${hostel.name} - Image ${index + 1}`}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 && (
            <>
              <CarouselPrevious className="left-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white border-none shadow-lg h-10 w-10" />
              <CarouselNext className="right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white border-none shadow-lg h-10 w-10" />
            </>
          )}
        </Carousel>

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
                  {(hostel.rating || 0) > 0 ? hostel.rating : "New"}
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
                  src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15959.066036746155!2d32.59735055!3d0.2919935!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sug!4v1774273240433!5m2!1sen!2sug"
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
              <h3 className="text-xl font-bold text-slate-900">
                Available Room Types
              </h3>
              {rooms.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500">
                  <Building className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>The owner has not listed any room types yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {rooms.map((room) => (
                    <Card
                      key={room.id}
                      className="overflow-hidden border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-indigo-100 group flex flex-col p-0"
                    >
                      <div className="flex flex-col sm:flex-row w-full">
                        {room.images && room.images.length > 0 && (
                          <div className="sm:w-1/3 h-48 sm:h-auto border-b sm:border-b-0 sm:border-r border-slate-100 shrink-0">
                            <img
                              src={room.images[0]}
                              alt={room.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-6 flex-1 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-slate-900 mb-1">
                              {room.name}
                            </h4>
                            {room.description && (
                              <p className="text-sm text-slate-600 mb-3">
                                {room.description}
                              </p>
                            )}
                            <div className="flex gap-4 text-sm text-slate-500 font-medium bg-slate-50 p-2 rounded-lg w-fit">
                              <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" /> Capacity:{" "}
                                {room.capacity}
                              </span>
                              <span className="pl-4 border-l border-slate-200">
                                Available:{" "}
                                <strong
                                  className={
                                    room.available > 0
                                      ? "text-emerald-600"
                                      : "text-rose-500"
                                  }
                                >
                                  {room.available}
                                </strong>
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:items-end justify-center gap-3 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 shrink-0">
                            <div className="text-2xl font-bold text-indigo-600">
                              {formatUGX(room.price)}
                            </div>
                            <Button
                              onClick={() => handleBookClick(room)}
                              disabled={room.available === 0}
                              variant={
                                room.available > 0 ? "default" : "secondary"
                              }
                              className={cn(
                                "w-full sm:w-auto font-medium shadow-sm transition-all",
                                room.available > 0
                                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed",
                              )}
                            >
                              {room.available > 0 ? "Book Room" : "Full"}
                            </Button>
                          </div>
                        </div>
                      </div>
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
