// thought-parser.ts
// This file provides a utility function to parse the thought/action/observation
// from a ReAct agent LLM output. In a production environment, you would parse
// actual LLM tokens. This demo simply extracts lines from the mock output.

interface ThoughtParseResult {
  thought: string;
  action?: string;
  observation?: string;
  answer?: string;
}

/**
 * Parses a string (representing LLM output) to extract:
 * - Thought
 * - Action
 * - Observation
 * - Final answer
 *
 * This method uses naive string searches in a mock format:
 *
 *   Thought: ...
 *   Action: ...
 *   Observation: ...
 *   Answer: ...
 *
 * In a real ReAct approach, you'd have a more robust parsing logic.
 */
/**
 * Future Improvement: The current parsing is robust for this demo. For a more performant solution,
 * we could look into streaming LLM outputs and parsing tokens directly to identify tool calls as they happen,
 * rather than waiting for the full response string.
 */
export function parseThoughts(llmOutput: string): ThoughtParseResult {
  let thought = '';
  let action = '';
  let observation = '';
  let answer = '';

  // Extract lines from the LLM output
  const lines = llmOutput.split('\n').map((line) => line.trim());

  for (const line of lines) {
    if (line.startsWith('Thought:')) {
      thought = line.replace('Thought:', '').trim();
    } else if (line.startsWith('Action:')) {
      action = line.replace('Action:', '').trim();
    } else if (line.startsWith('Observation:')) {
      observation = line.replace('Observation:', '').trim();
    } else if (line.startsWith('Answer:')) {
      answer = line.replace('Answer:', '').trim();
    }
  }

  return { thought, action, observation, answer };
}
