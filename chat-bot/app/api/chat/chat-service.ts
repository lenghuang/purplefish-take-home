// chat-service.ts
// This file has been updated to integrate:
// 1) ReAct agent logic (LangChain-style reasoning)
// 2) Tool calls (license, negotiation, FAQ)
// 3) Zod schema validation (tools use internal Zod schemas)
// 4) Script/FAQ switching

// Below is the entire content of the file, with our new code inserted after line 15,
// preserving all existing functionality. Inline comments explain each new part.

export interface InterviewState {
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

// *** ReAct & Tools Integration START ***
import { ReActAgent, AgentState } from '../../../lib/agent/react-agent';
import { InMemoryToolRegistry } from '../../../lib/tools/tool-registry';
import { licenseValidatorTool } from '../../../lib/tools/license-validator';
import { negotiationTool } from '../../../lib/tools/negotiation-tool';
import { faqHandlerTool } from '../../../lib/tools/faq-handler';

/**
 * We create a single registry instance for demonstration, plus the ReAct agent.
 * In a production scenario, consider a more robust approach, e.g. dependency injection.
 */
const toolRegistry = new InMemoryToolRegistry();
toolRegistry.registerTool(licenseValidatorTool);
toolRegistry.registerTool(negotiationTool);
toolRegistry.registerTool(faqHandlerTool);

const reactAgent = new ReActAgent(toolRegistry);

/**
 * Example function to detect if user is asking an out-of-script question
 * that might be handled by the FAQ tool. This simplistic check can be
 * extended to incorporate more robust NLP or classification logic.
 */
/* Duplicate FAQ logic removed. The FAQ tool is now solely managed by the ReAct agent via 'faq-handler.ts'. */

/**
 * ReAct agent ephemeral state. Typically you'd store this in a conversation object or DB.
 */
let ephemeralAgentState: AgentState = {
  thoughtProcess: [],
  activeTools: [],
};

/**
 * Use the ReAct agent to process user input. If the agent calls a tool,
 * it will be executed automatically (with mock parameters for demonstration).
 * Returns the agent's final textual answer.
 */
/** Make currentState optional and embed system prompt into ephemeralAgentState so we call only two arguments */
// Accepts the full conversation history as an array of messages
export async function processWithReActAgent(
  messages: Array<{ role: string; content: string }>,
  currentState?: InterviewState,
): Promise<string> {
  let systemPrompt: string | undefined = undefined;
  if (currentState) {
    systemPrompt = getSystemPrompt(currentState);
    // Store that prompt in ephemeralAgentState
    ephemeralAgentState.systemPrompt = systemPrompt;
  }
  // Ensure the first message is always the system prompt
  let messagesWithSystem: Array<{ role: string; content: string }> = messages;
  if (systemPrompt) {
    if (!messages.length || messages[0].role !== 'system') {
      messagesWithSystem = [{ role: 'system', content: systemPrompt }, ...messages];
    } else if (messages[0].content !== systemPrompt) {
      // Replace the system message if it differs
      messagesWithSystem = [{ role: 'system', content: systemPrompt }, ...messages.slice(1)];
    }
  }
  const { agentReply, newState } = await reactAgent.processInput(
    messagesWithSystem,
    ephemeralAgentState,
  );
  ephemeralAgentState = newState;
  return agentReply;
}
// *** ReAct & Tools Integration END ***

export const MAX_SALARY = 72000;
export const COMPANY_INFO = {
  name: 'Regional Medical Center',
  position: 'ICU Registered Nurse',
  location: 'California',
  benefits: 'Health insurance, 401k, PTO, continuing education support',
  schedule: '12-hour shifts, rotating weekends',
};

export function validateSalary(desiredSalary: number): boolean {
  return desiredSalary <= MAX_SALARY;
}

export function extractStructuredData(
  text: string,
  currentState: InterviewState,
): Partial<InterviewState> {
  const updates: Partial<InterviewState> = {};
  const lowerText = text.toLowerCase().trim();

  switch (currentState.stage) {
    case 'greeting': {
      if (
        lowerText.includes('yes') ||
        lowerText.includes('sure') ||
        lowerText.includes('okay') ||
        lowerText.includes('interested')
      ) {
        updates.stage = 'basic_info';
      } else if (lowerText.includes('no') || lowerText.includes('not interested')) {
        updates.endedEarly = true;
        updates.completed = true;
        updates.endReason = 'Candidate not interested in discussing the role';
      } else {
        // Try to extract name directly in greeting stage
        const namePatterns = [
          /(?:my name is|i'm|i am|call me)\s+([a-zA-Z\s]+)/i,
          /^([a-zA-Z\s]{2,30})$/,
        ];
        for (const pattern of namePatterns) {
          const nameMatch = text.match(pattern);
          if (nameMatch && nameMatch[1].trim().length > 1) {
            const name = nameMatch[1].trim();
            if (
              !name.toLowerCase().includes('nurse') &&
              !name.toLowerCase().includes('position') &&
              !name.toLowerCase().includes('applying')
            ) {
              updates.candidateName = name;
              updates.stage = 'salary_discussion';
              break;
            }
          }
        }
      }
      break;
    }

    case 'basic_info':
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
            !name.toLowerCase().includes('nurse') &&
            !name.toLowerCase().includes('position') &&
            !name.toLowerCase().includes('applying')
          ) {
            updates.candidateName = name;
            updates.stage = 'salary_discussion';
            break;
          }
        }
      }
      break;

