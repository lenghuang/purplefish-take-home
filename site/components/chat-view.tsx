"use client";

import { useEffect, useRef, useState } from "react";
import { useChat, type Message } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  fetchConversation,
  updateConversationStatus,
  type Conversation,
} from "@/lib/api-client";
import {
  ArrowLeftIcon,
  SendIcon,
  CheckCircleIcon,
  MoreVerticalIcon,
  LoaderIcon,
  AlertTriangleIcon,
  WifiOffIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChatViewProps = {
  conversationId: string;
  onBack: () => void;
  onConversationUpdate: () => void;
};

export function ChatView({
  conversationId,
  onBack,
  onConversationUpdate,
}: ChatViewProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMarkingDone, setIsMarkingDone] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Load conversation from database
  useEffect(() => {
    async function loadConversation() {
      setLoading(true);
      setBackendError(null);
      setIsOffline(false);

      try {
        const conv = await fetchConversation(conversationId);
        if (conv) {
          setConversation(conv);
        } else {
          setBackendError("Conversation not found or unavailable.");
        }
      } catch (error) {
        console.warn("Error loading conversation:", error);
        setIsOffline(true);
        setBackendError(
          "Unable to load conversation. Please check your connection."
        );
      } finally {
        setLoading(false);
      }
    }

    loadConversation();
  }, [conversationId]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      api: "/api/chat",
      id: conversationId,
      initialMessages: conversation?.messages || [],
      body: {
        conversationId,
        userId: "demo-user-123", // In production, get from auth
        jobRole: conversation?.jobRole || "Software Engineer",
      },
      onFinish: () => {
        // Refresh conversation data after AI response
        onConversationUpdate();
      },
      onError: (error) => {
        console.warn("Chat error:", error);
        setBackendError(
          "Failed to send message. Please check your connection and try again."
        );
      },
    });

  useEffect(() => {
    // Scroll to bottom on new messages
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleMarkAsDone = async () => {
    if (!conversation) return;

    setIsMarkingDone(true);
    try {
      const success = await updateConversationStatus(
        conversation.id,
        "completed"
      );
      if (success) {
        setConversation((prev) =>
          prev ? { ...prev, status: "completed" } : null
        );
        onConversationUpdate();
      } else {
        setBackendError(
          "Failed to mark conversation as done. Please try again."
        );
      }
    } catch (error) {
      console.warn("Error marking conversation as done:", error);
      setBackendError(
        "Unable to update conversation status. Please check your connection."
      );
    } finally {
      setIsMarkingDone(false);
    }
  };

  const formatTime = (timestamp: string | number | Date | undefined) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <LoaderIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="flex items-center justify-center flex-1 text-gray-500">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Conversation not found</h3>
            <p className="text-sm text-gray-600 mb-4">
              {isOffline
                ? "This conversation is not available offline."
                : "The conversation may have been deleted."}
            </p>
            <Button onClick={onBack}>Go Back</Button>
          </div>
        </div>
      </div>
    );
  }

  const isConversationDisabled =
    conversation.status === "completed" || isLoading || isOffline;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-semibold text-gray-900">
                {conversation.jobRole}
              </h1>
              {isOffline && (
                <WifiOffIcon
                  className="h-4 w-4 text-orange-500"
                  title="Offline mode"
                />
              )}
            </div>
            <p className="text-xs text-gray-500">
              {conversation.status === "completed"
                ? "Conversation ended"
                : isOffline
                ? "Offline - limited functionality"
                : "AI Recruiter"}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {conversation.status !== "completed" && !isOffline && (
              <DropdownMenuItem
                onClick={handleMarkAsDone}
                disabled={isMarkingDone}
              >
                <CheckCircleIcon className="mr-2 h-4 w-4" />
                {isMarkingDone ? "Marking..." : "Mark as Done"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Error Alert */}
      {(backendError || error) && (
        <Alert className="m-4 border-orange-200 bg-orange-50">
          <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {backendError || error?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      <ScrollArea ref={chatContainerRef} className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {isOffline ? "Offline Mode" : "Start your conversation"}
              </h3>
              <p className="text-sm">
                {isOffline
                  ? "Connect to the internet to chat with the AI recruiter"
                  : "Send a message to begin chatting with the AI recruiter"}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message: Message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={
              conversation.status === "completed"
                ? "Conversation ended"
                : isOffline
                ? "Offline - connect to send messages"
                : "Type a message..."
            }
            disabled={isConversationDisabled}
            className="flex-1 rounded-full border-gray-300"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isConversationDisabled || !input.trim()}
            className="rounded-full"
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
