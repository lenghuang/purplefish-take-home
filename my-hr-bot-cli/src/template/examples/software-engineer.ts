import { Template } from "../types";

const softwareEngineerTemplate: Template = {
  id: "software-engineer",
  name: "Software Engineer Interview",
  description:
    "Interview template for software engineering candidates, focusing on technical and behavioral skills.",
  role: "Software Engineer",
  tags: ["engineering", "software", "technical"],
  version: "1.0",
  steps: [
    {
      id: "intro",
      title: "Introduction",
      prompt:
        "Please introduce yourself and describe your experience as a software engineer.",
      expectedType: "text",
    },
    {
      id: "tech-stack",
      title: "Technical Stack",
      prompt:
        "What programming languages and technologies are you most proficient in? Please provide examples.",
      expectedType: "text",
    },
    {
      id: "problem-solving",
      title: "Problem Solving",
      prompt:
        "Describe a challenging technical problem you solved. How did you approach it?",
      expectedType: "text",
    },
    {
      id: "coding",
      title: "Coding Exercise",
      prompt:
        "Write a function in your preferred language that reverses a string.",
      expectedType: "code",
    },
    {
      id: "behavioral",
      title: "Behavioral Question",
      prompt:
        "Tell me about a time you had a conflict in a team. How did you resolve it?",
      expectedType: "text",
    },
    {
      id: "system-design",
      title: "System Design",
      prompt:
        "Design a URL shortening service. Briefly describe your approach and key components.",
      expectedType: "text",
    },
  ],
  config: {
    allowStepSkipping: false,
    showStepNumbers: true,
  },
};

export default softwareEngineerTemplate;
