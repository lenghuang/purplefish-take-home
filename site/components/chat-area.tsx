"use client"

import { useEffect, useRef, useState } from "react"
import { useChat, type Message } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Conversation, updateConversation, markConversationAsDone } from "@/lib/data"
import { CheckCircleIcon, ArrowLeftIcon } from "lucide-react"

type ChatAreaProps = {
  conversation: Conversation | null
  onConversationUpdate: () => void // Callback to refresh parent state
  isMobileView: boolean // New prop
  onBackToList: () => void // New prop
}

export function ChatArea({ conversation, onConversationUpdate, isMobileView, onBackToList }: ChatAreaProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [isMarkingDone, setIsMarkingDone] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    id: conversation?.id || "new-chat", // Use conversation ID for AI SDK
    initialMessages: conversation?.messages || [], // This correctly initializes messages
    onFinish: () => {
      // When the AI response is complete, save the full messages array.
      // `messages` here should be the latest state from `useChat`.
      if (conversation) {
        updateConversation(conversation.id, messages, conversation.isDone)
        onConversationUpdate() // Notify parent about update
      }
    },
  })

  // REMOVED: The useEffect that was calling setMessages(conversation.messages)
  // This was likely causing the overwrite issue.
  // The `useChat` hook manages its own `messages` state after `initialMessages`.

  useEffect(() => {
    // Scroll to bottom on new messages
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleMarkAsDone = async () => {
    if (conversation) {
      setIsMarkingDone(true)
      // TODO: In a real app, this would trigger a backend call to finalize the conversation
      // and potentially store the final state.
      markConversationAsDone(conversation.id)
      onConversationUpdate() // Refresh parent to show (Done) status
      setIsMarkingDone(false)
    }
  }

  if (!conversation) {
    return (
      <Card className="flex flex-col h-full flex-grow items-center justify-center text-gray-500">
        <p>Select a conversation or start a new one.</p>
      </Card>
    )
  }

  const isConversationDisabled = conversation.isDone || isLoading

  return (
    <Card className="flex flex-col h-full flex-grow">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        {isMobileView && ( // Conditionally render back button for mobile view
          <Button variant="ghost" size="sm" onClick={onBackToList} aria-label="Back to list">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        )}
        <CardTitle className="text-lg flex-grow text-center md:text-left">
          {" "}
          {/* Adjust title alignment */}
          Chat with Recruiter AI for: {conversation.jobRole}
          {conversation.isDone && <span className="ml-2 text-green-600 text-sm">(Conversation Ended)</span>}
        </CardTitle>
        {!conversation.isDone && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsDone}
            disabled={isMarkingDone || isLoading}
            aria-label="Mark conversation as done"
          >
            <CheckCircleIcon className="mr-2 h-4 w-4" /> Mark as Done
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea ref={chatContainerRef} className="h-[calc(100vh-200px)] p-4">
          {messages.length === 0 && (
            <p className="text-sm text-gray-500 text-center mt-4">Start by typing a message to the AI recruiter.</p>
          )}
          {messages.map((m: Message) => (
            <div key={m.id} className={`mb-4 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`inline-block p-3 rounded-lg max-w-[70%] ${
                  m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="inline-block p-3 rounded-lg bg-gray-200 text-gray-800">
                <p className="animate-pulse">AI is typing...</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex w-full space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={conversation.isDone ? "Conversation ended." : "Type your message..."}
            className="flex-grow"
            disabled={isConversationDisabled}
            aria-label={conversation.isDone ? "Conversation ended, input disabled" : "Type your message"}
          />
          <Button type="submit" disabled={isConversationDisabled} aria-label="Send message">
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
