import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, Calendar, Lock, Unlock } from "lucide-react";
import { format } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  class: string;
  submission_date: string;
  portal_open: boolean;
  created_at: string;
}

export const Assignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const { toast } = useToast();

  const fetchAssignments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("lecturer_id", user.id)
      .order("submission_date", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching assignments",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAssignments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const assignmentData = {
      lecturer_id: user.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      class: formData.get("class") as string,
      submission_date: formData.get("submission_date") as string,
      portal_open: formData.get("portal_open") === "on",
    };

    if (editingAssignment) {
      const { error } = await supabase
        .from("assignments")
        .update(assignmentData)
        .eq("id", editingAssignment.id);

      if (error) {
        toast({
          title: "Error updating assignment",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Assignment updated successfully" });
        fetchAssignments();
        setDialogOpen(false);
        setEditingAssignment(null);
      }
    } else {
      const { error } = await supabase.from("assignments").insert([assignmentData]);

      if (error) {
        toast({
          title: "Error creating assignment",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Assignment created successfully" });
        fetchAssignments();
        setDialogOpen(false);
      }
    }
  };

  const handleTogglePortal = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("assignments")
      .update({ portal_open: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error updating portal status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: `Portal ${!currentStatus ? "opened" : "closed"}`,
      });
      fetchAssignments();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    const { error } = await supabase.from("assignments").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting assignment",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Assignment deleted successfully" });
      fetchAssignments();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Assignments</h2>
          <p className="text-muted-foreground">Create and manage student assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAssignment(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingAssignment ? "Edit Assignment" : "Create New Assignment"}
                </DialogTitle>
                <DialogDescription>
                  Enter the assignment details below
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingAssignment?.title}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingAssignment?.description || ""}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Input
                    id="class"
                    name="class"
                    defaultValue={editingAssignment?.class}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="submission_date">Submission Date</Label>
                  <Input
                    id="submission_date"
                    name="submission_date"
                    type="datetime-local"
                    defaultValue={
                      editingAssignment
                        ? format(new Date(editingAssignment.submission_date), "yyyy-MM-dd'T'HH:mm")
                        : ""
                    }
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="portal_open"
                    name="portal_open"
                    defaultChecked={editingAssignment?.portal_open}
                  />
                  <Label htmlFor="portal_open">Open submission portal</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingAssignment ? "Update" : "Create"} Assignment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">Loading assignments...</p>
            </CardContent>
          </Card>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                No assignments yet. Create your first assignment!
              </p>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {assignment.title}
                      {assignment.portal_open ? (
                        <Badge variant="default" className="gap-1">
                          <Unlock className="h-3 w-3" />
                          Open
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Closed
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Due: {format(new Date(assignment.submission_date), "PPp")}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingAssignment(assignment);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Class:</span>
                    <span className="ml-2 text-sm">{assignment.class}</span>
                  </div>
                  {assignment.description && (
                    <div>
                      <span className="text-sm font-medium">Description:</span>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {assignment.description}
                      </p>
                    </div>
                  )}
                  <Button
                    variant={assignment.portal_open ? "outline" : "default"}
                    onClick={() =>
                      handleTogglePortal(assignment.id, assignment.portal_open)
                    }
                  >
                    {assignment.portal_open ? "Close Portal" : "Open Portal"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
