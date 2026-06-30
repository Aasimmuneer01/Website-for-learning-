import { adminDb as db, adminAuth as auth } from '../src/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { chat as groqChat } from '../src/ai/groq';

export default async function handler(req: any, res: any) {
  console.log('API Chat Request:', req.method, req.url);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { prompt, history, provider, idToken } = req.body;

  try {
    if (!idToken) {
      console.warn('Unauthorized: No token provided');
      return res.status(401).json({ error: 'Unauthorized: No token' });
    }
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    console.log('User identified:', userId);

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists || !userDoc.data()?.isPremium) {
      console.warn('Premium check failed for user:', userId);
      return res.status(403).json({ error: 'Premium required' });
    }

    const usageRef = db.collection('ai_usage').doc(userId);
    const usageDoc = await usageRef.get();
    const now = new Date();
    let count = 1;
    if (usageDoc.exists) {
      const data = usageDoc.data();
      const lastReset = data?.lastReset.toDate();
      if (now.getTime() - lastReset.getTime() < 24 * 60 * 60 * 1000) {
        if (data?.count >= 100) return res.status(429).json({ error: 'Limit reached' });
        count = (data.count || 0) + 1;
      }
    }

    await usageRef.set({ count, lastReset: Timestamp.fromDate(now) });

    let response = '';
    if (provider === 'groq') {
      response = await groqChat(prompt, history);
    } else {
      return res.status(400).json({ error: 'Unsupported provider' });
    }
    res.status(200).json({ response });
  } catch (error: any) {
    console.error('API Chat Error:', error);
    res.status(500).json({ error: 'Failed to get AI response: ' + error.message });
  }
}
