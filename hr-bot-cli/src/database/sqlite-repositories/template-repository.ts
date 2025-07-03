import { Database } from "sqlite3";
import { Template } from "../../template-system/types";
import { ITemplateRepository, ApplicationError } from "../types";
import { BaseSQLiteRepository } from "./base-repository";

export class SQLiteTemplateRepository
  extends BaseSQLiteRepository<Template>
  implements ITemplateRepository
{
  tableName = "templates";

  async findByVersion(version: string): Promise<Template> {
    try {
      const template = await this.getOne(
        `SELECT * FROM ${this.tableName} WHERE version = ?`,
        [version]
      );

      if (!template) {
        throw new ApplicationError(
          "Template version not found",
          "TEMPLATE_NOT_FOUND",
          404
        );
      }

      const steps = await this.getAll(
        "SELECT * FROM template_steps WHERE template_id = ? ORDER BY sequence",
        [template.id]
      );

      return this.mapToEntity(template, steps);
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError(
        "Error finding template by version",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async findLatestVersion(): Promise<Template> {
    try {
      const template = await this.getOne(
        `SELECT * FROM ${this.tableName} ORDER BY version DESC LIMIT 1`
      );

      if (!template) {
        throw new ApplicationError(
          "No templates found",
          "TEMPLATE_NOT_FOUND",
          404
        );
      }

      const steps = await this.getAll(
        "SELECT * FROM template_steps WHERE template_id = ? ORDER BY sequence",
        [template.id]
      );

      return this.mapToEntity(template, steps);
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      throw new ApplicationError(
        "Error finding latest template version",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async findByRole(roleType: string): Promise<Template[]> {
    try {
      const templates = await this.getAll(
        `SELECT * FROM ${this.tableName} WHERE json_extract(metadata, '$.roleType') = ?`,
        [roleType]
      );

      const results: Template[] = [];
      for (const template of templates) {
        const steps = await this.getAll(
          "SELECT * FROM template_steps WHERE template_id = ? ORDER BY sequence",
          [template.id]
        );
        results.push(this.mapToEntity(template, steps));
      }

      return results;
    } catch (error) {
      throw new ApplicationError(
        "Error finding templates by role",
        "DATABASE_ERROR",
        500
      );
    }
  }

  async create(template: Template): Promise<Template> {
    try {
      await this.db.run("BEGIN TRANSACTION");

      // Insert template
      await super.create(template);

      // Insert steps
      for (let i = 0; i < template.steps.length; i++) {
        const step = template.steps[i];
        await this.runQuery(
          `INSERT INTO template_steps (
            id, template_id, type, content, conditions, next_steps, metadata, sequence
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            step.id,
            template.id,
            step.type,
            step.content,
            JSON.stringify(step.conditions),
            JSON.stringify(step.nextSteps),
            JSON.stringify(step.metadata),
            i,
          ]
        );
      }

      await this.db.run("COMMIT");
      return template;
    } catch (error) {
      await this.db.run("ROLLBACK");
      throw new ApplicationError(
        "Error creating template",
        "DATABASE_ERROR",
        500
      );
    }
  }

  protected mapToEntity(row: any, steps: any[] = []): Template {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      steps: steps.map((step) => ({
        id: step.id,
        type: step.type as "question" | "validation" | "branch" | "exit",
        content: step.content,
        availableTools: [],
        conditions: JSON.parse(step.conditions),
        nextSteps: JSON.parse(step.next_steps),
        metadata: JSON.parse(step.metadata),
      })),
      metadata: JSON.parse(row.metadata),
    };
  }
}
