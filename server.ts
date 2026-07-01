import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { chat as groqChat } from './src/ai/groq';
import { adminDb as db, adminAuth as auth } from './src/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'Routing is working' });
  });

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
  
      const generateEmailWithRetry = async (prompt: string, retries = 3): Promise<any> => {
        try {
          return await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          });
        } catch (error: any) {
          if (retries > 0 && error.status === 503) {
            console.warn(`Gemini API 503, retrying in 1s... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return generateEmailWithRetry(prompt, retries - 1);
          }
          throw error;
        }
      };
  
      const result = await generateEmailWithRetry(prompt);
      const emailContent = result.text;
  
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
  
  app.post('/api/chat', async (req, res) => {
    const { prompt, history, provider, idToken } = req.body;
    console.log('--- CHAT REQUEST START ---');
    console.log('Received chat request:', { prompt: prompt?.substring(0, 50), provider, hasIdToken: !!idToken });
    
    try {
       if (!idToken) {
         console.error('No ID Token provided');
         return res.status(401).json({ error: 'Unauthorized: No token' });
       }
       
       console.log('Verifying token...');
       const decodedToken = await auth.verifyIdToken(idToken);
       const userId = decodedToken.uid;
       console.log('Token verified for User ID:', userId);
       
       // Check premium status
       const userDoc = await db.collection('users').doc(userId).get();
       if (!userDoc.exists || !userDoc.data()?.isPremium) {
         console.warn('Access denied: User is not premium');
         return res.status(403).json({ error: 'Premium required' });
       }
       
       // Check usage limits
       const usageRef = db.collection('ai_usage').doc(userId);
       const usageDoc = await usageRef.get();
       const now = new Date();
       
       let count = 1;
       if (usageDoc.exists) {
           const data = usageDoc.data();
           const lastReset = data?.lastReset.toDate();
           if (now.getTime() - lastReset.getTime() < 24 * 60 * 60 * 1000) {
               if (data?.count >= 100) {
                 console.warn('Limit reached for user:', userId);
                 return res.status(429).json({ error: 'Limit reached' });
               }
               count = data.count + 1;
           } else {
               count = 1; // Reset
           }
       }
       
       // Update usage
       await usageRef.set({ count, lastReset: Timestamp.fromDate(now) });
       console.log('Usage updated for user:', userId, 'Count:', count);
       
       let response = '';
       if (provider === 'groq') {
         console.log('Calling Groq AI...');
         response = await groqChat(prompt, history);
       } else {
         console.error('Unsupported provider:', provider);
         return res.status(400).json({ error: 'Unsupported provider' });
       }
       console.log('AI response received, sending back to client.');
       res.json({ response });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: 'Failed to get AI response: ' + (error as Error).message });
    }
  });

  // API routes defined above
  
  // JSON 404 for unmatched API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

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
