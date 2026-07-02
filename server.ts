import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { adminDb as db, adminAuth as auth } from './src/lib/firebase-admin';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
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
    
    console.log('------------------------------------------');
    console.log('📧 SIMULATED EMAIL SENT TO:', email);
    console.log('OTP CODE:', code);
    console.log('------------------------------------------');
  
    res.json({ success: true, message: 'OTP sent successfully (Simulated)' });
  });

  app.post('/api/chat', async (req, res) => {
    const { messages, model } = req.body;
    if (!messages) return res.status(400).json({ error: 'Messages required' });
    
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: model || 'llama-3.3-70b-versatile',
      });
      res.json(chatCompletion.choices[0].message);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to chat' });
    }
  });

  app.post('/api/ai/usage', async (req, res) => {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'UID required' });
    
    try {
      const usageDoc = await db.collection('users').doc(uid).collection('aiUsage').doc('stats').get();
      if (!usageDoc.exists) {
        return res.json({ count: 0 });
      }
      res.json(usageDoc.data());
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch usage' });
    }
  });

  app.post('/api/chats', async (req, res) => {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'UID required' });
    
    try {
      console.log(`Fetching chats for UID: ${uid}`);
      const userRef = db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
          console.log(`User ${uid} not found`);
          return res.json([]);
      }
      const chatsRef = userRef.collection('chats');
      const chatsSnap = await chatsRef.orderBy('updatedAt', 'desc').get();
      const chats = chatsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log(`Fetched ${chats.length} chats`);
      res.json(chats);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      // Fallback: return empty list on any error
      return res.json([]);
    }
  });
  
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
