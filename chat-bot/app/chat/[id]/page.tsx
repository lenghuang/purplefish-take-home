'use client';

import type React from 'react';
import { v4 as createId } from 'uuid'; // Import createId from uuid package

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Bot, CheckCircle, XCircle, ArrowLeft, Home } from 'lucide-react';
import type { InterviewState, Message } from '@/lib/services/local-storage-service';

const initialAssistantMessage: Message = {
  id: 'initial-assistant-message', // Unique ID for the initial message
  role: 'assistant',
  content: 'Hello! Are you currently open to discussing this nursing position with us today?',
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id as string;

  const [interviewState, setInterviewState] = useState<InterviewState>({
    stage: 'greeting',
    completed: false,
  });
  const [isNewConversation, setIsNewConversation] = useState(true);
  const [isLoadingPage, setIsLoadingPage] = useState(true); // New loading state for page data
  const [error, setError] = useState<string | null>(null); // Error state

  const interviewStateRef = useRef<InterviewState>(interviewState);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Declare createId function here if needed
  // const createId = () => Math.random().toString(36).substr(2, 9);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: isChatLoading,
    setMessages,
  } = useChat({
    api: '/api/chat',
    id: conversationId,
    initialMessages: [initialAssistantMessage], // This is a fallback, actual messages loaded from service
    body: {
      get interviewState() {
        return interviewStateRef.current;
      },
      conversationId: conversationId,
    },
    streamProtocol: 'text',
    onFinish: async (message) => {
      console.log('🎯 onFinish called!');
      console.log('Message finished:', message.content);

      try {
        const stateMatch = message.content.match(/\[STATE:([\s\S]*?)\]/);
        let newState = interviewStateRef.current;
        if (stateMatch) {
          newState = JSON.parse(stateMatch[1]);
          console.log('Parsed state from message:', newState);
          setInterviewState(newState);
          console.log('UI interviewState after setInterviewState:', newState);
        }

        // Persist to server
        const apiRes = await fetch(`/api/conversations/${conversationId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: newState,
            message: {
              id: message.id,
              role: message.role,
              content: message.content,
            },
          }),
        });
        const apiJson = await apiRes.json().catch(() => ({}));
        console.log('API response after saving state:', apiJson);
      } catch (error) {
        console.error('Failed to save message or update state:', error);
      }
    },
    onError: (error) => {
      console.error('🚨 useChat error:', error);
    },
  });

  // Check if the interview is done (completed or ended early)
  const isInterviewDone = interviewState.completed || interviewState.endedEarly;

  // Update the ref whenever state changes
  useEffect(() => {
    interviewStateRef.current = interviewState;
  }, [interviewState]);

  /**
   * Load existing conversation or create new one.
   *
   * IMPORTANT: Do NOT include interviewState in the dependency array.
   * interviewState is set within this effect (via setInterviewState), so including it would cause this effect to re-run infinitely.
   * Only depend on conversationId (and setMessages if needed).
   * If you need the latest interviewState inside this effect, use interviewStateRef.current.
   */
  useEffect(() => {
    const loadOrCreateConversation = async () => {
      setIsLoadingPage(true);
      setError(null);
      let loaded = false;
      try {
        // Try to get from server first
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (res.ok) {
          const conversation = await res.json();
          if (
            !conversation ||
            typeof conversation !== 'object' ||
            !conversation.messages ||
            !conversation.state
          ) {
            setError(
              'Failed to load conversation data. Please try again or start a new conversation.',
            );
            setIsLoadingPage(false);
            return;
          }
          setMessages(conversation.messages);
          setInterviewState(conversation.state);
          setIsNewConversation(false);
          loaded = true;
        } else {
          // If not found, create new on server
          const createRes = await fetch(`/api/conversations/${conversationId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              state: interviewStateRef.current,
              message: initialAssistantMessage,
            }),
          });
          if (createRes.ok) {
            setMessages([initialAssistantMessage]);
            setIsNewConversation(true);
            loaded = true;
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error('Failed to load or create conversation:', error.message, error.stack);
        } else {
          console.error('Failed to load or create conversation:', error);
        }
        // Do not set error yet, try local storage fallback
      }

      if (!loaded) {
      }

      if (!loaded) {
        setError(
          'Failed to load or create conversation. Please check your connection or try again.',
        );
      }

      setIsLoadingPage(false);
    };

    if (conversationId) {
      loadOrCreateConversation();
    }
    // interviewState is intentionally omitted from dependencies to avoid infinite loop.
    // The effect only needs to run when conversationId or setMessages changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, setMessages]);

  // Autoscroll: Scroll to bottom when messages change
  useEffect(() => {
    if (viewportRef.current) {
      const timer = setTimeout(() => {
        if (viewportRef.current) {
          viewportRef.current.scrollTo({
            top: viewportRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  // Custom submit handler to save user messages
  const handleCustomSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() || isChatLoading || isInterviewDone) return;

    try {
      // Persist to server
      await fetch(`/api/conversations/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: interviewStateRef.current,
          message: {
            id: createId(),
            role: 'user',
            content: input,
          },
        }),
      });
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    // Continue with normal chat submission
    handleSubmit(e);
  };

  const getStageDisplay = (stage: string) => {
    const stages = {
      greeting: 'Getting Started',
      basic_info: 'Basic Information',
      salary_discussion: 'Salary Discussion',
      license_check: 'License Verification',
      license_details: 'License Details',
      license_timeline: 'License Timeline',
      experience: 'Experience Review',
      experience_details: 'Experience Details',
      alternative_experience: 'Alternative Experience',
      completed: 'Interview Complete',
    };
    return stages[stage as keyof typeof stages] || stage;
  };

  const getStatusBadge = () => {
    if (interviewState.completed) {
      return (
        <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Done
        </Badge>
      );
    }
    if (interviewState.endedEarly) {
      return (
        <Badge variant="destructive" className="text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Ended Early
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        {getStageDisplay(interviewState.stage)}
      </Badge>
    );
  };

  // Removed full-page loading spinner. Loading state is now handled in the chat area.

  // Guard: If interviewState is null/undefined, show loading or fallback UI
  if (!interviewState) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
          <div className="text-gray-700 mb-4">Loading conversation...</div>
        </div>
      </div>
    );
  }

  // Header
  const header = (
    <div className="sticky top-0 z-10 bg-white border-b px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {isNewConversation ? 'New Interview' : 'Interview Session'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge()}
              {interviewState.candidateName && (
                <span className="text-sm text-gray-500">• {interviewState.candidateName}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/history')}
            className="text-xs"
          >
            History
          </Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="text-xs">
            <Home className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Input area
  const inputArea = (
    <div className="sticky bottom-0 bg-white border-t px-4 py-4">
      {isInterviewDone ? (
        <div className="text-center">
          <div
            className={`p-4 rounded-lg ${
              interviewState.completed
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              {interviewState.completed ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <p
                className={`font-medium ${interviewState.completed ? 'text-green-800' : 'text-red-800'}`}
              >
                {interviewState.completed
                  ? 'Interview Completed Successfully!'
                  : 'Interview Ended Early'}
              </p>
            </div>
            {interviewState.endReason && (
              <p className="text-sm text-gray-600 mb-3">{interviewState.endReason}</p>
            )}
            <p className="text-xs text-gray-500">
              This conversation is now marked as done. You can review it in your history.
            </p>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={() => router.push('/history')} variant="outline" className="flex-1">
              View History
            </Button>
            <Button onClick={() => router.push('/')} className="flex-1">
              Back to Home
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your response..."
            disabled={isChatLoading || isInterviewDone}
            className="flex-1 h-12 text-base rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Button
            type="submit"
            disabled={isChatLoading || !input.trim() || isInterviewDone}
            className="h-12 px-6 rounded-full"
          >
            {isChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
        </form>
      )}
    </div>
  );

  // Render
  return (
    <>
      {/* Header */}
      {header}
      {/* Chat Messages Area */}
      <ScrollArea className="flex-1 px-4" viewportRef={viewportRef}>
        <div className="space-y-4 py-4 pb-20">
          {isLoadingPage ? (
            // Skeleton loading state for chat area
            <>
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center" />
                <div className="rounded-2xl px-4 py-3 bg-white border border-gray-200 w-2/3 h-6" />
              </div>
            </>
          ) : error ? (
            // Only show error bubble if error
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-red-200 flex items-center justify-center">
                <Bot className="h-4 w-4 text-red-600" />
              </div>
              <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="text-sm text-red-700">{error}</span>
                <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border-2 border-gray-200'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.content.replace(/\[STATE:[\s\S]*?\]/, '').trim()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-500">Typing...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
      {/* Input Area */}
      {inputArea}
    </>
  );
}
