"use client"

import { useState, useCallback } from "react"
import { ConversationListView } from "@/components/conversation-list-view"
import { ChatView } from "@/components/chat-view"
import { RoleSelectionPage } from "@/components/role-selection-page"

type AppView = "role-selection" | "conversation-list" | "chat"
type UserRole = "hunter" | "poster"

export default function HomePage() {
  const [currentView, setCurrentView] = useState<AppView>("role-selection")
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  // Callback to refresh conversations (can be used to trigger re-fetching)
  const refreshConversations = useCallback(() => {
    // This will trigger re-renders in child components that depend on conversation data
    // The actual data fetching happens in the components themselves
  }, [])

  // Handle role selection from the landing page
  const handleSelectRole = (role: UserRole) => {
    setUserRole(role)
    setCurrentView("conversation-list")
    setSelectedConversationId(null)
  }

  // Handle conversation selection - go to chat view
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setCurrentView("chat")
  }

  // Handle back from chat to conversation list
  const handleBackToConversationList = () => {
    setCurrentView("conversation-list")
    setSelectedConversationId(null)
  }

  // Handle back to role selection
  const handleBackToRoleSelection = () => {
    setCurrentView("role-selection")
    setUserRole(null)
    setSelectedConversationId(null)
  }

  return (
    <main className="h-screen bg-white">
      {currentView === "role-selection" && <RoleSelectionPage onSelectRole={handleSelectRole} />}

      {currentView === "conversation-list" && userRole && (
        <ConversationListView
          userRole={userRole}
          onSelectConversation={handleSelectConversation}
          onBackToRoleSelection={handleBackToRoleSelection}
        />
      )}

      {currentView === "chat" && selectedConversationId && (
        <ChatView
          conversationId={selectedConversationId}
          onBack={handleBackToConversationList}
          onConversationUpdate={refreshConversations}
        />
      )}
    </main>
  )
}
