import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "student" | "club_admin" | "admin" | ("student" | "club_admin" | "admin")[];
  requireCampusHubAdmin?: boolean;
  requireClubAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requireCampusHubAdmin = false,
  requireClubAdmin = false,
}: ProtectedRouteProps) {
  const { user, role, isCampusHubAdmin, isClubAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Check Campus Hub Admin requirement
  if (requireCampusHubAdmin && !isCampusHubAdmin) {
    return <Navigate to="/" replace />;
  }

  // Check Club Admin requirement
  if (requireClubAdmin && !isClubAdmin) {
    return <Navigate to="/" replace />;
  }

  // Check role requirement
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
