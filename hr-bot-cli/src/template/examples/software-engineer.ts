import { Template } from "../types";

const softwareEngineerTemplate: Template = {
  id: 1,
  name: "Software Engineer Interview",
  description:
    "Interview template for software engineering candidates, focusing on technical and behavioral skills. Demonstrates tool-driven flow for salary validation and negotiation.",
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
      id: "salary-expectations",
      title: "Salary Expectations",
      prompt:
        "What are your salary expectations for this role? Please provide a range or specific number.",
      expectedType: "text",
      // This step demonstrates tool-driven flow: SalaryValidatorTool and NegotiationTool
      tools: ["SalaryValidatorTool", "NegotiationTool"],
    },
    {
      id: "problem-solving",
      title: "Problem Solving",
      prompt:
        "Describe a challenging technical problem you solved. How did you approach it?",
      expectedType: "text",
    },
  ],
  config: {
    allowStepSkipping: false,
    showStepNumbers: true,
  },
};

export default softwareEngineerTemplate;
