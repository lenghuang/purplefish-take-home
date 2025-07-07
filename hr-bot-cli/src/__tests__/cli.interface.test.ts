import { CLIInterface } from "../cli/interface";
import { Template } from "../template/types";
import * as readline from "readline";

// Mock readline
jest.mock("readline");

describe("CLIInterface - Characterization Tests", () => {
  let cli: CLIInterface;
  let mockRl: any;

  beforeEach(() => {
    mockRl = {
      question: jest.fn(),
      close: jest.fn(),
    };

    (readline.createInterface as jest.Mock).mockReturnValue(mockRl);

    cli = new CLIInterface();
  });

  describe("initialization", () => {
    it("should create readline interface", () => {
      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
      });
    });

    it("should initialize with empty conversation history", () => {
      expect(cli["conversationHistory"]).toEqual([]);
    });

    it("should initialize with zero progress", () => {
      expect(cli["progress"]).toEqual({ current: 0, total: 0 });
    });
  });

  describe("conversation management", () => {
    it("should add messages to conversation history", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      cli.addMessage("user", "Hello");
      cli.addMessage("assistant", "Hi there!");

      expect(cli["conversationHistory"]).toEqual([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ]);

      expect(consoleSpy).toHaveBeenCalledWith("You: Hello");
      expect(consoleSpy).toHaveBeenCalledWith("\nBot: Hi there!");

      consoleSpy.mockRestore();
    });

    it("should display conversation history", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      cli.addMessage("user", "Hello");
      cli.addMessage("assistant", "Hi!");

      cli.showConversationHistory(1);

      expect(consoleSpy).toHaveBeenCalledWith("\n--- Conversation History ---");
      expect(consoleSpy).toHaveBeenCalledWith("You: Hello");
      expect(consoleSpy).toHaveBeenCalledWith("Bot: Hi!");
      expect(consoleSpy).toHaveBeenCalledWith("---------------------------\n");

      consoleSpy.mockRestore();
    });
  });

  describe("progress tracking", () => {
    it("should update and display progress", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      cli.showProgress(2, 5);

      expect(cli["progress"]).toEqual({ current: 2, total: 5 });
      expect(consoleSpy).toHaveBeenCalledWith("Progress: Step 2 of 5");

      consoleSpy.mockRestore();
    });
  });

  describe("template selection", () => {
    it("should display template options and handle valid selection", async () => {
      const templates: Template[] = [
        {
          id: 1,
          name: "Template 1",
          description: "First template",
          role: "Developer",
          steps: [],
          tags: [],
        },
        {
          id: 2,
          name: "Template 2",
          description: "Second template",
          role: "Manager",
          steps: [],
          tags: [],
        },
      ];

      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      mockRl.question.mockImplementation(
        (prompt: string, callback: (answer: string) => void) => {
          callback("1");
        },
      );

      const result = await cli.selectTemplateDropdown(templates);

      expect(consoleSpy).toHaveBeenCalledWith(
        "\nSelect an interview template:",
      );
      expect(consoleSpy).toHaveBeenCalledWith("  [1] Template 1");
      expect(consoleSpy).toHaveBeenCalledWith("  [2] Template 2");
      expect(result).toEqual(templates[0]);

      consoleSpy.mockRestore();
    });
  });

  describe("error handling", () => {
    it("should handle errors and exit", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const exitSpy = jest.spyOn(process, "exit").mockImplementation();

      const error = new Error("Test error");
      cli.handleError(error);

      expect(consoleSpy).toHaveBeenCalledWith("\n[Error]", "Test error");
      expect(mockRl.close).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(0);

      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});
