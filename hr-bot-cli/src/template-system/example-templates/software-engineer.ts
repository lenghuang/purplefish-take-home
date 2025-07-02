import { Template } from "../types";

export const softwareEngineerTemplate: Template = {
  id: "software-engineer-interview",
  name: "Software Engineer Interview",
  description: "Technical screening interview for software engineer positions",
  version: "1.0.0",
  steps: [
    {
      id: "introduction",
      type: "question",
      content:
        "Are you currently open to discussing software engineering opportunities?",
      conditions: [
        {
          type: "regex",
          value: "^(?i)(no|nope|not interested)",
          outcome: "exit",
          metadata: {
            errorMessage: "Response indicates candidate is not interested",
            validationHints: ["Please respond with yes/no"],
          },
        },
      ],
      nextSteps: {
        default: "experience",
        exit: "exit_flow",
      },
      metadata: {
        timeoutSeconds: 300,
        importance: "critical",
        tags: ["screening", "initial"],
      },
    },
    {
      id: "experience",
      type: "validation",
      content:
        "How many years of professional software development experience do you have?",
      conditions: [
        {
          type: "numeric",
          value: ">=3",
          outcome: "technical_assessment",
          metadata: {
            errorMessage: "Experience does not meet minimum requirements",
            validationHints: [
              "Please provide a number",
              "We require at least 3 years of experience",
            ],
          },
        },
      ],
      nextSteps: {
        default: "junior_track",
        technical_assessment: "technical_skills",
      },
      metadata: {
        timeoutSeconds: 300,
        importance: "critical",
        tags: ["experience", "screening"],
      },
    },
    {
      id: "technical_skills",
      type: "validation",
      content:
        "Which of the following technologies have you worked with professionally: React, Node.js, TypeScript, Python?",
      conditions: [
        {
          type: "regex",
          value: "(?i)(react|typescript).*(node|python)",
          outcome: "success",
          metadata: {
            errorMessage: "Required technology experience not found",
            validationHints: [
              "Please list your experience with the mentioned technologies",
            ],
          },
        },
      ],
      nextSteps: {
        default: "alternative_track",
        success: "salary_expectations",
      },
      metadata: {
        timeoutSeconds: 600,
        importance: "critical",
        tags: ["technical", "skills"],
      },
    },
    {
      id: "salary_expectations",
      type: "validation",
      content:
        "What are your salary expectations for this role? (Please provide a number)",
      conditions: [
        {
          type: "numeric",
          value: "<=150000",
          outcome: "success",
          metadata: {
            errorMessage: "Salary expectations exceed our budget",
            validationHints: [
              "Please provide a numeric value",
              "Our budget range is up to $150,000",
            ],
          },
        },
      ],
      nextSteps: {
        default: "negotiation",
        success: "schedule_technical",
      },
      metadata: {
        timeoutSeconds: 300,
        importance: "critical",
        tags: ["compensation", "screening"],
      },
    },
    {
      id: "schedule_technical",
      type: "question",
      content:
        "Great! Would you be available for a technical interview in the next week?",
      conditions: [
        {
          type: "regex",
          value: "^(?i)(no|cannot|unavailable)",
          outcome: "reschedule",
          metadata: {
            validationHints: ["Please respond with yes/no"],
          },
        },
      ],
      nextSteps: {
        default: "success_exit",
        reschedule: "reschedule_flow",
      },
      metadata: {
        timeoutSeconds: 300,
        importance: "optional",
        tags: ["scheduling", "next_steps"],
      },
    },
    {
      id: "exit_flow",
      type: "exit",
      content:
        "Thank you for your time. We understand you're not interested at this moment.",
      conditions: [],
      nextSteps: {
        default: "exit",
      },
      metadata: {
        importance: "optional",
        tags: ["exit", "not_interested"],
      },
    },
    {
      id: "success_exit",
      type: "exit",
      content:
        "Thank you for your time! Our team will be in touch with technical interview details.",
      conditions: [],
      nextSteps: {
        default: "exit",
      },
      metadata: {
        importance: "optional",
        tags: ["exit", "success"],
      },
    },
  ],
  metadata: {
    roleType: "software_engineer",
    requiredSkills: ["React", "Node.js", "TypeScript", "Python"],
    expectedDuration: 1800,
    customFields: {
      department: "Engineering",
      level: "Senior",
      remote: true,
    },
  },
};
