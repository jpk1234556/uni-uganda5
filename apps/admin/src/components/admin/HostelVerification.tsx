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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle,
  XCircle,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Image as ImageIcon,
  ListChecks,
  Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function HostelVerification() {
  const [pendingHostels, setPendingHostels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedHostel, setSelectedHostel] = useState<any | null>(null);

  useEffect(() => {
    fetchPendingHostels();
  }, []);

  const fetchPendingHostels = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("hostels")
        .select(`*, users!hostels_owner_id_fkey(first_name, last_name, email)`)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPendingHostels(data || []);
    } catch (error) {
      toast.error("Failed to load pending hostels");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    hostelId: string,
    status: "approved" | "rejected",
  ) => {
    try {
      setProcessingId(hostelId);
      const { error } = await supabase
        .from("hostels")
        .update({ status })
        .eq("id", hostelId);

      if (error) throw error;

      toast.success(
        `Hostel ${status === "approved" ? "approved" : "rejected"} successfully`,
      );
      setPendingHostels((prev) => prev.filter((h) => h.id !== hostelId));
      if (selectedHostel?.id === hostelId) setSelectedHostel(null);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setProcessingId(null);
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
            <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
              Security_Protocol
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
            Hostel_Verification
          </h2>
          <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest">
            REVIEW_AND_VALIDATE_NEW_LISTING_REQUESTS
          </p>
        </div>
      </div>

      <Card className="border-slate-200 rounded-none shadow-sm bg-white overflow-hidden">
        <div className="bg-slate-50/50 border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-none bg-white border border-slate-200 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                Pending_Approvals
              </h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                {pendingHostels.length} HOSTELS_AWAITING_SYSTEM_VALIDATION
              </p>
            </div>
          </div>
          {pendingHostels.length > 0 && (
            <div className="px-2 py-1 bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" />
              Action_Required
            </div>
          )}
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                Accessing_Data_Streams...
              </span>
            </div>
          ) : pendingHostels.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="h-16 w-16 rounded-none bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-slate-200" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                System_Clear
              </h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono mt-1">
                NO_PENDING_VERIFICATIONS_IN_QUEUE.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Hostel_Details
                  </TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Owner_Information
                  </TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Location_Data
                  </TableHead>
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">
                    Decision_Matrix
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingHostels.map((hostel) => (
                  <TableRow
                    key={hostel.id}
                    className="hover:bg-slate-50/30 border-b border-slate-100 transition-colors group"
                  >
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                          {hostel.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider line-clamp-1 max-w-[250px]">
                          {hostel.description || "NO_DESCRIPTION_PROVIDED"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                          {hostel.users?.first_name} {hostel.users?.last_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {hostel.users?.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {hostel.university}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                          {hostel.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          onClick={() => setSelectedHostel(hostel)}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[9px] font-bold uppercase tracking-widest text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 rounded-none gap-1.5"
                        >
                          <Eye className="h-3 w-3" />
                          Inspect
                        </Button>
                        <Button
                          onClick={() =>
                            handleUpdateStatus(hostel.id, "approved")
                          }
                          disabled={processingId === hostel.id}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[9px] font-bold uppercase tracking-widest text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 rounded-none gap-1.5"
                        >
                          {processingId === hostel.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={() =>
                            handleUpdateStatus(hostel.id, "rejected")
                          }
                          disabled={processingId === hostel.id}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[9px] font-bold uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 rounded-none gap-1.5"
                        >
                          {processingId === hostel.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          Reject
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

      {/* Property Inspection Dialog */}
      <Dialog
        open={!!selectedHostel}
        onOpenChange={(open) => !open && setSelectedHostel(null)}
      >
        <DialogContent className="sm:max-w-[600px] rounded-none border-slate-200 font-mono max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <DialogTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />{" "}
              Property_Inspection_Protocol
            </DialogTitle>
            <DialogDescription className="text-[10px] uppercase tracking-wider text-slate-400">
              ID: {selectedHostel?.id} | STATUS: PENDING_VALIDATION
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Media Assets */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <ImageIcon className="h-3.5 w-3.5" /> Media_Assets_Registry
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                {selectedHostel?.images && selectedHostel.images.length > 0 ? (
                  selectedHostel.images.map((img: string, idx: number) => (
                    <div
                      key={idx}
                      className="h-32 w-48 shrink-0 bg-slate-100 border border-slate-200 overflow-hidden"
                    >
                      <img
                        src={img}
                        alt={`Asset_${idx}`}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://picsum.photos/seed/error/400/300?blur=2";
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="h-32 w-full bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 uppercase tracking-widest">
                    NO_MEDIA_ASSETS_DETECTED
                  </div>
                )}
              </div>
            </div>

            {/* Property Brief */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Info className="h-3.5 w-3.5" /> Property_Brief
              </div>
              <div className="p-4 bg-slate-50 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase mb-2">
                  {selectedHostel?.name}
                </h4>
                <p className="text-[10px] text-slate-600 leading-relaxed uppercase">
                  {selectedHostel?.description ||
                    "NO_DESCRIPTION_DATA_AVAILABLE"}
                </p>
              </div>
            </div>

            {/* Amenities Registry */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <ListChecks className="h-3.5 w-3.5" /> Amenities_Registry
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedHostel?.amenities &&
                selectedHostel.amenities.length > 0 ? (
                  selectedHostel.amenities.map(
                    (amenity: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-white border border-slate-200 text-[9px] font-bold text-slate-600 uppercase tracking-widest"
                      >
                        {amenity}
                      </span>
                    ),
                  )
                ) : (
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest italic">
                    NO_AMENITIES_LISTED
                  </span>
                )}
              </div>
            </div>

            {/* Location & Owner Data */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Geographic_Data
                </span>
                <div className="text-[10px] text-slate-700 font-bold uppercase">
                  {selectedHostel?.university}
                </div>
                <div className="text-[10px] text-slate-500 uppercase">
                  {selectedHostel?.address}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Owner_Identity
                </span>
                <div className="text-[10px] text-slate-700 font-bold uppercase">
                  {selectedHostel?.users?.first_name}{" "}
                  {selectedHostel?.users?.last_name}
                </div>
                <div className="text-[10px] text-slate-500 lowercase">
                  {selectedHostel?.users?.email}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-4 flex gap-2">
            <Button
              onClick={() => handleUpdateStatus(selectedHostel.id, "rejected")}
              disabled={processingId === selectedHostel?.id}
              variant="outline"
              className="flex-1 h-10 text-[10px] font-bold uppercase tracking-widest text-rose-600 border-rose-200 hover:bg-rose-50 rounded-none"
            >
              {processingId === selectedHostel?.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Reject_Listing"
              )}
            </Button>
            <Button
              onClick={() => handleUpdateStatus(selectedHostel.id, "approved")}
              disabled={processingId === selectedHostel?.id}
              className="flex-1 h-10 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-none"
            >
              {processingId === selectedHostel?.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Approve_Listing"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
