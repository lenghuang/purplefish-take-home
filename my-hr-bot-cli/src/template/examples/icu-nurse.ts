import { Template } from "../types";

const icuNurseTemplate: Template = {
  id: "icu-nurse",
  name: "ICU Nurse Interview",
  description:
    "Interview template for ICU nurse candidates, focusing on clinical skills, critical thinking, and patient care.",
  role: "ICU Nurse",
  tags: ["nursing", "icu", "healthcare"],
  version: "1.0",
  steps: [
    {
      id: "intro",
      title: "Introduction",
      prompt:
        "Please introduce yourself and describe your experience as an ICU nurse.",
      expectedType: "text",
    },
    {
      id: "clinical-scenario",
      title: "Clinical Scenario",
      prompt:
        "Describe a critical situation you managed in the ICU. What actions did you take and what was the outcome?",
      expectedType: "text",
    },
    {
      id: "patient-safety",
      title: "Patient Safety",
      prompt:
        "How do you ensure patient safety and prevent medical errors in a high-pressure environment?",
      expectedType: "text",
    },
    {
      id: "teamwork",
      title: "Teamwork",
      prompt:
        "Give an example of how you collaborated with other healthcare professionals to provide optimal patient care.",
      expectedType: "text",
    },
    {
      id: "technical-skills",
      title: "Technical Skills",
      prompt:
        "What ICU equipment and procedures are you most comfortable with? How do you stay updated on best practices?",
      expectedType: "text",
    },
    {
      id: "stress-management",
      title: "Stress Management",
      prompt:
        "How do you manage stress and maintain focus during long or difficult shifts?",
      expectedType: "text",
    },
  ],
  config: {
    allowStepSkipping: false,
    showStepNumbers: true,
  },
};

export default icuNurseTemplate;
