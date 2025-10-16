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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Trash2, Calendar, FileText, Video, Folder, Link, Upload, X } from "lucide-react";
import { format } from "date-fns";

interface StudyMaterial {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  class: string;
  subject: string;
  created_at: string;
  type: 'document' | 'video' | 'folder';
  video_links?: string[];
  folder_items?: string[];
}

export const StudyMaterials = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('document');
  const [videoLinks, setVideoLinks] = useState<string[]>(['']);
  const [folderItems, setFolderItems] = useState<string[]>(['']);
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([]);
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

  const addVideoLink = () => {
    setVideoLinks([...videoLinks, '']);
  };

  const updateVideoLink = (index: number, value: string) => {
    const newLinks = [...videoLinks];
    newLinks[index] = value;
    setVideoLinks(newLinks);
  };

  const removeVideoLink = (index: number) => {
    setVideoLinks(videoLinks.filter((_, i) => i !== index));
  };

  const addFolderItem = () => {
    setFolderItems([...folderItems, '']);
  };

  const updateFolderItem = (index: number, value: string) => {
    const newItems = [...folderItems];
    newItems[index] = value;
    setFolderItems(newItems);
  };

  const removeFolderItem = (index: number) => {
    setFolderItems(folderItems.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    setUploadingFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesToStorage = async (materialId: string): Promise<string[]> => {
    const uploadedPaths: string[] = [];

    for (const file of uploadingFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${materialId}/${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('study-materials')
        .upload(fileName, file);

      if (uploadError) {
        toast({
          title: "Error uploading file",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
        continue;
      }

      const { data } = supabase.storage
        .from('study-materials')
        .getPublicUrl(fileName);

      uploadedPaths.push(data.publicUrl);
    }

    return uploadedPaths;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Common data for all types
    const materialData: any = {
      lecturer_id: user.id,
      title: formData.get("title") as string,
      description: formData.get("description") as string || null,
      class: formData.get("class") as string,
      subject: formData.get("subject") as string,
      type: activeTab,
    };

    // Handle different types
    if (activeTab === 'video') {
      materialData.video_links = videoLinks.filter(link => link.trim() !== '');
    } else if (activeTab === 'folder') {
      materialData.folder_items = folderItems.filter(item => item.trim() !== '');
    }

    // Insert the material first
    const { data, error } = await supabase
      .from("study_materials")
      .insert([materialData])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error adding material",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    // Upload files if any (for document type)
    if (activeTab === 'document' && uploadingFiles.length > 0) {
      const uploadedFileUrls = await uploadFilesToStorage(data.id);
      
      if (uploadedFileUrls.length > 0) {
        // Update material with file URLs
        const { error: updateError } = await supabase
          .from("study_materials")
          .update({ file_url: uploadedFileUrls[0] }) // Store first file URL, or you can store array
          .eq("id", data.id);

        if (updateError) {
          toast({
            title: "Error updating material files",
            description: updateError.message,
            variant: "destructive",
          });
        }
      }
    }

    toast({ title: "Study material added successfully" });
    fetchMaterials();
    setDialogOpen(false);
    setUploadingFiles([]);
    setVideoLinks(['']);
    setFolderItems(['']);
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'folder':
        return <Folder className="h-5 w-5 text-blue-500" />;
      default:
        return <BookOpen className="h-5 w-5 text-green-500" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      document: { label: 'Document', variant: 'default' as const },
      video: { label: 'Video', variant: 'destructive' as const },
      folder: { label: 'Folder', variant: 'secondary' as const }
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.document;

    return (
      <Badge variant={config.variant} className="ml-2">
        {config.label}
      </Badge>
    );
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
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add Study Material</DialogTitle>
                <DialogDescription>
                  Share different types of resources with your students
                </DialogDescription>
              </DialogHeader>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="document">Document</TabsTrigger>
                  <TabsTrigger value="video">Video Links</TabsTrigger>
                  <TabsTrigger value="folder">Folder</TabsTrigger>
                </TabsList>
                
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

                  <TabsContent value="document" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Upload Files</Label>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                        <Input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium">Click to upload files</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, Word, PowerPoint, etc.
                          </p>
                        </Label>
                      </div>
                      
                      {uploadingFiles.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <p className="text-sm font-medium">Selected files:</p>
                          {uploadingFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{file.name}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="video" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Video Links</Label>
                      {videoLinks.map((link, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            type="url"
                            placeholder="https://youtube.com/..."
                            value={link}
                            onChange={(e) => updateVideoLink(index, e.target.value)}
                          />
                          {videoLinks.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVideoLink(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addVideoLink}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Another Video Link
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="folder" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Folder Items</Label>
                      {folderItems.map((item, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            placeholder="Item name or description"
                            value={item}
                            onChange={(e) => updateFolderItem(index, e.target.value)}
                          />
                          {folderItems.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFolderItem(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addFolderItem}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Another Item
                      </Button>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

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
                    {getFileTypeIcon(material.type)}
                    {material.title}
                    {getTypeBadge(material.type)}
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

                  {/* Document Type Content */}
                  {material.type === 'document' && material.file_url && (
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

                  {/* Video Type Content */}
                  {material.type === 'video' && material.video_links && (
                    <div>
                      <span className="text-sm font-medium">Video Links:</span>
                      <div className="mt-2 space-y-2">
                        {material.video_links.map((link, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-red-500" />
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              Video Link {index + 1}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Folder Type Content */}
                  {material.type === 'folder' && material.folder_items && (
                    <div>
                      <span className="text-sm font-medium">Folder Contents:</span>
                      <div className="mt-2 space-y-1">
                        {material.folder_items.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
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