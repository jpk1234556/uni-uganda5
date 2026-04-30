import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home,
  ClipboardList,
  UserCircle,
  Loader2,
  GraduationCap,
  Smartphone,
  CheckCircle2,
  Heart,
  ShoppingCart,
  Trash2,
  MapPin,
  Save,
  User,
  BookOpen,
  Phone,
  HeartPulse,
  Users,
  Bell,
  MessageSquare,
  Send,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Notification, Message } from "@/types";

interface ConversationParticipant {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
}

interface ConversationThread {
  participant: ConversationParticipant;
  messages: Message[];
  unreadCount: number;
}

const formatUGX = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));

export default function StudentDashboard() {
  const { user, dbUser } = useAuth();
  const [applications, setApplications] = useState<any[]>([]);
  const [savedHostels, setSavedHostels] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeConversation, setActiveConversation] =
    useState<ConversationParticipant | null>(null);
  const [messageDraft, setMessageDraft] = useState("");

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    phone_number: "",
    course: "",
    next_of_kin: "",
    medical_history: "",
  });

  useEffect(() => {
    if (dbUser) {
      setProfileForm({
        phone_number: dbUser.phone_number || "",
        course: dbUser.course || "",
        next_of_kin: dbUser.next_of_kin || "",
        medical_history: dbUser.medical_history || "",
      });
    }
  }, [dbUser]);

  // Payment UI State
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") === "cart"
      ? "cart"
      : searchParams.get("tab") === "notifications"
        ? "notifications"
        : searchParams.get("tab") === "messages"
          ? "messages"
          : "applications",
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "applications" ||
      tab === "saved" ||
      tab === "profile" ||
      tab === "cart" ||
      tab === "notifications" ||
      tab === "messages"
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          status,
          created_at,
          room_types ( name, price ),
          hostels ( name, owner_id, users!hostels_owner_id_fkey ( first_name, last_name, email ) )
        `,
        )
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
        .select(
          `
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
        `,
        )
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

  const fetchCartItems = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingCart(true);
      const { data, error } = await supabase
        .from("booking_cart_items")
        .select(
          `
          id,
          student_id,
          hostel_id,
          room_type_id,
          check_in_date,
          duration_months,
          note,
          created_at,
          room_types (
            id,
            name,
            price,
            available,
            capacity,
            images
          ),
          hostels (
            id,
            name,
            address,
            university,
            images,
            category,
            status
          )
        `,
        )
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error("Error fetching cart items:", error);
    } finally {
      setIsLoadingCart(false);
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingNotifications(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("id, user_id, title, message, type, is_read, link, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingMessages(true);
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          sender_id,
          receiver_id,
          content,
          is_read,
          created_at,
          sender:users!messages_sender_id_fkey(first_name, last_name, email),
          receiver:users!messages_receiver_id_fkey(first_name, last_name, email)
        `,
        )
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: true })
        .limit(200);

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [user]);

  const conversationThreads = useMemo<ConversationThread[]>(() => {
    if (!user) return [];

    const threadsByParticipant = new Map<string, ConversationThread>();

    messages.forEach((message) => {
      const participantId =
        message.sender_id === user.id ? message.receiver_id : message.sender_id;
      const participantProfile =
        message.sender_id === user.id ? message.receiver : message.sender;

      if (!participantProfile) return;

      const existing = threadsByParticipant.get(participantId);
      const participant: ConversationParticipant = {
        id: participantId,
        first_name: participantProfile.first_name,
        last_name: participantProfile.last_name,
        email: participantProfile.email ?? null,
      };

      if (existing) {
        existing.messages.push(message);
        if (message.receiver_id === user.id && !message.is_read) {
          existing.unreadCount += 1;
        }
      } else {
        threadsByParticipant.set(participantId, {
          participant,
          messages: [message],
          unreadCount:
            message.receiver_id === user.id && !message.is_read ? 1 : 0,
        });
      }
    });

    return Array.from(threadsByParticipant.values()).sort((a, b) => {
      const lastA = a.messages[a.messages.length - 1]?.created_at || "";
      const lastB = b.messages[b.messages.length - 1]?.created_at || "";
      return lastB.localeCompare(lastA);
    });
  }, [messages, user]);

  const currentConversationMessages = useMemo(() => {
    if (!user || !activeConversation) return [];

    return messages.filter(
      (message) =>
        (message.sender_id === user.id &&
          message.receiver_id === activeConversation.id) ||
        (message.sender_id === activeConversation.id &&
          message.receiver_id === user.id),
    );
  }, [activeConversation, messages, user]);

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchSavedHostels();
      fetchCartItems();
      fetchNotifications();
      fetchMessages();
    }
  }, [
    user,
    fetchApplications,
    fetchSavedHostels,
    fetchCartItems,
    fetchNotifications,
    fetchMessages,
  ]);

  useEffect(() => {
    if (!user) return;

    const messagesSub = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          fetchMessages();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSub);
    };
  }, [user, fetchMessages]);

  const removeFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;
      setSavedHostels((prev) => prev.filter((f) => f.id !== favoriteId));
      toast.success("Removed from saved hostels");
    } catch (error) {
      toast.error("Failed to remove favorite");
    }
  };

  const removeCartItem = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from("booking_cart_items")
        .delete()
        .eq("id", cartItemId);

      if (error) throw error;
      setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
      toast.success("Removed from cart");
    } catch (error) {
      toast.error("Failed to remove cart item");
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification,
        ),
      );
    } catch (error) {
      toast.error("Failed to update notification");
    }
  };

  const markAllNotificationsAsRead = async () => {
    const unreadNotificationIds = notifications
      .filter((notification) => !notification.is_read)
      .map((notification) => notification.id);

    if (unreadNotificationIds.length === 0) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", unreadNotificationIds);

      if (error) throw error;
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true })),
      );
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  };

  const openConversation = async (participant: ConversationParticipant) => {
    setActiveConversation(participant);
    setMessageDraft("");

    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", participant.id)
        .eq("receiver_id", user?.id)
        .eq("is_read", false);

      if (error) throw error;
      setMessages((prev) =>
        prev.map((message) =>
          message.sender_id === participant.id &&
          message.receiver_id === user?.id
            ? { ...message, is_read: true }
            : message,
        ),
      );
    } catch (error) {
      console.error("Failed to mark conversation read:", error);
    }
  };

  const sendMessage = async () => {
    if (!user || !activeConversation || !messageDraft.trim()) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: activeConversation.id,
        content: messageDraft.trim(),
      });

      if (error) throw error;
      setMessageDraft("");
      await fetchMessages();
    } catch (error) {
      toast.error("Failed to send message");
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
        platform_fee: 0,
      });

      if (error) throw error;

      toast.success(
        "Payment details submitted! Admin will verify your transaction shortly.",
      );
      setIsPaymentOpen(false);
      fetchApplications();
    } catch (error: any) {
      toast.error("Failed to submit payment confirmation: " + error.message);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCheckoutCart = async () => {
    if (!user || cartItems.length === 0) return;

    if (!profileForm.phone_number || !profileForm.next_of_kin) {
      toast.error(
        "Complete your profile phone number and next of kin before checkout.",
      );
      setActiveTab("profile");
      return;
    }

    try {
      setIsCheckingOut(true);
      const { data: intentId, error: intentError } = await supabase.rpc(
        "create_checkout_intent_from_cart",
        {
          p_student_id: user.id,
          p_expires_minutes: 15,
        },
      );

      if (intentError) throw intentError;
      if (!intentId) throw new Error("Failed to create checkout intent.");

      const primaryCartItem = cartItems[0];
      const durationLabel =
        primaryCartItem.duration_months === 1
          ? "1 month"
          : `${primaryCartItem.duration_months} months`;

      const { data: bookingCount, error: finalizeError } = await supabase.rpc(
        "finalize_booking_intent",
        {
          p_intent_id: intentId,
          p_phone_number: profileForm.phone_number,
          p_course: profileForm.course || null,
          p_move_in_date: primaryCartItem.check_in_date || null,
          p_duration: durationLabel,
          p_next_of_kin: profileForm.next_of_kin,
          p_sponsor: null,
          p_origin: null,
          p_medical_history: profileForm.medical_history || null,
          p_special_requests: null,
        },
      );

      if (finalizeError) throw finalizeError;

      toast.success(
        `Checkout complete. ${bookingCount || cartItems.length} booking request(s) submitted for approval.`,
      );
      await fetchApplications();
      await fetchCartItems();
      setActiveTab("applications");
    } catch (error: any) {
      toast.error(error?.message || "Failed to checkout cart");
    } finally {
      setIsCheckingOut(false);
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
          updated_at: new Date().toISOString(),
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              My Dashboard
            </h1>
          </div>
          <p className="text-blue-800/80 dark:text-blue-300/80 max-w-2xl text-lg">
            Manage your booking applications, track your stays, and set up your
            student profile.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-white border border-slate-200 p-1.5 shadow-sm rounded-xl h-auto w-full grid grid-cols-1 sm:grid-cols-5 gap-1">
            <TabsTrigger
              value="applications"
              className="gap-2 px-4 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all text-xs sm:text-sm"
            >
              <ClipboardList className="h-4 w-4" /> Booking History
            </TabsTrigger>
            <TabsTrigger
              value="cart"
              className="gap-2 px-4 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all text-xs sm:text-sm"
            >
              <ShoppingCart className="h-4 w-4" /> Booking Cart
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="gap-2 px-4 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all text-xs sm:text-sm"
            >
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="gap-2 px-4 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all text-xs sm:text-sm"
            >
              <MessageSquare className="h-4 w-4" /> Messages
            </TabsTrigger>
            <TabsTrigger
              value="saved"
              className="gap-2 px-4 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all text-xs sm:text-sm"
            >
              <Heart className="h-4 w-4" /> Saved Hostels
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="gap-2 px-4 py-2.5 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg transition-all text-xs sm:text-sm"
            >
              <UserCircle className="h-4 w-4" /> Profile Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <Card className="border-blue-100/50 shadow-md bg-white">
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <CardDescription>
                  Keep track of your hostel applications and stays.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : applications.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                    <Home className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium mb-4">
                      You haven't applied to any hostels yet.
                    </p>
                    <Link to="/search">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all">
                        Find a Hostel
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <div
                        key={app.id}
                        className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-5 border rounded-xl hover:shadow-md hover:border-blue-200 transition-all bg-white"
                      >
                        <div className="min-w-0">
                          <h4 className="font-semibold text-lg text-slate-900">
                            {app.hostels?.name}
                          </h4>
                          <p className="text-sm text-slate-500 mb-1">
                            {app.room_types?.name} &bull;{" "}
                            {new Date(app.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm font-medium text-slate-700">
                            Price: {formatUGX(app.room_types?.price)}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:justify-end">
                          <Badge
                            variant={
                              app.status === "approved"
                                ? "default"
                                : app.status === "pending"
                                  ? "outline"
                                  : app.status === "completed"
                                    ? "default"
                                    : "destructive"
                            }
                            className={
                              app.status === "approved"
                                ? "bg-amber-500 text-white"
                                : app.status === "completed"
                                  ? "bg-emerald-500 text-white"
                                  : ""
                            }
                          >
                            {app.status === "approved"
                              ? "Awaiting Payment"
                              : app.status === "completed"
                                ? "Paid & Confirmed"
                                : app.status}
                          </Badge>

                          {app.status === "approved" ? (
                            <Button
                              onClick={() => handleOpenPayment(app)}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 shadow-sm text-white gap-2 w-full sm:w-auto"
                            >
                              <Smartphone className="h-4 w-4" /> Pay Now
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 w-full sm:w-auto"
                            >
                              View
                            </Button>
                          )}
                          {app.hostels?.owner_id ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 w-full sm:w-auto"
                              onClick={() => {
                                setActiveConversation({
                                  id: app.hostels.owner_id,
                                  first_name:
                                    app.hostels.users?.first_name || "Hostel",
                                  last_name:
                                    app.hostels.users?.last_name || "Owner",
                                  email: app.hostels.users?.email || null,
                                });
                                setActiveTab("messages");
                              }}
                            >
                              <MessageSquare className="h-4 w-4" /> Message
                              Owner
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cart">
            <Card className="border-blue-100/50 shadow-md bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Your Booking Cart
                </CardTitle>
                <CardDescription>
                  Review the rooms you are holding before confirming checkout.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingCart ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground font-medium mb-4">
                      Your booking cart is empty.
                    </p>
                    <Link to="/search">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all">
                        Browse Hostels
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.9fr] gap-6">
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col md:flex-row gap-4 p-4 border rounded-xl hover:shadow-md hover:border-blue-200 transition-all bg-white"
                        >
                          <div className="w-full md:w-28 h-24 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                            {item.hostels?.images?.[0] ? (
                              <img
                                src={item.hostels.images[0]}
                                alt={item.hostels?.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500 font-semibold px-2 text-center">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div>
                                <h4 className="font-bold text-slate-900 truncate">
                                  {item.hostels?.name}
                                </h4>
                                <p className="text-sm text-slate-600">
                                  {item.room_types?.name || "Selected room"}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {item.hostels?.university ||
                                    item.hostels?.address}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold text-blue-700">
                                  {formatUGX(item.room_types?.price)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Duration: {item.duration_months} month
                                  {item.duration_months > 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 font-medium">
                              <span className="bg-slate-100 px-2.5 py-1 rounded-full">
                                Available: {item.room_types?.available ?? "-"}
                              </span>
                              <span className="bg-slate-100 px-2.5 py-1 rounded-full">
                                Capacity: {item.room_types?.capacity ?? "-"}
                              </span>
                              <span className="bg-slate-100 px-2.5 py-1 rounded-full">
                                Added:{" "}
                                {new Date(item.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-start md:items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 gap-1"
                              onClick={() => removeCartItem(item.id)}
                            >
                              <Trash2 className="h-3 w-3" /> Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Card className="border-slate-200 shadow-sm h-fit sticky top-24">
                      <CardContent className="p-5 space-y-4">
                        <div>
                          <p className="text-sm text-slate-500">Summary</p>
                          <h3 className="text-xl font-bold text-slate-900">
                            Booking Checkout
                          </h3>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-600">
                              Items in cart
                            </span>
                            <span className="font-semibold text-slate-900">
                              {cartItems.length}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-600">
                              Estimated total
                            </span>
                            <span className="font-semibold text-slate-900">
                              {formatUGX(
                                cartItems.reduce(
                                  (total, item) =>
                                    total + (item.room_types?.price || 0),
                                  0,
                                ),
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-600">
                              Checkout window
                            </span>
                            <span className="font-semibold text-slate-900">
                              15 minutes
                            </span>
                          </div>
                        </div>
                        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800 leading-relaxed">
                          Complete your profile, then checkout to convert cart
                          items into booking requests.
                        </div>
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2"
                          onClick={handleCheckoutCart}
                          disabled={isCheckingOut || cartItems.length === 0}
                        >
                          {isCheckingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Checkout Cart
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-blue-100/50 shadow-md bg-white">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    Notifications
                  </CardTitle>
                  <CardDescription>
                    Booking updates, approval status changes, and system
                    messages.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllNotificationsAsRead}
                  disabled={notifications.every(
                    (notification) => notification.is_read,
                  )}
                >
                  Mark all as read
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingNotifications ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                    <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground font-medium mb-2">
                      You have no notifications yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Approval updates and booking messages will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`rounded-xl border p-4 transition-all ${
                          notification.is_read
                            ? "border-slate-200 bg-white"
                            : "border-blue-200 bg-blue-50/60"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge
                                variant="outline"
                                className="capitalize text-xs"
                              >
                                {notification.type}
                              </Badge>
                              {!notification.is_read ? (
                                <Badge className="bg-blue-600 text-white text-xs">
                                  New
                                </Badge>
                              ) : null}
                              <span className="text-xs text-slate-500">
                                {new Date(
                                  notification.created_at,
                                ).toLocaleString()}
                              </span>
                            </div>
                            <h4 className="font-semibold text-slate-900">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 sm:items-end shrink-0">
                            {notification.link ? (
                              <Button asChild variant="outline" size="sm">
                                <Link to={notification.link}>Open</Link>
                              </Button>
                            ) : null}
                            {!notification.is_read ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  markNotificationAsRead(notification.id)
                                }
                              >
                                Mark as read
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="border-blue-100/50 shadow-md bg-white">
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Messages
                  </CardTitle>
                  <CardDescription>
                    Chat with hostel owners about applications, payments, and
                    room details.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchMessages}
                  disabled={isLoadingMessages}
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : conversationThreads.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground font-medium mb-2">
                      No messages yet.
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start a conversation from one of your booking
                      applications.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("applications")}
                    >
                      Go to Bookings
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4">
                    <div className="border rounded-xl overflow-hidden bg-slate-50/60">
                      <div className="border-b px-4 py-3 bg-white">
                        <p className="text-sm font-semibold text-slate-900">
                          Conversations
                        </p>
                      </div>
                      <div className="max-h-[520px] overflow-y-auto divide-y">
                        {conversationThreads.map((thread) => {
                          const isActive =
                            activeConversation?.id === thread.participant.id;
                          return (
                            <button
                              key={thread.participant.id}
                              type="button"
                              onClick={() =>
                                openConversation(thread.participant)
                              }
                              className={`w-full text-left px-4 py-3 transition-colors ${
                                isActive
                                  ? "bg-blue-50"
                                  : "bg-transparent hover:bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 truncate">
                                    {thread.participant.first_name}{" "}
                                    {thread.participant.last_name}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">
                                    {thread.participant.email || "Hostel owner"}
                                  </p>
                                  <p className="text-sm text-slate-600 truncate mt-1">
                                    {
                                      thread.messages[
                                        thread.messages.length - 1
                                      ]?.content
                                    }
                                  </p>
                                </div>
                                {thread.unreadCount > 0 ? (
                                  <Badge className="bg-blue-600 text-white">
                                    {thread.unreadCount}
                                  </Badge>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border rounded-xl bg-white flex flex-col min-h-[520px]">
                      <div className="border-b px-4 py-3 bg-slate-50/70">
                        {activeConversation ? (
                          <div>
                            <p className="font-semibold text-slate-900">
                              {activeConversation.first_name}{" "}
                              {activeConversation.last_name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {activeConversation.email ||
                                "Conversation partner"}
                            </p>
                          </div>
                        ) : (
                          <p className="font-semibold text-slate-900">
                            Select a conversation
                          </p>
                        )}
                      </div>

                      <div className="flex-1 p-4 space-y-3 max-h-[420px] overflow-y-auto">
                        {currentConversationMessages.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-center text-sm text-slate-500 py-16">
                            Choose a conversation or start a new one from your
                            bookings.
                          </div>
                        ) : (
                          currentConversationMessages.map((message) => {
                            const isMine = message.sender_id === user?.id;
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                    isMine
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-900"
                                  }`}
                                >
                                  <p>{message.content}</p>
                                  <p
                                    className={`mt-2 text-[11px] ${isMine ? "text-blue-100" : "text-slate-500"}`}
                                  >
                                    {new Date(
                                      message.created_at,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <div className="border-t p-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Textarea
                            placeholder={
                              activeConversation
                                ? "Write a message..."
                                : "Select a conversation first"
                            }
                            value={messageDraft}
                            onChange={(e) => setMessageDraft(e.target.value)}
                            disabled={!activeConversation}
                            className="min-h-[90px] resize-none"
                          />
                          <Button
                            className="sm:self-end gap-2"
                            onClick={sendMessage}
                            disabled={
                              !activeConversation || !messageDraft.trim()
                            }
                          >
                            <Send className="h-4 w-4" /> Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved">
            <Card className="border-blue-100/50 shadow-md bg-white">
              <CardHeader>
                <CardTitle>Your Saved Hostels</CardTitle>
                <CardDescription>
                  Hostels you've favorited for quick access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSaved ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : savedHostels.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                    <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-muted-foreground font-medium mb-4">
                      You haven't saved any hostels yet.
                    </p>
                    <Link to="/search">
                      <Button variant="outline">Browse Hostels</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedHostels.map((item) => (
                      <div
                        key={item.id}
                        className="group relative flex flex-col sm:flex-row gap-4 p-4 border rounded-xl hover:shadow-md hover:border-blue-200 transition-all bg-white overflow-hidden"
                      >
                        <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                          {item.hostels?.images?.[0] ? (
                            <img
                              src={item.hostels.images[0]}
                              alt={item.hostels?.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500 font-semibold px-2 text-center">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">
                            {item.hostels?.name}
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3" />{" "}
                            {item.hostels?.university || item.hostels?.address}
                          </p>
                          <div className="flex items-center gap-3">
                            <Link to={`/hostel/${item.hostels?.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                              >
                                View Details
                              </Button>
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
                <CardDescription>
                  Your personal and academic information required for hostel
                  bookings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="firstName"
                        className="text-slate-700 font-medium"
                      >
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={dbUser?.first_name || ""}
                        disabled
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-slate-700 font-medium"
                      >
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={dbUser?.last_name || ""}
                        disabled
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-slate-700 font-medium"
                      >
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        value={dbUser?.email || ""}
                        disabled
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-slate-700 font-medium flex items-center gap-2"
                      >
                        <Phone className="h-4 w-4 text-slate-400" /> Phone
                        Number
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+256 700 000 000"
                        value={profileForm.phone_number}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            phone_number: e.target.value,
                          }))
                        }
                        className="border-slate-200 focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="course"
                        className="text-slate-700 font-medium flex items-center gap-2"
                      >
                        <BookOpen className="h-4 w-4 text-slate-400" /> Course
                        of Study
                      </Label>
                      <Input
                        id="course"
                        placeholder="e.g. Bachelor of Computer Science"
                        value={profileForm.course}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            course: e.target.value,
                          }))
                        }
                        className="border-slate-200 focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="nok"
                        className="text-slate-700 font-medium flex items-center gap-2"
                      >
                        <Users className="h-4 w-4 text-slate-400" /> Next of Kin
                        (Name & Contact)
                      </Label>
                      <Input
                        id="nok"
                        placeholder="e.g. John Smith (Father) - 0700..."
                        value={profileForm.next_of_kin}
                        onChange={(e) =>
                          setProfileForm((prev) => ({
                            ...prev,
                            next_of_kin: e.target.value,
                          }))
                        }
                        className="border-slate-200 focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="medical"
                      className="text-slate-700 font-medium flex items-center gap-2"
                    >
                      <HeartPulse className="h-4 w-4 text-slate-400" /> Medical
                      History / Allergies
                    </Label>
                    <Textarea
                      id="medical"
                      placeholder="Please list any medical conditions or allergies we should be aware of..."
                      value={profileForm.medical_history}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          medical_history: e.target.value,
                        }))
                      }
                      className="min-h-[100px] border-slate-200 focus:border-blue-400"
                    />
                    <p className="text-[10px] text-slate-400 italic">
                      This information is kept confidential and shared only with
                      hostel management upon booking.
                    </p>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px] gap-2 shadow-sm"
                    >
                      {isUpdatingProfile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
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
              <Smartphone className="h-5 w-5 text-emerald-500" /> Complete
              Payment
            </DialogTitle>
            <DialogDescription>
              Your booking for{" "}
              <strong className="text-slate-900">
                {selectedBooking?.room_types?.name}
              </strong>{" "}
              at {selectedBooking?.hostels?.name} was approved!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 text-center">
              <p className="text-sm text-emerald-800 mb-1">Amount Due</p>
              <div className="text-3xl font-bold text-emerald-900">
                {formatUGX(selectedBooking?.room_types?.price)}
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">
                How to pay via MTN Mobile Money / Airtel Money:
              </p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Dial <strong>*165#</strong> (MTN) or <strong>*185#</strong>{" "}
                  (Airtel)
                </li>
                <li>
                  Select <strong>Send Money</strong>
                </li>
                <li>
                  Enter KAJU HOUSING Merchant Number:{" "}
                  <strong className="text-slate-900 font-mono text-base">
                    0700 123 456
                  </strong>
                </li>
                <li>Enter the exact amount shown above.</li>
                <li>Confirm with your PIN.</li>
              </ol>
            </div>

            <div className="bg-amber-50 p-3 rounded-md text-amber-800 text-xs flex items-start gap-2 border border-amber-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <p>
                After sending the money, click the button below. Our admins will
                verify the transaction within 30 minutes and fully confirm your
                stay.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleConfirmPayment}
              disabled={isConfirming}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isConfirming ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              I Have Sent the Money
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
