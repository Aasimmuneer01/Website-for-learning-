import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { adminDb as db, adminAuth as auth } from './src/lib/firebase-admin';
import aiRouter from './src/lib/server/aiRouter';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

async function startServer() {
  app.use('/api/ai', aiRouter);
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
