import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { user, role, isCampusHubAdmin, isClubAdmin, isStudent, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("Navbar Auth State:", {
      user: user?.email || null,
      role,
      isCampusHubAdmin,
      isClubAdmin,
      isStudent,
    });
  }, [user, role, isCampusHubAdmin, isClubAdmin, isStudent]);

  const handleSignOut = async () => {
    console.log("[Navbar] Sign out clicked");
    setSigningOut(true);
    try {
      await signOut();
      console.log("[Navbar] Sign out successful, navigating to /");
      navigate("/");
    } catch (err) {
      console.error("[Navbar] Sign out error:", err);
    } finally {
      setSigningOut(false);
    }
  };

  // Determine dashboard link based on role
  const getDashboardLink = () => {
    if (isCampusHubAdmin) return "/campus-hub-admin";
    if (isClubAdmin) return "/club-admin-dashboard";
    if (isStudent) return "/dashboard";
    return "/dashboard";
  };

  const getDashboardLabel = () => {
    if (isCampusHubAdmin) return "Admin Panel";
    if (isClubAdmin) return "Club Dashboard";
    return "Dashboard";
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-primary">
          <GraduationCap className="h-7 w-7" />
          CampusHub
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/events" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Events
          </Link>

          {user && (
            <>
              {/* Dashboard link - changes based on role */}
              <Link 
                to={getDashboardLink()} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {getDashboardLabel()}
              </Link>
              
              {/* Show Create Club for students and club admins (not admin) */}
              {(isStudent || isClubAdmin) && (
                <Link to="/create-club" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Create Club
                </Link>
              )}
              
              {/* Show Create Event for students and club admins (not admin) */}
              {(isStudent || isClubAdmin) && (
                <Link to="/admin/create-event" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Create Event
                </Link>
              )}
            </>
          )}

          {user ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing out...
                </span>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-1" /> Sign Out
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Register
              </Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden flex flex-col gap-3">
          <Link to="/events" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>Events</Link>

          {user && (
            <>
              <Link 
                to={getDashboardLink()} 
                className="text-sm font-medium" 
                onClick={() => setMobileOpen(false)}
              >
                {getDashboardLabel()}
              </Link>
              
              {(isStudent || isClubAdmin) && (
                <>
                  <Link to="/create-club" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>
                    Create Club
                  </Link>
                  <Link to="/admin/create-event" className="text-sm font-medium" onClick={() => setMobileOpen(false)}>
                    Create Event
                  </Link>
                </>
              )}
            </>
          )}

          {user ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? "Signing out..." : "Sign Out"}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { navigate("/login"); setMobileOpen(false); }}>Login</Button>
              <Button size="sm" onClick={() => { navigate("/register"); setMobileOpen(false); }}>Register</Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
