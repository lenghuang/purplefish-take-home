"use client";

import type { Message } from "ai";

export type Conversation = {
  id: string;
  jobRole: string;
  messages: Message[];
  isDone: boolean;
  createdAt: string;
};

export type JobRole = {
  id: string;
  name: string;
};

const LOCAL_STORAGE_KEY = "ai-recruiter-conversations";

// Mock Job Roles
const MOCK_JOB_ROLES: JobRole[] = [
  { id: "software-engineer", name: "Software Engineer" },
  { id: "product-manager", name: "Product Manager" },
  { id: "data-scientist", name: "Data Scientist" },
  { id: "ux-designer", name: "UX Designer" },
];

function getStoredConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveConversations(conversations: Conversation[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(conversations));
  }
}

export function getConversations(): Conversation[] {
  return getStoredConversations().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getConversation(id: string): Conversation | undefined {
  return getStoredConversations().find((conv) => conv.id === id);
}

export function createConversation(jobRole: string): Conversation {
  const newConversation: Conversation = {
    id: `conv-${Date.now()}`,
    jobRole,
    messages: [],
    isDone: false,
    createdAt: new Date().toISOString(),
  };
  const conversations = getStoredConversations();
  conversations.push(newConversation);
  saveConversations(conversations);
  return newConversation;
}

export function updateConversation(
  id: string,
  messages: Message[],
  isDone: boolean,
): void {
  const conversations = getStoredConversations();
  const index = conversations.findIndex((conv) => conv.id === id);
  if (index !== -1) {
    conversations[index].messages = messages;
    conversations[index].isDone = isDone;
    saveConversations(conversations);
  }
}

export function deleteConversation(id: string): void {
  const conversations = getStoredConversations();
  const updatedConversations = conversations.filter((conv) => conv.id !== id);
  saveConversations(updatedConversations);
}

export function getJobRoles(): JobRole[] {
  return MOCK_JOB_ROLES;
}

export function markConversationAsDone(id: string): void {
  const conversations = getStoredConversations();
  const index = conversations.findIndex((conv) => conv.id === id);
  if (index !== -1) {
    conversations[index].isDone = true;
    saveConversations(conversations);
  }
}
