import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Star, Trash2, Home, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "motion/react";

// Correcting imports for Dialog
import {
  Dialog as ShadDialog,
  DialogContent as ShadDialogContent,
  DialogDescription as ShadDialogDescription,
  DialogFooter as ShadDialogFooter,
  DialogHeader as ShadDialogHeader,
  DialogTitle as ShadDialogTitle,
} from "@/components/ui/dialog";

export default function ReviewsManager() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id, rating, comment, created_at,
          users!reviews_student_id_fkey(first_name, last_name),
          hostels!reviews_hostel_id_fkey(name)
        `)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      toast.error("Failed to load reviews ledger");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!deleteConfirmId) return;
    
    try {
      setIsDeleting(deleteConfirmId);
      const { error } = await supabase.from("reviews").delete().eq("id", deleteConfirmId);
      if (error) throw error;
      toast.success("Abusive review removed permanently");
      setReviews(reviews.filter(r => r.id !== deleteConfirmId));
    } catch (error) {
      toast.error("Failed to delete review");
    } finally {
      setIsDeleting(null);
      setDeleteConfirmId(null);
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Content_Moderation</span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Moderation_&_Reviews</h2>
          <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest">FEEDBACK_AUDIT_AND_COMMUNITY_GUIDELINE_ENFORCEMENT</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2 font-mono">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">Total_Feedback</span>
            <span className="text-xs font-bold text-slate-900">{reviews.length}</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">Avg_Rating</span>
            <span className="text-xs font-bold text-indigo-600">
              {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0"}
            </span>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 rounded-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-amber-400 mb-3" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Scanning_Platform_Feedback...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Zero_Feedback_Detected</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider max-w-xs mt-2 font-mono">WAITING_FOR_STUDENT_SENTIMENT_STREAMS</p>
            </div>
          ) : (
            <Table className="font-mono">
              <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Author_Identity</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Target_Property</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Rating_Data</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Feedback_Snippet</TableHead>
                  <TableHead className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10 pr-6">Operations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                          {review.users ? `${review.users.first_name} ${review.users.last_name}` : "UNKNOWN_SUBJECT"}
                        </span>
                        <span className="text-[9px] text-slate-400 tracking-widest">{format(new Date(review.created_at), "dd/MM/yyyy")}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-indigo-600 uppercase font-bold tracking-tight">
                      <div className="flex items-center gap-1.5">
                        <Home className="h-3 w-3 text-indigo-400" />
                        {review.hostels?.name || "DELETED_PROPERTY"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 border border-amber-100 text-[10px] uppercase tracking-widest">
                        <Star className="h-3 w-3 fill-amber-500" /> {review.rating}.0
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-[10px] text-slate-600 italic line-clamp-2 max-w-sm uppercase tracking-tight">"{review.comment}"</p>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button 
                        variant="ghost" 
                        onClick={() => setDeleteConfirmId(review.id)}
                        disabled={isDeleting === review.id}
                        className="h-7 text-[9px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-none px-3"
                      >
                        {isDeleting === review.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                        Purge
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ShadDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <ShadDialogContent className="sm:max-w-[400px] rounded-none border-slate-200 font-mono">
          <ShadDialogHeader className="border-b border-slate-100 pb-4">
            <ShadDialogTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-600">
              <AlertTriangle className="h-4 w-4" /> Security_Protocol: Purge_Content
            </ShadDialogTitle>
            <ShadDialogDescription className="text-[10px] uppercase tracking-wider text-slate-400">
              Confirm permanent removal of student feedback from registry.
            </ShadDialogDescription>
          </ShadDialogHeader>
          <div className="py-4">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest leading-relaxed">
              WARNING: This action cannot be reversed. The feedback data will be permanently purged from the central database.
            </p>
          </div>
          <ShadDialogFooter className="border-t border-slate-100 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmId(null)}
              className="rounded-none text-[10px] font-bold uppercase tracking-widest h-9 border-slate-200"
            >
              Abort_Action
            </Button>
            <Button 
              onClick={handleDeleteReview}
              disabled={!!isDeleting}
              className="rounded-none bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold uppercase tracking-widest h-9"
            >
              {isDeleting ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
              Confirm_Purge
            </Button>
          </ShadDialogFooter>
        </ShadDialogContent>
      </ShadDialog>
    </motion.div>
  );
}
