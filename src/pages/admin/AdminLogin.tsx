import { auth } from '../../firebase/config';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/admin');
    } catch (error) {
      console.error("Error signing in with Google", error);
      alert("Failed to sign in. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-main p-4">
      <div className="w-full max-w-md bg-secondary rounded-xl p-8 shadow-xl border border-surface">
        <h1 className="text-3xl font-bold text-white mb-6 text-center font-sans tracking-tight">Admin Login</h1>
        <p className="text-text-main text-center mb-8">Please sign in to access the admin panel.</p>
        <button 
          onClick={handleSignIn}
          className="w-full py-3 px-4 bg-primary text-secondary font-bold rounded-lg shadow-[0_4px_0_0_#0ea5e9] hover:shadow-none hover:translate-y-[4px] transition-all"
        >
          Sign In With Google
        </button>
      </div>
    </div>
  );
}
