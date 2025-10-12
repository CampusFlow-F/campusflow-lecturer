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
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Trash2, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

interface StudyMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  class: string;
  subject: string;
  created_at: string;
}

export const StudyMaterials = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchMaterials = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("study_materials")
      .select("*")
      .eq("lecturer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching materials",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMaterials(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const materialData = {
      lecturer_id: user.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      file_url: formData.get("file_url") as string || null,
      class: formData.get("class") as string,
      subject: formData.get("subject") as string,
    };

    const { error } = await supabase.from("study_materials").insert([materialData]);

    if (error) {
      toast({
        title: "Error adding material",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Study material added successfully" });
      fetchMaterials();
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    const { error } = await supabase.from("study_materials").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting material",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Study material deleted successfully" });
      fetchMaterials();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Study Materials</h2>
          <p className="text-muted-foreground">Share resources with your students</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add Study Material</DialogTitle>
                <DialogDescription>
                  Share resources with your students
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Input id="class" name="class" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file_url">File URL (Optional)</Label>
                  <Input
                    id="file_url"
                    name="file_url"
                    type="url"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Material</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading materials...</p>
            </CardContent>
          </Card>
        ) : materials.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                No study materials yet. Add your first material!
              </p>
            </CardContent>
          </Card>
        ) : (
          materials.map((material) => (
            <Card key={material.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {material.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(material.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="font-medium">Subject:</span>
                      <span className="ml-2">{material.subject}</span>
                    </div>
                    <div>
                      <span className="font-medium">Class:</span>
                      <span className="ml-2">{material.class}</span>
                    </div>
                  </div>
                  {material.description && (
                    <div>
                      <span className="text-sm font-medium">Description:</span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {material.description}
                      </p>
                    </div>
                  )}
                  {material.file_url && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View File
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Added {format(new Date(material.created_at), "PPp")}
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
