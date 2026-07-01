import Groq from 'groq-sdk';
import { AIProvider } from './provider';

export class GroqProvider implements AIProvider {
  name = 'groq';
  private client: Groq;

  constructor() {
    this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  async chat(prompt: string, history: any[]): Promise<string> {
    const messages = [...history, { role: 'user', content: prompt }];
    const chatCompletion = await this.client.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
    });
    return chatCompletion.choices[0]?.message?.content || '';
  }
}
