import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, UserPlus, Shield, Terminal, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

export default function Settings() {
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [autoApproveHostels, setAutoApproveHostels] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin-platform-settings");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as {
        requireEmailVerification?: boolean;
        autoApproveHostels?: boolean;
      };

      if (typeof parsed.requireEmailVerification === "boolean") {
        setRequireEmailVerification(parsed.requireEmailVerification);
      }
      if (typeof parsed.autoApproveHostels === "boolean") {
        setAutoApproveHostels(parsed.autoApproveHostels);
      }
    } catch {
      localStorage.removeItem("admin-platform-settings");
    }
  }, []);

  const handleSaveSettings = () => {
    try {
      setIsSaving(true);
      localStorage.setItem(
        "admin-platform-settings",
        JSON.stringify({ requireEmailVerification, autoApproveHostels })
      );
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }

    try {
      setIsInviting(true);
      const inviteLink = `${window.location.origin}/auth?invite=${encodeURIComponent(email)}&role=super_admin`;
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard");
      setInviteEmail("");
    } catch {
      toast.error("Could not copy invite link");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }} 
      className="space-y-6 max-w-5xl"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-slate-900 shadow-[0_0_8px_rgba(15,23,42,0.4)]" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">System_Config</span>
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">Platform_Settings</h2>
          <p className="text-slate-500 text-[10px] font-mono mt-1 uppercase tracking-widest">MANAGE_APPLICATION_CORE_AND_ADMINISTRATIVE_PROFILES</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Configs */}
        <Card className="border-slate-200 rounded-none shadow-sm bg-white overflow-hidden">
          <div className="bg-slate-50/50 border-b border-slate-200 p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-none bg-white border border-slate-200 flex items-center justify-center">
              <Shield className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Security_Protocol</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">GLOBAL_AUTH_AND_SECURITY_RULES</p>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-8">
            <div className="flex items-center justify-between group">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Require_Email_Verification</Label>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">NEW_USERS_MUST_VALIDATE_IDENTITY_TO_BOOK.</p>
              </div>
              <Switch
                checked={requireEmailVerification}
                onCheckedChange={setRequireEmailVerification}
                className="data-[state=checked]:bg-slate-900"
              />
            </div>
            
            <div className="flex items-center justify-between group">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Auto_Approve_Hostels</Label>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">BYPASS_MANUAL_VERIFICATION_FOR_NEW_LISTINGS.</p>
              </div>
              <Switch
                checked={autoApproveHostels}
                onCheckedChange={setAutoApproveHostels}
                className="data-[state=checked]:bg-slate-900"
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full h-10 text-[10px] font-bold uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white rounded-none shadow-sm gap-2">
                <Save className="h-3.5 w-3.5" /> {isSaving ? "SAVING_CHANGES..." : "COMMIT_SETTINGS"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add New Admin */}
        <Card className="border-slate-200 rounded-none shadow-sm bg-white overflow-hidden">
          <div className="bg-slate-50/50 border-b border-slate-200 p-4 flex items-center gap-3">
            <div className="h-8 w-8 rounded-none bg-white border border-slate-200 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-slate-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Access_Control</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">GRANT_SUPER_ADMIN_PRIVILEGES</p>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-900">Admin_Email_Address</Label>
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="COLLEAGUE@UNINEST.UG"
                className="h-10 text-[11px] font-mono uppercase tracking-widest border-slate-200 rounded-none focus-visible:ring-slate-900"
              />
            </div>
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-none flex gap-3">
              <Terminal className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider leading-relaxed">
                INVITED_USERS_WILL_RECEIVE_A_SECURE_LINK_TO_INITIALIZE_SUPER_ADMIN_CREDENTIALS._FULL_ACCESS_TO_USERS_PAYOUTS_AND_SYSTEM_CORE_WILL_BE_GRANTED.
              </p>
            </div>
            
            <Button onClick={handleSendInvite} disabled={isInviting} variant="outline" className="w-full h-10 text-[10px] font-bold uppercase tracking-widest text-slate-600 border-slate-200 hover:bg-slate-50 rounded-none gap-2">
              <Lock className="h-3.5 w-3.5" /> {isInviting ? "GENERATING_INVITE..." : "GENERATE_INVITE_LINK"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
