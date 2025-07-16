import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Conversation Table
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  candidateName: text('candidate_name'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  completed: integer('completed', { mode: 'boolean' }),
  endedEarly: integer('ended_early', { mode: 'boolean' }),
  endReason: text('end_reason'),
  lastMessage: text('last_message'),
  stateId: text('state_id'),
});

// Message Table
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull(),
  role: text('role'),
  content: text('content'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// Relations
export const conversationRelations = relations(conversations, ({ many }) => ({
  messages: many(messages, { relationName: 'conversation_messages' }),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
    relationName: 'conversation_messages',
  }),
}));

/**
 * PhaseStates Table
 * completedQuestions and answers are JSON-encoded strings.
 */
export const phaseStates = sqliteTable('phase_states', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull(),
  phaseId: text('phase_id').notNull(),
  status: text('status').notNull(),
  // JSON-encoded array
  completedQuestions: text('completed_questions').notNull(),
  // JSON-encoded object
  answers: text('answers').notNull(),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
});

export const phaseStatesRelations = relations(phaseStates, ({ one }) => ({
  conversation: one(conversations, {
    fields: [phaseStates.conversationId],
    references: [conversations.id],
    relationName: 'phase_states_conversation',
  }),
}));
