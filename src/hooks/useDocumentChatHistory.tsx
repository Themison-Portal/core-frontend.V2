import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface ChatMessage {
  id: string;
  role: "user" | "llm";
  content: string;
  sources?: Array<{
    section: string;
    page?: number;
    content: string;
    exactText?: string;
    relevance?: 'high' | 'medium' | 'low';
    context?: string;
    highlightURL?: string;
  }>;
  downloadableTemplates?: any[];
  quickActions?: any[];
  isStreaming?: boolean;
  streamedContent?: string;
}

interface ChatSession {
  id: string;
  user_id: string | null;
  trial_id: string | null;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
  document_id?: string; // From chat_document_links
  messages?: ChatMessage[];
}

interface CreateSessionData {
  trialId: string;
  documentId: string;
  title: string;
}

interface AddMessageData {
  sessionId: string;
  role: "user" | "llm";
  content: string;
}

export function useDocumentChatHistory(trialId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query: Get all chat sessions for user + trial
  const sessionsQuery = useQuery({
    queryKey: ["document-chat-sessions", user?.id, trialId],
    queryFn: async (): Promise<ChatSession[]> => {
      if (!user || !trialId) return [];

      // Get sessions with document links
      const { data: sessions, error: sessionsError } = await supabase
        .from("chat_sessions")
        .select(`
          id,
          user_id,
          trial_id,
          title,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .eq("trial_id", trialId)
        .order("updated_at", { ascending: false });

      if (sessionsError) {
        console.error("Error fetching chat sessions:", sessionsError);
        throw sessionsError;
      }

      // Get document links for these sessions
      const sessionIds = (sessions || []).map((s) => s.id);

      if (sessionIds.length === 0) return [];

      const { data: docLinks, error: linksError } = await supabase
        .from("chat_document_links")
        .select("chat_session_id, document_id")
        .in("chat_session_id", sessionIds);

      if (linksError) {
        console.error("Error fetching document links:", linksError);
      }

      // Merge document_id into sessions
      const sessionsWithDocs = (sessions || []).map((session) => {
        const link = (docLinks || []).find(
          (l) => l.chat_session_id === session.id
        );
        return {
          ...session,
          document_id: link?.document_id,
        };
      });

      return sessionsWithDocs;
    },
    enabled: !!user && !!trialId,
  });

  // Query: Get messages for a specific session
  const getSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching chat messages:", error);
      throw error;
    }

    return (data || []).map((msg) => ({
      id: msg.id,
      role: (msg.role as "user" | "llm") || "user",
      content: msg.content || "",
      // Note: sources/templates/quickActions are NOT stored in DB
      // They would need to be regenerated or stored as JSONB
    }));
  };

  // Mutation: Create new chat session with document link
  const createSessionMutation = useMutation({
    mutationFn: async (data: CreateSessionData): Promise<ChatSession> => {
      if (!user) throw new Error("User not authenticated");

      const now = new Date().toISOString();
      const sessionId = crypto.randomUUID();

      // 1. Create chat_session
      const { data: insertedSession, error: sessionError } = await supabase
        .from("chat_sessions")
        .insert({
          id: sessionId,
          user_id: user.id,
          trial_id: data.trialId,
          title: data.title,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (sessionError) {
        console.error("Error creating chat session:", sessionError);
        throw sessionError;
      }

      // 2. Create chat_document_link
      const { error: linkError } = await supabase
        .from("chat_document_links")
        .insert({
          chat_session_id: sessionId,
          document_id: data.documentId,
          created_at: now,
          usage_count: 1,
          first_used_at: now,
          last_used_at: now,
        });

      if (linkError) {
        console.error("Error creating document link:", linkError);
        // Don't throw - session was created successfully
      }

      return {
        ...insertedSession,
        document_id: data.documentId,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document-chat-sessions", user?.id, trialId],
      });
    },
    onError: (error) => {
      console.error("Failed to create chat session:", error);
      toast({
        title: "Failed to Create Chat",
        description: "Could not create new chat session",
        variant: "destructive",
      });
    },
  });

  // Mutation: Add message to session
  const addMessageMutation = useMutation({
    mutationFn: async (data: AddMessageData): Promise<void> => {
      if (!user) throw new Error("User not authenticated");

      const messageId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Insert message
      const { error: messageError } = await supabase
        .from("chat_messages")
        .insert({
          id: messageId,
          session_id: data.sessionId,
          role: data.role,
          content: data.content,
          created_at: now,
        });

      if (messageError) {
        console.error("Error adding message:", messageError);
        throw messageError;
      }

      // Update session timestamp
      const { error: sessionError } = await supabase
        .from("chat_sessions")
        .update({ updated_at: now })
        .eq("id", data.sessionId);

      if (sessionError) {
        console.error("Error updating session timestamp:", sessionError);
      }

      // Update document link usage - just update timestamp for now
      // Note: usage_count increment skipped due to Supabase 406 error
      await supabase
        .from("chat_document_links")
        .update({ last_used_at: now })
        .eq("chat_session_id", data.sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document-chat-sessions", user?.id, trialId],
      });
    },
    onError: (error) => {
      console.error("Failed to add message:", error);
      // Don't show toast for every message failure - too noisy
    },
  });

  // Mutation: Delete chat session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string): Promise<void> => {
      // Delete messages (if not CASCADE)
      await supabase.from("chat_messages").delete().eq("session_id", sessionId);

      // Delete document links
      await supabase
        .from("chat_document_links")
        .delete()
        .eq("chat_session_id", sessionId);

      // Delete session
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", sessionId);

      if (error) {
        console.error("Error deleting chat session:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["document-chat-sessions", user?.id, trialId],
      });
      toast({
        title: "Chat Deleted",
        description: "Chat session removed successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to delete chat session:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete chat session",
        variant: "destructive",
      });
    },
  });

  // Helper: Create session and add first message atomically
  const createSessionWithMessage = async (
    trialId: string,
    documentId: string,
    userMessage: string
  ): Promise<{ sessionId: string; session: ChatSession }> => {
    const title =
      userMessage.length > 50
        ? userMessage.substring(0, 50) + "..."
        : userMessage;

    const session = await createSessionMutation.mutateAsync({
      trialId,
      documentId,
      title,
    });

    await addMessageMutation.mutateAsync({
      sessionId: session.id,
      role: "user",
      content: userMessage,
    });

    return { sessionId: session.id, session };
  };

  return {
    // Data
    sessions: sessionsQuery.data || [],
    isLoadingSessions: sessionsQuery.isLoading,
    sessionsError: sessionsQuery.error,

    // Mutations
    createSession: createSessionMutation.mutate,
    createSessionAsync: createSessionMutation.mutateAsync,
    isCreatingSession: createSessionMutation.isPending,

    addMessage: addMessageMutation.mutate,
    addMessageAsync: addMessageMutation.mutateAsync,
    isAddingMessage: addMessageMutation.isPending,

    deleteSession: deleteSessionMutation.mutate,
    isDeletingSession: deleteSessionMutation.isPending,

    // Helper functions
    getSessionMessages,
    createSessionWithMessage,

    // Refetch
    refetchSessions: sessionsQuery.refetch,
  };
}
