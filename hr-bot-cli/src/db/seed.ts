import { db, sqlite } from "./client";
import {
  templates,
  conversations,
  messages,
  userTemplateSelection,
} from "./schema";

async function main() {
  try {
    // Insert example templates
    await db.insert(templates).values([
      {
        name: "Software Engineer",
        description: "Interview template for software engineers.",
        content:
          "Q: Tell me about a challenging bug you fixed.\nQ: How do you design scalable systems?",
        createdAt: new Date(),
      },
      {
        name: "ICU Nurse",
        description: "Interview template for ICU nurses.",
        content:
          "Q: How do you handle high-stress situations?\nQ: Describe your experience with critical care equipment.",
        createdAt: new Date(),
      },
    ]);

    // Insert example conversation
    const [template] = await db.select().from(templates).limit(1);
    if (template) {
      const [conversation] = await db
        .insert(conversations)
        .values({
          userId: "user-1",
          templateId: template.id,
          startedAt: new Date(),
        })
        .returning();

      if (conversation) {
        await db.insert(messages).values([
          {
            conversationId: conversation.id,
            sender: "user",
            content: "Hello, I'm ready for my interview.",
            stepId: "other",
            timestamp: new Date(),
          },
          {
            conversationId: conversation.id,
            sender: "bot",
            content: "Great! Let's get started.",
            stepId: "other",
            timestamp: new Date(),
          },
        ]);
      }
    }

    // Insert example user template selection
    const [firstTemplate] = await db.select().from(templates).limit(1);
    if (firstTemplate) {
      await db.insert(userTemplateSelection).values({
        userId: "user-1",
        templateId: firstTemplate.id,
        selectedAt: new Date(),
      });
    }

    console.log("Seed data inserted successfully.");
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  } finally {
    sqlite.close();
  }
}

main();
