import {
  Tool,
  ValidateNumericInputTool,
  ValidateRegexTool,
  NextStepTool,
} from "./tool";

/**
 * Registry to hold and manage available tools.
 */
export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  constructor() {
    // Register default tools
    this.register(new ValidateNumericInputTool());
    this.register(new ValidateRegexTool());
    this.register(new NextStepTool());
  }

  /**
   * Register a new tool.
   * @param tool Tool instance to register
   */
  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name.
   * @param name Tool name
   * @returns Tool instance or undefined if not found
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools.
   * @returns Array of Tool instances
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}
