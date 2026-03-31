import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface Club {
  id: string;
  name: string;
  description: string | null;
  admin_email: string;
  status: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  club_name: string;
  status: string;
  created_at: string;
}

export default function CampusHubAdminDashboard() {
  const { toast } = useToast();
  const [pendingClubs, setPendingClubs] = useState<Club[]>([]);
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [approvedClubs, setApprovedClubs] = useState<Club[]>([]);
  const [approvedEvents, setApprovedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [clubsRes, eventsRes] = await Promise.all([
        supabase.from("clubs").select("*"),
        supabase.from("events").select("*"),
      ]);

      const allClubs = clubsRes.data || [];
      const allEvents = eventsRes.data || [];

      setPendingClubs(allClubs.filter(c => c.status === "pending"));
      setApprovedClubs(allClubs.filter(c => c.status === "approved"));
      setPendingEvents(allEvents.filter(e => e.status === "pending"));
      setApprovedEvents(allEvents.filter(e => e.status === "approved"));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClubApproval = async (clubId: string, approved: boolean) => {
    try {
      const status = approved ? "approved" : "rejected";
      const { error } = await supabase
        .from("clubs")
        .update({ status })
        .eq("id", clubId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Club ${status} successfully.`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update club status",
        variant: "destructive",
      });
    }
  };

  const handleEventApproval = async (eventId: string, approved: boolean) => {
    try {
      const status = approved ? "approved" : "rejected";
      const { error } = await supabase
        .from("events")
        .update({ status })
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Event ${status} successfully.`,
      });

      fetchData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
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
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">CampusHub Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Review and approve clubs and events</p>
        </div>

        <Tabs defaultValue="clubs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clubs">Clubs</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="clubs" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" /> Pending Clubs ({pendingClubs.length})
              </h2>
              {pendingClubs.length === 0 ? (
                <p className="text-muted-foreground">No pending clubs</p>
              ) : (
                <div className="grid gap-4">
                  {pendingClubs.map((club) => (
                    <Card key={club.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{club.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{club.admin_email}</p>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{club.description}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleClubApproval(club.id, true)}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleClubApproval(club.id, false)}
                            className="flex items-center gap-2"
                          >
                            <XCircle className="h-4 w-4" /> Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> Approved Clubs ({approvedClubs.length})
              </h2>
              {approvedClubs.length === 0 ? (
                <p className="text-muted-foreground">No approved clubs</p>
              ) : (
                <div className="grid gap-4">
                  {approvedClubs.map((club) => (
                    <Card key={club.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{club.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{club.admin_email}</p>
                          </div>
                          <Badge>Approved</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{club.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" /> Pending Events ({pendingEvents.length})
              </h2>
              {pendingEvents.length === 0 ? (
                <p className="text-muted-foreground">No pending events</p>
              ) : (
                <div className="grid gap-4">
                  {pendingEvents.map((event) => (
                    <Card key={event.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{event.date}</span>
                              <span>{event.club_name}</span>
                            </div>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEventApproval(event.id, true)}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleEventApproval(event.id, false)}
                            className="flex items-center gap-2"
                          >
                            <XCircle className="h-4 w-4" /> Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" /> Approved Events ({approvedEvents.length})
              </h2>
              {approvedEvents.length === 0 ? (
                <p className="text-muted-foreground">No approved events</p>
              ) : (
                <div className="grid gap-4">
                  {approvedEvents.map((event) => (
                    <Card key={event.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span>{event.date}</span>
                              <span>{event.club_name}</span>
                            </div>
                          </div>
                          <Badge>Approved</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
