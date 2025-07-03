import { Template, Step, StepType } from "../types";

export const seniorEngineerTemplate: Template = {
  id: "senior-engineer-2025",
  name: "Senior Software Engineer Interview",
  description:
    "Comprehensive interview template for senior software engineer positions with enhanced interaction patterns",
  version: "1.0.0",
  metadata: {
    roleType: "senior-software-engineer",
    requiredSkills: [
      "system-design",
      "architecture",
      "team-leadership",
      "technical-decision-making",
    ],
    expectedDuration: 60,
    customFields: {
      experienceLevel: "senior",
      focusAreas: ["architecture", "leadership", "technical-depth"],
    },
  },
  steps: [
    {
      id: "system-design",
      type: "question" as StepType,
      content:
        "Design a scalable real-time chat system that can handle millions of concurrent users. Include considerations for data storage, message delivery, and handling peak loads.",
      availableTools: [],
      conditions: [],
      nextSteps: {
        default: "architecture-tradeoffs",
      },
      metadata: {
        importance: "critical",
        tags: ["system-design", "scalability", "real-time"],
        timeoutSeconds: 600,
        qualityThreshold: 0.8,
        allowClarification: true,
        allowNegotiation: true,
        constraints: {
          requiredTopics: [
            "data-storage",
            "message-delivery",
            "scalability",
            "fault-tolerance",
          ],
          minDetailLevel: "high",
          mustIncludeTradeoffs: true,
        },
      },
    },
    {
      id: "architecture-tradeoffs",
      type: "validation" as StepType,
      content:
        "Explain the key architectural trade-offs you considered in your design. What alternatives did you evaluate and why did you choose your proposed solution?",
      availableTools: [],
      conditions: [
        {
          type: "regex",
          value: "\\b(latency|throughput|consistency|availability)\\b",
          outcome: "technical-leadership",
          metadata: {
            errorMessage:
              "Please discuss specific trade-offs between key system properties",
            validationHints: [
              "Consider CAP theorem implications",
              "Discuss performance vs cost trade-offs",
              "Address scalability challenges",
            ],
          },
        },
      ],
      nextSteps: {
        "technical-leadership": "team-leadership",
        default: "team-leadership",
      },
      metadata: {
        importance: "critical",
        tags: ["architecture", "decision-making", "trade-offs"],
        qualityThreshold: 0.75,
        allowClarification: true,
        constraints: {
          minTradeoffsDiscussed: 3,
          requireJustification: true,
        },
      },
    },
    {
      id: "team-leadership",
      type: "question" as StepType,
      content:
        "Describe a situation where you had to lead a team through a significant technical challenge. How did you handle disagreements and ensure the team remained productive?",
      availableTools: [],
      conditions: [],
      nextSteps: {
        default: "exit",
      },
      metadata: {
        importance: "critical",
        tags: ["leadership", "conflict-resolution", "team-management"],
        qualityThreshold: 0.7,
        allowClarification: true,
        allowNegotiation: true,
        constraints: {
          requiredElements: [
            "situation-context",
            "challenge-description",
            "resolution-approach",
            "outcome-impact",
          ],
          minResponseLength: 200,
        },
      },
    },
    {
      id: "exit",
      type: "exit" as StepType,
      content:
        "Thank you for completing the interview. We'll evaluate your responses and get back to you soon.",
      availableTools: [],
      conditions: [],
      nextSteps: {},
      metadata: {
        importance: "optional",
        tags: ["exit"],
        timeoutSeconds: 30,
      },
    },
  ],
};
