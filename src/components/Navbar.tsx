import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <nav className="bg-secondary border-b border-surface p-4 shadow-md z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold font-sans text-white tracking-tighter">EduPlatform</Link>
        
        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/" className="px-4 py-2 bg-surface text-white rounded-lg font-bold shadow-[0_3px_0_0_#091818] hover:shadow-none hover:translate-y-[3px] transition-all">Home</Link>
          <Link to="/resources" className="px-4 py-2 bg-primary text-secondary rounded-lg font-bold shadow-[0_3px_0_0_#0ea5e9] hover:shadow-none hover:translate-y-[3px] transition-all">Resources</Link>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => logout()}
            className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold border-2 border-red-500/20 transition-all group"
            title="Logout"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>

          {/* Hamburger */}
          <button className="md:hidden p-2 text-white" onClick={() => setIsOpen(!isOpen)}>
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
            className="md:hidden bg-secondary mt-4 border-t border-surface overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-4">
              <Link to="/" onClick={() => setIsOpen(false)} className="text-center p-3 text-white border-2 border-surface rounded-lg font-bold">Home</Link>
              <Link to="/resources" onClick={() => setIsOpen(false)} className="text-center p-3 text-white border-2 border-surface rounded-lg font-bold">Resources</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
