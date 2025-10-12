import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Calendar, Mail, User } from "lucide-react";
import { format } from "date-fns";

interface Consultation {
  id: string;
  student_name: string;
  student_email: string;
  consultation_date: string;
  reason: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
}

export const Consultations = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConsultations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("consultations")
      .select("*")
      .eq("lecturer_id", user.id)
      .order("consultation_date", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching consultations",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setConsultations((data || []) as Consultation[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const handleStatusUpdate = async (id: string, status: "approved" | "declined") => {
    const { error } = await supabase
      .from("consultations")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error updating consultation",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: `Consultation ${status}`,
        description: `The consultation request has been ${status}.`,
      });
      fetchConsultations();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success text-success-foreground";
      case "declined":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-warning text-warning-foreground";
    }
  };

  const pendingConsultations = consultations.filter((c) => c.status === "pending");
  const processedConsultations = consultations.filter((c) => c.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Consultations</h2>
        <p className="text-muted-foreground">Manage student consultation requests</p>
      </div>

      {pendingConsultations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Pending Requests</h3>
          {pendingConsultations.map((consultation) => (
            <Card key={consultation.id} className="border-warning/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {consultation.student_name}
                  </span>
                  <Badge className={getStatusColor(consultation.status)}>
                    {consultation.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {consultation.student_email}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(consultation.consultation_date), "PPp")}
                  </div>
                  <div>
                    <span className="text-sm font-medium">Reason:</span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {consultation.reason}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleStatusUpdate(consultation.id, "approved")}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleStatusUpdate(consultation.id, "declined")}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {processedConsultations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Processed Requests</h3>
          {processedConsultations.map((consultation) => (
            <Card key={consultation.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {consultation.student_name}
                  </span>
                  <Badge className={getStatusColor(consultation.status)}>
                    {consultation.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {consultation.student_email}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(consultation.consultation_date), "PPp")}
                  </div>
                  <div>
                    <span className="text-sm font-medium">Reason:</span>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {consultation.reason}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading consultations...</p>
          </CardContent>
        </Card>
      )}

      {!loading && consultations.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No consultation requests yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
