import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ClubAdminDashboard from "./pages/ClubAdminDashboard";
import CreateEvent from "./pages/CreateEvent";
import EditEvent from "./pages/EditEvent";
import CreateClub from "./pages/CreateClub";
import CampusHubAdminDashboard from "./pages/CampusHubAdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetails />} />
            
            {/* Student Dashboard - For students and club_admins */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole={["student", "club_admin"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Club Admin Dashboard - For club_admins only */}
            <Route
              path="/club-admin-dashboard"
              element={
                <ProtectedRoute requiredRole="club_admin">
                  <ClubAdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Create Club - For students and club_admins */}
            <Route
              path="/create-club"
              element={
                <ProtectedRoute requiredRole={["student", "club_admin"]}>
                  <CreateClub />
                </ProtectedRoute>
              }
            />
            
            {/* Create Event - For students and club_admins */}
            <Route
              path="/admin/create-event"
              element={
                <ProtectedRoute requiredRole={["student", "club_admin"]}>
                  <CreateEvent />
                </ProtectedRoute>
              }
            />
            
            {/* Edit Event - For students and club_admins */}
            <Route
              path="/admin/edit-event/:id"
              element={
                <ProtectedRoute requiredRole={["student", "club_admin"]}>
                  <EditEvent />
                </ProtectedRoute>
              }
            />
            
            {/* Campus Hub Admin Dashboard - For admin only */}
            <Route
              path="/campus-hub-admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CampusHubAdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Legacy Admin Dashboard - For admin only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
