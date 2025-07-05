import {
  Template,
  TemplateId,
  DropdownTemplateOption,
  TemplateSelectionState,
} from "./types";
import { validateTemplate, generatePrompt } from "./utils";

// Example templates
import softwareEngineerTemplate from "./examples/software-engineer";
import icuNurseTemplate from "./examples/icu-nurse";
import seniorEngineerTemplate from "./examples/senior-engineer";

// Database and agent integration (assume these services exist)
import { AgentService } from "../agent/service";
import { getConfig } from "../config";

import { TemplateRepository } from "../db/repositories/templateRepository";
import { UserTemplateSelectionRepository } from "../db/repositories/userTemplateSelectionRepository";

export class TemplateManager {
  private templates: Map<TemplateId, Template> = new Map();
  private selectionState: TemplateSelectionState = {
    selectedTemplateId: null,
    options: [],
  };
  private agentService: AgentService;
  private templateRepo: TemplateRepository;
  private userTemplateSelectionRepo: UserTemplateSelectionRepository;

  private constructor(agentService: AgentService) {
    this.loadBuiltInTemplates();
    this.agentService = agentService;
    this.templateRepo = new TemplateRepository();
    this.userTemplateSelectionRepo = new UserTemplateSelectionRepository();
  }

  static async init(): Promise<TemplateManager> {
    const config = getConfig();
    const agentService = new AgentService({
      provider: config.llm.provider,
      model: config.llm.modelName,
      apiKey: config.llm.apiKey,
      contextWindow: 10,
      temperature: config.llm.temperature,
    });
    return new TemplateManager(agentService);
  }

  /**
   * Loads built-in templates from the examples directory.
   */
  private loadBuiltInTemplates() {
    [
      softwareEngineerTemplate,
      icuNurseTemplate,
      seniorEngineerTemplate,
    ].forEach((tpl) => {
      const result = validateTemplate(tpl);
      if (result.valid) {
        this.templates.set(tpl.id, tpl);
      } else {
        // eslint-disable-next-line no-console
        console.warn(`Invalid template "${tpl.id}":`, result.errors);
      }
    });
    this.updateDropdownOptions();
  }

  /**
   * Loads templates from the database and merges with built-in templates.
   */
  async loadTemplatesFromDatabase() {
    // Map DB rows to Template type
    const dbTemplatesRaw = await this.templateRepo.findAll();
    const dbTemplates: Template[] = dbTemplatesRaw.map((row: any) => {
      // If content is JSON, parse and merge with row
      let content: any = {};
      try {
        content =
          typeof row.content === "string"
            ? JSON.parse(row.content)
            : row.content;
      } catch {
        content = {};
      }
      return {
        ...content,
        name: row.name,
        description: row.description,
        id: row.id, // Ensure DB id always takes precedence
      };
    });
    dbTemplates.forEach((tpl) => {
      const result = validateTemplate(tpl);
      if (result.valid) {
        this.templates.set(tpl.id, tpl);
      } else {
        // eslint-disable-next-line no-console
        console.warn(`Invalid DB template "${tpl.id}":`, result.errors);
      }
    });
    this.updateDropdownOptions();
  }

  /**
   * Returns all loaded templates.
   */
  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  /**
   * Returns dropdown options for template selection.
   */
  getDropdownOptions(): DropdownTemplateOption[] {
    return this.selectionState.options;
  }

  /**
   * Updates dropdown options from loaded templates.
   */
  private updateDropdownOptions() {
    this.selectionState.options = Array.from(this.templates.values()).map(
      (tpl) => ({
        id: tpl.id,
        label: tpl.name,
        description: tpl.description,
        tags: tpl.tags,
      })
    );
  }

  /**
   * Atomically selects a template and saves the selection to database.
   * This prevents temporal coupling issues.
   */
  async selectAndSaveTemplate(
    templateId: TemplateId,
    userId: string
  ): Promise<boolean> {
    if (!this.templates.has(templateId)) {
      return false;
    }

    // Update in-memory state
    this.selectionState.selectedTemplateId = templateId;

    // Persist to database atomically
    try {
      await this.saveSelectionToDatabase(userId);
      return true;
    } catch (error) {
      // Rollback in-memory state on database failure
      this.selectionState.selectedTemplateId = null;
      throw error;
    }
  }

  /**
   * Returns the currently selected template, or null.
   */
  getSelectedTemplate(): Template | null {
    if (!this.selectionState.selectedTemplateId) return null;
    return this.templates.get(this.selectionState.selectedTemplateId) || null;
  }

  /**
   * Provides a prompt for a specific template and step.
   * This method doesn't depend on internal state, eliminating temporal coupling.
   */
  getPromptForTemplateStep(
    templateId: TemplateId,
    stepIndex: number,
    previousAnswers?: Record<string, any>
  ): string | null {
    const template = this.templates.get(templateId);
    if (!template || stepIndex < 0 || stepIndex >= template.steps.length) {
      return null;
    }
    return generatePrompt(template, stepIndex, previousAnswers);
  }

  /**
   * Gets a template by ID without affecting internal state.
   */
  getTemplate(templateId: TemplateId): Template | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Example: Save template selection to the database (stub).
   */
  async saveSelectionToDatabase(userId: string) {
    if (!this.selectionState.selectedTemplateId) return;
    // Upsert logic: check if selection exists, update or create
    const selections = await this.userTemplateSelectionRepo.findByUser(userId);
    if (selections && selections.length > 0) {
      // Update the latest selection
      const latest = selections[0];
      await this.userTemplateSelectionRepo.update(latest.id, {
        templateId: this.selectionState.selectedTemplateId,
        selectedAt: new Date(),
      });
    } else {
      await this.userTemplateSelectionRepo.create({
        userId,
        templateId: this.selectionState.selectedTemplateId,
        selectedAt: new Date(),
      });
    }
  }

  /**
   * Example: Load template selection from the database (stub).
   */
  async loadSelectionFromDatabase(userId: string) {
    const selections = await this.userTemplateSelectionRepo.findByUser(userId);
    if (selections && selections.length > 0) {
      // Get the latest selection
      const latest = selections[0];
      const templateId = latest.templateId;
      if (templateId && this.templates.has(templateId)) {
        this.selectionState.selectedTemplateId = templateId;
      }
    }
  }

  /**
   * Example: Provide template-specific context to the agent layer (stub).
   */
  provideTemplateContextToAgent(sessionId: number) {
    const tpl = this.getSelectedTemplate();
    if (tpl) {
      this.agentService.setTemplateContext?.(sessionId, tpl);
    }
  }
}

export default TemplateManager;
