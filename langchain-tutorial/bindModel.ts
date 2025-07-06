import { Tool } from "langchain/tools";
import { ChatOpenAI } from "langchain";

/**
 * ExampleTool respects the abstract structure from the base Tool class
 * by implementing the protected _call(...) method.
 */
class ExampleTool extends Tool {
  name = "exampleTool";
  description = "An example tool for demonstration purposes.";

  protected async _call(input: string): Promise<string> {
    return `Processed input: ${input}`;
  }
}

/**
 * Binds the provided tools to the ChatOpenAI model using the bind(...) method.
 * This setup is compatible with LangChain’s function-calling system.
 */
export function getBoundModel(): ChatOpenAI {
  const chat = ChatOpenAI.bind({
    tools: [new ExampleTool()],
    temperature: 0.7,
  });

  return chat;
}
