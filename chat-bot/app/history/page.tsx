'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { clientStorageService } from '@/lib/services/client-storage-service';
import type { ConversationSummary } from '@/lib/services/local-storage-service';

export default function HistoryPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const router = useRouter();

  // Load conversations from localStorageService on mount
  useEffect(() => {
    const loadConversations = async () => {
      // Try to get from server first, fallback to local
      try {
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const serverConvs: ConversationSummary[] = await res.json();
          setConversations(serverConvs);
          // Optionally sync to local
          // (could iterate and save to local if desired)
        } else {
          throw new Error('Server fetch failed');
        }
      } catch {
        // Fallback to local storage
        const localConvs = await clientStorageService.getAllLocal();
        setConversations(localConvs);
      }
    };
    loadConversations();
  }, []);

  const loadConversation = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  };

  const clearHistory = async () => {
    if (confirm('Are you sure you want to clear all interview history?')) {
      await clientStorageService.clearAllLocal();
      setConversations([]);
      // Optionally, you could also call a server endpoint to clear all server-side conversations if needed
      // await fetch('/api/conversations', { method: 'DELETE' });
    }
  };

  const getStatusBadge = (conv: ConversationSummary) => {
    if (conv.completed) {
      return (
        <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Done
        </Badge>
      );
    }
    if (conv.endedEarly) {
      return (
        <Badge variant="destructive" className="text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Ended Early
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        <AlertCircle className="h-3 w-3 mr-1" />
        In Progress
      </Badge>
    );
  };

  const getStatusIcon = (conv: ConversationSummary) => {
    if (conv.completed) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (conv.endedEarly) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  // Deduplicate conversations by id (keep first occurrence)
  const deduplicatedConversations = conversations.filter(
    (conv, idx, arr) => arr.findIndex((c) => c.id === conv.id) === idx,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Interview History</h1>
              <p className="text-sm text-gray-500">
                {deduplicatedConversations.length} conversations
              </p>
            </div>
          </div>
          {deduplicatedConversations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-xs text-red-600"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="p-4 space-y-3">
        {deduplicatedConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No previous interviews</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Back to Home
            </Button>
          </div>
        ) : (
          <>
            {deduplicatedConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className="bg-white rounded-lg p-4 border border-gray-200 active:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(conv)}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {conv.candidateName || 'Anonymous Candidate'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {new Date(conv.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(conv)}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 ml-7">{conv.lastMessage}</p>
              </div>
            ))}

            {/* Summary Stats */}
            <div className="mt-8 bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Interview Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {deduplicatedConversations.length}
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {deduplicatedConversations.filter((c) => c.completed).length}
                  </div>
                  <div className="text-xs text-gray-500">Done</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {deduplicatedConversations.filter((c) => c.endedEarly).length}
                  </div>
                  <div className="text-xs text-gray-500">Ended Early</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
