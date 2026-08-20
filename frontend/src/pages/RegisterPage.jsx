import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  User, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck 
} from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    const errors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      errors.name = 'Full name is required and cannot be empty or whitespace.';
    }

    if (!trimmedEmail) {
      errors.email = 'Email is required and cannot be empty or whitespace.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!trimmedPassword) {
      errors.password = 'Password is required and cannot be whitespace.';
    } else if (trimmedPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      toastSuccess('Account created successfully! Welcome to Resume AI.');
      navigate('/upload');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setGeneralError(msg);
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-2xl border border-navy-700/80 backdrop-blur-xl">
          <div className="text-center space-y-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-cyan-400 flex items-center justify-center mx-auto shadow-glow-blue">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
              Create Your Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Start mapping your career with AI-powered role predictions
            </p>
          </div>

          {generalError && (
            <div className="mb-5 p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="name-input">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
                  }}
                  placeholder="Alex Chen"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-950/80 border text-slate-100 placeholder-slate-500 text-sm transition-all focus-visible:ring-2 ${
                    fieldErrors.name 
                      ? 'border-status-danger focus:border-status-danger' 
                      : 'border-navy-700 focus:border-brand-blue'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-status-danger">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="reg-email-input">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-email-input"
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
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-status-danger">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="reg-password-input">
                Password (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-password-input"
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
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-status-danger">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="reg-confirm-input">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-confirm-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: null }));
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-950/80 border text-slate-100 placeholder-slate-500 text-sm transition-all focus-visible:ring-2 ${
                    fieldErrors.confirmPassword 
                      ? 'border-status-danger focus:border-status-danger' 
                      : 'border-navy-700 focus:border-brand-blue'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-status-danger">{fieldErrors.confirmPassword}</p>
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
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-blue-light hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default RegisterPage;
