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
import { DatabaseService } from "../database/service";
import { AgentService } from "../agent/service";
import { getConfig } from "../config";

export class TemplateManager {
  private templates: Map<TemplateId, Template> = new Map();
  private selectionState: TemplateSelectionState = {
    selectedTemplateId: null,
    options: [],
  };
  private dbService: DatabaseService;
  private agentService: AgentService;

  private constructor(dbService: DatabaseService, agentService: AgentService) {
    this.loadBuiltInTemplates();
    this.dbService = dbService;
    this.agentService = agentService;
  }

  static async init(): Promise<TemplateManager> {
    const config = getConfig();
    const dbService = await DatabaseService.init(config.database.filename);
    const agentService = new AgentService(
      {
        provider: config.llm.provider,
        model: config.llm.modelName,
        apiKey: config.llm.apiKey,
        contextWindow: 10,
        temperature: config.llm.temperature,
      },
      dbService
    );
    return new TemplateManager(dbService, agentService);
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
    const dbTemplates: Template[] =
      (await this.dbService.getAllTemplates?.()) || [];
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
   * Selects a template by id.
   */
  selectTemplate(templateId: TemplateId): boolean {
    if (this.templates.has(templateId)) {
      this.selectionState.selectedTemplateId = templateId;
      return true;
    }
    return false;
  }

  /**
   * Returns the currently selected template, or null.
   */
  getSelectedTemplate(): Template | null {
    if (!this.selectionState.selectedTemplateId) return null;
    return this.templates.get(this.selectionState.selectedTemplateId) || null;
  }

  /**
   * Provides a prompt for the agent for the current step of the selected template.
   */
  getPromptForStep(
    stepIndex: number,
    previousAnswers?: Record<string, any>
  ): string | null {
    const tpl = this.getSelectedTemplate();
    if (!tpl || stepIndex < 0 || stepIndex >= tpl.steps.length) return null;
    return generatePrompt(tpl, stepIndex, previousAnswers);
  }

  /**
   * Example: Save template selection to the database (stub).
   */
  async saveSelectionToDatabase(userId: string) {
    if (!this.selectionState.selectedTemplateId) return;
    await this.dbService.saveUserTemplateSelection?.(
      userId,
      this.selectionState.selectedTemplateId
    );
  }

  /**
   * Example: Load template selection from the database (stub).
   */
  async loadSelectionFromDatabase(userId: string) {
    const templateId = await this.dbService.getUserTemplateSelection?.(userId);
    if (templateId && this.templates.has(templateId)) {
      this.selectionState.selectedTemplateId = templateId;
    }
  }

  /**
   * Example: Provide template-specific context to the agent layer (stub).
   */
  provideTemplateContextToAgent(sessionId: string) {
    const tpl = this.getSelectedTemplate();
    if (tpl) {
      this.agentService.setTemplateContext?.(sessionId, tpl);
    }
  }
}

export default TemplateManager;
