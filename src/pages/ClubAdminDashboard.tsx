import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Users, Plus, Trash2, Pencil, Check, X, Clock, Edit } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Club {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  poster_image: string | null;
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

export default function ClubAdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editClub, setEditClub] = useState<Club | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch clubs owned by this user
      const { data: clubsData, error: clubsError } = await supabase
        .from("clubs")
        .select("*")
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false });

      if (clubsError) throw clubsError;

      // Fetch events for this user's clubs
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", user.id)
        .order("date", { ascending: false });

      if (eventsError) throw eventsError;

      setClubs(clubsData ?? []);
      setEvents(eventsData ?? []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const deleteClub = async (clubId: string) => {
    if (!confirm("Are you sure you want to delete this club?")) return;
    
    const { error } = await supabase.from("clubs").delete().eq("id", clubId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Club deleted" });
      fetchData();
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Event deleted" });
      fetchData();
    }
  };

  const updateClub = async () => {
    if (!editClub) return;
    
    const { error } = await supabase
      .from("clubs")
      .update({
        name: editClub.name,
        description: editClub.description,
        poster_image: editClub.poster_image,
      })
      .eq("id", editClub.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Club updated" });
      setIsEditDialogOpen(false);
      fetchData();
    }
  };

  const statusColor = (status: string) =>
    status === "approved"
      ? "bg-success text-success-foreground"
      : status === "rejected"
      ? "bg-destructive text-destructive-foreground"
      : "bg-warning text-warning-foreground";

  const statusIcon = (status: string) => {
    if (status === "approved") return <Check className="h-3 w-3 mr-1" />;
    if (status === "rejected") return <X className="h-3 w-3 mr-1" />;
    return <Clock className="h-3 w-3 mr-1" />;
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
            <h1 className="font-heading text-3xl font-bold text-foreground">Club Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your clubs and events</p>
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

        <Tabs defaultValue="clubs">
          <TabsList>
            <TabsTrigger value="clubs">My Clubs</TabsTrigger>
            <TabsTrigger value="events">My Events</TabsTrigger>
          </TabsList>

          <TabsContent value="clubs" className="mt-4">
            {clubs.length === 0 ? (
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
                {clubs.map((club) => (
                  <Card key={club.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{club.name}</CardTitle>
                          <CardDescription>{club.description || "No description"}</CardDescription>
                        </div>
                        <Badge className={statusColor(club.status)}>
                          {statusIcon(club.status)}
                          {club.status}
                        </Badge>
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
                          onClick={() => {
                            setEditClub(club);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" /> Edit
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
                      {club.status === "rejected" && (
                        <p className="text-xs text-destructive mt-2">
                          This club was rejected. Please contact admin for more information.
                        </p>
                      )}
                      {club.status === "approved" && (
                        <p className="text-xs text-success mt-2">
                          ✓ This club is approved and visible to all users
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4">
            {events.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-heading font-semibold text-lg mb-2">No Events Yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first event for your club</p>
                  <Button onClick={() => navigate("/admin/create-event")}>
                    <Plus className="h-4 w-4 mr-1" /> Create Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <h3 className="font-heading font-bold text-foreground">{event.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.date), "MMM d, yyyy")} · {event.location} · {event.club_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColor(event.status)}>
                          {statusIcon(event.status)}
                          {event.status}
                        </Badge>
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

      {/* Edit Club Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>
              Make changes to your club information.
            </DialogDescription>
          </DialogHeader>
          {editClub && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Club Name</Label>
                <Input
                  id="edit-name"
                  value={editClub.name}
                  onChange={(e) => setEditClub({ ...editClub, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editClub.description || ""}
                  onChange={(e) => setEditClub({ ...editClub, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-poster">Poster Image URL</Label>
                <Input
                  id="edit-poster"
                  value={editClub.poster_image || ""}
                  onChange={(e) => setEditClub({ ...editClub, poster_image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={updateClub}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
