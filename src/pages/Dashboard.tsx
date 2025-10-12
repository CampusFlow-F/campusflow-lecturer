import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, FileText, MessageSquare, BookOpen, Bell } from "lucide-react";

export const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    timetableSlots: 0,
    assignments: 0,
    pendingConsultations: 0,
    materials: 0,
    updates: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [students, timetable, assignments, consultations, materials, updates] =
        await Promise.all([
          supabase.from("students").select("*", { count: "exact" }).eq("lecturer_id", user.id),
          supabase.from("timetable").select("*", { count: "exact" }).eq("lecturer_id", user.id),
          supabase.from("assignments").select("*", { count: "exact" }).eq("lecturer_id", user.id),
          supabase
            .from("consultations")
            .select("*", { count: "exact" })
            .eq("lecturer_id", user.id)
            .eq("status", "pending"),
          supabase
            .from("study_materials")
            .select("*", { count: "exact" })
            .eq("lecturer_id", user.id),
          supabase.from("updates").select("*", { count: "exact" }).eq("lecturer_id", user.id),
        ]);

      setStats({
        students: students.count || 0,
        timetableSlots: timetable.count || 0,
        assignments: assignments.count || 0,
        pendingConsultations: consultations.count || 0,
        materials: materials.count || 0,
        updates: updates.count || 0,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Students",
      value: stats.students,
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Timetable Slots",
      value: stats.timetableSlots,
      icon: Calendar,
      color: "text-accent",
    },
    {
      title: "Assignments",
      value: stats.assignments,
      icon: FileText,
      color: "text-success",
    },
    {
      title: "Pending Consultations",
      value: stats.pendingConsultations,
      icon: MessageSquare,
      color: "text-warning",
    },
    {
      title: "Study Materials",
      value: stats.materials,
      icon: BookOpen,
      color: "text-primary",
    },
    {
      title: "Updates Posted",
      value: stats.updates,
      icon: Bell,
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to your lecturer portal</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/students"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Manage Students</div>
              <div className="text-sm text-muted-foreground">
                Add, edit, or remove students from your classes
              </div>
            </a>
            <a
              href="/assignments"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Create Assignment</div>
              <div className="text-sm text-muted-foreground">
                Set up new assignments with submission dates
              </div>
            </a>
            <a
              href="/consultations"
              className="block p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="font-medium">Review Consultations</div>
              <div className="text-sm text-muted-foreground">
                Approve or decline consultation requests
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Activity feed will appear here
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
