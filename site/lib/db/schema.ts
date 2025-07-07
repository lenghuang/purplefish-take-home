import { sqliteTable, text, real } from "drizzle-orm/sqlite-core"
import { relations } from "drizzle-orm"

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  role: text("role", { enum: ["hunter", "poster"] }).notNull(),
  createdAt: text("created_at").notNull(),
})

export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  jobRole: text("job_role").notNull(),
  status: text("status", { enum: ["active", "completed", "paused"] })
    .notNull()
    .default("active"),
  agentType: text("agent_type").notNull(),
  interviewStage: text("interview_stage").default("introduction"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  completedAt: text("completed_at"),
})

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: text("created_at").notNull(),
})

export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  experience: text("experience"),
  skills: text("skills"), // JSON array
  education: text("education"),
  resumeData: text("resume_data"), // JSON object
  preferences: text("preferences"), // JSON object
  updatedAt: text("updated_at").notNull(),
})

export const assessments = sqliteTable("assessments", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  category: text("category").notNull(), // 'technical', 'communication', 'cultural_fit', etc.
  score: real("score").notNull(), // 0-100
  feedback: text("feedback"),
  createdAt: text("created_at").notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  conversations: many(conversations),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
}))

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
  assessments: many(assessments),
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}))

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}))

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  conversation: one(conversations, {
    fields: [assessments.conversationId],
    references: [conversations.id],
  }),
}))
