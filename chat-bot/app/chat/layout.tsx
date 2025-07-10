'use client';

import React from 'react';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  return <div className="min-h-screen bg-gray-50 flex flex-col">{children}</div>;
}
