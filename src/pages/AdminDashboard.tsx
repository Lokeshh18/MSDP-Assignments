import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Users, ClipboardList, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, upcoming: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: evts } = await supabase.from("events").select("*").order("date", { ascending: false });
    const { data: regs } = await supabase.from("registrations").select("*, events(*)");
    // Fetch profiles for each registration
    if (regs && regs.length > 0) {
      const studentIds = [...new Set(regs.map((r: any) => r.student_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, name, email").in("user_id", studentIds);
      const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
      regs.forEach((r: any) => {
        (r as any).profile = profileMap.get(r.student_id) ?? null;
      });
    }
    
    const today = new Date().toISOString().split("T")[0];
    setEvents(evts ?? []);
    setRegistrations(regs ?? []);
    setStats({
      totalEvents: evts?.length ?? 0,
      totalRegistrations: regs?.length ?? 0,
      upcoming: evts?.filter((e: any) => e.date >= today).length ?? 0,
    });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event deleted" });
      fetchData();
    }
  };

  const updateRegistrationStatus = async (regId: string, status: string) => {
    const { error } = await supabase.from("registrations").update({ status }).eq("id", regId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Registration ${status}` });
      fetchData();
    }
  };

  const statusColor = (status: string) =>
    status === "approved" ? "bg-success text-success-foreground"
    : status === "rejected" ? "bg-destructive text-destructive-foreground"
    : "bg-warning text-warning-foreground";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage events and registrations</p>
          </div>
          <Button onClick={() => navigate("/admin/create-event")}>
            <Plus className="h-4 w-4 mr-1" /> Create Event
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalEvents}</p>
                <p className="text-xs text-muted-foreground">Total Events</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalRegistrations}</p>
                <p className="text-xs text-muted-foreground">Total Registrations</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <ClipboardList className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.upcoming}</p>
                <p className="text-xs text-muted-foreground">Upcoming Events</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="events">
          <TabsList>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : events.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">No events yet. Create your first event!</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-heading font-bold text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {event.club_name} · {format(new Date(event.date), "MMM d, yyyy")} · {event.location}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/edit-event/${event.id}`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteEvent(event.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="registrations" className="mt-4">
            {registrations.length === 0 ? (
              <p className="py-10 text-center text-muted-foreground">No registrations yet.</p>
            ) : (
              <div className="space-y-3">
                {registrations.map((reg) => (
                  <Card key={reg.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-medium text-foreground">{(reg as any).profile?.name ?? "Unknown"}</h3>
                        <p className="text-xs text-muted-foreground">
                          {(reg as any).profile?.email} → {reg.events?.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColor(reg.status)}>{reg.status}</Badge>
                        {reg.status === "pending" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => updateRegistrationStatus(reg.id, "approved")}>
                              <Check className="h-4 w-4 text-success" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => updateRegistrationStatus(reg.id, "rejected")}>
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
