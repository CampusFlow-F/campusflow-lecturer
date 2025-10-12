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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Report {
  id: string;
  report_type: "sent" | "received";
  student_name: string;
  title: string;
  content: string;
  created_at: string;
}

export const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchReports = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("lecturer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching reports",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setReports((data || []) as Report[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const reportData = {
      lecturer_id: user.id,
      report_type: "sent" as const,
      student_name: formData.get("student_name") as string,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
    };

    const { error } = await supabase.from("reports").insert([reportData]);

    if (error) {
      toast({
        title: "Error creating report",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Report created successfully" });
      fetchReports();
      setDialogOpen(false);
    }
  };

  const sentReports = reports.filter((r) => r.report_type === "sent");
  const receivedReports = reports.filter((r) => r.report_type === "received");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">Manage student reports</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Write Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Write New Report</DialogTitle>
                <DialogDescription>
                  Create a report about a student
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="student_name">Student Name</Label>
                  <Input
                    id="student_name"
                    name="student_name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title</Label>
                  <Input
                    id="title"
                    name="title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Report Content</Label>
                  <Textarea
                    id="content"
                    name="content"
                    rows={6}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Report</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="sent" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sent">Sent Reports ({sentReports.length})</TabsTrigger>
          <TabsTrigger value="received">Received Reports ({receivedReports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="space-y-4 mt-6">
          {sentReports.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No sent reports yet. Write your first report!
                </p>
              </CardContent>
            </Card>
          ) : (
            sentReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {report.title}
                    </span>
                    <Badge variant="default">Sent</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Student:</span>
                      <span className="ml-2 text-sm">{report.student_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(report.created_at), "PPp")}
                    </div>
                    <div>
                      <span className="text-sm font-medium">Content:</span>
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                        {report.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4 mt-6">
          {receivedReports.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No received reports yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            receivedReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {report.title}
                    </span>
                    <Badge variant="secondary">Received</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">From:</span>
                      <span className="ml-2 text-sm">{report.student_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(report.created_at), "PPp")}
                    </div>
                    <div>
                      <span className="text-sm font-medium">Content:</span>
                      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                        {report.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
