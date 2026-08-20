import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Upload, 
  Compass, 
  Target, 
  Map, 
  Menu, 
  X, 
  LogOut, 
  User, 
  Layers,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { name: 'Upload Resume', path: '/upload', icon: Upload, authRequired: false },
    { name: 'Role Matcher', path: '/results', icon: Compass, authRequired: false },
    { name: 'Skill Gap', path: '/skill-gap', icon: Target, authRequired: false },
    { name: 'Career Roadmap', path: '/roadmap', icon: Map, authRequired: false },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-navy-800 bg-navy-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Brand Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group focus-visible:ring-2 rounded-xl p-1"
            aria-label="Resume AI Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-cyan-400 flex items-center justify-center shadow-glow-blue transition-transform group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Resume <span className="text-brand-blue-light">AI</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 -mt-1 hidden sm:block">
                Predictive Career Path
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-navy-800 text-brand-blue-light border border-brand-blue/30 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-navy-900 border border-transparent'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 opacity-80" />
                  {link.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Action / Auth Status */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-navy-900 border border-navy-800">
                  <div className="w-7 h-7 rounded-lg bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-blue-light font-bold text-xs">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200 leading-tight">
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 leading-tight">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Pro Session
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-status-danger hover:bg-navy-900 border border-transparent hover:border-status-danger/30 transition-all focus-visible:ring-2"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-navy-900 transition-colors focus-visible:ring-2"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-hover shadow-glow-blue transition-all focus-visible:ring-2"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-navy-900 border border-navy-800 text-slate-300 hover:text-white hover:border-brand-blue/40 transition-colors focus-visible:ring-2"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 top-16 bg-black/70 backdrop-blur-md z-40 md:hidden"
            />

            {/* Slide-out Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 w-full bg-navy-950 border-b border-navy-800 p-5 shadow-2xl z-50 md:hidden"
            >
              <div className="flex flex-col gap-1.5 mb-5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-navy-800 text-brand-blue-light border border-brand-blue/30'
                          : 'text-slate-300 hover:text-white hover:bg-navy-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-brand-blue-light" />
                        <span>{link.name}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </Link>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-navy-800">
                {isAuthenticated ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-navy-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-blue/20 border border-brand-blue/40 flex items-center justify-center text-brand-blue-light font-bold text-sm">
                          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-100">{user?.name || 'User'}</p>
                          <p className="text-xs text-slate-400">{user?.email}</p>
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-status-success/20 text-status-success font-mono">
                        Active
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full py-2.5 px-4 rounded-xl bg-navy-900 hover:bg-status-danger/10 text-status-danger border border-status-danger/20 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      className="py-2.5 px-4 rounded-xl text-center text-sm font-medium text-slate-300 bg-navy-900 hover:bg-navy-850 border border-navy-800"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="py-2.5 px-4 rounded-xl text-center text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-hover shadow-glow-blue"
                    >
                      Get Started
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
