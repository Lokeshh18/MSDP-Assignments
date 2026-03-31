import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateClub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    poster_image: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.from("clubs").insert({
        name: form.name,
        description: form.description,
        poster_image: form.poster_image || null,
        admin_id: user!.id,
        admin_email: user!.email!,
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
          title: "Club Created!", 
          description: "Your club is pending approval from the CampusHub admin." 
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
            <CardTitle className="font-heading text-2xl">Create New Club</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your club will be reviewed and approved by the CampusHub admin before it becomes visible.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Club Name *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g., Programming Club"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  rows={5}
                  placeholder="Tell us about your club..."
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
                {loading ? "Creating..." : "Create Club"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
