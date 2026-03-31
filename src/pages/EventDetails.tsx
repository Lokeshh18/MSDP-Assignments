import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, MapPin, ArrowLeft, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: ev } = await supabase.from("events").select("*").eq("id", id!).single();
      setEvent(ev);

      if (user) {
        const { data: reg } = await supabase
          .from("registrations")
          .select("*")
          .eq("event_id", id!)
          .eq("student_id", user.id)
          .maybeSingle();
        setRegistration(reg);
      }
      setLoading(false);
    };
    fetch();
  }, [id, user]);

  const handleRegister = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setRegistering(true);
    const { error } = await supabase.from("registrations").insert({
      student_id: user.id,
      event_id: id!,
    });
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Registered!", description: "Your registration is pending approval." });
      const { data: reg } = await supabase
        .from("registrations")
        .select("*")
        .eq("event_id", id!)
        .eq("student_id", user.id)
        .maybeSingle();
      setRegistration(reg);
    }
    setRegistering(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-20 text-center">
          <p className="text-lg text-muted-foreground">Event not found</p>
        </div>
      </div>
    );
  }

  const statusColor = registration?.status === "approved"
    ? "bg-success text-success-foreground"
    : registration?.status === "rejected"
    ? "bg-destructive text-destructive-foreground"
    : "bg-warning text-warning-foreground";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-8">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {event.poster_image && (
          <div className="mb-6 overflow-hidden rounded-xl">
            <img src={event.poster_image} alt={event.title} className="w-full object-cover max-h-80" />
          </div>
        )}

        <Badge variant="secondary" className="mb-3">{event.club_name}</Badge>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-4">{event.title}</h1>

        <div className="mb-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" /> {format(new Date(event.date), "MMMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> {event.time}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" /> {event.location}
          </span>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {event.description || "No description provided."}
            </p>
          </CardContent>
        </Card>

        {role !== "admin" && (
          <div>
            {registration ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <span className="text-sm font-medium">You're registered</span>
                <Badge className={statusColor}>{registration.status}</Badge>
              </div>
            ) : (
              <Button onClick={handleRegister} disabled={registering} size="lg">
                {registering ? "Registering..." : "Register for this Event"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
