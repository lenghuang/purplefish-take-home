'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  History,
  Sparkles,
} from 'lucide-react';
import {
  localStorageService,
  type ConversationSummary,
} from '@/lib/services/local-storage-service';

export default function HomePage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const router = useRouter();

  // Load conversations from localStorageService on mount
  useEffect(() => {
    const loadConversations = async () => {
      const saved = await localStorageService.getAllConversations();
      setConversations(saved);
    };
    loadConversations();
  }, []);

  const startNewInterview = () => {
    // Generate a new conversation ID and navigate to chat
    const newId = Math.random().toString(36).substring(2, 15);
    router.push(`/chat/${newId}`);
  };

  const loadConversation = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
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
  const recentConversations = deduplicatedConversations.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Purplefish Interviews</h1>
          <Button variant="ghost" size="sm" onClick={() => router.push('/history')}>
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl text-center space-y-6">
          <Sparkles className="h-16 w-16 text-blue-600 mx-auto" />
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Streamline Your Nursing Interviews
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Our AI-powered platform automates the initial screening process for ICU Registered
            Nurses, saving you time and ensuring consistent candidate evaluation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={startNewInterview} size="lg" className="px-8 py-3 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Start New Interview
            </Button>
            {conversations.length > 0 && (
              <Button
                onClick={() => router.push('/history')}
                variant="outline"
                size="lg"
                className="px-8 py-3 text-base"
              >
                <History className="h-5 w-5 mr-2" />
                View All History
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Recent Conversations (if any) */}
      {recentConversations.length > 0 && (
        <div className="max-w-4xl mx-auto w-full p-4 pt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Interviews
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push('/history')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {getStatusIcon(conv)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {conv.candidateName || 'Anonymous Candidate'}
                      </h4>
                      <Badge
                        variant={
                          conv.completed ? 'default' : conv.endedEarly ? 'destructive' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {conv.completed ? 'Done' : conv.endedEarly ? 'Ended Early' : 'In Progress'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(conv.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">{conv.lastMessage}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* About Section */}
      <div className="max-w-4xl mx-auto w-full p-4">
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Automated Screening</h4>
                <p className="text-gray-600">
                  Our AI conducts initial interviews, asking structured questions about experience,
                  salary, and licensing.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Intelligent Evaluation</h4>
                <p className="text-gray-600">
                  The system identifies key information and flags candidates based on predefined
                  criteria.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Seamless History</h4>
                <p className="text-gray-600">
                  All conversations are saved, allowing you to review past interviews and candidate
                  responses anytime.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Focus on Top Talent</h4>
                <p className="text-gray-600">
                  Spend less time on initial screenings and more time engaging with qualified
                  candidates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
