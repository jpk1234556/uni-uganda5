import { Card, CardContent } from "@/components/ui/card";
import { Filter, Download, LineChart, PieChart, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ReportsManager() {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<"this_month" | "last_30_days" | "all_time">("this_month");

  const dateRangeLabel = useMemo(() => {
    if (dateRange === "this_month") return "THIS_MONTH";
    if (dateRange === "last_30_days") return "LAST_30_DAYS";
    return "ALL_TIME";
  }, [dateRange]);

  const getStartDate = () => {
    if (dateRange === "all_time") return null;

    const now = new Date();
    if (dateRange === "this_month") {
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }

    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    return last30.toISOString();
  };

  const handleCycleDateRange = () => {
    setDateRange((prev) => {
      if (prev === "this_month") return "last_30_days";
      if (prev === "last_30_days") return "all_time";
      return "this_month";
    });
  };

  const escapeCsv = (value: unknown) => {
    const raw = String(value ?? "");
    return `"${raw.replace(/"/g, '""')}"`;
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);

      let query = supabase
        .from("bookings")
        .select(`
          id,
          status,
          move_in_date,
          created_at,
          users!bookings_student_id_fkey(first_name, last_name, email),
          hostels(name)
        `)
        .order("created_at", { ascending: false });

      const startDate = getStartDate();
      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.info("No records found for the selected date range");
        return;
      }

      const header = [
        "Booking ID",
        "Student Name",
        "Student Email",
        "Hostel",
        "Status",
        "Move In Date",
        "Created At",
      ];

      const rows = data.map((booking: any) => [
        booking.id,
        booking.users ? `${booking.users.first_name ?? ""} ${booking.users.last_name ?? ""}`.trim() : "Unknown",
        booking.users?.email ?? "",
        booking.hostels?.name ?? "",
        booking.status ?? "",
        booking.move_in_date ?? "",
        booking.created_at ?? "",
      ]);

      const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `admin-bookings-${dateRange}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("CSV exported successfully");
    } catch (error) {
      toast.error("Failed to export report data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfigureAutomation = () => {
    navigate("/admin/settings");
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Data_Intelligence</span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">System_Analytics</h2>
          <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest">METRIC_GENERATION_AND_REVENUE_AUDITING</p>
        </div>
        
        <div className="flex items-center gap-3">
           <Button onClick={handleCycleDateRange} variant="outline" className="h-10 text-[10px] font-bold uppercase tracking-widest text-slate-600 border-slate-200 hover:bg-slate-50 rounded-none px-4 gap-2">
             <Filter className="h-3.5 w-3.5" /> {dateRangeLabel}
           </Button>
           <Button onClick={handleExportCsv} disabled={isExporting} className="h-10 text-[10px] font-bold uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white rounded-none px-6 shadow-sm gap-2">
             <Download className="h-3.5 w-3.5" /> {isExporting ? "EXPORTING..." : "GENERATE_CSV"}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200 rounded-none shadow-sm bg-white overflow-hidden h-80 flex flex-col items-center justify-center p-8 border-dashed border-2">
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="h-12 w-12 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <LineChart className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">Revenue_Growth_Plot</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono leading-relaxed">
              INSUFFICIENT_DATA: FINANCIAL_PLOTTING_REQUIRES_30_DAYS_OF_MOBILE_MONEY_STREAMS.
            </p>
          </div>
        </Card>
        
        <Card className="border-slate-200 rounded-none shadow-sm bg-white overflow-hidden h-80 flex flex-col items-center justify-center p-8 border-dashed border-2">
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="h-12 w-12 rounded-none bg-slate-50 border border-slate-200 flex items-center justify-center mb-4">
              <PieChart className="h-6 w-6 text-slate-300" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">User_Demographics</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono leading-relaxed">
              VISUAL_BREAKDOWN_OF_STUDENTS_VS_HOSTEL_OWNERS_ACTIVE_ON_PLATFORM_CORE.
            </p>
          </div>
        </Card>
      </div>

      <Card className="border-slate-200 rounded-none shadow-sm bg-slate-900 overflow-hidden">
        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Automation_Protocol</span>
            </div>
            <h3 className="text-lg font-bold text-white uppercase tracking-tight">Automated_Monthly_Reports</h3>
            <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider leading-relaxed">
              CONFIGURE_SYSTEM_TO_AUTO_GENERATE_PDF_REPORTS_ON_THE_1ST_OF_EVERY_MONTH_SUMMARIZING_BOOKINGS_PAYMENTS_AND_REGISTRATIONS.
            </p>
          </div>
          <Button onClick={handleConfigureAutomation} className="bg-white hover:bg-slate-100 text-slate-900 text-[10px] font-bold uppercase tracking-widest rounded-none h-10 px-8 whitespace-nowrap">
            Configure_Automation
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
