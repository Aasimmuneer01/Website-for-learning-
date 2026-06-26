import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import ResourceUpload from '../../components/ResourceUpload';
import AdminResourceList from '../../components/AdminResourceList';
import AdminCreatorSettings from '../../components/AdminCreatorSettings';
import AdminUsersManager from '../../components/AdminUsersManager';
import PremiumUsersManager from '../../components/PremiumUsersManager';
import { ShieldAlert, Users, Crown, Upload, FileText, Settings, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AdminTab = 'users' | 'premium' | 'upload' | 'resources' | 'settings';

export default function AdminDashboard() {
  const { user, userData, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (loading) {
    return <div className="p-8 text-center text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const isAdmin = user.email === 'admin@example.com' || 
                  user.email === 'aasimmuneer349@gmail.com' || 
                  userData?.role === 'admin' || 
                  userData?.role === 'superadmin';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-6 mt-12 bg-surface rounded-2xl border border-red-500/30">
        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white font-sans">Admin Access Required</h2>
        <p className="text-gray-400 text-sm">
          Your account ({user.email}) does not have administrator privileges. Only authorized admins can manage users, resources, and settings.
        </p>
        <button 
          onClick={handleSignOut}
          className="px-6 py-2.5 bg-red-500 text-white font-bold rounded-xl shadow-lg hover:bg-red-600 transition-all text-sm"
        >
          Sign Out & Switch Account
        </button>
      </div>
    );
  }

  const menuItems = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'premium', label: 'Premium Manager', icon: Crown },
    { id: 'upload', label: 'Upload Resources', icon: Upload },
    { id: 'resources', label: 'Manage Resources', icon: FileText },
    { id: 'settings', label: 'Creator Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-background-main flex">
      {/* Sidebar Navigation */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-surface border-r border-secondary flex flex-col transition-all duration-300 relative z-40`}>
        <div className="p-6 border-b border-secondary flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!isSidebarOpen && 'hidden'}`}>
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Crown size={20} className="text-primary" />
            </div>
            <span className="font-bold text-white uppercase tracking-tighter">Admin Panel</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-gray-400"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === item.id 
                  ? 'bg-primary text-secondary shadow-lg shadow-primary/20' 
                  : 'text-gray-400 hover:bg-secondary hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? '' : 'text-gray-500'} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-secondary">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-secondary pb-6">
            <div>
              <h1 className="text-4xl font-bold font-sans tracking-tight text-white uppercase">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                Managing platform as <span className="text-primary font-mono font-bold">{user.email}</span>
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-surface border border-secondary rounded-2xl shadow-xl">
              <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white truncate max-w-[150px]">{user.displayName || 'Admin'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Super Administrator</span>
                  {(userData?.isPremium || userData?.role === 'admin') && (
                    <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Crown size={8} />
                      Premium
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'users' && <AdminUsersManager />}
            {activeTab === 'premium' && <PremiumUsersManager />}
            {activeTab === 'upload' && <ResourceUpload />}
            {activeTab === 'resources' && <AdminResourceList />}
            {activeTab === 'settings' && <AdminCreatorSettings />}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
