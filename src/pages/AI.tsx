import React from 'react';
import { Chat } from '../components/ai/Chat';

export default function AIPage() {
  return (
    <div className="p-6 h-[calc(100vh-64px)]">
      <h1 className="text-2xl font-bold mb-6 text-text-main">AI Assistant</h1>
      <Chat />
    </div>
  );
}
