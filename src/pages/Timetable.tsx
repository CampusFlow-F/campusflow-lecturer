import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";

interface TimetableSlot {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subject: string;
  class: string;
  room: string | null;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const Timetable = () => {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const { toast } = useToast();

  const fetchTimetable = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("timetable")
      .select("*")
      .eq("lecturer_id", user.id)
      .order("day_of_week")
      .order("start_time");

    if (error) {
      toast({
        title: "Error fetching timetable",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const slotData = {
      lecturer_id: user.id,
      day_of_week: formData.get("day") as string,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      subject: formData.get("subject") as string,
      class: formData.get("class") as string,
      room: formData.get("room") as string || null,
    };

    if (editingSlot) {
      const { error } = await supabase
        .from("timetable")
        .update(slotData)
        .eq("id", editingSlot.id);

      if (error) {
        toast({
          title: "Error updating slot",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Timetable slot updated" });
        fetchTimetable();
        setDialogOpen(false);
        setEditingSlot(null);
      }
    } else {
      const { error } = await supabase.from("timetable").insert([slotData]);

      if (error) {
        toast({
          title: "Error adding slot",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Timetable slot added" });
        fetchTimetable();
        setDialogOpen(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this slot?")) return;

    const { error } = await supabase.from("timetable").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error deleting slot",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Timetable slot deleted" });
      fetchTimetable();
    }
  };

  const getSlotsByDay = (day: string) => {
    return slots.filter((slot) => slot.day_of_week === day);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Timetable</h2>
          <p className="text-muted-foreground">Manage your weekly schedule</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingSlot(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Slot
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingSlot ? "Edit Slot" : "Add New Slot"}
                </DialogTitle>
                <DialogDescription>
                  Enter the timetable slot details
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="day">Day of Week</Label>
                  <Select name="day" defaultValue={editingSlot?.day_of_week} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Start Time</Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="time"
                      defaultValue={editingSlot?.start_time}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">End Time</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="time"
                      defaultValue={editingSlot?.end_time}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    defaultValue={editingSlot?.subject}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Input
                    id="class"
                    name="class"
                    defaultValue={editingSlot?.class}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room (Optional)</Label>
                  <Input
                    id="room"
                    name="room"
                    defaultValue={editingSlot?.room || ""}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingSlot ? "Update" : "Add"} Slot
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {daysOfWeek.map((day) => {
          const daySlots = getSlotsByDay(day);
          return (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="text-lg">{day}</CardTitle>
              </CardHeader>
              <CardContent>
                {daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No classes scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {slot.start_time} - {slot.end_time}
                            </span>
                          </div>
                          <div className="mt-1 text-sm">
                            <span className="font-medium">{slot.subject}</span>
                            <span className="text-muted-foreground"> • {slot.class}</span>
                            {slot.room && (
                              <span className="text-muted-foreground"> • Room {slot.room}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingSlot(slot);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(slot.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
