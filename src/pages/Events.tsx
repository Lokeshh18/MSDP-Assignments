import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import EventCard from "@/components/EventCard";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [clubFilter, setClubFilter] = useState("all");
  const [clubs, setClubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      // Fetch only approved events
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("status", "approved")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true });
      setEvents(data ?? []);
      const uniqueClubs = [...new Set((data ?? []).map((e: any) => e.club_name))];
      setClubs(uniqueClubs);
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const filtered = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());
    const matchesClub = clubFilter === "all" || e.club_name === clubFilter;
    return matchesSearch && matchesClub;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">Upcoming Events</h1>
          <p className="text-muted-foreground">Discover and register for campus events</p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={clubFilter} onValueChange={setClubFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Clubs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clubs</SelectItem>
              {clubs.map((club) => (
                <SelectItem key={club} value={club}>{club}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <p className="text-lg">No events found</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
