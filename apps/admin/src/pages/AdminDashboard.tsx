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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building2,
  ClipboardList,
  Users,
  CreditCard,
  Loader2,
  Search,
  Check,
  X,
  BarChart3,
  Home,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Hostel } from "@/types";

interface HostelWithOwner extends Hostel {
  users?: { first_name: string; last_name: string; email: string };
  room_types?: { id: string; name: string; price: number; available: number }[];
}

interface BookingWithRelations {
  id: string;
  student_id: string;
  hostel_id: string;
  room_type_id: string;
  status: "pending" | "approved" | "rejected" | "completed";
  created_at: string;
  users?: { id: string; first_name: string; last_name: string; email: string };
  hostels?: { id: string; name: string };
  room_types?: { id: string; name: string; price: number };
}

const formatUGX = (amount: number | string | null | undefined) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
  }).format(Number(amount ?? 0));

export default function AdminDashboard() {
  const { user, dbUser } = useAuth();
  const [hostels, setHostels] = useState<HostelWithOwner[]>([]);
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hostelSearchTerm, setHostelSearchTerm] = useState("");
  const [selectedHostel, setSelectedHostel] = useState<HostelWithOwner | null>(
    null,
  );
  const [isHostelDetailsOpen, setIsHostelDetailsOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchHostels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("hostels")
        .select(
          `
          *,
          users!hostels_owner_id_fkey ( first_name, last_name, email ),
          room_types ( id, name, price, available )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHostels((data as HostelWithOwner[]) || []);
    } catch (error) {
      console.error("Error fetching hostels:", error);
      toast.error("Failed to load hostels");
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          student_id,
          hostel_id,
          room_type_id,
          status,
          created_at,
          users!bookings_student_id_fkey ( id, first_name, last_name, email ),
          hostels ( id, name ),
          room_types ( id, name, price )
        `,
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setBookings((data as BookingWithRelations[]) || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([fetchHostels(), fetchBookings(), fetchPayments()]).finally(
        () => setIsLoading(false),
      );
    }
  }, [user, fetchHostels, fetchBookings, fetchPayments]);

  const handleApproveHostel = async (hostelId: string) => {
    try {
      const { error } = await supabase
        .from("hostels")
        .update({ status: "approved" })
        .eq("id", hostelId);

      if (error) throw error;
      toast.success("Hostel approved successfully");
      setIsHostelDetailsOpen(false);
      await fetchHostels();
    } catch (error) {
      toast.error("Failed to approve hostel");
    }
  };

  const handleRejectHostel = async (hostelId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const { error } = await supabase
        .from("hostels")
        .update({ status: "rejected" })
        .eq("id", hostelId);

      if (error) throw error;
      toast.success("Hostel rejected");
      setIsHostelDetailsOpen(false);
      setRejectionReason("");
      await fetchHostels();
    } catch (error) {
      toast.error("Failed to reject hostel");
    }
  };

  const filteredHostels = useMemo(
    () =>
      hostels.filter(
        (hostel) =>
          hostel.name?.toLowerCase().includes(hostelSearchTerm.toLowerCase()) ||
          hostel.address?.toLowerCase().includes(hostelSearchTerm.toLowerCase()),
      ),
    [hostels, hostelSearchTerm],
  );

  const stats = useMemo(
    () => ({
      totalHostels: hostels.length,
      approvedHostels: hostels.filter((h) => h.status === "approved").length,
      pendingHostels: hostels.filter((h) => h.status === "pending").length,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter((b) => b.status === "pending").length,
      approvedBookings: bookings.filter((b) => b.status === "approved").length,
      totalPayments: payments.length,
      totalRevenue: payments
        .filter((p) => p.status === "completed")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    }),
    [hostels, bookings, payments],
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 dark:from-purple-950/20 dark:border-purple-900/50 pt-10 pb-12 mb-8">
        <div className="container mx-auto px-4 max-w-7xl animate-in fade-in duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-full dark:bg-purple-900/50 dark:text-purple-400">
              <BarChart3 className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-purple-800/80 dark:text-purple-300/80 max-w-2xl text-lg">
            Manage hostels, bookings, payments, and platform oversight.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-purple-100/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Hostels (Approved / Total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.approvedHostels}/{stats.totalHostels}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.pendingHostels} pending review
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Bookings (Approved / Total)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.approvedBookings}/{stats.totalBookings}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.pendingBookings} pending approval
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-100/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Platform Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatUGX(stats.totalRevenue)}</div>
              <p className="text-xs text-slate-500 mt-2">
                {stats.totalPayments} total transactions
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-100/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Completed Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bookings.filter((b) => b.status === "completed").length}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Fully confirmed reservations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="hostels" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1.5 shadow-sm rounded-xl h-auto w-full grid grid-cols-1 sm:grid-cols-3 gap-1">
            <TabsTrigger
              value="hostels"
              className="gap-2 px-4 py-2.5 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-lg transition-all text-xs sm:text-sm"
            >
              <Building2 className="h-4 w-4" /> Hostels
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="gap-2 px-4 py-2.5 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-lg transition-all text-xs sm:text-sm"
            >
              <ClipboardList className="h-4 w-4" /> Bookings
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="gap-2 px-4 py-2.5 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 rounded-lg transition-all text-xs sm:text-sm"
            >
              <CreditCard className="h-4 w-4" /> Payments
            </TabsTrigger>
          </TabsList>

          {/* Hostels Tab */}
          <TabsContent value="hostels">
            <Card className="border-purple-100/50 shadow-md bg-white">
              <CardHeader>
                <CardTitle>Hostel Listings</CardTitle>
                <CardDescription>
                  Review and approve/reject hostel listings for the platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by name or address..."
                    className="pl-10"
                    value={hostelSearchTerm}
                    onChange={(e) => setHostelSearchTerm(e.target.value)}
                  />
                </div>

                {isLoading ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredHostels.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                    <Home className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground font-medium">
                      No hostels found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredHostels.map((hostel) => (
                      <div
                        key={hostel.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-xl hover:shadow-md hover:border-purple-200 transition-all bg-white"
                      >
                        <div className="min-w-0 space-y-2">
                          <h4 className="font-semibold text-slate-900">
                            {hostel.name}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {hostel.address} • {hostel.university}
                          </p>
                          <p className="text-xs text-slate-500">
                            Owner: {hostel.users?.first_name}{" "}
                            {hostel.users?.last_name}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-end">
                          <Badge
                            variant={
                              hostel.status === "approved"
                                ? "default"
                                : hostel.status === "pending"
                                  ? "outline"
                                  : "destructive"
                            }
                            className={
                              hostel.status === "approved"
                                ? "bg-emerald-500 text-white"
                                : ""
                            }
                          >
                            {hostel.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedHostel(hostel);
                              setIsHostelDetailsOpen(true);
                            }}
                          >
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card className="border-blue-100/50 shadow-md bg-white">
              <CardHeader>
                <CardTitle>Booking Requests</CardTitle>
                <CardDescription>
                  Monitor all booking requests across the platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                    <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground font-medium">
                      No bookings yet
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-slate-900">
                            Student
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-900">
                            Hostel
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-900">
                            Room
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-900">
                            Price
                          </th>
                          <th className="text-center py-3 px-4 font-semibold text-slate-900">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-slate-900">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr
                            key={booking.id}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {booking.users?.first_name}{" "}
                                  {booking.users?.last_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {booking.users?.email}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-4">{booking.hostels?.name}</td>
                            <td className="py-3 px-4">
                              {booking.room_types?.name}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">
                              {formatUGX(booking.room_types?.price)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                variant={
                                  booking.status === "approved"
                                    ? "default"
                                    : booking.status === "pending"
                                      ? "outline"
                                      : booking.status === "completed"
                                        ? "default"
                                        : "destructive"
                                }
                                className={
                                  booking.status === "approved"
                                    ? "bg-emerald-500 text-white"
                                    : booking.status === "completed"
                                      ? "bg-blue-500 text-white"
                                      : ""
                                }
                              >
                                {booking.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {new Date(booking.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card className="border-emerald-100/50 shadow-md bg-white">
              <CardHeader>
                <CardTitle>Payment Transactions</CardTitle>
                <CardDescription>
                  Track all payment transactions on the platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-20 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                    <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground font-medium">
                      No payments yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-xl hover:shadow-md hover:border-emerald-200 transition-all bg-white"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">
                            {formatUGX(payment.amount)}
                          </p>
                          <p className="text-sm text-slate-600">
                            Booking ID: {payment.booking_id?.substring(0, 8)}...
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-end">
                          <Badge
                            variant={
                              payment.status === "completed"
                                ? "default"
                                : payment.status === "pending"
                                  ? "outline"
                                  : "destructive"
                            }
                            className={
                              payment.status === "completed"
                                ? "bg-emerald-500 text-white"
                                : ""
                            }
                          >
                            {payment.status}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Hostel Details Dialog */}
      <Dialog open={isHostelDetailsOpen} onOpenChange={setIsHostelDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedHostel?.name}</DialogTitle>
            <DialogDescription>
              Review hostel details and approve or reject the listing.
            </DialogDescription>
          </DialogHeader>

          {selectedHostel && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600 font-medium">Address</p>
                  <p className="text-slate-900">{selectedHostel.address}</p>
                </div>
                <div>
                  <p className="text-slate-600 font-medium">University</p>
                  <p className="text-slate-900">{selectedHostel.university}</p>
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Owner</p>
                  <p className="text-slate-900">
                    {selectedHostel.users?.first_name}{" "}
                    {selectedHostel.users?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Email</p>
                  <p className="text-slate-900">{selectedHostel.users?.email}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-600 font-medium mb-2">Description</p>
                <p className="text-slate-900 text-sm">
                  {selectedHostel.description || "No description provided"}
                </p>
              </div>

              <div>
                <p className="text-slate-600 font-medium mb-2">Rooms</p>
                {selectedHostel.room_types && selectedHostel.room_types.length > 0 ? (
                  <div className="space-y-2">
                    {selectedHostel.room_types.map((room) => (
                      <div
                        key={room.id}
                        className="flex justify-between items-center p-2 bg-slate-50 rounded"
                      >
                        <span className="text-sm text-slate-900">
                          {room.name}
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          {formatUGX(room.price)}{" "}
                          <span className="text-slate-500">
                            ({room.available} available)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No rooms added yet</p>
                )}
              </div>

              {selectedHostel.status === "pending" && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="rejection_reason">
                      Rejection Reason (if applicable)
                    </Label>
                    <Textarea
                      id="rejection_reason"
                      placeholder="Explain why you're rejecting this hostel listing..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="h-24"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApproveHostel(selectedHostel.id)}
                      className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      onClick={() =>
                        handleRejectHostel(selectedHostel.id)
                      }
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
