import {
  sqliteTable,
  integer,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// Templates table
export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Conversations table
export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  templateId: integer("template_id").references(() => templates.id),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  endedAt: integer("ended_at", { mode: "timestamp" }),
});

// Messages table
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").references(() => conversations.id),
  sender: text("sender").notNull(),
  content: text("content").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
});

// User Template Selection table
export const userTemplateSelection = sqliteTable("user_template_selection", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  templateId: integer("template_id").references(() => templates.id),
  selectedAt: integer("selected_at", { mode: "timestamp" }).notNull(),
});
