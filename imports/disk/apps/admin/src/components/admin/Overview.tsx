import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Building, Users, Calendar, ArrowRight, ExternalLink, ShieldCheck, Activity, Database, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Overview() {
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalOwners: 0,
    activeHostels: 0,
    pendingVerifications: 0,
    activeBookings: 0
  });
  const [recentHostels, setRecentHostels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchMetrics();
    
    // Real-time subscriptions
    const usersSub = supabase.channel('admin:users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchMetrics)
      .subscribe();
      
    const hostelsSub = supabase.channel('admin:hostels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hostels' }, fetchMetrics)
      .subscribe();
      
    const bookingsSub = supabase.channel('admin:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, fetchMetrics)
      .subscribe();

    return () => {
      supabase.removeChannel(usersSub);
      supabase.removeChannel(hostelsSub);
      supabase.removeChannel(bookingsSub);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      
      const { data: usersCount, error: usersErr } = await supabase.from('users').select('role');
      const { data: hostelsData, error: hostelsErr } = await supabase.from('hostels').select('id, name, university, status, created_at, users!hostels_owner_id_fkey(first_name, last_name)').order('created_at', { ascending: false });
      const { count: bookingsCount, error: bookingsErr } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'approved');

      if (usersErr || hostelsErr || bookingsErr) throw new Error("Failed to load metrics");

      const studentCount = usersCount?.filter((u: any) => u.role === 'student').length || 0;
      const ownerCount = usersCount?.filter((u: any) => u.role === 'hostel_owner').length || 0;
      const activeHostels = hostelsData?.filter((h: any) => h.status === 'approved').length || 0;
      const pendingHostels = hostelsData?.filter((h: any) => h.status === 'pending').length || 0;

      setMetrics({
        totalStudents: studentCount,
        totalOwners: ownerCount,
        activeHostels,
        pendingVerifications: pendingHostels,
        activeBookings: bookingsCount || 0
      });
      
      setRecentHostels(hostelsData?.slice(0, 5) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="space-y-6 p-6"
    >
      {/* Header Section - Mission Control Style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">System_Overview</span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Mission_Control</h2>
          <p className="text-slate-500 text-xs font-mono mt-1">REAL_TIME_PLATFORM_METRICS_STREAM</p>
        </div>
        
        <div className="flex items-center gap-6 px-4 py-2 bg-white border border-slate-200 rounded shadow-sm">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Local_Time</span>
            <span className="text-sm font-mono font-bold text-slate-700">{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Server_Status</span>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-emerald-600 uppercase">Operational</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard 
          title="PLATFORM_USERS" 
          value={metrics.totalStudents + metrics.totalOwners} 
          loading={isLoading}
          icon={<Users className="h-4 w-4" />}
          color="indigo"
          delay={0.1}
          subValue={`${metrics.totalStudents} STU / ${metrics.totalOwners} OWN`}
        />
        <StatsCard 
          title="ACTIVE_INVENTORY" 
          value={metrics.activeHostels} 
          loading={isLoading}
          icon={<Building className="h-4 w-4" />}
          color="emerald"
          delay={0.2}
          subValue="APPROVED_PROPERTIES"
        />
        <StatsCard 
          title="TOTAL_BOOKINGS" 
          value={metrics.activeBookings} 
          loading={isLoading}
          icon={<Calendar className="h-4 w-4" />}
          color="amber"
          delay={0.3}
          subValue="CONFIRMED_STAYS"
        />
        <StatsCard 
          title="VERIFICATION_REQ" 
          value={metrics.pendingVerifications} 
          loading={isLoading}
          icon={<AlertCircle className="h-4 w-4" />}
          color="rose"
          delay={0.4}
          subValue="PENDING_REVIEW"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
        {/* Recent Hostels */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <Card className="shadow-sm border-slate-200 rounded-none bg-white h-full">
            <CardHeader className="border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" />
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-widest">Recent_Activity_Log</CardTitle>
              </div>
              <Link to="/admin/hostels" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group uppercase tracking-wider">
                View_All <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mb-3" />
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Fetching_Data_Stream...</span>
                </div>
              ) : recentHostels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">No_Records_Found</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 font-mono">
                  {recentHostels.map((hostel) => (
                    <div key={hostel.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 bg-slate-100 border border-slate-200 text-slate-600 rounded flex items-center justify-center text-xs font-bold">
                          {hostel.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{hostel.name}</p>
                          <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">OWNER: {hostel.users ? `${hostel.users.first_name} ${hostel.users.last_name}` : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest">University</span>
                          <span className="text-[10px] font-bold text-slate-600">{hostel.university || 'N/A'}</span>
                        </div>
                        <div className={cn(
                          "px-2 py-0.5 text-[9px] font-bold rounded border uppercase tracking-widest",
                          hostel.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          hostel.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          'bg-rose-50 text-rose-600 border-rose-100'
                        )}>
                          {hostel.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts & Quick Actions */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="shadow-sm border-slate-200 rounded-none bg-white overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-widest">System_Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {metrics.pendingVerifications > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Action_Required</span>
                    </div>
                    <p className="text-[11px] font-mono font-bold text-amber-900 leading-relaxed">
                      {metrics.pendingVerifications} NEW_PROPERTIES_AWAITING_VERIFICATION
                    </p>
                    <p className="text-[10px] text-amber-700/70 mt-2 font-mono leading-relaxed">
                      Review required before public listing.
                    </p>
                  </div>
                  <Link to="/admin/hostels" className="flex w-full items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded transition-all shadow-sm">
                    Open_Verification_Queue <ExternalLink className="ml-2 h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded">
                  <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">System_Clear</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest">No_Pending_Actions</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 rounded-none bg-white overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-slate-400" />
                <CardTitle className="text-xs font-bold text-slate-800 uppercase tracking-widest">Database_Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Connection</span>
                <span className="text-[10px] font-mono font-bold text-emerald-500 uppercase">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Latency</span>
                <span className="text-[10px] font-mono font-bold text-slate-700 uppercase">24ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sync_State</span>
                <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase">Realtime</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function StatsCard({ title, value, loading, icon, color, delay, subValue }: { title: string; value: string | number; loading: boolean; icon: React.ReactNode; color: string; delay: number; subValue: string }) {
  const colorClasses: Record<string, string> = {
    indigo: "text-indigo-500 bg-indigo-500/5 border-indigo-500/20",
    emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/20",
    amber: "text-amber-500 bg-amber-500/5 border-amber-500/20",
    rose: "text-rose-500 bg-rose-500/5 border-rose-500/20",
  };

  const accentClasses: Record<string, string> = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 24 }}
    >
      <Card className="border-slate-200 rounded-none shadow-sm bg-white overflow-hidden relative group hover:border-slate-300 transition-colors">
        <div className={cn("absolute top-0 left-0 w-1 h-full", accentClasses[color])} />
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</span>
            <div className={cn("p-1.5 rounded border", colorClasses[color])}>
              {icon}
            </div>
          </div>
          
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" />
          ) : (
            <div className="flex flex-col">
              <div className="text-3xl font-mono font-black text-slate-900 tracking-tighter leading-none">
                {typeof value === 'number' ? value.toLocaleString().padStart(2, '0') : value}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <div className={cn("h-1 w-1 rounded-full", accentClasses[color])} />
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">{subValue}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
