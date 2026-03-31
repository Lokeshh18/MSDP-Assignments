import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, Calendar } from "lucide-react";

export default function Index() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("*")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(6);
      setEvents(data ?? []);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Your campus, one portal
            </div>
            <h1 className="font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Discover &amp; Join<br />
              <span className="text-primary">Campus Events</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-lg">
              The centralized hub for all college events. Browse, register, and never miss what's happening on campus.
            </p>
            <div className="mt-8 flex gap-3">
              <Button size="lg" asChild>
                <Link to="/events">
                  Browse Events <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">All Events in One Place</h3>
            <p className="text-sm text-muted-foreground">No more scattered WhatsApp groups. Find every campus event here.</p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Users className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">Easy Registration</h3>
            <p className="text-sm text-muted-foreground">Register for events with one click and track your registrations.</p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Sparkles className="h-5 w-5 text-success" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">Club Management</h3>
            <p className="text-sm text-muted-foreground">Clubs can manage events, track registrations, and approve students.</p>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="container pb-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-foreground">Upcoming Events</h2>
          <Link to="/events" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground rounded-xl border border-dashed border-border">
            <p>No upcoming events yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} CampusHub. Built for students, by students.
        </div>
      </footer>
    </div>
  );
}
