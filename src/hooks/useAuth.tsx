import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    metadata?: any
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  // member: {
  //   id: string;
  //   name: string;
  //   email: string;
  //   profile_id: string;
  // } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // const [member, setMember] = useState<any>(null);

  // Get authenticated member details from members table
  // const getMember = async (setter: (data: any) => void) => {
  //   const { data, error } = await supabase
  //     .from("members")
  //     .select("id,name, email, profile_id")
  //     .eq("profile_id", user?.id)
  //     .single();

  //   if (error) {
  //     console.error("Error getting member:", error);
  //     return null;
  //   }
  //   console.log(data);
  //   setter(data);
  //   return data;
  // };

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // The database trigger now handles profile creation automatically
      // when email is confirmed, so we don't need to manually create profiles here
      if (event === "SIGNED_IN" && session?.user) {
        console.log("User signed in:", session.user.email);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
  // member,

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