    case 'salary_discussion':
      const salaryMatch = text.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g);
      if (salaryMatch) {
        const salary = Number.parseInt(salaryMatch[0].replace(/[$,]/g, ''));
        if (salary > 20000 && salary < 200000) {
          // Reasonable salary range
          updates.desiredSalary = salary;
          if (validateSalary(salary)) {
            updates.salaryAcceptable = true;
            updates.stage = 'license_check';
          } else {
            updates.stage = 'salary_negotiation';
          }
        }
      }
      break;

    case 'salary_negotiation':
      if (
        lowerText.includes('yes') ||
        lowerText.includes('okay') ||
        lowerText.includes('accept') ||
        lowerText.includes('fine')
      ) {
        updates.salaryAcceptable = true;
        updates.stage = 'license_check';
      } else if (
        lowerText.includes('no') ||
        lowerText.includes("can't") ||
        lowerText.includes("won't")
      ) {
        updates.endedEarly = true;
        updates.completed = true;
        updates.endReason = 'Salary expectations beyond budget';
      }
      break;

    case 'license_check':
      if (
        lowerText.includes('yes') ||
        lowerText.includes('licensed') ||
        lowerText.includes('i am') ||
        lowerText.includes('i have')
      ) {
        updates.hasLicense = true;
        updates.stage = 'license_details';
      } else if (
        lowerText.includes('no') ||
        lowerText.includes('not licensed') ||
        lowerText.includes("don't have")
      ) {
        updates.hasLicense = false;
        updates.stage = 'license_timeline';
      }
      break;

    case 'license_details':
      // Extract license number and expiry
      const licenseMatch = text.match(/([A-Z0-9]{6,})/i);
      if (licenseMatch) {
        updates.licenseNumber = licenseMatch[1];
      }

      const dateMatch = text.match(/(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}|next year|this year)/i);
      if (dateMatch) {
        updates.licenseExpiry = dateMatch[1];
      }

      // Move to next stage if we got some info
      if (text.length > 10) {
        updates.stage = 'experience';
      }
      break;

    case 'license_timeline':
      if (lowerText.includes('month') || lowerText.includes('week') || lowerText.includes('soon')) {
        const monthMatch = text.match(/(\d+)\s*month/i);
        if (monthMatch && Number.parseInt(monthMatch[1]) > 6) {
          updates.endedEarly = true;
          updates.completed = true;
          updates.endReason = 'License timeline too long (>6 months)';
        } else {
          updates.stage = 'experience';
        }
      } else if (lowerText.includes('no') || lowerText.includes('not planning')) {
        updates.endedEarly = true;
        updates.completed = true;
        updates.endReason = 'No plans to obtain required license';
      }
      break;

    case 'experience':
      if (
        lowerText.includes('yes') ||
        lowerText.includes('year') ||
        lowerText.includes('experience')
      ) {
        const yearMatch = text.match(/(\d+)\s*year/i);
        if (yearMatch) {
          updates.experienceYears = Number.parseInt(yearMatch[1]);
        }
        updates.hasExperience = true;
        updates.stage = 'experience_details';
      } else if (
        lowerText.includes('no') ||
        lowerText.includes("don't have") ||
        lowerText.includes('new grad')
      ) {
        updates.hasExperience = false;
        updates.stage = 'alternative_experience';
      }
      break;

    case 'experience_details':
      // Mark as completed upon any answer in experience_details stage
      updates.stage = 'completed';
      updates.completed = true;
      break;

    case 'alternative_experience':
      if (
        lowerText.includes('yes') ||
        lowerText.includes('acute') ||
        lowerText.includes('hospital')
      ) {
        updates.stage = 'experience_details';
      } else {
        updates.stage = 'completed';
        updates.completed = true;
      }
      break;
  }

  return updates;
}

