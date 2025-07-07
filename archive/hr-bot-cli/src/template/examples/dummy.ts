import { Template } from "../types";

const dummyTemplate: Template = {
  id: 4,
  name: "Dummy",
  description: "Dummy.",
  role: "Dummy",
  tags: ["no", "tags"],
  version: "1.0",
  steps: [
    {
      id: "intro",
      title: "Introduction",
      prompt:
        "Please introduce yourself and describe your experience as a dummy.",
      expectedType: "text",
    },
  ],
  config: {
    allowStepSkipping: false,
    showStepNumbers: true,
  },
};

export default dummyTemplate;
