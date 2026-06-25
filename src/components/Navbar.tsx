import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogOut, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const { logout } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <nav className="bg-background-main border-b border-surface p-4 shadow-md z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold font-sans text-text-main tracking-tighter">EduPlatform</Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/" className="px-4 py-2 bg-surface text-text-main rounded-lg font-bold shadow-[0_3px_0_0_rgba(0,0,0,0.1)] dark:shadow-[0_3px_0_0_#000] hover:shadow-none hover:translate-y-[3px] transition-all">Home</Link>
          <Link to="/resources" className="px-4 py-2 bg-primary text-slate-950 rounded-lg font-bold shadow-[0_3px_0_0_#0ea5e9] hover:shadow-none hover:translate-y-[3px] transition-all">Resources</Link>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-text-main hover:bg-surface rounded-lg transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} className="text-primary" />}
          </button>

          <button 
            onClick={() => logout()}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold border-2 border-red-500/20 transition-all group"
            title="Logout"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Hamburger */}
          <button className="md:hidden p-2 text-text-main" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background-main mt-4 border-t border-surface overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-4">
              <Link to="/" onClick={() => setIsOpen(false)} className="text-center p-3 text-text-main border-2 border-surface rounded-lg font-bold">Home</Link>
              <Link to="/resources" onClick={() => setIsOpen(false)} className="text-center p-3 text-text-main border-2 border-surface rounded-lg font-bold">Resources</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
