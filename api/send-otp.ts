import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  try {
    const prompt = `Generate a professional and friendly email for a user of "Educational Study Material Platform". 
    The email should contain a 6-digit verification code: ${code}.
    The user is trying to verify their account.
    Keep it concise. Format it as a simple text-based email.
    Recipient: ${email}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    const emailContent = response.text;

    console.log('Simulated email sent to:', email, 'Code:', code);
    res.status(200).json({ success: true, message: 'OTP sent successfully (Simulated)' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send OTP: ' + error.message });
  }
}
