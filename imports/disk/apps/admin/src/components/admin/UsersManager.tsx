import { useState, useEffect } from "react";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MoreHorizontal, UserCheck, Ban, Shield, Home, GraduationCap, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { DBUser } from "@/types";
import { motion } from "motion/react";

export default function UsersManager() {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, targetRole: 'student' | 'hostel_owner' | 'super_admin') => {
    try {
      const { error } = await supabase.from("users").update({ role: targetRole }).eq("id", userId);
      if (error) throw error;
      toast.success(`User role updated to ${targetRole.replace('_', ' ')}`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean | undefined) => {
    try {
      const newStatus = currentStatus === false ? true : false; 
      const { error } = await supabase.from("users").update({ is_active: newStatus }).eq("id", userId);
      if (error) throw error;
      toast.success(`User account ${newStatus ? 'activated' : 'suspended'}`);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 }
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Module_Access</span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">User_Management</h2>
          <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest">ACCESS_CONTROL_AND_PRIVILEGE_MANAGEMENT</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded shadow-sm">
          <Users className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-widest">Total_Records: {users.length.toString().padStart(3, '0')}</span>
        </div>
      </div>

      <Card className="border-slate-200 rounded-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mb-3" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Streaming_User_Registry...</span>
            </div>
          ) : users.length === 0 ? (
             <div className="py-24 text-center">
               <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">No_Records_Found</span>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="font-mono">
                <TableHeader className="bg-slate-50/80 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[300px] text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Identity_Hash</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Communication_Node</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Access_Level</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Status_Flag</TableHead>
                    <TableHead className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10 pr-6">Operations</TableHead>
                  </TableRow>
                </TableHeader>
                <motion.tbody 
                  variants={containerVariants} 
                  initial="hidden" 
                  animate="visible"
                  className="divide-y divide-slate-100"
                >
                  {users.map((u) => (
                    <motion.tr variants={itemVariants} key={u.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 bg-slate-100 border border-slate-200 text-slate-600 rounded flex items-center justify-center text-[10px] font-bold">
                            {u.first_name?.charAt(0) || "?"}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                              {u.first_name} {u.last_name}
                            </span>
                            <span className="text-[9px] text-slate-400 tracking-widest">UID: {u.id.split('-')[0]}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-600 lowercase">{u.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                          {u.role === 'super_admin' && <Shield className="h-3 w-3 text-indigo-500" />}
                          {u.role === 'hostel_owner' && <Home className="h-3 w-3 text-amber-500" />}
                          {u.role === 'student' && <GraduationCap className="h-3 w-3 text-emerald-500" />}
                          {u.role.replace('_', ' ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest",
                          u.is_active === false ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                        )}>
                          {u.is_active === false ? "Suspended" : "Active"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-slate-200 rounded" disabled={u.role === 'super_admin'}>
                              <MoreHorizontal className="h-3.5 w-3.5 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-none shadow-xl border-slate-200 p-1 font-mono">
                            <DropdownMenuLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2 py-1.5">Security_Protocol</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleToggleStatus(u.id, u.is_active)} className="cursor-pointer focus:bg-slate-100 text-[10px] font-bold uppercase tracking-widest px-2 py-2">
                              {u.is_active === false ? <><UserCheck className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Restore_Access</> : <><Ban className="mr-2 h-3.5 w-3.5 text-rose-500" /> Suspend_Account</>}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator className="bg-slate-100" />
                            <DropdownMenuLabel className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2 py-1.5">Privilege_Shift</DropdownMenuLabel>
                            
                            {u.role !== 'student' && (
                              <DropdownMenuItem onClick={() => handleUpdateRole(u.id, 'student')} className="cursor-pointer focus:bg-slate-100 text-[10px] font-bold uppercase tracking-widest px-2 py-2">
                                <GraduationCap className="mr-2 h-3.5 w-3.5 text-emerald-500" /> Demote_To_Student
                              </DropdownMenuItem>
                            )}
                            {u.role !== 'hostel_owner' && (
                              <DropdownMenuItem onClick={() => handleUpdateRole(u.id, 'hostel_owner')} className="cursor-pointer focus:bg-slate-100 text-[10px] font-bold uppercase tracking-widest px-2 py-2">
                                <Home className="mr-2 h-3.5 w-3.5 text-amber-500" /> Promote_To_Owner
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
