import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { NextRequest } from "next/server";

interface InterviewState {
  stage: string;
  candidateName?: string;
  position?: string;
  desiredSalary?: number;
  salaryAcceptable?: boolean;
  hasLicense?: boolean;
  licenseNumber?: string;
  licenseExpiry?: string;
  hasExperience?: boolean;
  experienceYears?: number;
  completed: boolean;
  endedEarly?: boolean;
  endReason?: string;
}

const MAX_SALARY = 72000;
const COMPANY_INFO = {
  name: "Regional Medical Center",
  position: "ICU Registered Nurse",
  location: "California",
  benefits: "Health insurance, 401k, PTO, continuing education support",
  schedule: "12-hour shifts, rotating weekends",
};

function validateSalary(desiredSalary: number): boolean {
  return desiredSalary <= MAX_SALARY;
}

function extractStructuredData(
  text: string,
  currentState: InterviewState,
): Partial<InterviewState> {
  const updates: Partial<InterviewState> = {};
  const lowerText = text.toLowerCase().trim();

  switch (currentState.stage) {
    case "greeting":
      if (
        lowerText.includes("yes") ||
        lowerText.includes("sure") ||
        lowerText.includes("okay") ||
        lowerText.includes("interested")
      ) {
        updates.stage = "basic_info";
      } else if (
        lowerText.includes("no") ||
        lowerText.includes("not interested")
      ) {
        updates.endedEarly = true;
        updates.completed = true;
        updates.endReason = "Candidate not interested in discussing the role";
      }
      break;

    case "basic_info":
      // Extract name - look for common name patterns
      const namePatterns = [
        /(?:my name is|i'm|i am|call me)\s+([a-zA-Z\s]+)/i,
        /^([a-zA-Z\s]{2,30})$/,
      ];

      for (const pattern of namePatterns) {
        const nameMatch = text.match(pattern);
        if (nameMatch && nameMatch[1].trim().length > 1) {
          const name = nameMatch[1].trim();
          // Avoid false positives
          if (
            !name.toLowerCase().includes("nurse") &&
            !name.toLowerCase().includes("position") &&
            !name.toLowerCase().includes("applying")
          ) {
            updates.candidateName = name;
            updates.stage = "salary_discussion";
            break;
          }
        }
      }
      break;

    case "salary_discussion":
      const salaryMatch = text.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);
      if (salaryMatch) {
        const salary = Number.parseInt(salaryMatch[0].replace(/[$,]/g, ""));
        if (salary > 20000 && salary < 200000) {
          // Reasonable salary range
          updates.desiredSalary = salary;
          if (validateSalary(salary)) {
            updates.salaryAcceptable = true;
            updates.stage = "license_check";
          } else {
            updates.stage = "salary_negotiation";
          }
        }
      }
      break;

    case "salary_negotiation":
      if (
        lowerText.includes("yes") ||
        lowerText.includes("okay") ||
        lowerText.includes("accept") ||
        lowerText.includes("fine")
      ) {
        updates.salaryAcceptable = true;
        updates.stage = "license_check";
      } else if (
        lowerText.includes("no") ||
        lowerText.includes("can't") ||
        lowerText.includes("won't")
      ) {
        updates.endedEarly = true;
        updates.completed = true;
        updates.endReason = "Salary expectations beyond budget";
      }
      break;

    case "license_check":
      if (
        lowerText.includes("yes") ||
        lowerText.includes("licensed") ||
        lowerText.includes("i am") ||
        lowerText.includes("i have")
      ) {
        updates.hasLicense = true;
        updates.stage = "license_details";
      } else if (
        lowerText.includes("no") ||
        lowerText.includes("not licensed") ||
        lowerText.includes("don't have")
      ) {
        updates.hasLicense = false;
        updates.stage = "license_timeline";
      }
      break;

    case "license_details":
      // Extract license number and expiry
      const licenseMatch = text.match(/([A-Z0-9]{6,})/i);
      if (licenseMatch) {
        updates.licenseNumber = licenseMatch[1];
      }

      const dateMatch = text.match(
        /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}|next year|this year)/i,
      );
      if (dateMatch) {
        updates.licenseExpiry = dateMatch[1];
      }

      // Move to next stage if we got some info
      if (text.length > 10) {
        updates.stage = "experience";
      }
      break;

    case "license_timeline":
      if (
        lowerText.includes("month") ||
        lowerText.includes("week") ||
        lowerText.includes("soon")
      ) {
        const monthMatch = text.match(/(\d+)\s*month/i);
        if (monthMatch && Number.parseInt(monthMatch[1]) > 6) {
          updates.endedEarly = true;
          updates.completed = true;
          updates.endReason = "License timeline too long (>6 months)";
        } else {
          updates.stage = "experience";
        }
      } else if (
        lowerText.includes("no") ||
        lowerText.includes("not planning")
      ) {
        updates.endedEarly = true;
        updates.completed = true;
        updates.endReason = "No plans to obtain required license";
      }
      break;

    case "experience":
      if (
        lowerText.includes("yes") ||
        lowerText.includes("year") ||
        lowerText.includes("experience")
      ) {
        const yearMatch = text.match(/(\d+)\s*year/i);
        if (yearMatch) {
          updates.experienceYears = Number.parseInt(yearMatch[1]);
        }
        updates.hasExperience = true;
        updates.stage = "experience_details";
      } else if (
        lowerText.includes("no") ||
        lowerText.includes("don't have") ||
        lowerText.includes("new grad")
      ) {
        updates.hasExperience = false;
        updates.stage = "alternative_experience";
      }
      break;

    case "experience_details":
      if (text.length > 30) {
        updates.stage = "completed";
        updates.completed = true;
      }
      break;

    case "alternative_experience":
      if (
        lowerText.includes("yes") ||
        lowerText.includes("acute") ||
        lowerText.includes("hospital")
      ) {
        updates.stage = "experience_details";
      } else {
        updates.stage = "completed";
        updates.completed = true;
      }
      break;
  }

  return updates;
}

