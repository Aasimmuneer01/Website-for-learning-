import { Sparkles, X } from 'lucide-react';

interface FeatureUpdateModalProps {
  onClose: () => void;
}

export default function FeatureUpdateModal({ onClose }: FeatureUpdateModalProps) {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">
          <X size={24} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="text-primary" size={32} />
          <h2 className="text-2xl font-bold">New Feature: AI Assistant!</h2>
        </div>
        <p className="text-gray-600 mb-6">
          We've just launched a powerful new AI Assistant to help you with your studies. 
          You can now ask questions, get explanations, and more directly from your dashboard!
          <br /><br />
          <span className="font-bold">Available exclusively for Premium members.</span>
        </p>
        <button 
          onClick={onClose}
          className="w-full bg-primary text-secondary py-3 rounded-xl font-bold hover:bg-opacity-90"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
