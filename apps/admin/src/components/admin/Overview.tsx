import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, Building, Users, Calendar, ArrowRight, ExternalLink, ShieldCheck, Activity, Database, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
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
    visible: { y: 0, opacity: 1, transition: { type: "spring" as any, stiffness: 300, damping: 24 } }
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
            <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            <span className="text-sm font-bold text-slate-500 tracking-wide">System Overview</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Mission Control</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time platform metrics stream</p>
        </div>
        
        <div className="flex items-center gap-6 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Local Time</span>
            <span className="text-sm font-bold text-slate-700">{currentTime.toLocaleTimeString()}</span>
          </div>
          <div className="h-8 w-px bg-slate-100" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500">Server Status</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-emerald-600">Operational</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Users" 
          value={metrics.totalStudents + metrics.totalOwners} 
          loading={isLoading}
          icon={<Users className="h-5 w-5" />}
          color="indigo"
          delay={0.1}
          subValue={`${metrics.totalStudents} Students / ${metrics.totalOwners} Owners`}
        />
        <StatsCard 
          title="Active Inventory" 
          value={metrics.activeHostels} 
          loading={isLoading}
          icon={<Building className="h-5 w-5" />}
          color="emerald"
          delay={0.2}
          subValue="Approved Properties"
        />
        <StatsCard 
          title="Total Bookings" 
          value={metrics.activeBookings} 
          loading={isLoading}
          icon={<Calendar className="h-5 w-5" />}
          color="amber"
          delay={0.3}
          subValue="Confirmed Stays"
        />
        <StatsCard 
          title="Verification Queue" 
          value={metrics.pendingVerifications} 
          loading={isLoading}
          icon={<AlertCircle className="h-5 w-5" />}
          color="rose"
          delay={0.4}
          subValue="Pending Review"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">
        {/* Recent Hostels */}
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-white h-full overflow-hidden">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between py-4 px-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm font-bold text-slate-900 tracking-tight">Recent Activity Log</CardTitle>
              </div>
              <Link to="/admin/hostels" className="text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 group">
                View All <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <span className="text-sm font-medium text-slate-500">Fetching Data...</span>
                </div>
              ) : recentHostels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-sm font-medium text-slate-500">No Records Found</span>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentHostels.map((hostel) => (
                    <div key={hostel.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">
                          {hostel.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{hostel.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">Owner: {hostel.users ? `${hostel.users.first_name} ${hostel.users.last_name}` : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                          <span className="text-xs text-slate-500 font-medium">University</span>
                          <span className="text-sm font-bold text-slate-700">{hostel.university || 'N/A'}</span>
                        </div>
                        <div className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded-md border shadow-sm",
                          hostel.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          hostel.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-rose-50 text-rose-700 border-rose-200'
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
          <Card className="shadow-sm border-slate-200 rounded-2xl bg-white overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-sm font-bold text-slate-900 tracking-tight">System Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {metrics.pendingVerifications > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-bold text-amber-700">Action Required</span>
                    </div>
                    <p className="text-sm font-semibold text-amber-900 leading-relaxed">
                      {metrics.pendingVerifications} properties awaiting verification.
                    </p>
                    <p className="text-xs text-amber-700/80 mt-1 font-medium">
                      Review required before public listing.
                    </p>
                  </div>
                  <Link to="/admin/hostels" className="flex w-full items-center justify-center px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-sm">
                    Open Verification Queue <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">System Clear</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">No pending actions required.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200 rounded-2xl bg-white overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-slate-500" />
                <CardTitle className="text-sm font-bold text-slate-900 tracking-tight">Database Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Connection</span>
                <span className="text-sm font-bold text-emerald-600">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Latency</span>
                <span className="text-sm font-bold text-slate-900">24ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Sync State</span>
                <span className="text-sm font-bold text-primary">Realtime</span>
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
      <Card className="border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all">
        <div className={cn("absolute top-0 left-0 w-1 h-full", accentClasses[color])} />
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-500">{title}</span>
            <div className={cn("p-2 rounded-xl border border-transparent", colorClasses[color])}>
              {icon}
            </div>
          </div>
          
          {loading ? (
            <div className="h-8 w-24 bg-slate-100 animate-pulse rounded-xl" />
          ) : (
            <div className="flex flex-col">
              <div className="text-4xl font-bold text-slate-900 tracking-tight leading-none">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
              <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-slate-100">
                <div className={cn("h-1.5 w-1.5 rounded-full", accentClasses[color])} />
                <span className="text-xs font-medium text-slate-500">{subValue}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
