import { Template } from "../template-system/types";

export interface Filter {
  [key: string]: any;
}

export interface Interview {
  id: string;
  templateId: string;
  userId: string;
  status: "active" | "completed" | "cancelled";
  currentStepId: string;
  metadata: Record<string, any>;
  startedAt: Date;
  completedAt?: Date;
}

export interface Response {
  stepId: string;
  response: string;
  metadata: Record<string, any>;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Filter): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface ITemplateRepository extends IRepository<Template> {
  findByVersion(version: string): Promise<Template>;
  findLatestVersion(): Promise<Template>;
  findByRole(roleType: string): Promise<Template[]>;
}

export interface IInterviewRepository extends IRepository<Interview> {
  findByUserId(userId: string): Promise<Interview[]>;
  findActiveInterviews(): Promise<Interview[]>;
  saveResponse(interviewId: string, response: Response): Promise<void>;
}

export interface ICandidateRepository extends IRepository<Candidate> {
  findByEmail(email: string): Promise<Candidate | null>;
  findByPhone(phone: string): Promise<Candidate | null>;
}

export interface DatabaseConfig {
  filename: string;
}

export class ApplicationError extends Error {
  constructor(message: string, public code: string, public statusCode: number) {
    super(message);
    this.name = "ApplicationError";
  }
}
