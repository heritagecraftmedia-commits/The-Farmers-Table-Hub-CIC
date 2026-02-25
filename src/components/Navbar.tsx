import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useFog } from '../context/FogContext';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Cloud, Sun, LogIn, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { isFogMode, toggleFogMode } = useFog();
  const { user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Food Directory', path: '/directory' },
    { name: 'What\'s On', path: '/whats-on' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Makers Hub', path: '/makers-hub' },
    { name: '24-Hour Café', path: '/cafe' },
    { name: 'Community Radio', path: '/radio' },
    { name: 'Volunteer', path: '/volunteer' },
    { name: 'Resources', path: '/resources' },
    { name: 'Apply to Join', path: '/join' },
    { name: 'Members', path: '/members' },
    { name: 'Feedback', path: '/feedback' },
    { name: 'About', path: '/about' },
  ];

  // Visible links on desktop
  const visibleLinks = [
    { name: 'Food Directory', path: '/directory' },
    { name: 'What\'s On', path: '/whats-on' },
    { name: 'Makers Hub', path: '/makers-hub' },
  ];

  return (
    <nav className="bg-brand-cream border-b border-brand-olive/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-serif text-xl md:text-2xl font-bold text-brand-olive tracking-tight">
                The Farmers Table Hub
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {visibleLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-bold transition-colors hover:text-brand-olive ${
                  location.pathname === link.path ? 'text-brand-olive underline underline-offset-8' : 'text-brand-ink/70'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="h-6 w-px bg-brand-olive/20 mx-2"></div>

            <button
              onClick={toggleFogMode}
              className={`p-2 rounded-full border transition-all ${
                isFogMode 
                  ? 'bg-brand-olive text-white border-brand-olive' 
                  : 'bg-white text-brand-olive border-brand-olive/30 hover:bg-brand-olive/5'
              }`}
              title={isFogMode ? 'Clear Mind' : 'Fog Mode'}
            >
              {isFogMode ? <Sun size={18} /> : <Cloud size={18} />}
            </button>

            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-olive text-white rounded-full text-sm font-bold hover:bg-brand-olive/90 transition-all shadow-md shadow-brand-olive/10"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-brand-olive border border-brand-olive/20 rounded-full text-sm font-bold hover:bg-brand-olive/5 transition-all"
              >
                <LogIn size={16} /> Login
              </Link>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-brand-ink p-2 hover:bg-brand-olive/5 rounded-full transition-all"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={toggleFogMode}
              className="p-2 rounded-full border border-brand-olive/30 text-brand-olive"
            >
              {isFogMode ? <Sun size={20} /> : <Cloud size={20} />}
            </button>
            {user ? (
              <Link to="/dashboard" className="p-2 text-brand-olive"><LayoutDashboard size={24} /></Link>
            ) : (
              <Link to="/login" className="p-2 text-brand-olive"><LogIn size={24} /></Link>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-brand-ink p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Full Menu (Hamburger) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-0 right-0 bg-white border-b border-brand-olive/10 shadow-2xl overflow-hidden z-40"
          >
            <div className="max-w-7xl mx-auto px-4 py-12 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-brand-olive/50 mb-6">Explore</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {navLinks.slice(0, 6).map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className="text-2xl font-serif hover:text-brand-olive transition-all"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-brand-olive/50 mb-6">Community</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {navLinks.slice(6, 12).map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className="text-2xl font-serif hover:text-brand-olive transition-all"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="bg-brand-cream p-8 rounded-[32px]">
                  <h3 className="text-xl font-serif mb-4">The Farmers Table Hub</h3>
                  <p className="text-sm text-brand-ink/60 leading-relaxed mb-6">
                    A community-led social enterprise dedicated to supporting local food producers and fostering community through radio.
                  </p>
                  <Link 
                    to="/join" 
                    onClick={() => setIsOpen(false)}
                    className="inline-block px-6 py-3 bg-brand-olive text-white rounded-full font-bold text-sm"
                  >
                    Apply to Join
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

