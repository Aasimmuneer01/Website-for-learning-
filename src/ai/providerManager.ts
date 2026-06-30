import * as groq from './groq';

type Provider = 'groq' | 'openai' | 'gemini';

let activeProvider: Provider = 'groq';

export function selectProvider(provider: Provider) {
  activeProvider = provider;
}

export async function getResponse(prompt: string, history: any[]): Promise<string> {
  switch (activeProvider) {
    case 'groq':
      return await groq.chat(prompt, history);
    default:
      throw new Error(`Provider ${activeProvider} not implemented`);
  }
}
