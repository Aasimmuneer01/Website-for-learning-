import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';
import ResourceUpload from '../../components/ResourceUpload';
import AdminResourceList from '../../components/AdminResourceList';
import AdminCreatorSettings from '../../components/AdminCreatorSettings';
import AdminUsersManager from '../../components/AdminUsersManager';
import PremiumUsersManager from '../../components/PremiumUsersManager';
import { ShieldAlert } from 'lucide-react';

export default function AdminDashboard() {
  const { user, userData, loading } = useAuth();

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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div className="flex justify-between items-center border-b border-secondary pb-6">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back, {user.displayName || user.email} <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded text-xs ml-2 font-mono uppercase">Admin</span></p>
        </div>
        <button 
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-500/10 text-red-400 font-bold rounded-xl border border-red-500/30 hover:bg-red-500 hover:text-white transition-all text-sm"
        >
          Sign Out
        </button>
      </div>
      
      {/* Realtime Analytics & User Management Section */}
      <AdminUsersManager />

      {/* Premium Management Section */}
      <PremiumUsersManager />

      {/* Upload Section */}
      <ResourceUpload />

      {/* Manage Resources Section */}
      <AdminResourceList />

      {/* Creator Settings Section */}
      <AdminCreatorSettings />
      
    </div>
  );
}
