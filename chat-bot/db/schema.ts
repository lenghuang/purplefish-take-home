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

// InterviewState Table
export const interviewStates = sqliteTable('interview_states', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull(),
  stage: text('stage'),
  candidateName: text('candidate_name'),
  position: text('position'),
  desiredSalary: integer('desired_salary'),
  salaryAcceptable: integer('salary_acceptable', { mode: 'boolean' }),
  hasLicense: integer('has_license', { mode: 'boolean' }),
  licenseNumber: text('license_number'),
  licenseExpiry: text('license_expiry'),
  hasExperience: integer('has_experience', { mode: 'boolean' }),
  experienceYears: integer('experience_years'),
  completed: integer('completed', { mode: 'boolean' }),
  endedEarly: integer('ended_early', { mode: 'boolean' }),
  endReason: text('end_reason'),
});

// Relations
export const conversationRelations = relations(conversations, ({ many, one }) => ({
  messages: many(messages, { relationName: 'conversation_messages' }),
  state: one(interviewStates, {
    fields: [conversations.stateId],
    references: [interviewStates.id],
    relationName: 'conversation_state',
  }),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
    relationName: 'conversation_messages',
  }),
}));

export const interviewStateRelations = relations(interviewStates, ({ one }) => ({
  conversation: one(conversations, {
    fields: [interviewStates.conversationId],
    references: [conversations.id],
    relationName: 'conversation_state',
  }),
}));
