import { db, sqlite } from "./client";
import {
  templates,
  conversations,
  messages,
  userTemplateSelection,
} from "./schema";

async function main() {
  try {
    const { default: softwareEngineerTemplate } = await import(
      "../template/examples/software-engineer"
    );
    const { default: icuNurseTemplate } = await import(
      "../template/examples/icu-nurse"
    );
    const { default: seniorEngineerTemplate } = await import(
      "../template/examples/senior-engineer"
    );
    const { default: dummy } = await import("../template/examples/dummy");

    const templatesToSeed = [
      softwareEngineerTemplate,
      icuNurseTemplate,
      seniorEngineerTemplate,
      dummy,
    ];

    // Clean up all dependent tables to avoid foreign key constraint errors
    await db.delete(messages);
    await db.delete(conversations);
    await db.delete(userTemplateSelection);
    await db.delete(templates); // Now safe to clear templates

    await db.insert(templates).values(
      templatesToSeed.map((tpl) => ({
        id: tpl.id,
        name: tpl.name,
        description: tpl.description,
        content: JSON.stringify({
          ...tpl,
          id: undefined,
          name: undefined,
          description: undefined,
        }),
        createdAt: new Date(),
      })),
    );

    // Insert example conversation
    const [template] = await db.select().from(templates).limit(1);
    if (template) {
      const [conversation] = await db
        .insert(conversations)
        .values({
          userId: "user-123",
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
            sender: "assistant",
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
        userId: "user-123",
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