function getSystemPrompt(state: InterviewState): string {
  const basePrompt = `You are conducting a professional nursing interview for an ICU RN position at ${COMPANY_INFO.name}. 

IMPORTANT RULES:
- Ask ONE question at a time
- Keep responses concise and professional (2-3 sentences max)
- Be encouraging and positive
- Handle company questions with: "${COMPANY_INFO.name} is a leading medical facility. The ICU position offers ${COMPANY_INFO.benefits}. Schedule: ${COMPANY_INFO.schedule}."
- If asked about salary range, say "The position pays up to $${MAX_SALARY.toLocaleString()}"

Current stage: ${state.stage}
Candidate info: ${JSON.stringify(state, null, 2)}`;

  const stagePrompts = {
    greeting: "Ask if they're open to discussing the nursing position today.",
    basic_info: "Ask for their full name in a friendly way.",
    salary_discussion:
      "Ask about their desired salary for the ICU RN position.",
    salary_negotiation: `Their desired salary ($${state.desiredSalary?.toLocaleString()}) is above our max of $${MAX_SALARY.toLocaleString()}. Ask if they'd accept $${MAX_SALARY.toLocaleString()}.`,
    license_check: `Ask if they're a licensed RN in ${COMPANY_INFO.location}.`,
    license_details: "Ask for their license number and expiration date.",
    license_timeline: "Ask when they expect to get their RN license.",
    experience: "Ask if they have at least 2 years of ICU experience.",
    experience_details:
      "Ask them to describe a challenging ICU emergency situation they handled.",
    alternative_experience:
      "Ask if they have any acute care or hospital experience.",
    completed:
      "Thank them and explain next steps: 'Thank you for your time! We'll review your responses and get back to you within 2 business days.'",
  };

  return (
    basePrompt + "\n\n" + stagePrompts[state.stage as keyof typeof stagePrompts]
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, interviewState } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      return new Response("No message provided", { status: 400 });
    }

    // Extract structured data from user input
    const stateUpdates = extractStructuredData(
      lastMessage.content,
      interviewState || { stage: "greeting", completed: false },
    );
    const newState = { ...interviewState, ...stateUpdates };

    console.log("Processing message:", lastMessage.content);
    console.log("Current state:", interviewState);
    console.log("New state:", newState);

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not found");
      return getFallbackResponse(newState);
    }

    try {
      const result = streamText({
        model: openai("gpt-4o"),
        system: getSystemPrompt(newState),
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content.replace(/\[STATE:.*?\]/s, "").trim(),
        })),
        onError: (error) => {
          console.error("StreamText internal error:", error);
        },
      });

      console.log("Result from streamText:", result);

      // Workaround: Manually pipe the text stream and append state
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            let fullText = "";
            for await (const chunk of result.textStream) {
              fullText += chunk;
              controller.enqueue(encoder.encode(chunk));
            }
            // Append state as a special string at the end
            const stateString = `[STATE:${JSON.stringify(newState)}]`;
            controller.enqueue(encoder.encode(stateString));
            console.log("Full streamed text:", fullText);
            console.log("Appended state:", stateString);
            controller.close();
          } catch (streamError) {
            console.error("Error during stream piping:", streamError);
            controller.error(streamError);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8", // Use text/plain for simple streams
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      return getFallbackResponse(newState);
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

// Add fallback response function
function getFallbackResponse(state: InterviewState): Response {
  const fallbackResponses = {
    greeting:
      "Hello! Are you currently open to discussing this nursing position with us today?",
    basic_info: "Great! Could you please tell me your full name?",
    salary_discussion:
      "Thank you! What is your desired salary for this ICU RN position?",
    salary_negotiation: `I understand. Our maximum budget for this position is $${MAX_SALARY.toLocaleString()}. Would that work for you?`,
    license_check: "Perfect! Are you currently a licensed RN in California?",
    license_details:
      "Excellent! Could you provide your license number and expiration date?",
    license_timeline: "I see. When do you expect to obtain your RN license?",
    experience: "Great! Do you have at least 2 years of ICU experience?",
    experience_details:
      "Wonderful! Can you tell me about a challenging emergency situation you handled in the ICU?",
    alternative_experience:
      "I understand. Do you have any acute care or hospital experience?",
    completed:
      "Thank you so much for your time today! We'll review your responses and get back to you within 2 business days.",
  };

  const response =
    fallbackResponses[state.stage as keyof typeof fallbackResponses] ||
    "Thank you for your response. Could you tell me more about that?";

  const fullResponse = `${response}[STATE:${JSON.stringify(state)}]`;

  return new Response(fullResponse, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
