# Interview Agent Architecture

## Template System & Repository Pattern Implementation

### 1. Template System

The template system allows for configurable interview flows while maintaining flexibility and reusability.

#### 1.1 Core Template Models

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: Step[];
  metadata: {
    roleType: string;
    requiredSkills: string[];
    expectedDuration: number;
    customFields: Record<string, any>;
  };
}

interface Step {
  id: string;
  type: "question" | "validation" | "branch" | "exit";
  content: string;
  conditions: Condition[];
  nextSteps: Record<string, string>;
  metadata: {
    timeoutSeconds?: number;
    retryAttempts?: number;
    importance: "critical" | "optional";
    tags: string[];
  };
}

interface Condition {
  type: "regex" | "numeric" | "custom";
  value: string;
  outcome: string;
  metadata: {
    errorMessage?: string;
    validationHints?: string[];
  };
}
```

#### 1.2 Example Template Definition

```json
{
  "id": "rn-icu-interview",
  "name": "ICU Registered Nurse Interview",
  "description": "Screening interview for ICU RN positions",
  "version": "1.0.0",
  "steps": [
    {
      "id": "interest_check",
      "type": "question",
      "content": "Are you currently open to discussing this role?",
      "conditions": [
        {
          "type": "regex",
          "value": "^\\s*no",
          "outcome": "exit"
        }
      ],
      "nextSteps": {
        "default": "name",
        "exit": "exit"
      }
    },
    {
      "id": "salary",
      "type": "validation",
      "content": "What is your desired salary?",
      "conditions": [
        {
          "type": "numeric",
          "value": "<=72000",
          "outcome": "license"
        }
      ],
      "nextSteps": {
        "default": "salary_negotiation",
        "success": "license"
      },
      "metadata": {
        "importance": "critical",
        "validationHints": [
          "Please provide a numeric value",
          "Our maximum budget is $72,000"
        ]
      }
    }
  ]
}
```

### 2. Repository Pattern Implementation

The repository pattern abstracts data persistence operations and allows for easy switching between different storage solutions.

#### 2.1 Base Repository Interface

```typescript
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Filter): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
```

#### 2.2 Specialized Repository Interfaces

```typescript
interface ITemplateRepository extends IRepository<Template> {
  findByVersion(version: string): Promise<Template>;
  findLatestVersion(): Promise<Template>;
  findByRole(roleType: string): Promise<Template[]>;
}

interface IInterviewRepository extends IRepository<Interview> {
  findByUserId(userId: string): Promise<Interview[]>;
  findActiveInterviews(): Promise<Interview[]>;
  saveResponse(interviewId: string, response: Response): Promise<void>;
}
```

#### 2.3 SQLite Implementation Example

```typescript
class SQLiteTemplateRepository implements ITemplateRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Template | null> {
    const template = await this.db.get(`SELECT * FROM templates WHERE id = ?`, [
      id,
    ]);
    if (!template) return null;

    const steps = await this.db.all(
      `SELECT * FROM template_steps WHERE template_id = ?`,
      [id]
    );

    return this.mapToTemplate(template, steps);
  }

  async findByVersion(version: string): Promise<Template> {
    const template = await this.db.get(
      `SELECT * FROM templates WHERE version = ?`,
      [version]
    );
    if (!template) {
      throw new ApplicationError(
        "Template not found",
        "TEMPLATE_NOT_FOUND",
        404
      );
    }
    return this.mapToTemplate(template);
  }

  private mapToTemplate(row: any, steps?: any[]): Template {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      steps: steps || [],
      metadata: JSON.parse(row.metadata),
    };
  }
}
```

### 3. Database Schema

```sql
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE template_steps (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  conditions JSON,
  next_steps JSON,
  metadata JSON,
  sequence INTEGER NOT NULL,
  FOREIGN KEY(template_id) REFERENCES templates(id)
);

CREATE TABLE interviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_step_id TEXT,
  metadata JSON,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY(template_id) REFERENCES templates(id)
);

CREATE TABLE interview_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  interview_id INTEGER NOT NULL,
  step_id TEXT NOT NULL,
  response TEXT NOT NULL,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(interview_id) REFERENCES interviews(id)
);
```

### 4. Usage Example

```typescript
class InterviewService {
  constructor(
    private templateRepo: ITemplateRepository,
    private interviewRepo: IInterviewRepository,
    private llmService: ILLMService
  ) {}

  async startInterview(templateId: string, userId: string): Promise<Interview> {
    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw new ApplicationError(
        "Template not found",
        "TEMPLATE_NOT_FOUND",
        404
      );
    }

    const interview = await this.interviewRepo.create({
      templateId,
      userId,
      status: "active",
      currentStepId: template.steps[0].id,
      metadata: {},
    });

    return interview;
  }

  async processResponse(
    interviewId: string,
    response: string
  ): Promise<Step | null> {
    const interview = await this.interviewRepo.findById(interviewId);
    if (!interview) {
      throw new ApplicationError(
        "Interview not found",
        "INTERVIEW_NOT_FOUND",
        404
      );
    }

    const template = await this.templateRepo.findById(interview.templateId);
    const currentStep = template.steps.find(
      (s) => s.id === interview.currentStepId
    );

    // Process conditions and determine next step
    const nextStepId = this.evaluateConditions(currentStep, response);
    const nextStep = template.steps.find((s) => s.id === nextStepId);

    // Save response and update interview
    await this.interviewRepo.saveResponse(interviewId, {
      stepId: currentStep.id,
      response,
      metadata: {},
    });

    await this.interviewRepo.update(interviewId, {
      currentStepId: nextStepId,
      status: nextStepId === "exit" ? "completed" : "active",
    });

    return nextStep || null;
  }
}
```

This architecture provides:

- Flexible template definition for different interview flows
- Clean separation of concerns through repository pattern
- Type-safe implementations
- Easy extensibility for new features
- Clear data structure for persistence
