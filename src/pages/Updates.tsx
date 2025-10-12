import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Bell, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Update {
  id: string;
  title: string;
  content: string;
  target_class: string | null;
  created_at: string;
}

export const Updates = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchUpdates = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("updates")
      .select("*")
      .eq("lecturer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching updates",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setUpdates(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const updateData = {
      lecturer_id: user.id,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      target_class: formData.get("target_class") as string || null,
    };

    const { error } = await supabase.from("updates").insert([updateData]);

    if (error) {
      toast({
        title: "Error posting update",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Update posted successfully" });
      fetchUpdates();
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this update?")) return;

    const { error } = await supabase.from("updates").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting update",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Update deleted successfully" });
      fetchUpdates();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Updates & Announcements</h2>
          <p className="text-muted-foreground">Post updates and announcements for students</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post Update
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Post New Update</DialogTitle>
                <DialogDescription>
                  Share an announcement or update with students
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea id="content" name="content" rows={5} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_class">Target Class (Optional)</Label>
                  <Input
                    id="target_class"
                    name="target_class"
                    placeholder="Leave empty for all classes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Post Update</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading updates...</p>
            </CardContent>
          </Card>
        ) : updates.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                No updates yet. Post your first announcement!
              </p>
            </CardContent>
          </Card>
        ) : (
          updates.map((update) => (
            <Card key={update.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    {update.title}
                  </span>
                  <div className="flex items-center gap-2">
                    {update.target_class && (
                      <Badge variant="secondary">{update.target_class}</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(update.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm whitespace-pre-wrap">{update.content}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Posted {format(new Date(update.created_at), "PPp")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
