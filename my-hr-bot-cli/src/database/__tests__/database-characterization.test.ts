import { DatabaseService } from "../service";
import { ConversationRepository } from "../repositories/conversation";
import { TemplateRepository } from "../repositories/template";
import { OutcomeRepository } from "../repositories/outcome";
import fs from "fs";
import path from "path";

describe("Database Characterization Tests", () => {
  let dbService: DatabaseService;
  let testDbPath: string;

  beforeEach(async () => {
    testDbPath = path.join(__dirname, `test-${Date.now()}.db`);
    dbService = await DatabaseService.init(testDbPath);
  });

  afterEach(async () => {
    dbService.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe("Current Schema Behavior", () => {
    test("should create tables with current service schema", async () => {
      const db = dbService.connection;
      
      // Check tables exist
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
      const tableNames = tables.map((t: any) => t.name);
      
      expect(tableNames).toContain("conversations");
      expect(tableNames).toContain("messages");
      expect(tableNames).toContain("templates");
      expect(tableNames).toContain("user_template_selection");
      
      // Note: outcomes table is NOT created by service (inconsistency)
      expect(tableNames).not.toContain("outcomes");
    });

    test("should have messages table with created_at column (not timestamp)", async () => {
      const db = dbService.connection;
      
      // Check messages table schema
      const schema = db.prepare("PRAGMA table_info(messages)").all();
      const columnNames = schema.map((col: any) => col.name);
      
      expect(columnNames).toContain("created_at");
      expect(columnNames).not.toContain("timestamp");
    });

    test("should have templates table with TEXT content (not JSON)", async () => {
      const db = dbService.connection;
      
      // Check templates table schema
      const schema = db.prepare("PRAGMA table_info(templates)").all();
      const contentColumn = schema.find((col: any) => col.name === "content") as any;
      
      expect(contentColumn?.type).toBe("TEXT");
    });

    test("should NOT have CHECK constraints on status and role", async () => {
      const db = dbService.connection;
      
      // Check conversations table constraints
      const conversationsSchema = db.prepare("SELECT sql FROM sqlite_master WHERE name='conversations'").get() as any;
      expect(conversationsSchema.sql).not.toContain("CHECK");
      
      // Check messages table constraints
      const messagesSchema = db.prepare("SELECT sql FROM sqlite_master WHERE name='messages'").get() as any;
      expect(messagesSchema.sql).not.toContain("CHECK");
    });
  });

  describe("Current Data Operations", () => {
    test("should save and retrieve user template selection", async () => {
      const userId = "user123";
      const templateId = "template456";
      
      await dbService.saveUserTemplateSelection(userId, templateId);
      const retrieved = await dbService.getUserTemplateSelection(userId);
      
      expect(retrieved).toBe(templateId);
    });

    test("should fail conversation creation due to foreign key constraint", async () => {
      const repo = new ConversationRepository(dbService);
      const conversation = {
        id: "conv123",
        userId: "user123",
        templateId: "template456", // This template doesn't exist
        status: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // This should fail because template doesn't exist (FK constraint)
      await expect(repo.create(conversation)).rejects.toThrow("FOREIGN KEY constraint failed");
    });

    test("should handle template operations through repository", async () => {
      const repo = new TemplateRepository(dbService);
      const template = {
        id: "template123",
        name: "Test Template",
        description: "Test Description",
        version: "1.0.0",
        content: { role: "test", steps: [], config: {} },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const created = await repo.create(template);
      expect(created.id).toBe(template.id);
      expect(created.name).toBe(template.name);
    });

    test("should fail when trying to use outcome repository (table doesn't exist)", async () => {
      const repo = new OutcomeRepository(dbService);
      const outcome = {
        id: "outcome123",
        conversationId: "conv123",
        type: "completion",
        value: { score: 85 },
        metadata: { notes: "Good performance" },
        createdAt: new Date()
      };
      
      // This should fail because outcomes table doesn't exist in service schema
      await expect(repo.create(outcome)).rejects.toThrow();
    });
  });

  describe("Current AgentService Message Handling", () => {
    test("should fail due to column name mismatch in AgentService", async () => {
      const db = dbService.connection;
      
      // This is how AgentService currently tries to insert messages (incorrectly)
      expect(() => {
        db.prepare(
          "INSERT INTO messages (id, conversationId, role, content, timestamp) VALUES (?, ?, ?, ?, ?)"
        );
      }).toThrow("table messages has no column named conversationId");
    });

    test("should work with correct column names (after creating valid conversation)", async () => {
      const db = dbService.connection;
      
      // First create a template to satisfy FK constraint
      const template = {
        id: "template123",
        name: "Test Template",
        description: "Test",
        version: "1.0.0",
        content: JSON.stringify({ role: "test", steps: [] }),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      db.prepare(
        "INSERT INTO templates (id, name, description, version, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(template.id, template.name, template.description, template.version, template.content, template.created_at, template.updated_at);
      
      // Then create a conversation
      const conversation = {
        id: "conv123",
        user_id: "user123",
        template_id: "template123",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      db.prepare(
        "INSERT INTO conversations (id, user_id, template_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).run(conversation.id, conversation.user_id, conversation.template_id, conversation.status, conversation.created_at, conversation.updated_at);
      
      // Now we can insert a message with correct column names
      const message = {
        id: "msg123",
        conversation_id: "conv123",
        role: "user",
        content: "Hello world",
        created_at: new Date().toISOString()
      };
      
      const stmt = db.prepare(
        "INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)"
      );
      
      expect(() => {
        stmt.run(
          message.id,
          message.conversation_id,
          message.role,
          message.content,
          message.created_at
        );
      }).not.toThrow();
    });
  });
});