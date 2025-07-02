"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { type Conversation, getConversations } from "@/lib/data"

interface JobPosterDashboardProps {
  onSelectConversation: (conversationId: string) => void
  selectedConversationId: string | null
  onConversationUpdate: () => void
  onBackToList: () => void
}

export function JobPosterDashboard({
  onSelectConversation,
  selectedConversationId,
  onConversationUpdate,
  onBackToList,
}: JobPosterDashboardProps) {
  const [completedConversations, setCompletedConversations] = useState<Conversation[]>([])

  const refreshCompletedConversations = () => {
    setCompletedConversations(getConversations().filter((conv) => conv.isDone))
  }

  useEffect(() => {
    refreshCompletedConversations()
  }, [selectedConversationId, onConversationUpdate]) // Re-fetch when selected conversation changes or parent updates

  // This component now only handles the list view.
  // The ChatArea rendering for a selected conversation is handled by app/page.tsx
  return (
    <Card className="flex flex-col h-full w-full md:w-80">
      {/* Responsive width */}
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Candidate Conversations (Completed)</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-0">
        <ScrollArea className="flex-grow p-4">
          {completedConversations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center mt-4">No completed candidate conversations yet.</p>
          ) : (
            <div className="space-y-2">
              {completedConversations.map((conv) => (
                <Button
                  key={conv.id}
                  variant={selectedConversationId === conv.id ? "secondary" : "ghost"}
                  className="w-full justify-start h-auto py-2 px-3 text-left"
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">
                      {conv.jobRole} - Candidate {conv.id.substring(conv.id.length - 4)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Completed on: {new Date(conv.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
