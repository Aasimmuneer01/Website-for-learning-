/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Resources from './pages/Resources';
import PDFViewer from './components/PDFViewer';
import Bookmarks from './pages/Bookmarks';
import Folders from './pages/Folders';
import OfflineLibrary from './pages/OfflineLibrary';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthScreen from './components/AuthScreen';
import VerificationScreen from './components/VerificationScreen';
import TermsOfUse from './pages/legal/TermsOfUse';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import RefundPolicy from './pages/legal/RefundPolicy';
import Copyright from './pages/legal/Copyright';
import CommunityGuidelines from './pages/legal/CommunityGuidelines';
import Contact from './pages/legal/Contact';
import BanPolicy from './pages/legal/BanPolicy';
import PremiumAgreement from './pages/legal/PremiumAgreement';
import Footer from './components/Footer';
import TermsAcceptanceDialog from './components/TermsAcceptanceDialog';
import WarningModal from './components/WarningModal';

function MainLayout() {
  const { user, loading, verificationBlocked, userData, acceptTerms, acknowledgeWarning, logout } = useAuth();
  const location = useLocation();
  
  // Terms check
  const termsAccepted = !!userData?.termsAccepted;

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

  if (user && !termsAccepted && location.pathname !== '/terms') {
    return <TermsAcceptanceDialog onAccept={acceptTerms} onDecline={logout} />;
  }

  if (userData?.accountStatus === 'warning' && !userData.warningAcknowledged && userData.warnings && userData.warnings.length > 0) {
    return <WarningModal warnings={userData.warnings} onUnderstand={acknowledgeWarning} onViewTerms={() => {
      window.open(window.location.origin + '/terms', '_blank');
    }} />;
  }

  return (
    <div className="min-h-screen bg-background-main text-text-main flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/folders" element={<Folders />} />
          <Route path="/offline" element={<OfflineLibrary />} />
          <Route path="/viewer/:resourceId" element={<PDFViewer />} />
          <Route path="/terms" element={<TermsOfUse />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/copyright" element={<Copyright />} />
          <Route path="/guidelines" element={<CommunityGuidelines />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ban-policy" element={<BanPolicy />} />
          <Route path="/premium-agreement" element={<PremiumAgreement />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="*" element={<MainLayout />} />
          </Routes>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