export function getSystemPrompt(state: InterviewState): string {
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
    basic_info: 'Ask for their full name in a friendly way.',
    salary_discussion: 'Ask about their desired salary for the ICU RN position.',
    salary_negotiation: `Their desired salary ($${state.desiredSalary?.toLocaleString()}) is above our max of $${MAX_SALARY.toLocaleString()}. Ask if they'd accept $${MAX_SALARY.toLocaleString()}.`,
    license_check: `Ask if they're a licensed RN in ${COMPANY_INFO.location}.`,
    license_details: 'Ask for their license number and expiration date.',
    license_timeline: 'Ask when they expect to get their RN license.',
    experience: 'Ask if they have at least 2 years of ICU experience.',
    experience_details: 'Ask them to describe a challenging ICU emergency situation they handled.',
    alternative_experience: 'Ask if they have any acute care or hospital experience.',
    completed:
      "Thank them and explain next steps: 'Thank you for your time! We'll review your responses and get back to you within 2 business days.'",
  };

  return basePrompt + '\n\n' + stagePrompts[state.stage as keyof typeof stagePrompts];
}

export function getFallbackResponse(state: InterviewState): Response {
  const fallbackResponses = {
    greeting: 'Hello! Are you currently open to discussing this nursing position with us today?',
    basic_info: 'Great! Could you please tell me your full name?',
    salary_discussion: 'Thank you! What is your desired salary for this ICU RN position?',
    salary_negotiation: `I understand. Our maximum budget for this position is $${MAX_SALARY.toLocaleString()}. Would that work for you?`,
    license_check: 'Perfect! Are you currently a licensed RN in California?',
    license_details: 'Excellent! Could you provide your license number and expiration date?',
    license_timeline: 'I see. When do you expect to obtain your RN license?',
    experience: 'Great! Do you have at least 2 years of ICU experience?',
    experience_details:
      'Wonderful! Can you tell me about a challenging emergency situation you handled in the ICU?',
    alternative_experience: 'I understand. Do you have any acute care or hospital experience?',
    completed:
      "Thank you so much for your time today! We'll review your responses and get back to you within 2 business days.",
  };

  const response =
    fallbackResponses[state.stage as keyof typeof fallbackResponses] ||
    'Thank you for your response. Could you tell me more about that?';

  const fullResponse = `${response}[STATE:${JSON.stringify(state)}]`;

  return new Response(fullResponse, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
