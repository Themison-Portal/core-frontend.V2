import React, { useState } from "react";
import { useQARepository } from "@/hooks/useQARepository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import {
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  BookOpen,
  MessageSquare,
  Clock,
  Filter,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function to format dates (simple implementation)
function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return options?.addSuffix ? 'just now' : '0 minutes';
  } else if (diffInMinutes < 60) {
    return options?.addSuffix ? `${diffInMinutes} minutes ago` : `${diffInMinutes} minutes`;
  } else if (diffInHours < 24) {
    return options?.addSuffix ? `${diffInHours} hours ago` : `${diffInHours} hours`;
  } else {
    return options?.addSuffix ? `${diffInDays} days ago` : `${diffInDays} days`;
  }
}

interface QARepositoryProps {
  trial: {
    id: string;
    name: string;
  };
}

type FilterType = 'all' | 'verified' | 'recent';

export function QARepository({ trial }: QARepositoryProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const {
    qaItems,
    isLoading,
    error,
    toggleVerified,
    isTogglingVerified,
    deleteQAItem,
    isDeleting,
    searchQAItems,
    getVerifiedItems,
    getRecentItems,
  } = useQARepository(trial.id);

  // Apply search and filtering
  const getFilteredItems = () => {
    let items = qaItems;

    // Apply search
    if (searchQuery.trim()) {
      items = searchQAItems(searchQuery);
    }

    // Apply filter
    switch (filter) {
      case 'verified':
        return items.filter(item => item.is_verified);
      case 'recent':
        return items.slice(0, 10);
      default:
        return items;
    }
  };

  const filteredItems = getFilteredItems();

  const handleToggleVerified = (id: string, currentValue: boolean | undefined) => {
    toggleVerified({ id, isVerified: !currentValue });
  };

  const handleDeleteItem = (id: string) => {
    deleteQAItem(id);
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500">Loading Q&A Repository...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-red-600">Error Loading Repository</h3>
            <p className="text-gray-500 mt-2">There was an error loading the Q&A repository.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search questions and answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filter} onValueChange={(value: FilterType) => setFilter(value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items ({qaItems.length})</SelectItem>
            <SelectItem value="verified">
              Verified ({getVerifiedItems().length})
            </SelectItem>
            <SelectItem value="recent">
              Recent (10)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* QA Items List */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || filter !== 'all' ? 'No items found' : 'No saved conversations yet'}
          </h3>
          <p className="text-gray-500 text-center max-w-md">
            {searchQuery || filter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Start conversations with Document AI and save important Q&As here for easy reference.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <CardTitle className="text-base font-medium text-gray-900 line-clamp-2">
                        {item.question}
                      </CardTitle>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </div>
                      {item.members?.profiles && (
                        <div>
                          by {item.members.profiles.first_name} {item.members.profiles.last_name}
                        </div>
                      )}
                      {item.source && (
                        <Badge variant="outline" className="text-xs">
                          {item.source}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleVerified(item.id, item.is_verified)}
                      disabled={isTogglingVerified}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      {item.is_verified ? (
                        <CheckCircle2 className="w-4 h-4 fill-current" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Q&A Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this Q&A item? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteItem(item.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <Separator />

                  <div className="relative">
                    <div className={`prose prose-sm max-w-none ${!expandedItems.has(item.id) && item.answer.length > 500 ? 'max-h-48 overflow-hidden' : ''}`}>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        <ReactMarkdown>{item.answer}</ReactMarkdown>
                      </div>
                    </div>

                    {item.answer.length > 500 && (
                      <div className={`${!expandedItems.has(item.id) ? 'absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent' : ''}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpanded(item.id)}
                          className={`${!expandedItems.has(item.id) ? 'absolute bottom-0 left-1/2 -translate-x-1/2' : 'mt-2'} text-blue-600 hover:text-blue-700 hover:bg-blue-50`}
                        >
                          {expandedItems.has(item.id) ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Show more
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-2">
                      <span className="text-xs text-gray-500">Tags:</span>
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {item.sources && item.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold text-gray-700">
                          Sources ({item.sources.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {item.sources.slice(0, 3).map((source, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-blue-50 border border-blue-200 rounded-md p-2"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-blue-900">
                                {source.section}
                              </span>
                              {source.page && (
                                <span className="text-blue-600">Page {source.page}</span>
                              )}
                            </div>
                            <p className="text-gray-700 line-clamp-2">
                              {source.content}
                            </p>
                          </div>
                        ))}
                        {item.sources.length > 3 && (
                          <p className="text-xs text-gray-500 italic">
                            +{item.sources.length - 3} more sources
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}