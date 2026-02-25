import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { FogProvider } from './context/FogContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Directory } from './pages/Directory';
import { Radio } from './pages/Radio';
import { About } from './pages/About';
import { Join } from './pages/Join';
import { Resources } from './pages/Resources';
import { Marketplace } from './pages/Marketplace';
import { MakersHub } from './pages/MakersHub';
import { Cafe } from './pages/Cafe';
import { Volunteer } from './pages/Volunteer';
import { Members } from './pages/Members';
import { Feedback } from './pages/Feedback';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { WhatsOn } from './pages/WhatsOn';
import { MakerStories } from './pages/MakerStories';
import { ClaimListing } from './pages/ClaimListing';
import { SubmitStory } from './pages/SubmitStory';
import { MakersShop } from './pages/MakersShop';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { CommandCenter } from './pages/CommandCenter';
import { AnimatePresence, motion } from 'motion/react';

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FogProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                <Route path="/directory" element={<PageWrapper><Directory /></PageWrapper>} />
                <Route path="/radio" element={<PageWrapper><Radio /></PageWrapper>} />
                <Route path="/marketplace" element={<PageWrapper><Marketplace /></PageWrapper>} />
                <Route path="/makers-hub" element={<PageWrapper><MakersHub /></PageWrapper>} />
                <Route path="/cafe" element={<PageWrapper><Cafe /></PageWrapper>} />
                <Route path="/volunteer" element={<PageWrapper><Volunteer /></PageWrapper>} />
                <Route path="/members" element={<PageWrapper><Members /></PageWrapper>} />
                <Route path="/feedback" element={<PageWrapper><Feedback /></PageWrapper>} />
                <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
                <Route path="/join" element={<PageWrapper><Join /></PageWrapper>} />
                <Route path="/resources" element={<PageWrapper><Resources /></PageWrapper>} />
                <Route path="/whats-on" element={<PageWrapper><WhatsOn /></PageWrapper>} />
                <Route path="/maker-stories" element={<PageWrapper><MakerStories /></PageWrapper>} />
                <Route path="/login" element={<PageWrapper><Login /></PageWrapper>} />
                <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
                <Route path="/claim/:id" element={<PageWrapper><ClaimListing /></PageWrapper>} />
                <Route path="/submit-story" element={<PageWrapper><SubmitStory /></PageWrapper>} />
                <Route path="/makers-shop" element={<PageWrapper><MakersShop /></PageWrapper>} />
                <Route path="/privacy" element={<PageWrapper><Privacy /></PageWrapper>} />
                <Route path="/terms" element={<PageWrapper><Terms /></PageWrapper>} />
                <Route path="/command" element={<PageWrapper><CommandCenter /></PageWrapper>} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </FogProvider>
    </AuthProvider>
  );
}

