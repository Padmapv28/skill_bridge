import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, ArrowRight, RotateCcw, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import PageWrapper from '../components/layout/PageWrapper';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as authApi from '../api/auth';

export const OTPVerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login: setAuthLogin } = useAuth();
  const { addToast } = useToast();

  const initialEmail = location.state?.email || 'student@example.com';
  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  // 6-digit OTP code array
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [timer, setTimer] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // 60-second countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Handle single digit input and auto-advance
  const handleDigitChange = (index, value) => {
    // Only accept numeric digit
    const char = value.replace(/[^0-9]/g, '').slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    setErrorMsg('');

    // Auto-advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle paste event (e.g., pasting "123456")
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);
    setErrorMsg('');

    // Focus last filled or next input
    const nextIdx = Math.min(pasteData.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const res = await authApi.verifyOtp({ email, otp: otpCode });
      addToast('Email verified successfully! Welcome to SkillBridge.', 'success');

      // Auto-login with returned JWT
      if (res.token && res.user && setAuthLogin) {
        setAuthLogin(res.user, res.token);
      }

      navigate('/upload', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Invalid or expired OTP code. Please try again.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg('');

    try {
      await authApi.resendOtp({ email });
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      addToast('A new 6-digit verification code has been sent to your email.', 'info');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to resend verification code. Please try again.';
      setErrorMsg(msg);
      addToast(msg, 'error');
    } finally {
      setIsResending(false);
    }
  };

  const formatTimer = () => {
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <PageWrapper className="flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 min-h-[80vh]">
      <div className="w-full max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl bg-gradient-to-b from-navy-900/95 via-navy-950 to-navy-950 border border-cyan-500/30 p-8 shadow-glow-cyan relative overflow-hidden backdrop-blur-xl"
        >
          {/* Header Icon */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.25)]">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h1 className="font-heading font-extrabold text-2xl text-white">
              Verify Your Email
            </h1>

            <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-sans">
              We sent a 6-digit confirmation code to:
            </p>

            {/* Email pill with edit toggle */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-950 border border-navy-800 text-xs font-mono text-cyan-300">
              <Mail className="w-3.5 h-3.5 text-cyan-400" />
              <span>{email}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleVerify} className="mt-8 space-y-6">
            {/* 6 Digit Inputs */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider text-center mb-3">
                Enter 6-Digit Code
              </label>

              <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-14 sm:w-12 sm:h-14 text-center font-heading text-xl sm:text-2xl font-bold rounded-xl bg-navy-950 border border-navy-750 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 text-white shadow-inner transition-all outline-none"
                  />
                ))}
              </div>

              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 flex items-center justify-center gap-1.5 text-xs text-rose-400 font-mono"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isVerifying || otp.join('').length < 6}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 hover:from-brand-blue-hover hover:to-cyan-400 text-white font-heading font-bold text-sm tracking-wide shadow-glow-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Proceed</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend Section with Countdown */}
            <div className="pt-2 text-center text-xs font-mono space-y-2">
              <div className="text-slate-400">
                {timer > 0 ? (
                  <span>Code expires in: <strong className="text-cyan-400">{formatTimer()}</strong></span>
                ) : (
                  <span className="text-amber-400">Code expired. Please request a new one.</span>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timer > 0 || isResending}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  <span>Resend Verification Code</span>
                </button>
              </div>
            </div>

            {/* Back to Login link */}
            <div className="pt-4 border-t border-navy-800 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </PageWrapper>
  );
};

export default OTPVerificationPage;
