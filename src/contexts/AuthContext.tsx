import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "student" | "club_admin" | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isCampusHubAdmin: boolean;
  isClubAdmin: boolean;
  isStudent: boolean;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isCampusHubAdmin, setIsCampusHubAdmin] = useState(false);
  const [isClubAdmin, setIsClubAdmin] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [loading, setLoading] = useState(true);

  // Update role flags whenever role changes
  useEffect(() => {
    if (role) {
      setIsCampusHubAdmin(role === "admin");
      setIsClubAdmin(role === "club_admin");
      setIsStudent(role === "student");
    } else {
      setIsCampusHubAdmin(false);
      setIsClubAdmin(false);
      setIsStudent(false);
    }
  }, [role]);

  const fetchRole = async (userId: string, userEmail: string): Promise<AppRole> => {
    return new Promise((resolve) => {
      // Set a 2-second timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.warn("[fetchRole] Timeout after 2 seconds, using fallback");
        // Fallback based on email
        if (userEmail === "lokeshhofficial18@gmail.com") {
          resolve("admin");
        } else {
          resolve("student");
        }
      }, 2000);

      console.log("[fetchRole] Starting for user:", userId);
      
      // Query the database
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single()
        .then(({ data, error }) => {
          // Clear timeout
          clearTimeout(timeoutId);
          
          console.log("[fetchRole] DB query result:", { data, error });

          if (error) {
            console.warn("[fetchRole] Error from DB:", error.message, error.code);
            
            // Fallback: check email for admin
            if (userEmail === "lokeshhofficial18@gmail.com") {
              console.log("[fetchRole] Using email fallback: admin");
              resolve("admin");
            } else {
              console.log("[fetchRole] Using default fallback: student");
              resolve("student");
            }
            return;
          }

          const userRole = (data?.role as AppRole) ?? "student";
          console.log("[fetchRole] Returning role:", userRole);
          resolve(userRole);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          console.error("[fetchRole] Exception caught:", err);
          
          // Fallback based on email
          if (userEmail === "lokeshhofficial18@gmail.com") {
            resolve("admin");
          } else {
            resolve("student");
          }
        });
    });
  };

  const handleSession = async (session: Session | null) => {
    console.log("[handleSession] Called with session:", session ? "YES" : "NO");
    
    setSession(session);
    setUser(session?.user ?? null);

    if (session?.user) {
      const userEmail = session.user.email || "";
      console.log("[handleSession] Fetching role for:", userEmail);
      
      const userRole = await fetchRole(session.user.id, userEmail);
      console.log("[handleSession] Role set to:", userRole);
      setRole(userRole);
    } else {
      console.log("[handleSession] No session, clearing role");
      setRole(null);
    }

    console.log("[handleSession] Loading set to FALSE, role:", role);
    setLoading(false);
  };

  useEffect(() => {
    console.log("[AuthProvider] Setting up auth state listener");
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[onAuthStateChange] Event:", event, "Session:", session ? "YES" : "NO");
        await handleSession(session);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[getSession] Result:", session ? "HAS SESSION" : "NO SESSION");
      handleSession(session);
    });

    return () => {
      console.log("[AuthProvider] Cleaning up subscription");
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    console.log("[signIn] Attempting login for:", email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("[signIn] Error:", error);
      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please check your credentials.");
      }
      if (error.message.includes("Email not confirmed")) {
        throw new Error("Please verify your email address before signing in.");
      }
      throw error;
    }

    console.log("[signIn] Success:", data.user?.email);
  };

  const signOut = async () => {
    console.log("[signOut] Called");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("[signOut] Error:", error);
        throw error;
      }
      console.log("[signOut] Success - clearing state");
      
      // Manually clear state to ensure UI updates
      setRole(null);
      setUser(null);
      setSession(null);
      setIsCampusHubAdmin(false);
      setIsClubAdmin(false);
      setIsStudent(false);
    } catch (err) {
      console.error("[signOut] Exception:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      role,
      isCampusHubAdmin,
      isClubAdmin,
      isStudent,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
