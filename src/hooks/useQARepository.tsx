import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

// TypeScript interfaces
interface QAItemSource {
  section: string;
  page?: number;
  content: string;
  exactText?: string;
  relevance?: 'high' | 'medium' | 'low';
  context?: string;
  highlightURL?: string;
}

interface QAItem {
  id: string;
  trial_id: string;
  question: string;
  answer: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[] | null;
  is_verified?: boolean;
  source?: string | null;
  sources?: QAItemSource[] | null;
  members?: {
    name: string;
    profiles: {
      first_name?: string;
      last_name?: string;
    } | null;
  } | null;
}

interface CreateQAItemData {
  trial_id: string;
  question: string;
  answer: string;
  tags?: string[];
  source?: string;
  sources?: QAItemSource[];
}

export function useQARepository(trialId?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to get all QA items for a trial
  const qaQuery = useQuery({
    queryKey: ["qa-repository", trialId],
    queryFn: async (): Promise<QAItem[]> => {
      if (!trialId) return [];

      const { data, error } = await supabase
        .from("qa_repository")
        .select(`
          *,
          members:created_by (
            name,
            profiles:profile_id (
              first_name,
              last_name
            )
          )
        `)
        .eq("trial_id", trialId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching QA repository:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!trialId && !!user,
  });

  // Mutation to add a new QA item
  const addQAItemMutation = useMutation({
    mutationFn: async (data: CreateQAItemData): Promise<QAItem> => {
      if (!user) throw new Error("User not authenticated");

      // Get member_id from members table
      const { data: memberData, error: memberError } = await supabase
        .from("members")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (memberError || !memberData) {
        console.error("Error finding member:", memberError);
        throw new Error(`Member not found for user profile: ${user.id}`);
      }

      const qaItem = {
        ...data,
        created_by: memberData.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_verified: false,
        source: data.source || 'ai',
      };

      const { data: insertedData, error } = await supabase
        .from("qa_repository")
        .insert(qaItem)
        .select(`
          *,
          members:created_by (
            name,
            profiles:profile_id (
              first_name,
              last_name
            )
          )
        `)
        .single();

      if (error) {
        console.error("Error adding QA item:", error);
        throw error;
      }

      return insertedData;
    },
    onSuccess: (data) => {
      // Invalidate and refetch QA repository data
      queryClient.invalidateQueries({ queryKey: ["qa-repository", data.trial_id] });
      
      toast({
        title: "Added to Q&A Repository",
        description: "Question and answer saved successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to add QA item:", error);
      toast({
        title: "Failed to Add",
        description: "Could not save to Q&A repository",
        variant: "destructive",
      });
    },
  });

  // Mutation to toggle verified status
  const toggleVerifiedMutation = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }): Promise<void> => {
      const { error } = await supabase
        .from("qa_repository")
        .update({
          is_verified: isVerified,
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) {
        console.error("Error toggling verified:", error);
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      // Update the cache optimistically
      queryClient.setQueryData(["qa-repository", trialId], (old: QAItem[] | undefined) => {
        if (!old) return old;
        return old.map(item =>
          item.id === variables.id
            ? { ...item, is_verified: variables.isVerified }
            : item
        );
      });
    },
  });

  // Mutation to delete a QA item
  const deleteQAItemMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("qa_repository")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting QA item:", error);
        throw error;
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.setQueryData(["qa-repository", trialId], (old: QAItem[] | undefined) => {
        if (!old) return old;
        return old.filter(item => item.id !== deletedId);
      });

      toast({
        title: "Deleted",
        description: "Q&A item removed from repository",
      });
    },
    onError: (error) => {
      console.error("Failed to delete QA item:", error);
      toast({
        title: "Delete Failed",
        description: "Could not remove Q&A item",
        variant: "destructive",
      });
    },
  });

  // Helper function to add a QA item
  const addQAItem = async (
    prompt: string,
    response: string,
    trialId: string,
    tags?: string[],
    sources?: QAItemSource[]
  ): Promise<QAItem> => {
    return addQAItemMutation.mutateAsync({
      trial_id: trialId,
      question: prompt,
      answer: response,
      tags: tags ?? [],
      source: 'ai',
      sources: sources ?? [],
    });
  };

  // Helper function to search QA items
  const searchQAItems = (query: string): QAItem[] => {
    if (!qaQuery.data || !query.trim()) return qaQuery.data || [];

    const searchTerm = query.toLowerCase();
    return qaQuery.data.filter(item =>
      item.question.toLowerCase().includes(searchTerm) ||
      item.answer.toLowerCase().includes(searchTerm) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
    );
  };

  // Helper function to get verified items
  const getVerifiedItems = (): QAItem[] => {
    if (!qaQuery.data) return [];
    return qaQuery.data.filter(item => item.is_verified);
  };

  // Helper function to get recent items
  const getRecentItems = (limit: number = 5): QAItem[] => {
    if (!qaQuery.data) return [];
    return qaQuery.data.slice(0, limit);
  };

  return {
    // Data
    qaItems: qaQuery.data || [],
    isLoading: qaQuery.isLoading,
    error: qaQuery.error,

    // Mutations
    addQAItem,
    isAdding: addQAItemMutation.isPending,
    toggleVerified: toggleVerifiedMutation.mutate,
    isTogglingVerified: toggleVerifiedMutation.isPending,
    deleteQAItem: deleteQAItemMutation.mutate,
    isDeleting: deleteQAItemMutation.isPending,

    // Helper functions
    searchQAItems,
    getVerifiedItems,
    getRecentItems,

    // Refetch function
    refetch: qaQuery.refetch,
  };
}