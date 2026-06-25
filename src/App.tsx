/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Resources from './pages/Resources';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthScreen from './components/AuthScreen';
import VerificationScreen from './components/VerificationScreen';

function MainLayout() {
  const { user, loading, verificationBlocked } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (verificationBlocked) {
    return <VerificationScreen />;
  }

  return (
    <div className="min-h-screen bg-background-main text-text-main flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
        </Routes>
      </main>
      <footer className="w-full py-6 mt-auto border-t border-secondary bg-surface text-center">
        <p className="text-gray-400 font-medium">
          Created with <span className="text-red-500">❤️</span> by Aasim Muneer &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <MainLayout />
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
