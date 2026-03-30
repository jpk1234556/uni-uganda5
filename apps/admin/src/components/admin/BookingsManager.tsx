import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  XCircle,
  CreditCard,
  CalendarDays,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function BookingsManager() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          *,
          users!bookings_student_id_fkey(first_name, last_name),
          hostels(name)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: "approved" | "rejected" | "completed",
  ) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      toast.success(`Booking marked as ${status}`);
      fetchBookings();
    } catch (error) {
      toast.error(`Failed to update booking to ${status}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses =
      "inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest";
    switch (status) {
      case "completed":
        return (
          <div
            className={cn(
              baseClasses,
              "bg-emerald-50 text-emerald-600 border-emerald-100",
            )}
          >
            Paid_&_Completed
          </div>
        );
      case "approved":
        return (
          <div
            className={cn(
              baseClasses,
              "bg-blue-50 text-blue-600 border-blue-100",
            )}
          >
            Approved_Awaiting_Payment
          </div>
        );
      case "pending":
        return (
          <div
            className={cn(
              baseClasses,
              "bg-amber-50 text-amber-600 border-amber-100",
            )}
          >
            Pending_Approval
          </div>
        );
      case "rejected":
        return (
          <div
            className={cn(
              baseClasses,
              "bg-rose-50 text-rose-600 border-rose-100",
            )}
          >
            Rejected_Access
          </div>
        );
      default:
        return (
          <div
            className={cn(
              baseClasses,
              "bg-slate-50 text-slate-600 border-slate-100",
            )}
          >
            {status.toUpperCase()}
          </div>
        );
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              Transaction_Monitor
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
            Bookings_Management
          </h2>
          <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest">
            LIFECYCLE_OVERSEE_AND_PAYMENT_VERIFICATION
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2 font-mono">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">
              Active_Sessions
            </span>
            <span className="text-xs font-bold text-slate-900">
              {bookings.length}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">
              Pending_Action
            </span>
            <span className="text-xs font-bold text-amber-600">
              {bookings.filter((b) => b.status === "pending").length}
            </span>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 rounded-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mb-3" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Fetching_Transaction_Streams...
              </span>
            </div>
          ) : (
            <Table className="font-mono">
              <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">
                    Subject_Identity
                  </TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">
                    Property_Target
                  </TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">
                    Deployment_Date
                  </TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">
                    Current_Status
                  </TableHead>
                  <TableHead className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10 pr-6">
                    Operations
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <TableCell className="py-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                          {booking.users
                            ? `${booking.users.first_name} ${booking.users.last_name}`
                            : "UNKNOWN_SUBJECT"}
                        </span>
                        <span className="text-[9px] text-slate-400 tracking-widest">
                          UID: {booking.student_id?.split("-")[0]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-600 uppercase tracking-tight">
                      {booking.hostels?.name || "UNASSIGNED_PROPERTY"}
                    </TableCell>
                    <TableCell className="text-[10px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3 w-3 text-slate-400" />
                        {booking.move_in_date
                          ? format(new Date(booking.move_in_date), "dd/MM/yyyy")
                          : "NOT_SPECIFIED"}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-right pr-6">
                      {booking.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() =>
                              handleUpdateStatus(booking.id, "approved")
                            }
                            variant="outline"
                            className="h-7 text-[9px] font-bold uppercase tracking-widest text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-none px-3"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />{" "}
                            Approve
                          </Button>
                          <Button
                            onClick={() =>
                              handleUpdateStatus(booking.id, "rejected")
                            }
                            variant="outline"
                            className="h-7 text-[9px] font-bold uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50 rounded-none px-3"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1.5" /> Reject
                          </Button>
                        </div>
                      )}
                      {booking.status === "approved" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() =>
                              handleUpdateStatus(booking.id, "completed")
                            }
                            className="h-7 text-[9px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-none px-3 shadow-sm"
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1.5" />{" "}
                            Mark_Paid
                          </Button>
                        </div>
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
  );
}
