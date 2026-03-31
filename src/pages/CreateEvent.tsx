import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Club {
  id: string;
  name: string;
  status: string;
}

export default function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    club_id: "",
    club_name: "",
    poster_image: "",
  });

  useEffect(() => {
    const fetchClubs = async () => {
      const { data } = await supabase
        .from("clubs")
        .select("id, name, status")
        .eq("status", "approved");
      setClubs(data || []);
    };
    fetchClubs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClubSelect = (clubId: string) => {
    const selectedClub = clubs.find(c => c.id === clubId);
    setForm({
      ...form,
      club_id: clubId,
      club_name: selectedClub?.name || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.club_id) {
      toast({
        title: "Error",
        description: "Please select a club",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("events").insert({
        title: form.title,
        description: form.description,
        date: form.date,
        time: form.time,
        location: form.location,
        club_id: form.club_id,
        club_name: form.club_name,
        poster_image: form.poster_image || null,
        created_by: user!.id,
        status: "pending",
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Event created!",
          description: "Your event is pending approval from the CampusHub admin."
        });
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Create New Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your event will be reviewed and approved by the CampusHub admin before it becomes visible.
              </AlertDescription>
            </Alert>

            {clubs.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No approved clubs available. Please{" "}
                  <Link to="/create-club" className="font-medium underline">create a club</Link>{" "}
                  first and wait for it to be approved.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="club">Select Club *</Label>
                  <Select value={form.club_id} onValueChange={handleClubSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a club..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs.map((club) => (
                        <SelectItem key={club.id} value={club.id}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      value={form.time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poster_image">Poster Image URL (optional)</Label>
                  <Input
                    id="poster_image"
                    name="poster_image"
                    value={form.poster_image}
                    onChange={handleChange}
                    placeholder="https://..."
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Event"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
