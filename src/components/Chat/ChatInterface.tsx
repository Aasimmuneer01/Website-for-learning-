import { useState } from 'react';
import { Send, Trash2, Bot } from 'lucide-react';
import { auth } from '../../firebase/config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface({ isPremium }: { isPremium: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isPremium) {
    return (
      <div className="p-6 border border-white/10 rounded-2xl bg-surface">
        <h3 className="font-bold text-lg">Premium AI Assistant</h3>
        <p className="text-gray-500">Upgrade to Premium to unlock AI.</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, history: messages, provider: 'groq', idToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-white/10 rounded-2xl bg-surface overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2"><Bot size={20}/> Premium AI Assistant</h3>
            <button onClick={() => setMessages([])} className="p-2 hover:bg-white/10 rounded-full"><Trash2 size={18}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl max-w-[80%] ${m.role === 'user' ? 'bg-primary text-secondary' : 'bg-white/10'}`}>
                        {m.content}
                    </div>
                </div>
            ))}
            {isLoading && <div className="text-gray-500">Thinking...</div>}
        </div>
        <div className="p-4 border-t border-white/10 flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 bg-black p-3 rounded-xl border border-white/10" placeholder="Ask anything..."/>
            <button onClick={handleSend} className="p-3 bg-primary text-secondary rounded-xl"><Send size={20}/></button>
        </div>
    </div>
  );
}
