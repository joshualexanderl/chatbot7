'use client';

import React, { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation'; // Import useSearchParams
import { ChatInterface } from '@/components/ChatInterface'; // Assuming component path

// Wrapper component to handle Suspense for useSearchParams
function ChatPageContent() {
  const params = useParams();
  const searchParams = useSearchParams(); // Use the hook here

  const chatId = typeof params.chatId === 'string' ? params.chatId : undefined;
  const initialPrompt = searchParams.get('prompt'); // Get the 'prompt' query param

  if (!chatId) {
    // Handle cases where chatId might be missing or an array (though unlikely here)
    return <div>Error: Invalid or missing Chat ID.</div>;
  }

  return (
    <ChatInterface 
      chatId={chatId} 
      // Decode and pass the initial prompt if it exists
      initialPrompt={initialPrompt ? decodeURIComponent(initialPrompt) : undefined} 
    />
  );
}

export default function ChatPage() {
  // useSearchParams needs to be wrapped in a Suspense boundary
  return (
    <div className="h-full">
      <Suspense fallback={<div>Loading Chat...</div>}> {/* Add Suspense Boundary */}
        <ChatPageContent />
      </Suspense>
    </div>
  );
} 