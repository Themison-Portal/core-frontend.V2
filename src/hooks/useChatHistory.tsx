import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { ChatMessage, ChatSession } from "@/components/chat/types";

interface DbChatMessage {
  id: string;
  session_id: string | null;
  role: string | null;
  content: string | null;
  created_at: string | null;
  document_chunk_ids: string[] | null;
}

interface DbChatSession {
  id: string;
  user_id: string | null;
  title: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface CreateSessionData {
  title?: string;
}

interface AddMessageData {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
}

export function useChatHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query: Get all chat sessions for the user
  const sessionsQuery = useQuery({
    queryKey: ["chat-sessions", user?.id],
    queryFn: async (): Promise<ChatSession[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching chat sessions:", error);
        throw error;
      }

      return (data || []).map((session: DbChatSession) => ({
        id: session.id,
        title: session.title || "New Chat",
        messages: [], // Messages loaded separately
        createdAt: session.created_at ? new Date(session.created_at) : new Date(),
        updatedAt: session.updated_at ? new Date(session.updated_at) : new Date(),
      }));
    },
    enabled: !!user,
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

    return (data || []).map((msg: DbChatMessage) => ({
      role: (msg.role as "user" | "assistant") || "user",
      content: msg.content || "",
      timestamp: msg.created_at ? new Date(msg.created_at) : new Date(),
    }));
  };

  // Mutation: Create new chat session
  const createSessionMutation = useMutation({
    mutationFn: async (data: CreateSessionData): Promise<ChatSession> => {
      if (!user) throw new Error("User not authenticated");

      const now = new Date().toISOString();
      const sessionId = crypto.randomUUID();

      const { data: insertedData, error } = await supabase
        .from("chat_sessions")
        .insert({
          id: sessionId,
          user_id: user.id,
          title: data.title || "New Chat",
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating chat session:", error);
        throw error;
      }

      return {
        id: insertedData.id,
        title: insertedData.title || "New Chat",
        messages: [],
        createdAt: new Date(insertedData.created_at),
        updatedAt: new Date(insertedData.updated_at),
      };
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", user?.id] });
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
    },
    onSuccess: (_, variables) => {
      // Invalidate sessions list to refresh "updated_at"
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", user?.id] });
    },
    onError: (error) => {
      console.error("Failed to add message:", error);
      toast({
        title: "Failed to Save Message",
        description: "Could not save your message",
        variant: "destructive",
      });
    },
  });

  // Mutation: Delete chat session
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string): Promise<void> => {
      // Messages are deleted via CASCADE in DB (if configured)
      // Otherwise, delete messages first
      await supabase
        .from("chat_messages")
        .delete()
        .eq("session_id", sessionId);

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
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", user?.id] });
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

  // Mutation: Update session title
  const updateSessionTitleMutation = useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: string; title: string }): Promise<void> => {
      const { error } = await supabase
        .from("chat_sessions")
        .update({
          title,
          updated_at: new Date().toISOString()
        })
        .eq("id", sessionId);

      if (error) {
        console.error("Error updating session title:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions", user?.id] });
    },
  });

  // Helper: Create session and add first message atomically
  const createSessionWithMessage = async (
    userMessage: string
  ): Promise<{ sessionId: string; session: ChatSession }> => {
    const session = await createSessionMutation.mutateAsync({
      title: userMessage.substring(0, 40) + (userMessage.length > 40 ? "..." : ""),
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

    updateSessionTitle: updateSessionTitleMutation.mutate,

    // Helper functions
    getSessionMessages,
    createSessionWithMessage,

    // Refetch
    refetchSessions: sessionsQuery.refetch,
  };
}
