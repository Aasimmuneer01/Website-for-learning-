import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Mail, RefreshCw, LogOut, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function VerificationScreen() {
  const { user, logout, resendVerification } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerification();
      setSent(true);
    } catch (err) {
      console.error("Resend err", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReload = async () => {
    setLoading(true);
    if (user) {
      await user.reload();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background-main flex items-center justify-center p-4">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-surface border border-yellow-500/40 rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative z-10"
      >
        <div className="w-16 h-16 bg-yellow-500/10 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto border border-yellow-500/30">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-sans text-text-main">Verification Required</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your account requires email verification before you can continue using this website.
          </p>
          <p className="text-xs text-gray-400 pt-1">
            Signed in as: <span className="text-primary font-mono">{user?.email}</span>
          </p>
        </div>

        {sent && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-xs flex items-center justify-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Verification email sent! Check your inbox & spam.</span>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <button 
            onClick={handleResend}
            disabled={loading}
            className="w-full py-3 bg-primary text-secondary font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-[0.99] transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            <span>{loading ? 'Please wait...' : 'Resend Verification Email'}</span>
          </button>

          <button 
            onClick={handleReload}
            disabled={loading}
            className="w-full py-3 bg-surface border border-secondary text-text-main font-semibold rounded-xl hover:bg-secondary/50 transition-all text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>I have verified my email (Check Status)</span>
          </button>
        </div>

        <div className="border-t border-secondary pt-4">
          <button 
            onClick={logout}
            className="text-xs text-red-400 hover:underline inline-flex items-center gap-1.5 font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out and use another account</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
