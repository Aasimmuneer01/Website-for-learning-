import { Router } from 'express';
import { adminDb as db, adminAuth as auth } from '../firebase-admin';
import { getProvider } from '../ai';

const router = Router();

router.post('/chat', async (req, res) => {
  const { prompt, history, idToken } = req.body;
  
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    // Check premium status
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.data()?.isPremium) {
        return res.status(403).json({ error: 'Premium required' });
    }
    
    // Daily Limit check would go here
    
    // Get provider
    const providerName = 'groq'; 
    const provider = getProvider(providerName);
    const response = await provider.chat(prompt, history);
    
    res.json({ response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI Error' });
  }
});

export default router;
