"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type Conversation,
  type JobRole,
  getConversations,
  getJobRoles,
  createConversation,
  deleteConversation,
} from "@/lib/data";
import { PlusIcon, MessageSquareIcon, Trash2Icon } from "lucide-react"; // Added Trash2Icon

type ChatSidebarProps = {
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId: string | null;
  onConversationsChanged: () => void; // Renamed prop for clarity
};

export function ChatSidebar({
  onSelectConversation,
  selectedConversationId,
  onConversationsChanged,
}: ChatSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [selectedJobRole, setSelectedJobRole] = useState<string>("");

  // Effect to load conversations and job roles
  useEffect(() => {
    setConversations(getConversations());
    setJobRoles(getJobRoles());
    if (getJobRoles().length > 0) {
      setSelectedJobRole(getJobRoles()[0].id); // Select first job role by default
    }
  }, [selectedConversationId, onConversationsChanged]); // Re-run when selectedConversationId changes or conversations are changed

  const handleNewConversation = () => {
    if (selectedJobRole) {
      const newConv = createConversation(selectedJobRole);
      setConversations(getConversations()); // Refresh list locally
      onSelectConversation(newConv.id); // Select the new conversation
      onConversationsChanged(); // Notify parent about new conversation
    } else {
      alert("Please select a job role to start a new conversation.");
    }
  };

  const handleDeleteConversation = (id: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteConversation(id);
      setConversations(getConversations()); // Refresh list locally
      if (selectedConversationId === id) {
        onSelectConversation(""); // Clear selection if the deleted conversation was active
      }
      onConversationsChanged(); // Notify parent about deletion
    }
  };

  return (
    <Card className="flex flex-col h-full w-full md:w-80">
      {" "}
      {/* Responsive width */}
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Conversations</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0">
        <div className="p-4 border-b">
          <Select onValueChange={setSelectedJobRole} value={selectedJobRole}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a job role" />
            </SelectTrigger>
            <SelectContent>
              {jobRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleNewConversation} className="w-full mt-2">
            <PlusIcon className="mr-2 h-4 w-4" /> New Conversation
          </Button>
        </div>
        <ScrollArea className="flex-grow p-4">
          {conversations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center mt-4">
              No conversations yet. Start a new one!
            </p>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center justify-between gap-2"
                >
                  <Button
                    variant={
                      selectedConversationId === conv.id ? "secondary" : "ghost"
                    }
                    className="flex-grow justify-start h-auto py-2 px-3 text-left"
                    onClick={() => onSelectConversation(conv.id)}
                  >
                    <MessageSquareIcon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{conv.jobRole}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(conv.createdAt).toLocaleDateString()}
                        {conv.isDone && (
                          <span className="ml-2 text-green-600">(Done)</span>
                        )}
                      </span>
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteConversation(conv.id)}
                    aria-label={`Delete conversation for ${conv.jobRole}`}
                    className="flex-shrink-0"
                  >
                    <Trash2Icon className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
