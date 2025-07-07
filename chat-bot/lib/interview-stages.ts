export interface InterviewStage {
  id: string
  name: string
  description: string
  questions: string[]
  validationRules?: {
    required?: boolean
    minLength?: number
    pattern?: RegExp
  }
}

export const interviewStages: InterviewStage[] = [
  {
    id: "greeting",
    name: "Introduction",
    description: "Welcome and basic introduction",
    questions: ["Could you please tell me your full name?", "How are you doing today?"],
  },
  {
    id: "basic_info",
    name: "Basic Information",
    description: "Position and background information",
    questions: [
      "What position are you applying for?",
      "Can you tell me a bit about your background?",
      "What interests you about this role?",
    ],
  },
  {
    id: "salary_discussion",
    name: "Salary Discussion",
    description: "Compensation expectations",
    questions: ["What are your salary expectations for this role?", "Are you flexible with compensation?"],
  },
  {
    id: "license_check",
    name: "License Verification",
    description: "Professional licenses and certifications",
    questions: [
      "Do you have any relevant professional licenses?",
      "Could you provide your license number?",
      "When does your license expire?",
    ],
  },
  {
    id: "experience",
    name: "Experience Review",
    description: "Work experience and achievements",
    questions: [
      "Can you tell me about your relevant work experience?",
      "What are some of your key achievements?",
      "How do you handle challenging situations?",
    ],
  },
  {
    id: "completed",
    name: "Interview Complete",
    description: "Wrap up and next steps",
    questions: ["Do you have any questions for us?", "Is there anything else you'd like to add?"],
  },
]

export function getStageById(id: string): InterviewStage | undefined {
  return interviewStages.find((stage) => stage.id === id)
}

export function getNextStage(currentStageId: string): InterviewStage | undefined {
  const currentIndex = interviewStages.findIndex((stage) => stage.id === currentStageId)
  if (currentIndex >= 0 && currentIndex < interviewStages.length - 1) {
    return interviewStages[currentIndex + 1]
  }
  return undefined
}
