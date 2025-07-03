export interface Conversation {
  id: string;
  userId: string;
  templateId: string;
  status: "active" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Outcome {
  id: string;
  conversationId: string;
  type: string;
  value: any;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface DatabaseTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  content: Record<string, any>; // This will store role, steps, config, tags
  createdAt: Date;
  updatedAt: Date;
}
