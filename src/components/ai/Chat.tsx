import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Copy, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string, timestamp: number}[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim() || !user) return;
    
    const userMsg = { role: 'user' as const, content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, history: messages, idToken })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to get response');
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: Date.now() }]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-main rounded-2xl border border-secondary p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && <Bot className="w-8 h-8 p-1.5 rounded-full bg-secondary" />}
            <div className={`p-3 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'bg-primary text-white' : 'bg-secondary text-text-main'}`}>
              {m.content}
            </div>
            {m.role === 'user' && <User className="w-8 h-8 p-1.5 rounded-full bg-primary text-white" />}
          </div>
        ))}
        {loading && <div className="text-gray-500">Thinking...</div>}
      </div>
      <div className="flex gap-2">
        <input 
          value={input} 
          onChange={e => setInput(e.target.value)}
          className="flex-1 bg-surface border border-secondary rounded-xl p-3 text-text-main"
          placeholder="Ask something..."
        />
        <button onClick={sendMessage} className="p-3 bg-primary text-white rounded-xl"><Send /></button>
      </div>
    </div>
  );
};
