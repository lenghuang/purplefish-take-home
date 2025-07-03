"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import {
  type Conversation,
  type JobRole,
  getConversations,
  getJobRoles,
  createConversation,
  deleteConversation,
} from "@/lib/data"
import {
  ArrowLeftIcon,
  SearchIcon,
  PlusIcon,
  MessageSquareIcon,
  SettingsIcon,
  Trash2Icon,
  XIcon,
  SparklesIcon,
} from "lucide-react"

type ConversationListViewProps = {
  userRole: "hunter" | "poster"
  onSelectConversation: (conversationId: string) => void
  onBackToRoleSelection: () => void
}

export function ConversationListView({
  userRole,
  onSelectConversation,
  onBackToRoleSelection,
}: ConversationListViewProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [selectedJobRole, setSelectedJobRole] = useState<string>("")
  const [editMode, setEditMode] = useState(false)
  const [selectedConversationsToDelete, setSelectedConversationsToDelete] = useState<string[]>([])

  // Load conversations based on user role
  useEffect(() => {
    const allConversations = getConversations()
    let roleConversations: Conversation[]

    if (userRole === "hunter") {
      // Job hunters see all their conversations
      roleConversations = allConversations
    } else {
      // Job posters see only completed conversations (candidates)
      roleConversations = allConversations.filter((conv) => conv.isDone)
    }

    setConversations(roleConversations)
    setJobRoles(getJobRoles())
    if (getJobRoles().length > 0) {
      setSelectedJobRole(getJobRoles()[0].id)
    }
  }, [userRole])

  // Filter conversations based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredConversations(conversations)
    } else {
      const filtered = conversations.filter(
        (conv) =>
          conv.jobRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
          conv.messages.some((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase())),
      )
      setFilteredConversations(filtered)
    }
  }, [conversations, searchQuery])

  const handleNewConversation = () => {
    if (selectedJobRole) {
      const newConv = createConversation(selectedJobRole)
      setConversations(getConversations())
      onSelectConversation(newConv.id)
    }
  }

  const toggleEditMode = () => {
    setEditMode((prev) => !prev)
    setSelectedConversationsToDelete([])
  }

  const handleSelectConversationForDeletion = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedConversationsToDelete((prev) => [...prev, id])
    } else {
      setSelectedConversationsToDelete((prev) => prev.filter((convId) => convId !== id))
    }
  }

  const handleDeleteSelectedConversations = () => {
    if (selectedConversationsToDelete.length === 0) {
      alert("Please select conversations to delete.")
      return
    }
    if (confirm(`Are you sure you want to delete ${selectedConversationsToDelete.length} conversation(s)?`)) {
      selectedConversationsToDelete.forEach((id) => deleteConversation(id))
      setConversations(getConversations())
      setEditMode(false)
      setSelectedConversationsToDelete([])
    }
  }

  const formatLastMessage = (conv: Conversation) => {
    if (conv.messages.length === 0) return "No messages yet"
    const lastMessage = conv.messages[conv.messages.length - 1]
    const preview = lastMessage.content.substring(0, 50)
    return preview.length < lastMessage.content.length ? `${preview}...` : preview
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" onClick={onBackToRoleSelection}>
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">{userRole === "hunter" ? "My Conversations" : "Candidate Results"}</h1>
        </div>
        {userRole === "hunter" && conversations.length > 0 && (
          <Button variant="ghost" size="icon" onClick={toggleEditMode} aria-label="Manage conversations">
            {editMode ? <XIcon className="h-5 w-5" /> : <SettingsIcon className="h-5 w-5" />}
          </Button>
        )}
        {editMode && (
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDeleteSelectedConversations}
            disabled={selectedConversationsToDelete.length === 0}
            aria-label="Delete selected conversations"
          >
            <Trash2Icon className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Prominent New Conversation Section - Always visible for hunters */}
      {userRole === "hunter" && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <Card className="border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <SparklesIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Start a New AI Interview</h2>
                  <p className="text-sm text-gray-600 mb-4">Get screened by our AI recruiter for your dream job role</p>
                </div>
                <div className="space-y-3">
                  <Select onValueChange={setSelectedJobRole} value={selectedJobRole}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a job role to get started" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleNewConversation}
                    className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={!selectedJobRole}
                  >
                    <PlusIcon className="mr-2 h-5 w-5" />
                    Start AI Interview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search - Only show if there are conversations */}
      {conversations.length > 0 && (
        <div className="p-4 border-b">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      )}

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageSquareIcon className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">
              {conversations.length === 0 ? "Ready to get started?" : "No matching conversations"}
            </p>
            <p className="text-sm text-center px-8">
              {userRole === "hunter"
                ? conversations.length === 0
                  ? "Choose a job role above to start your first AI interview"
                  : "Try adjusting your search terms"
                : "Completed candidate conversations will appear here"}
            </p>
          </div>
        ) : (
          <>
            {/* Section header for existing conversations */}
            {userRole === "hunter" && (
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="text-sm font-medium text-gray-700">Previous Conversations</h3>
              </div>
            )}
            <div className="divide-y">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100"
                  onClick={() => !editMode && onSelectConversation(conv.id)}
                >
                  {editMode && userRole === "hunter" && (
                    <Checkbox
                      className="mr-4"
                      checked={selectedConversationsToDelete.includes(conv.id)}
                      onCheckedChange={(checked) => handleSelectConversationForDeletion(conv.id, checked as boolean)}
                      aria-label={`Select conversation for ${conv.jobRole}`}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {userRole === "poster"
                          ? `${conv.jobRole} - Candidate ${conv.id.substring(conv.id.length - 4)}`
                          : conv.jobRole}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {conv.isDone && <span className="text-xs text-green-600 font-medium">Done</span>}
                        <span className="text-xs text-gray-500">{formatTime(conv.createdAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{formatLastMessage(conv)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  )
}
