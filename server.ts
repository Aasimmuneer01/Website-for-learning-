import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API route to "send" OTP via Gemini-generated email content
app.post('/api/send-otp', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    const prompt = `Generate a professional and friendly email for a user of "Educational Study Material Platform". 
    The email should contain a 6-digit verification code: ${code}.
    The user is trying to verify their account.
    Keep it concise. Format it as a simple text-based email.
    Recipient: ${email}`;

    const result = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });
    const emailContent = result.text;

    // In a real app, you'd use a service like SendGrid here.
    // For this environment, we'll log it to the console so the user can "see" their code.
    console.log('------------------------------------------');
    console.log('📧 SIMULATED EMAIL SENT TO:', email);
    console.log('CONTENT:\n', emailContent);
    console.log('OTP CODE:', code);
    console.log('------------------------------------------');

    res.json({ success: true, message: 'OTP sent successfully (Simulated)' });
  } catch (error) {
    console.error('Error generating OTP email:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Serve standalone admin portal
app.get('/admin', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.redirect('/admin');
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
