/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Resources from './pages/Resources';

export default function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen bg-background-main text-text-main flex flex-col">
          <Navbar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/resources" element={<Resources />} />
            </Routes>
          </main>
          <footer className="w-full py-6 mt-auto border-t border-secondary bg-surface text-center">
            <p className="text-gray-400 font-medium">
              Created with <span className="text-red-500">❤️</span> by Aasim Muneer &copy; {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      </Router>
    </HelmetProvider>
  );
}

