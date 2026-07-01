import { AIProvider } from './provider';
import { GroqProvider } from './groq';

export const getProvider = (providerName: string): AIProvider => {
  switch (providerName) {
    case 'groq':
      return new GroqProvider();
    default:
      throw new Error(`Unsupported provider: ${providerName}`);
  }
};
