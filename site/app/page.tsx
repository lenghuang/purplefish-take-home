"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatArea } from "@/components/chat-area";
import { JobPosterDashboard } from "@/components/job-poster-dashboard";
import { RoleSelectionPage } from "@/components/role-selection-page";
import {
  type Conversation,
  getConversation,
  getConversations,
} from "@/lib/data";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

type AppView = "role-selection" | "hunter-dashboard" | "poster-dashboard";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<AppView>("role-selection");
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [isMobile, setIsMobile] = useState(false); // New state for mobile detection

  // Effect to detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's 'md' breakpoint
    };

    // Set initial value
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Callback to refresh the current conversation and trigger re-renders in child components
  const refreshAllConversations = useCallback(() => {
    if (selectedConversationId) {
      setCurrentConversation(getConversation(selectedConversationId) || null);
    }
    // Child components (ChatSidebar, JobPosterDashboard) will re-fetch their lists
    // when their internal state or props change, or when this callback is triggered.
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
  const handleSelectRole = (role: "hunter" | "poster") => {
    setSelectedConversationId(null); // Clear any previous selection
    setCurrentConversation(null);

    if (role === "hunter") {
      setCurrentView("hunter-dashboard");
      // Optionally, pre-select the most recent hunter conversation
      const conversations = getConversations();
      if (conversations.length > 0) {
        const mostRecent = conversations[0];
        setSelectedConversationId(mostRecent.id);
      }
    } else {
      setCurrentView("poster-dashboard");
    }
  };

  // Handle back button click (from dashboard to role selection)
  const handleBackToRoleSelection = () => {
    setCurrentView("role-selection");
    setSelectedConversationId(null);
    setCurrentConversation(null);
  };

  // Handle back button click (from chat area to list view on mobile)
  const handleBackFromChatToListView = () => {
    setSelectedConversationId(null);
    setCurrentConversation(null);
  };

  return (
    <main className="flex flex-col h-screen bg-gray-50 p-4">
      {currentView !== "role-selection" && (
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={handleBackToRoleSelection}
            aria-label="Back to role selection"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Role Selection
          </Button>
        </div>
      )}

      {currentView === "role-selection" && (
        <RoleSelectionPage onSelectRole={handleSelectRole} />
      )}

      {currentView === "hunter-dashboard" && (
        <div className="flex flex-col md:flex-row flex-grow space-y-4 md:space-y-0 md:space-x-4">
          {/* On mobile, show sidebar ONLY if no conversation is selected. On desktop, always show sidebar. */}
          {(!selectedConversationId || !isMobile) && (
            <ChatSidebar
              onSelectConversation={setSelectedConversationId}
              selectedConversationId={selectedConversationId}
              onConversationsChanged={refreshAllConversations} // Updated prop name
            />
          )}
          {/* On mobile, show chat area ONLY if a conversation is selected. On desktop, always show chat area. */}
          {(selectedConversationId || !isMobile) && (
            <ChatArea
              conversation={currentConversation}
              onConversationUpdate={refreshAllConversations}
              isMobileView={isMobile && selectedConversationId !== null} // Pass prop for mobile back button
              onBackToList={handleBackFromChatToListView}
            />
          )}
        </div>
      )}

      {currentView === "poster-dashboard" && (
        <div className="flex flex-col md:flex-row flex-grow space-y-4 md:space-y-0 md:space-x-4">
          {/* On mobile, show dashboard list ONLY if no conversation is selected. On desktop, always show dashboard list. */}
          {(!selectedConversationId || !isMobile) && (
            <JobPosterDashboard
              onSelectConversation={setSelectedConversationId}
              selectedConversationId={selectedConversationId}
              onConversationUpdate={refreshAllConversations}
              onBackToList={handleBackFromChatToListView} // This is for the dashboard's internal back button
            />
          )}
          {/* On mobile, show chat area ONLY if a conversation is selected. On desktop, always show chat area. */}
          {(selectedConversationId || !isMobile) && (
            <ChatArea
              conversation={currentConversation}
              onConversationUpdate={refreshAllConversations}
              isMobileView={isMobile && selectedConversationId !== null} // Pass prop for mobile back button
              onBackToList={handleBackFromChatToListView}
            />
          )}
        </div>
      )}
    </main>
  );
}
