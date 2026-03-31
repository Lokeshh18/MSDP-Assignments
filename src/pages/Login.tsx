import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GraduationCap, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user, isCampusHubAdmin, isClubAdmin, isStudent, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect based on role when user is logged in and not loading
  useEffect(() => {
    console.log("[Login useEffect] loading:", loading, "user:", user?.email);
    console.log("[Login useEffect] isCampusHubAdmin:", isCampusHubAdmin, "isClubAdmin:", isClubAdmin, "isStudent:", isStudent);
    
    // Only navigate when loading is complete AND user exists AND role is set
    if (!loading && user) {
      console.log("[Login useEffect] Navigating based on role...");
      
      if (isCampusHubAdmin) {
        console.log("[Login useEffect] Redirecting to /campus-hub-admin");
        navigate("/campus-hub-admin", { replace: true });
      } else if (isClubAdmin) {
        console.log("[Login useEffect] Redirecting to /club-admin-dashboard");
        navigate("/club-admin-dashboard", { replace: true });
      } else if (isStudent) {
        console.log("[Login useEffect] Redirecting to /dashboard");
        navigate("/dashboard", { replace: true });
      } else {
        console.log("[Login useEffect] No role matched, redirecting to /");
        navigate("/", { replace: true });
      }
    }
  }, [user, loading, isCampusHubAdmin, isClubAdmin, isStudent, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setError(null);
    
    try {
      console.log("[Login] Submit clicked, calling signIn...");
      await signIn(email, password);
      toast({ 
        title: "Welcome back!", 
        description: "You have successfully signed in."
      });
      // Navigation will happen in the useEffect above when auth state updates
    } catch (err: any) {
      console.error("[Login] Error:", err);
      const errorMessage = err.message || "Failed to sign in. Please try again.";
      setError(errorMessage);
      toast({ 
        title: "Login failed", 
        description: errorMessage, 
        variant: "destructive" 
      });
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your CampusHub account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@college.edu" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                autoComplete="email"
                disabled={loggingIn}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                autoComplete="current-password"
                disabled={loggingIn}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loggingIn}>
              {loggingIn ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          
          <div className="mt-4 space-y-2">
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline font-medium">Register</Link>
            </p>
            
            <div className="rounded-lg bg-muted p-3 text-xs">
              <p className="font-medium mb-1">Test Accounts:</p>
              <p className="text-muted-foreground">
                <strong>Campus Admin:</strong> lokeshhofficial18@gmail.com
              </p>
              <p className="text-muted-foreground">
                <strong>Club Admin:</strong> Use "admin" in email
              </p>
              <p className="text-muted-foreground">
                <strong>Student:</strong> Any other email
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
