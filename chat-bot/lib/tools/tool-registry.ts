// tool-registry.ts
// This file defines the Tool interface, the ToolRegistry interface, and a simple in-memory
// registry implementation for storing and retrieving tools (e.g., license validation, negotiation).
// Tools can be registered at application startup and invoked later by name.

// We import Zod to support schema-based validation for the Tool parameters.
import { ZodType } from 'zod';

/**
 * Represents a single tool, including its name, description, input parameter schema,
 * and an async function to execute the tool's behavior.
 */
export interface Tool {
  name: string;
  description: string;
  parameters: ZodType<any>; // Zod schema for input validation
  execute: (params: any) => Promise<any>;
}

/**
 * Defines the interface for a tool registry, allowing tools to be registered and retrieved.
 */
export interface ToolRegistry {
  registerTool(tool: Tool): void;
  getTool(name: string): Tool | undefined;
  listTools(): Tool[];
}

/**
 * Implements the ToolRegistry interface using an in-memory store.
 * In a real-world application, you might use a more complex approach.
 */
export class InMemoryToolRegistry implements ToolRegistry {
  private tools: Map<string, Tool>;

  constructor() {
    this.tools = new Map<string, Tool>();
  }

  /**
   * Registers a tool by storing it in the internal Map. If a tool with the same name
   * already exists, it is overwritten.
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Retrieves a tool by its name, returning undefined if not found.
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Lists all currently registered tools.
   */
  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}
