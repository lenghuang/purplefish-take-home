"use client"

import { useEffect, useRef, useState } from "react"
import { useChat, type Message } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Conversation, updateConversation, markConversationAsDone } from "@/lib/data"
import { ArrowLeftIcon, SendIcon, CheckCircleIcon, MoreVerticalIcon } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type ChatViewProps = {
  conversation: Conversation
  onBack: () => void
  onConversationUpdate: () => void
}

export function ChatView({ conversation, onBack, onConversationUpdate }: ChatViewProps) {
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [isMarkingDone, setIsMarkingDone] = useState(false)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    id: conversation.id,
    initialMessages: conversation.messages,
    onFinish: () => {
      if (conversation) {
        updateConversation(conversation.id, messages, conversation.isDone)
        onConversationUpdate()
      }
    },
  })

  useEffect(() => {
    // Scroll to bottom on new messages
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleMarkAsDone = async () => {
    setIsMarkingDone(true)
    markConversationAsDone(conversation.id)
    onConversationUpdate()
    setIsMarkingDone(false)
  }

  const formatTime = (timestamp: string | number | undefined) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const isConversationDisabled = conversation.isDone || isLoading

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold text-gray-900">{conversation.jobRole}</h1>
            <p className="text-xs text-gray-500">{conversation.isDone ? "Conversation ended" : "AI Recruiter"}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVerticalIcon className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!conversation.isDone && (
              <DropdownMenuItem onClick={handleMarkAsDone} disabled={isMarkingDone}>
                <CheckCircleIcon className="mr-2 h-4 w-4" />
                Mark as Done
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <ScrollArea ref={chatContainerRef} className="flex-1 p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Start your conversation</h3>
              <p className="text-sm">Send a message to begin chatting with the AI recruiter</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((message: Message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
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
            placeholder={conversation.isDone ? "Conversation ended" : "Type a message..."}
            disabled={isConversationDisabled}
            className="flex-1 rounded-full border-gray-300"
          />
          <Button type="submit" size="icon" disabled={isConversationDisabled || !input.trim()} className="rounded-full">
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
