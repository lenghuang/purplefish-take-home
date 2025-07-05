// Mock dependencies first
jest.mock('../agent/service');
jest.mock('../config', () => ({
  getConfig: jest.fn().mockReturnValue({
    llm: {
      provider: 'openai',
      modelName: 'gpt-3.5-turbo',
      apiKey: 'test-key',
      temperature: 0.7,
    },
    database: {
      filename: 'test.db',
    },
    templates: {
      templateDir: 'src/template/examples',
      builtInTemplates: [],
    },
  }),
}));
jest.mock('../db/repositories/templateRepository');
jest.mock('../db/repositories/userTemplateSelectionRepository');

import TemplateManager from '../template/manager';

describe('TemplateManager - Temporal Coupling Fixes', () => {
  let templateManager: TemplateManager;

  beforeEach(async () => {
    // Mock AgentService
    const { AgentService } = require('../agent/service');
    jest.mocked(AgentService).mockImplementation(() => ({
      setTemplateContext: jest.fn(),
    }));

    templateManager = await TemplateManager.init();
  });

  describe('selectAndSaveTemplate', () => {
    it('should atomically select and save template', async () => {
      const templates = templateManager.getAllTemplates();
      const firstTemplate = templates[0];
      
      // Mock the saveSelectionToDatabase method
      const saveSpy = jest.spyOn(templateManager, 'saveSelectionToDatabase').mockResolvedValue();

      const result = await templateManager.selectAndSaveTemplate(firstTemplate.id, 'user123');

      expect(result).toBe(true);
      expect(saveSpy).toHaveBeenCalledWith('user123');
      expect(templateManager.getSelectedTemplate()).toEqual(firstTemplate);
    });

    it('should return false for invalid template ID', async () => {
      const result = await templateManager.selectAndSaveTemplate(999, 'user123');
      expect(result).toBe(false);
      expect(templateManager.getSelectedTemplate()).toBeNull();
    });

    it('should rollback state on database save failure', async () => {
      const templates = templateManager.getAllTemplates();
      const firstTemplate = templates[0];
      
      // Mock saveSelectionToDatabase to fail
      const error = new Error('Database error');
      const saveSpy = jest.spyOn(templateManager, 'saveSelectionToDatabase').mockRejectedValue(error);

      await expect(templateManager.selectAndSaveTemplate(firstTemplate.id, 'user123'))
        .rejects.toThrow('Database error');

      // Should rollback state
      expect(templateManager.getSelectedTemplate()).toBeNull();
    });
  });

  describe('getPromptForTemplateStep', () => {
    it('should return prompt without requiring selection state', () => {
      const templates = templateManager.getAllTemplates();
      const firstTemplate = templates[0];
      
      // Don't select any template - this is the key test
      expect(templateManager.getSelectedTemplate()).toBeNull();
      
      // Should still work
      const prompt = templateManager.getPromptForTemplateStep(firstTemplate.id, 0);
      expect(typeof prompt).toBe('string');
    });

    it('should return null for invalid template ID', () => {
      const prompt = templateManager.getPromptForTemplateStep(999, 0);
      expect(prompt).toBeNull();
    });

    it('should return null for invalid step index', () => {
      const templates = templateManager.getAllTemplates();
      const firstTemplate = templates[0];
      
      const prompt = templateManager.getPromptForTemplateStep(firstTemplate.id, -1);
      expect(prompt).toBeNull();
      
      const outOfBoundsPrompt = templateManager.getPromptForTemplateStep(firstTemplate.id, 999);
      expect(outOfBoundsPrompt).toBeNull();
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID without affecting state', () => {
      const templates = templateManager.getAllTemplates();
      const firstTemplate = templates[0];
      
      const retrieved = templateManager.getTemplate(firstTemplate.id);
      expect(retrieved).toEqual(firstTemplate);
      
      // Should not affect selection state
      expect(templateManager.getSelectedTemplate()).toBeNull();
    });

    it('should return null for invalid template ID', () => {
      const retrieved = templateManager.getTemplate(999);
      expect(retrieved).toBeNull();
    });
  });
});