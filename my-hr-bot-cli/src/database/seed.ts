// TypeScript-only seeding script for templates and conversations

import { Template } from "../template/types";
import softwareEngineerTemplate from "../template/examples/software-engineer";
import icuNurseTemplate from "../template/examples/icu-nurse";
import seniorEngineerTemplate from "../template/examples/senior-engineer";
import { toDatabaseTemplate } from "./utils";
import { DatabaseService } from "./service";
import { TemplateRepository } from "./repositories/template";
import { ConversationRepository } from "./repositories/conversation";
import { Conversation } from "./schema";
import { randomUUID } from "crypto";

function log(msg: string) {
  console.log(`[seed] ${msg}`);
}

async function main() {
  const dbPath = process.env.DB_PATH || "hr-bot.db";
  log(`Connecting to database at ${dbPath}...`);
  const dbService = await DatabaseService.init(dbPath);

  try {
    // Seed templates
    const templateRepo = new TemplateRepository(dbService);
    const templates: Template[] = [
      softwareEngineerTemplate,
      icuNurseTemplate,
      seniorEngineerTemplate,
    ];

    for (const tpl of templates) {
      const now = new Date();
      const dbTpl = {
        ...toDatabaseTemplate(tpl),
        createdAt: now,
        updatedAt: now,
      };
      try {
        await templateRepo.create(dbTpl);
        log(`Seeded template: ${tpl.name}`);
      } catch (err: any) {
        if (err && err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
          log(`Template already exists: ${tpl.name}`);
        } else {
          log(`Error seeding template ${tpl.name}: ${err.message || err}`);
        }
      }
    }

    // Seed sample conversations
    const conversationRepo = new ConversationRepository(dbService);
    const now = new Date();
    const sampleConversations: Conversation[] = [
      {
        id: randomUUID(),
        userId: "user-1",
        templateId: softwareEngineerTemplate.id,
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        userId: "user-2",
        templateId: icuNurseTemplate.id,
        status: "completed",
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const conv of sampleConversations) {
      try {
        await conversationRepo.create(conv);
        log(`Seeded conversation for user: ${conv.userId} (${conv.status})`);
      } catch (err: any) {
        if (err && err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") {
          log(`Conversation already exists for user: ${conv.userId}`);
        } else {
          log(
            `Error seeding conversation for user ${conv.userId}: ${
              err.message || err
            }`
          );
        }
      }
    }

    log("Seeding complete.");
  } catch (err: any) {
    log(`Fatal error: ${err.message || err}`);
    process.exitCode = 1;
  } finally {
    dbService.close?.();
  }
}

main();
