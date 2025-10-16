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
import { Plus, Pencil, Trash2, Calendar, Lock, Unlock, FileText, Upload, X } from "lucide-react";
import { format } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  class: string;
  submission_date: string;
  portal_open: boolean;
  created_at: string;
  file_paths: string[] | null;
}

export const Assignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files).filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/msword' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    if (newFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Only PDF and Word documents are allowed",
        variant: "destructive",
      });
    }

    setUploadingFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesToStorage = async (assignmentId: string): Promise<string[]> => {
    const uploadedPaths: string[] = [];

    for (const file of uploadingFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${assignmentId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('assignments')
        .upload(fileName, file);

      if (uploadError) {
        toast({
          title: "Error uploading file",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      uploadedPaths.push(fileName);
    }

    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // First create/update the assignment
    const assignmentData = {
      lecturer_id: user.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      class: formData.get("class") as string,
      submission_date: formData.get("submission_date") as string,
      portal_open: formData.get("portal_open") === "on",
    };

    let assignmentId: string;

    if (editingAssignment) {
      const { data, error } = await supabase
        .from("assignments")
        .update(assignmentData)
        .eq("id", editingAssignment.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error updating assignment",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      assignmentId = editingAssignment.id;
      toast({ title: "Assignment updated successfully" });
    } else {
      const { data, error } = await supabase
        .from("assignments")
        .insert([assignmentData])
        .select()
        .single();

      if (error) {
        toast({
          title: "Error creating assignment",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      assignmentId = data.id;
      toast({ title: "Assignment created successfully" });
    }

    // Upload files if any
    if (uploadingFiles.length > 0) {
      const uploadedFilePaths = await uploadFilesToStorage(assignmentId);
      
      if (uploadedFilePaths.length > 0) {
        // Update assignment with file paths
        const { error: updateError } = await supabase
          .from("assignments")
          .update({ file_paths: uploadedFilePaths })
          .eq("id", assignmentId);

        if (updateError) {
          toast({
            title: "Error updating assignment files",
            description: updateError.message,
            variant: "destructive",
          });
        }
      }
    }

    fetchAssignments();
    setDialogOpen(false);
    setEditingAssignment(null);
    setUploadingFiles([]);
  };

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('assignments')
      .getPublicUrl(filePath);
    return data.publicUrl;
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Assignments</h2>
          <p className="text-xs text-muted-foreground">Create and manage student assignments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAssignment(null)} className="text-sm">
              <Plus className="mr-2 h-3 w-3" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl text-sm">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="text-base">
                  {editingAssignment ? "Edit Assignment" : "Create New Assignment"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Enter the assignment details and upload assignment files
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <div className="space-y-1">
                  <Label htmlFor="title" className="text-xs">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingAssignment?.title}
                    required
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="file" className="text-xs">Assignment Files (PDF/Word)</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <Input
                      id="file"
                      name="file"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Label htmlFor="file" className="cursor-pointer">
                      <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-1" />
                      <p className="text-xs font-medium">Click to upload files</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF and Word documents only
                      </p>
                    </Label>
                  </div>
                  
                  {uploadingFiles.length > 0 && (
                    <div className="space-y-1 mt-3">
                      <p className="text-xs font-medium">Selected files:</p>
                      {uploadingFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded text-xs">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span>{file.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description" className="text-xs">Additional Instructions (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingAssignment?.description || ""}
                    rows={2}
                    placeholder="Add any additional instructions for students..."
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="class" className="text-xs">Class</Label>
                  <Input
                    id="class"
                    name="class"
                    defaultValue={editingAssignment?.class}
                    required
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="submission_date" className="text-xs">Submission Date</Label>
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
                    className="text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="portal_open"
                    name="portal_open"
                    defaultChecked={editingAssignment?.portal_open}
                  />
                  <Label htmlFor="portal_open" className="text-xs">Open submission portal</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="text-sm">
                  {editingAssignment ? "Update" : "Create"} Assignment
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-center text-xs text-muted-foreground">Loading assignments...</p>
            </CardContent>
          </Card>
        ) : assignments.length === 0 ? (
          <Card>
            <CardContent className="p-4">
              <p className="text-center text-xs text-muted-foreground">
                No assignments yet. Create your first assignment!
              </p>
            </CardContent>
          </Card>
        ) : (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="text-sm">
              <CardHeader className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {assignment.title}
                      {assignment.portal_open ? (
                        <Badge variant="default" className="gap-1 text-xs">
                          <Unlock className="h-2 w-2" />
                          Open
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Lock className="h-2 w-2" />
                          Closed
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Due: {format(new Date(assignment.submission_date), "PPp")}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingAssignment(assignment);
                        setUploadingFiles([]);
                        setDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(assignment.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium">Class:</span>
                    <span className="ml-2 text-xs">{assignment.class}</span>
                  </div>
                  
                  {assignment.file_paths && assignment.file_paths.length > 0 && (
                    <div>
                      <span className="text-xs font-medium">Assignment Files:</span>
                      <div className="mt-1 space-y-1">
                        {assignment.file_paths.map((filePath, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <a
                              href={getFileUrl(filePath)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {filePath.split('/').pop()}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {assignment.description && (
                    <div>
                      <span className="text-xs font-medium">Additional Instructions:</span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {assignment.description}
                      </p>
                    </div>
                  )}
                  
                  <Button
                    variant={assignment.portal_open ? "outline" : "default"}
                    onClick={() =>
                      handleTogglePortal(assignment.id, assignment.portal_open)
                    }
                    className="text-xs h-8"
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
