import { Template, Step, StepType } from "../types";

export const icuNurseTemplate: Template = {
  id: "rn-icu-interview",
  name: "ICU Registered Nurse Interview",
  description: "Screening interview for ICU RN positions",
  version: "1.0.0",
  steps: [
    {
      id: "interest_check",
      type: "question",
      content: "Hello! Are you currently open to discussing this role?",
      availableTools: [],
      conditions: [
        {
          type: "regex",
          value: "^\\s*no",
          outcome: "exit",
          metadata: {
            errorMessage: "Not interested in role",
            validationHints: [],
          },
        },
      ],
      nextSteps: {
        default: "name",
        exit: "exit",
      },
      metadata: {
        importance: "critical",
        tags: ["screening"],
      },
    },
    {
      id: "name",
      type: "question",
      content: "Great! What's your name?",
      availableTools: [],
      conditions: [],
      nextSteps: {
        default: "position",
      },
      metadata: {
        importance: "critical",
        tags: ["personal"],
      },
    },
    {
      id: "position",
      type: "question",
      content: "What position are you applying for?",
      availableTools: [],
      conditions: [],
      nextSteps: {
        default: "salary",
      },
      metadata: {
        importance: "critical",
        tags: ["screening"],
      },
    },
    {
      id: "salary",
      type: "validation",
      content: "What is your desired salary?",
      availableTools: [],
      conditions: [
        {
          type: "numeric",
          value: "<=72000",
          outcome: "license",
          metadata: {
            errorMessage: "Salary exceeds maximum",
            validationHints: ["Maximum salary is $72,000"],
          },
        },
      ],
      nextSteps: {
        default: "salary_negotiation",
        success: "license",
      },
      metadata: {
        importance: "critical",
        tags: ["compensation"],
      },
    },
    {
      id: "salary_negotiation",
      type: "question",
      content: "The max pay is $72,000. Does that work for you?",
      availableTools: [],
      conditions: [
        {
          type: "regex",
          value: "^\\s*(y|yes)",
          outcome: "license",
          metadata: {
            errorMessage: "Salary requirements not met",
            validationHints: [],
          },
        },
      ],
      nextSteps: {
        default: "exit",
        license: "license",
      },
      metadata: {
        importance: "critical",
        tags: ["compensation", "negotiation"],
      },
    },
    {
      id: "license",
      type: "question",
      content: "Are you a licensed RN in this state?",
      availableTools: [],
      conditions: [
        {
          type: "regex",
          value: "^\\s*yes",
          outcome: "experience_years",
          metadata: {
            errorMessage: "License required",
            validationHints: [],
          },
        },
      ],
      nextSteps: {
        default: "license_timing",
        experience_years: "experience_years",
      },
      metadata: {
        importance: "critical",
        tags: ["qualifications"],
      },
    },
    {
      id: "license_timing",
      type: "validation",
      content: "When (in months) do you expect to get licensed?",
      availableTools: [],
      conditions: [
        {
          type: "numeric",
          value: "<=6",
          outcome: "experience_years",
          metadata: {
            errorMessage: "License timeline too long",
            validationHints: ["Must be licensed within 6 months"],
          },
        },
      ],
      nextSteps: {
        default: "exit",
        experience_years: "experience_years",
      },
      metadata: {
        importance: "critical",
        tags: ["qualifications", "timeline"],
      },
    },
    {
      id: "experience_years",
      type: "question",
      content: "Do you have at least 2 years of ICU experience?",
      availableTools: [],
      conditions: [
        {
          type: "regex",
          value: "^\\s*yes",
          outcome: "experience_story",
          metadata: {
            errorMessage: "Insufficient experience",
            validationHints: [],
          },
        },
      ],
      nextSteps: {
        default: "experience_acute",
        experience_story: "experience_story",
      },
      metadata: {
        importance: "critical",
        tags: ["experience"],
      },
    },
    {
      id: "experience_story",
      type: "question",
      content:
        "Tell me about a challenging ICU emergency and how you handled it.",
      availableTools: [],
      conditions: [],
      nextSteps: {
        default: "ending",
      },
      metadata: {
        importance: "critical",
        tags: ["experience", "behavioral"],
      },
    },
    {
      id: "experience_acute",
      type: "question",
      content: "Do you have any acute‑care experience?",
      availableTools: [],
      conditions: [],
      nextSteps: {
        default: "ending",
      },
      metadata: {
        importance: "critical",
        tags: ["experience"],
      },
    },
    {
      id: "ending",
      type: "question",
      content: "Thanks for your time! We'll be in touch soon.",
      availableTools: [],
      conditions: [],
      nextSteps: {
        default: "exit",
      },
      metadata: {
        importance: "optional",
        tags: ["closing"],
      },
    },
    {
      id: "exit",
      type: "exit",
      content: "",
      availableTools: [],
      conditions: [],
      nextSteps: {
        default: "exit",
      },
      metadata: {
        importance: "optional",
        tags: ["system"],
      },
    },
  ],
  metadata: {
    roleType: "nursing",
    requiredSkills: ["ICU", "RN License"],
    expectedDuration: 15,
    customFields: {
      maxSalary: 72000,
      licenseGraceMonths: 6,
    },
  },
};
