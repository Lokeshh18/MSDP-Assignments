import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, CalendarDays, Plus, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Registration {
  id: string;
  status: string;
  registered_at: string;
  events: {
    id: string;
    title: string;
    date: string;
    location: string;
  } | null;
}

interface Club {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string;
  status: string;
  created_at: string;
  club_name: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetch = async () => {
      try {
        // Fetch registrations
        const { data: regs } = await supabase
          .from("registrations")
          .select("*, events(*)")
          .eq("student_id", user.id)
          .order("registered_at", { ascending: false });

        // Fetch clubs created by user
        const { data: clubs } = await supabase
          .from("clubs")
          .select("*")
          .eq("admin_id", user.id)
          .order("created_at", { ascending: false });

        // Fetch events created by user
        const { data: events } = await supabase
          .from("events")
          .select("*")
          .eq("created_by", user.id)
          .order("date", { ascending: false });

        setRegistrations(regs ?? []);
        setMyClubs(clubs ?? []);
        setMyEvents(events ?? []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetch();
  }, [user]);

  const statusColor = (status: string) =>
    status === "approved"
      ? "bg-success text-success-foreground"
      : status === "rejected"
      ? "bg-destructive text-destructive-foreground"
      : "bg-warning text-warning-foreground";

  const deleteClub = async (clubId: string) => {
    if (!confirm("Are you sure you want to delete this club?")) return;
    
    const { error } = await supabase.from("clubs").delete().eq("id", clubId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Club deleted" });
      setMyClubs(myClubs.filter(c => c.id !== clubId));
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event deleted" });
      setMyEvents(myEvents.filter(e => e.id !== eventId));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">My Dashboard</h1>
            <p className="text-muted-foreground">Manage your events, clubs, and registrations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/create-club")}>
              <Plus className="h-4 w-4 mr-1" /> Create Club
            </Button>
            <Button onClick={() => navigate("/admin/create-event")}>
              <Plus className="h-4 w-4 mr-1" /> Create Event
            </Button>
          </div>
        </div>

        <Tabs defaultValue="registrations">
          <TabsList>
            <TabsTrigger value="registrations">My Registrations</TabsTrigger>
            <TabsTrigger value="clubs">My Clubs</TabsTrigger>
            <TabsTrigger value="events">My Events</TabsTrigger>
          </TabsList>

          <TabsContent value="registrations" className="mt-4">
            {registrations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-heading font-semibold text-lg mb-2">No Registrations Yet</h3>
                  <p className="text-muted-foreground mb-4">You haven't registered for any events yet.</p>
                  <Link to="/events">
                    <Button>Browse Events</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {registrations.map((reg) => (
                  <Card key={reg.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-heading font-bold text-foreground">{reg.events?.title}</h3>
                        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {reg.events?.date && format(new Date(reg.events.date), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {reg.events?.location}
                          </span>
                        </div>
                      </div>
                      <Badge className={statusColor(reg.status)}>{reg.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="clubs" className="mt-4">
            {myClubs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-heading font-semibold text-lg mb-2">No Clubs Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first club to get started</p>
                  <Button onClick={() => navigate("/create-club")}>
                    <Plus className="h-4 w-4 mr-1" /> Create Club
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {myClubs.map((club) => (
                  <Card key={club.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{club.name}</CardTitle>
                          <CardDescription>{club.description || "No description"}</CardDescription>
                        </div>
                        <Badge className={statusColor(club.status)}>{club.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(club.created_at), "MMM d, yyyy")}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/create-club`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteClub(club.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      {club.status === "pending" && (
                        <p className="text-xs text-warning mt-2">
                          Waiting for Campus Hub Admin approval
                        </p>
                      )}
                      {club.status === "approved" && (
                        <p className="text-xs text-success mt-2">
                          ✓ Approved and visible to all
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            {myEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-heading font-semibold text-lg mb-2">No Events Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first event</p>
                  <Button onClick={() => navigate("/admin/create-event")}>
                    <Plus className="h-4 w-4 mr-1" /> Create Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {myEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-heading font-bold text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.date), "MMM d, yyyy")} · {event.location} · {event.club_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColor(event.status)}>{event.status}</Badge>
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
        </Tabs>
      </div>
    </div>
  );
}
