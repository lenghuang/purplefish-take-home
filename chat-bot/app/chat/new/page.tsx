'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function NewChatPage() {
  const router = useRouter();
  const hasCreatedRef = useRef(false);

  useEffect(() => {
    if (hasCreatedRef.current) return;
    hasCreatedRef.current = true;
    // Create a new conversation on mount
    const createConversation = async () => {
      try {
        const res = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to create conversation');
        const data = await res.json();
        if (data.id) {
          router.replace(`/chat/${data.id}`);
        } else {
          throw new Error('No conversation ID returned');
        }
      } catch {
        // Optionally handle error (could show a toast or error skeleton)
        router.replace('/'); // fallback to home
      }
    };
    createConversation();
  }, [router]);

  // Skeleton UI matching chat view
  const header = (
    <div className="sticky top-0 z-10 bg-white border-b px-4 py-4">
      <div className="flex items-center px-4 py-3">
        <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );

  const messagesArea = (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
      {/* Skeleton message bubbles */}
      <div className="flex items-start space-x-2">
        <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex items-start space-x-2 flex-row-reverse">
        <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <div className="h-8 w-8 bg-gray-300 rounded-full animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );

  const inputArea = (
    <div className="px-4 py-3 border-t bg-white flex items-center space-x-2">
      <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
      <div className="h-10 w-16 bg-gray-200 rounded animate-pulse" />
    </div>
  );

  return (
    <>
      {header}
      {messagesArea}
      {inputArea}
    </>
  );
}
