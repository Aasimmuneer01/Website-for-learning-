import { useState, FormEvent } from 'react';
import { auth } from '../../firebase/config';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import rawConfig from '../../../firebase-applet-config.json';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/admin');
    } catch (err: any) {
      console.error("Error with authentication", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(`Email/Password auth is not enabled. Please enable it in the Firebase Console for project: ${rawConfig.projectId}`);
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "Failed to authenticate. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-main p-4">
      <div className="w-full max-w-md bg-secondary rounded-xl p-8 shadow-xl border border-surface">
        <h1 className="text-3xl font-bold text-white mb-6 text-center font-sans tracking-tight">Admin {isSignUp ? 'Registration' : 'Login'}</h1>
        <p className="text-gray-400 text-center mb-8">
          {isSignUp ? "Create a new admin account." : "Please sign in to access the admin panel."}
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
            <label className="block text-white mb-2 text-sm font-bold">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface border border-secondary p-3 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
              placeholder="admin@example.com"
            />
          </div>
          <div className="mb-6">
            <label className="block text-white mb-2 text-sm font-bold">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-surface border border-secondary p-3 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary text-secondary font-bold rounded-lg shadow-[0_4px_0_0_#0ea5e9] hover:shadow-none hover:translate-y-[4px] transition-all disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_0_0_#0ea5e9] mt-4"
          >
            {loading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Create Account" : "Sign In")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isSignUp ? "Already have an account? " : "Don't have an admin account? "}
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-primary hover:underline font-bold"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
