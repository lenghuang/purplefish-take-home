import { Template } from "../types";

const seniorEngineerTemplate: Template = {
  id: "senior-engineer",
  name: "Senior Engineer Interview",
  description:
    "Interview template for senior engineering candidates, focusing on leadership, architecture, and advanced problem-solving.",
  role: "Senior Engineer",
  tags: ["engineering", "senior", "leadership"],
  version: "1.0",
  steps: [
    {
      id: "intro",
      title: "Introduction",
      prompt:
        "Please introduce yourself and summarize your experience as a senior engineer or technical lead.",
      expectedType: "text",
    },
    {
      id: "architecture",
      title: "System Architecture",
      prompt:
        "Describe a complex system you designed or led. What were the key architectural decisions and trade-offs?",
      expectedType: "text",
    },
    {
      id: "mentorship",
      title: "Mentorship",
      prompt:
        "How have you mentored junior engineers? Share a specific example of helping someone grow.",
      expectedType: "text",
    },
    {
      id: "cross-team",
      title: "Cross-Team Collaboration",
      prompt:
        "Describe a time you worked across teams or departments to deliver a project. What challenges did you face?",
      expectedType: "text",
    },
    {
      id: "technical-decision",
      title: "Technical Decision-Making",
      prompt:
        "Tell me about a high-stakes technical decision you made. How did you evaluate options and communicate your choice?",
      expectedType: "text",
    },
    {
      id: "coding",
      title: "Coding Exercise",
      prompt:
        "Write a function to detect cycles in a directed graph. Use your preferred language and explain your approach.",
      expectedType: "code",
    },
    {
      id: "leadership",
      title: "Leadership Challenge",
      prompt:
        "Share an example of a leadership challenge you faced and how you addressed it.",
      expectedType: "text",
    },
  ],
  config: {
    allowStepSkipping: false,
    showStepNumbers: true,
  },
};

export default seniorEngineerTemplate;
