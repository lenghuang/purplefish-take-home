// Mock dependencies first
jest.mock("../agent/service");
jest.mock("../config", () => ({
  getConfig: jest.fn().mockReturnValue({
    llm: {
      provider: "openai",
      modelName: "gpt-3.5-turbo",
      apiKey: "test-key",
      temperature: 0.7,
    },
    database: {
      filename: "test.db",
    },
    templates: {
      templateDir: "src/template/examples",
      builtInTemplates: [],
    },
  }),
}));
jest.mock("../db/repositories/templateRepository");
jest.mock("../db/repositories/userTemplateSelectionRepository");

import TemplateManager from "../template/manager";
import { Template } from "../template/types";

describe("TemplateManager - Characterization Tests", () => {
  let templateManager: TemplateManager;

  beforeEach(async () => {
    // Mock AgentService
    const { AgentService } = require("../agent/service");
    jest.mocked(AgentService).mockImplementation(() => ({
      setTemplateContext: jest.fn(),
    }));

    templateManager = await TemplateManager.init();
  });

  describe("initialization", () => {
    it("should initialize with built-in templates", () => {
      const templates = templateManager.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);

      // Should have the built-in templates
      const templateNames = templates.map((t) => t.name);
      expect(templateNames).toContain("Software Engineer Interview");
      expect(templateNames).toContain("ICU Nurse Interview");
      expect(templateNames).toContain("Senior Engineer Interview");
    });

    it("should create dropdown options from templates", () => {
      const options = templateManager.getDropdownOptions();
      expect(options.length).toBeGreaterThan(0);

      options.forEach((option) => {
        expect(option).toHaveProperty("id");
        expect(option).toHaveProperty("label");
        expect(option).toHaveProperty("description");
      });
    });
  });

  describe("template selection", () => {
    it("should select valid template by id", async () => {
      const templates = templateManager.getAllTemplates();
      const firstTemplate = templates[0];

      const result = await templateManager.selectAndSaveTemplate(
        firstTemplate.id,
        "test-user"
      );
      expect(result).toBe(true);

      const selected = templateManager.getSelectedTemplate();
      expect(selected).toEqual(firstTemplate);
    });

    it("should return false for invalid template id", async () => {
      const result = await templateManager.selectAndSaveTemplate(
        999,
        "test-user"
      );
      expect(result).toBe(false);

      const selected = templateManager.getSelectedTemplate();
      expect(selected).toBeNull();
    });
  });

  describe("prompt generation", () => {
    it("should return null for invalid step index", async () => {
      const templates = templateManager.getAllTemplates();
      await templateManager.selectAndSaveTemplate(templates[0].id, "test-user");

      const prompt = templateManager.getPromptForTemplateStep(
        templates[0].id,
        -1
      );
      expect(prompt).toBeNull();

      const outOfBoundsPrompt = templateManager.getPromptForTemplateStep(
        templates[0].id,
        999
      );
      expect(outOfBoundsPrompt).toBeNull();
    });

    it("should return null when no template is selected", () => {
      // No template selected, so use a non-existent templateId
      const prompt = templateManager.getPromptForTemplateStep(999, 0);
      expect(prompt).toBeNull();
    });

    it("should return prompt for valid step when template is selected", async () => {
      const templates = templateManager.getAllTemplates();
      await templateManager.selectAndSaveTemplate(templates[0].id, "test-user");

      const prompt = templateManager.getPromptForTemplateStep(
        templates[0].id,
        0
      );
      expect(typeof prompt).toBe("string");
    });
  });
});
