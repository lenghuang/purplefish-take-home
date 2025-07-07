"use client";

import { useState } from "react";
import { useChatStream } from "./useChatStream";

export default function ChatPage() {
  // For demo, use static threadId/userId
  const [input, setInput] = useState("");
  const { messages, send, stop, isStreaming } = useChatStream({
    threadId: "demo-thread",
    userId: "demo-user",
  });

  return (
    <div
      style={{ maxWidth: 480, margin: "2rem auto", fontFamily: "sans-serif" }}
    >
      <h2>Chat</h2>
      <div
        style={{
          minHeight: 300,
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
          background: "#fafbfc",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              margin: "8px 0",
            }}
          >
            <div
              style={{
                background: msg.role === "user" ? "#d1e7dd" : "#e2e3e5",
                color: "#222",
                borderRadius: 16,
                padding: "8px 16px",
                maxWidth: "70%",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isStreaming && (
          <div style={{ color: "#888", fontStyle: "italic" }}>
            Assistant is typing...
          </div>
</div>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (input.trim()) {
            send(input.trim());
            setInput("");
          }
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          Send
        </button>
        <button type="button" onClick={stop} disabled={!isStreaming}>
          Stop
        </button>
      </form>
    </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            send(input.trim());
            setInput("");
          }
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: 8,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
          disabled={isStreaming}
        />
        <button type="submit" disabled={isStreaming || !input.trim()}>
          Send
        </button>
        <button type="button" onClick={stop} disabled={!isStreaming}>
          Stop
        </button>
      </form>
    </div>
  );
}
