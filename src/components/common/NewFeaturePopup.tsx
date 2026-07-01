import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const NewFeaturePopup = ({ version, onClose }: { version: string, onClose: () => void }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background-main border border-secondary p-8 rounded-2xl w-full max-w-lg shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500"><X /></button>
        <div className="text-primary mb-4"><Sparkles size={40} /></div>
        <h2 className="text-2xl font-bold mb-4 text-text-main">🎉 New Feature Available!</h2>
        <p className="mb-4 text-text-main">Premium AI Assistant is now available!</p>
        <ul className="list-disc list-inside mb-6 text-text-main space-y-1">
            <li>Ask questions instantly</li>
            <li>Get homework help</li>
            <li>Solve Maths & Science problems</li>
        </ul>
        <div className="flex gap-4">
            <button onClick={() => { navigate('/ai'); onClose(); }} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold">Explore</button>
            <button onClick={onClose} className="flex-1 bg-secondary text-text-main py-3 rounded-xl font-bold">Maybe Later</button>
        </div>
      </div>
    </div>
  );
};
