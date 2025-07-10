'use client';

import React from 'react';

interface ChatShellProps {
  header: React.ReactNode;
  messagesArea: React.ReactNode;
  inputArea: React.ReactNode;
}

export function ChatShell({ header, messagesArea, inputArea }: ChatShellProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-4">{header}</div>
      {/* Chat Messages */}
      <div className="flex-1 flex flex-col">
        {messagesArea}
        {/* Input Area */}
        {inputArea}
      </div>
    </div>
  );
}
