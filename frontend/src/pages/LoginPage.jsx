import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import OrbitingSpinner from '../components/common/OrbitingSpinner';

const getFriendlyAuthError = (error, fallback) => {
  const detail = error?.response?.data?.detail || error?.response?.data?.message;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => item?.msg).filter(Boolean);
    if (messages.length) return messages.join(' ');
  }

  const status = error?.response?.status;
  const messages = {
    400: 'Please check the information you entered and try again.',
    401: 'Your email or password is incorrect. Please check your credentials.',
    403: 'Your account needs email verification before you can continue.',
    404: 'The authentication service could not be found. Please restart SkillBridge and try again.',
    409: 'An account with this email already exists. Please sign in instead.',
    410: 'Your verification code has expired. Request a new code.',
    422: 'Some information is missing or invalid. Please check the form and try again.',
    429: 'Too many attempts. Please wait before trying again.',
    502: 'SkillBridge could not send the email. Please check the email configuration and try again.',
  };
  if (status && messages[status]) return messages[status];
  if (!error?.response) {
    const message = error?.message || '';
    if (message && !/network error|failed to fetch|timeout/i.test(message)) return message;
    return 'Cannot connect to SkillBridge. Check that the backend is running and try again.';
  }
  return fallback;
};

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, sessionNotice, clearSessionNotice } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for session_expired query parameter
  const searchParams = new URLSearchParams(location.search);
  const isSessionExpired = searchParams.get('reason') === 'session_expired' || Boolean(sessionNotice);

  const fromPath = location.state?.from || '/upload';

  const validateForm = () => {
    const errors = {};
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      errors.email = 'Email is required and cannot be empty or whitespace.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!trimmedPassword) {
      errors.password = 'Password is required and cannot be empty or whitespace.';
    } else if (trimmedPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    clearSessionNotice();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await login(email, password);
      toastSuccess('Signed in successfully! Welcome back.');
      navigate(fromPath, { replace: true });
    } catch (err) {
      const msg = getFriendlyAuthError(err, 'Invalid email or password.');
      setGeneralError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Session Expired Global Notice */}
        {isSessionExpired && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-status-danger/15 border border-status-danger/40 text-slate-100 flex items-start gap-3 shadow-glow-danger/20"
          >
            <ShieldAlert className="w-5 h-5 text-status-danger flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-rose-300">Session Expired</p>
              <p className="text-slate-300 mt-0.5">
                {sessionNotice || 'Your authentication token has expired. Please sign in again to continue your session.'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Card Container */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-2xl border border-navy-700/80 backdrop-blur-xl">
          <div className="text-center space-y-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-cyan-400 flex items-center justify-center mx-auto shadow-glow-blue">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
              Sign in to Resume AI
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Access your personalized role predictions and roadmaps
            </p>
          </div>

          {generalError && (
            <div className="mb-5 p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="email-input">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }));
                  }}
                  placeholder="alex.chen@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-950/80 border text-slate-100 placeholder-slate-500 text-sm transition-all focus-visible:ring-2 ${
                    fieldErrors.email 
                      ? 'border-status-danger focus:border-status-danger' 
                      : 'border-navy-700 focus:border-brand-blue'
                  }`}
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-status-danger">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300" htmlFor="password-input">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }));
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-950/80 border text-slate-100 placeholder-slate-500 text-sm transition-all focus-visible:ring-2 ${
                    fieldErrors.password 
                      ? 'border-status-danger focus:border-status-danger' 
                      : 'border-navy-700 focus:border-brand-blue'
                  }`}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-status-danger">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-brand-blue hover:bg-brand-blue-hover text-white font-semibold text-sm shadow-glow-blue transition-all flex items-center justify-center gap-2 group disabled:opacity-60 focus-visible:ring-2 mt-2"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo One-Click Fill */}
          <div className="mt-5 pt-5 border-t border-navy-800/80">
            <button
              type="button"
              onClick={() => setGeneralError('Demo sign-in is disabled. Please register and verify your email.')}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-navy-850 hover:bg-navy-800 text-slate-200 border border-navy-700 hover:border-brand-gold/40 text-xs font-medium flex items-center justify-center gap-2 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-gold" />
              <span>One-Click Instant Demo Login</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" state={{ from: location.state?.from || null }} className="font-semibold text-brand-blue-light hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default LoginPage;
