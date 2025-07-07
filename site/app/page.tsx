"use client";

import { useState, useEffect, useCallback } from "react";
import { ConversationListView } from "@/components/conversation-list-view";
import { ChatView } from "@/components/chat-view";
import { RoleSelectionPage } from "@/components/role-selection-page";
import { type Conversation, getConversation } from "@/lib/data";

type AppView = "role-selection" | "conversation-list" | "chat";
type UserRole = "hunter" | "poster";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<AppView>("role-selection");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);

  // Callback to refresh the current conversation
  const refreshCurrentConversation = useCallback(() => {
    if (selectedConversationId) {
      setCurrentConversation(getConversation(selectedConversationId) || null);
    }
  }, [selectedConversationId]);

  // Effect to update currentConversation when selectedConversationId changes
  useEffect(() => {
    if (selectedConversationId) {
      setCurrentConversation(getConversation(selectedConversationId) || null);
    } else {
      setCurrentConversation(null);
    }
  }, [selectedConversationId]);

  // Handle role selection from the landing page
  const handleSelectRole = (role: UserRole) => {
    setUserRole(role);
    setCurrentView("conversation-list");
    setSelectedConversationId(null);
    setCurrentConversation(null);
  };

  // Handle conversation selection - go to chat view
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setCurrentView("chat");
  };

  // Handle back from chat to conversation list
  const handleBackToConversationList = () => {
    setCurrentView("conversation-list");
    setSelectedConversationId(null);
    setCurrentConversation(null);
  };

  // Handle back to role selection
  const handleBackToRoleSelection = () => {
    setCurrentView("role-selection");
    setUserRole(null);
    setSelectedConversationId(null);
    setCurrentConversation(null);
  };

  return (
    <main className="h-screen bg-white">
      {currentView === "role-selection" && (
        <RoleSelectionPage onSelectRole={handleSelectRole} />
      )}

      {currentView === "conversation-list" && userRole && (
        <ConversationListView
          userRole={userRole}
          onSelectConversation={handleSelectConversation}
          onBackToRoleSelection={handleBackToRoleSelection}
        />
      )}

      {currentView === "chat" && currentConversation && (
        <ChatView
          conversation={currentConversation}
          onBack={handleBackToConversationList}
          onConversationUpdate={refreshCurrentConversation}
        />
      )}
    </main>
  );
}
