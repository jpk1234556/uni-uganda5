import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  MapPin,
  Phone,
  Search,
  UserRound,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

type RoommatePost = {
  id: string;
  student_id: string;
  university: string;
  preferred_location: string | null;
  budget_range: string | null;
  contact_phone: string | null;
  about: string | null;
  is_active: boolean;
  users?: {
    first_name: string | null;
    last_name: string | null;
    course: string | null;
  } | null;
};

const initialForm = {
  university: "",
  preferred_location: "",
  budget_range: "",
  contact_phone: "",
  about: "",
};

export default function Roommates() {
  const { user, dbUser } = useAuth();
  const [posts, setPosts] = useState<RoommatePost[]>([]);
  const [myPost, setMyPost] = useState<RoommatePost | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const hydrateForm = useCallback((post: RoommatePost | null) => {
    if (!post) {
      setForm(initialForm);
      return;
    }
    setForm({
      university: post.university || "",
      preferred_location: post.preferred_location || "",
      budget_range: post.budget_range || "",
      contact_phone: post.contact_phone || "",
      about: post.about || "",
    });
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("roommate_posts")
        .select(
          "*, users!roommate_posts_student_id_fkey(first_name, last_name, course)",
        )
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const records = (data as RoommatePost[]) || [];
      setPosts(records);

      const own = records.find((p) => p.student_id === user?.id) || null;
      setMyPost(own);
      if (own) {
        hydrateForm(own);
      } else {
        setForm((prev) => ({
          ...prev,
          university: dbUser?.course ? prev.university : prev.university,
        }));
      }
    } catch (error: any) {
      const message = String(error?.message || "");
      if (message.toLowerCase().includes("roommate_posts")) {
        toast.error(
          "Roommates module is not ready. Run phase21_roommates_marketplace.sql in Supabase first.",
        );
      } else {
        toast.error("Failed to load roommate posts");
      }
    } finally {
      setIsLoading(false);
    }
  }, [dbUser?.course, hydrateForm, user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const visiblePosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return posts.filter((post) => {
      if (post.student_id === user?.id) return false;
      if (!q) return true;
      return [
        post.university,
        post.preferred_location,
        post.about,
        post.users?.first_name,
        post.users?.last_name,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [posts, searchTerm, user?.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in as a student to post.");
      return;
    }

    if (!form.university.trim()) {
      toast.error("University is required.");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        student_id: user.id,
        university: form.university.trim(),
        preferred_location: form.preferred_location.trim() || null,
        budget_range: form.budget_range.trim() || null,
        contact_phone:
          form.contact_phone.trim() || dbUser?.phone_number || null,
        about: form.about.trim() || null,
        is_active: true,
      };

      const { error } = await supabase
        .from("roommate_posts")
        .upsert(payload, { onConflict: "student_id" });

      if (error) throw error;

      toast.success(
        myPost ? "Roommate post updated." : "Roommate post published.",
      );
      fetchPosts();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save roommate post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!myPost) return;
    try {
      const { error } = await supabase
        .from("roommate_posts")
        .update({ is_active: false })
        .eq("student_id", myPost.student_id);
      if (error) throw error;
      toast.success("Your roommate post is now hidden.");
      setMyPost(null);
      hydrateForm(null);
      fetchPosts();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update post");
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Find Roommates
        </h1>
        <p className="text-slate-600 mt-2">
          Post your roommate needs and discover students searching around your
          university.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-slate-200 shadow-sm h-fit">
          <CardHeader>
            <CardTitle>
              {myPost ? "Update My Listing" : "Create My Listing"}
            </CardTitle>
            <CardDescription>
              Your post helps other students contact you for shared
              accommodation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Input
                  id="university"
                  value={form.university}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, university: e.target.value }))
                  }
                  placeholder="e.g. Makerere University"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Preferred Location</Label>
                <Input
                  id="location"
                  value={form.preferred_location}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      preferred_location: e.target.value,
                    }))
                  }
                  placeholder="e.g. Kikoni"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget Range</Label>
                <Input
                  id="budget"
                  value={form.budget_range}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      budget_range: e.target.value,
                    }))
                  }
                  placeholder="e.g. 400k - 700k UGX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Contact Phone</Label>
                <Input
                  id="phone"
                  value={form.contact_phone}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      contact_phone: e.target.value,
                    }))
                  }
                  placeholder="e.g. +256 700 000 000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About / Preferences</Label>
                <Textarea
                  id="about"
                  value={form.about}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, about: e.target.value }))
                  }
                  placeholder="Share your habits, preferred room type, move-in period, etc."
                  className="min-h-24"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  {myPost ? "Update Listing" : "Publish Listing"}
                </Button>
                {myPost ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDeactivate}
                  >
                    Hide
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-slate-200"
              placeholder="Search by university, location, or name"
            />
          </div>

          {isLoading ? (
            <div className="py-14 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : visiblePosts.length === 0 ? (
            <Card className="border-dashed border-slate-300">
              <CardContent className="py-12 text-center text-slate-500">
                No active roommate posts found yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visiblePosts.map((post) => (
                <Card key={post.id} className="border-slate-200 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <UserRound className="h-4 w-4 text-primary" />
                          {(post.users?.first_name || "Student") +
                            " " +
                            (post.users?.last_name || "")}
                        </CardTitle>
                        <CardDescription>
                          {post.users?.course || "Student"}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span>
                        {post.university}
                        {post.preferred_location
                          ? ` - ${post.preferred_location}`
                          : ""}
                      </span>
                    </p>
                    {post.budget_range ? (
                      <p className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-slate-400" />
                        <span>{post.budget_range}</span>
                      </p>
                    ) : null}
                    {post.contact_phone ? (
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{post.contact_phone}</span>
                      </p>
                    ) : null}
                    {post.about ? (
                      <p className="pt-2 border-t border-slate-100 text-slate-700">
                        {post.about}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
