import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Receipt, Search, ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export default function PaymentsManager() {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          users!payments_student_id_fkey(first_name, last_name)
        `)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      toast.error("Failed to load financial records");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.users?.first_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Financial_Intelligence</span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Financial_Ledger</h2>
          <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest">TRANSACTION_AUDIT_AND_REVENUE_TRACKING</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input 
            placeholder="SEARCH_BY_TXID_OR_SUBJECT..." 
            className="pl-9 h-10 bg-white border-slate-200 rounded-none text-[10px] font-mono uppercase tracking-widest focus-visible:ring-indigo-500" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-slate-200 rounded-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mb-3" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Accessing_Secure_Ledger...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
                <Receipt className="h-6 w-6 text-slate-300" />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Zero_Transactions_Detected</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider max-w-xs mt-2 font-mono">WAITING_FOR_INBOUND_MOBILE_MONEY_STREAMS</p>
            </div>
          ) : (
            <Table className="font-mono">
              <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Txn_Identity</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Origin_Subject</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Net_Amount</TableHead>
                  <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">System_State</TableHead>
                  <TableHead className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10 pr-6">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 border border-slate-200">
                          {payment.id.split('-')[0].toUpperCase()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                      {payment.users ? `${payment.users.first_name} ${payment.users.last_name}` : "UNKNOWN_ORIGIN"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-slate-900 tracking-tighter">
                          {parseInt(payment.amount).toLocaleString()}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{payment.currency || 'UGX'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest",
                        payment.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      )}>
                        {payment.status === 'completed' ? 'Verified' : payment.status}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-700">{format(new Date(payment.created_at), "dd/MM/yyyy")}</span>
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest">{format(new Date(payment.created_at), "HH:mm:ss")}</span>
                      </div>
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
