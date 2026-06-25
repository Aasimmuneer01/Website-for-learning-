import { useState, FormEvent } from 'react';
import { auth } from '../../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import rawConfig from '../../../firebase-applet-config.json';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin');
    } catch (err: any) {
      console.error("Error with authentication", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(`Email/Password auth is not enabled. Please enable it in the Firebase Console for project: ${rawConfig.projectId}`);
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Failed to authenticate. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-main p-4">
      <div className="w-full max-w-md bg-surface rounded-xl p-8 shadow-xl border border-secondary">
        <h1 className="text-3xl font-bold text-text-main mb-6 text-center font-sans tracking-tight">Admin Login</h1>
        <p className="text-gray-400 text-center mb-8">
          Please sign in to access the admin panel.
        </p>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-sm flex flex-col gap-2">
            <p>{error}</p>
            {error.includes('firebase.google.com') && (
                <a href={`https://console.firebase.google.com/project/${rawConfig.projectId}/authentication/providers`} target="_blank" rel="noreferrer" className="underline font-bold text-red-400 hover:text-red-300">
                    Open Firebase Console
                </a>
            )}
        </div>}
        
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-text-main mb-2 text-sm font-bold">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-background-main border border-secondary p-3 rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
              placeholder="admin@example.com"
            />
          </div>
          <div className="mb-6">
            <label className="block text-text-main mb-2 text-sm font-bold">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-background-main border border-secondary p-3 rounded-lg text-text-main focus:outline-none focus:border-primary transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-secondary font-bold rounded-lg shadow-[0_4px_0_0_#0ea5e9] hover:shadow-none hover:translate-y-[4px] transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_0_0_#0ea5e9] mt-4"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
