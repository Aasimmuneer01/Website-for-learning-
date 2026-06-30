import { useAuth } from '../hooks/useAuth';
import ChatInterface from '../components/Chat/ChatInterface';

export default function AI() {
  const { userData } = useAuth();
  const isPremium = !!userData?.isPremium;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">AI Assistant</h1>
      <ChatInterface isPremium={isPremium} />
    </div>
  );
}
