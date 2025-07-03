import { DatabaseTemplate } from "./schema";
import { Template } from "../template/types";

/**
 * Maps a DatabaseTemplate (DB schema) to a business Template (app logic).
 */
export function toBusinessTemplate(dbTemplate: DatabaseTemplate): Template {
  const content = dbTemplate.content;
  return {
    id: dbTemplate.id,
    name: dbTemplate.name,
    description: dbTemplate.description,
    role: content.role,
    steps: content.steps,
    config: content.config,
    version: dbTemplate.version,
    tags: content.tags,
  };
}

/**
 * Maps a business Template (app logic) to a DatabaseTemplate (DB schema), omitting createdAt/updatedAt.
 */
export function toDatabaseTemplate(
  template: Template
): Omit<DatabaseTemplate, "createdAt" | "updatedAt"> {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    version: template.version || "1.0.0",
    content: {
      role: template.role,
      steps: template.steps,
      config: template.config,
      tags: template.tags,
    },
  };
}
