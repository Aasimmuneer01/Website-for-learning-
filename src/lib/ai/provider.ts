export interface AIProvider {
  chat(prompt: string, history: any[]): Promise<string>;
  name: string;
}
