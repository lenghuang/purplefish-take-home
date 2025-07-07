import { useRef, useState, useCallback } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface UseChatStreamOptions {
  threadId: string;
  userId: string;
}

export function useChatStream({ threadId, userId }: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const send = useCallback(
    async (text: string) => {
      setMessages((msgs) => [...msgs, { role: "user", content: text }]);
      setIsStreaming(true);
      const controller = new AbortController();
      controllerRef.current = controller;

      let assistantMsg = "";
      setMessages((msgs) => [...msgs, { role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          body: JSON.stringify({ threadId, userId, message: text }),
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
        });

        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        let done = false;
        while (!done) {
          const { value, done: streamDone } = await reader.read();
          if (value) {
            const token = new TextDecoder().decode(value);
            assistantMsg += token;
            setMessages((msgs) =>
              msgs.map((msg, i) =>
                i === msgs.length - 1 && msg.role === "assistant"
                  ? { ...msg, content: assistantMsg }
                  : msg
              )
            );
          }
          done = streamDone;
        }
      } catch (err) {
        setMessages((msgs) =>
          msgs.map((msg, i) =>
            i === msgs.length - 1 && msg.role === "assistant"
              ? { ...msg, content: "[Error streaming response]" }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
        controllerRef.current = null;
      }
    },
    [threadId, userId]
  );

  const stop = useCallback(() => {
    controllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return { messages, send, stop, isStreaming };
}
