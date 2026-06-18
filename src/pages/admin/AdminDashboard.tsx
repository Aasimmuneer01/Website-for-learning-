import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 font-sans tracking-tight text-white">Admin Dashboard</h1>
      <p className="text-gray-400 mb-8">Welcome back, {user.displayName || user.email}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary shadow-[0_4px_0_0_theme(colors.secondary)]">
          <h3 className="text-lg font-bold text-gray-400">Total Users</h3>
          <p className="text-3xl font-bold text-primary mt-2">0</p>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary shadow-[0_4px_0_0_theme(colors.secondary)]">
          <h3 className="text-lg font-bold text-gray-400">Total Resources</h3>
          <p className="text-3xl font-bold text-primary mt-2">0</p>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary shadow-[0_4px_0_0_theme(colors.secondary)]">
          <h3 className="text-lg font-bold text-gray-400">Total Downloads</h3>
          <p className="text-3xl font-bold text-primary mt-2">0</p>
        </div>
        <div className="bg-surface p-6 rounded-xl shadow-sm border border-secondary shadow-[0_4px_0_0_theme(colors.secondary)]">
          <h3 className="text-lg font-bold text-gray-400">Total Views</h3>
          <p className="text-3xl font-bold text-primary mt-2">0</p>
        </div>
      </div>
    </div>
  );
}
