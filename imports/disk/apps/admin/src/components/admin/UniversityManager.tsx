import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, School, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function UniversityManager() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newUniName, setNewUniName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("universities")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) {
        // If table doesn't exist, we might get an error.
        // In a real app, we'd handle this or ensure the table exists.
        console.error("Error fetching universities:", error);
        setUniversities([]);
      } else {
        setUniversities(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUniName.trim()) return;

    try {
      setIsAdding(true);
      const { error } = await supabase
        .from("universities")
        .insert([{ name: newUniName.trim() }]);

      if (error) throw error;

      toast.success("University added to registry");
      setNewUniName("");
      fetchUniversities();
    } catch (error: any) {
      toast.error(error.message || "Failed to add university");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This might affect hostel filtering if hostels are still linked to this name.")) return;

    try {
      const { error } = await supabase
        .from("universities")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("University removed from registry");
      fetchUniversities();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete university");
    }
  };

  const filteredUniversities = universities.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            <div className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Institutional_Registry</span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">University_Management</h2>
          <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest">GLOBAL_INSTITUTION_DATABASE_CONTROL</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add University Form */}
        <Card className="border-slate-200 rounded-none shadow-sm bg-white h-fit">
          <CardHeader className="border-b border-slate-50">
            <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-500" /> Register_New_Institution
            </CardTitle>
            <CardDescription className="text-[10px] uppercase tracking-wider">
              Add a new university to the platform filters.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddUniversity} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Institution_Name</label>
                <Input 
                  value={newUniName}
                  onChange={(e) => setNewUniName(e.target.value)}
                  placeholder="E.G. MAKERERE UNIVERSITY"
                  className="rounded-none border-slate-200 text-xs uppercase"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={isAdding}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-none h-10"
              >
                {isAdding ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Plus className="h-3 w-3 mr-2" />}
                Commit_To_Registry
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* University List */}
        <Card className="lg:col-span-2 border-slate-200 rounded-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <School className="h-4 w-4 text-indigo-500" /> Active_Institutions
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-wider">
                  Total registered: {universities.length}
                </CardDescription>
              </div>
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                <Input 
                  placeholder="SEARCH_REGISTRY..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-7 text-[9px] uppercase tracking-widest rounded-none border-slate-200 bg-white"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mb-3" />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Accessing_Registry_Data...</span>
              </div>
            ) : universities.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">No_Institutions_Found</p>
              </div>
            ) : (
              <Table className="font-mono">
                <TableHeader className="bg-slate-50/50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Institution_Identity</TableHead>
                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">Registration_Date</TableHead>
                    <TableHead className="text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10 pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUniversities.map((uni) => (
                    <TableRow key={uni.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                      <TableCell className="py-3">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">{uni.name}</span>
                      </TableCell>
                      <TableCell className="text-[10px] text-slate-500 uppercase tracking-tight">
                        {new Date(uni.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button 
                          onClick={() => handleDelete(uni.id)}
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
