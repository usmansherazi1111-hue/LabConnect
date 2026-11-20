/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Phone, Mail, User, CheckCircle2, ArrowRight, X, Loader2 } from 'lucide-react';
import { AnimatedModal, AnimatedTabBar, LC_EASE } from './ui/MotionPrimitives';
import { AuthErrorBanner } from './ui/PortalAuthShell';
import { GoogleOAuthButton, OAuthOrDivider } from './ui/OAuthSignInBar';
import { AnimatePresence, motion } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { signInWithGoogle, sendEmailOtp, verifyEmailOtp } = useAuth();

  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [phone, setPhone] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(300);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsGoogleLoading(true);
    const res = await signInWithGoogle('patient');
    setIsGoogleLoading(false);
    if (res.success) {
      onClose();
      onSuccess?.();
    } else if (res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (authTab === 'SIGN_UP' && userName.trim().length < 3) {
      setErrorMessage('Please enter your full name (minimum 3 characters).');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) {
      setErrorMessage('Please enter a valid email address for OTP verification and PDF delivery.');
      return;
    }

    setIsSending(true);
    const res = await sendEmailOtp(userEmail.trim(), 'patient');
    setIsSending(false);

    if (res.success) {
      setStep('OTP');
      setCountdown(300);
      setStatusMessage(res.message || `6-digit verification code emailed to ${userEmail.trim()}.`);
    } else {
      setErrorMessage(res.error || 'Failed to dispatch email verification code');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMessage(null);

    const res = await verifyEmailOtp({
      email: userEmail.trim(),
      otp: otpCode,
      portal: 'patient',
      name: authTab === 'SIGN_UP' ? userName.trim() : undefined,
      phone: phone.trim() || undefined,
    });
    setIsVerifying(false);

    if (res.success) {
      onClose();
      onSuccess?.();
    } else {
      setErrorMessage(res.error || 'Incorrect or expired verification code');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-md">
      <div className="p-6 space-y-4 pb-safe">
        <div className="flex items-start justify-between border-b border-[#D9E9E5] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl lc-gradient-ocean text-[#21D4C2] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#087F8C]">
                Patient Identity &amp; PDF Delivery
              </span>
              <h3 className="text-lg font-bold text-[#172C32]">
                {step === 'OTP'
                  ? 'Enter 6-Digit Email Code'
                  : authTab === 'SIGN_IN'
                  ? 'Patient Sign In'
                  : 'Create Patient Account'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#556B70] hover:text-[#172C32] p-2 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'FORM' && (
          <>
            <AnimatedTabBar
              layoutId="auth-modal-tab"
              activeId={authTab}
              onChange={(t) => {
                setAuthTab(t);
                setErrorMessage(null);
              }}
              className="w-full grid grid-cols-2"
              items={[
                { id: 'SIGN_IN', label: 'Sign In' },
                { id: 'SIGN_UP', label: 'Create Account' },
              ]}
            />

            <GoogleOAuthButton
              label={authTab === 'SIGN_IN' ? 'Sign in with Google' : 'Sign up with Google'}
              loading={isGoogleLoading}
              onClick={handleGoogleAuth}
            />

            <OAuthOrDivider text="or real-time email OTP verification" />
          </>
        )}

        {/* Step Indicator Bar */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="flex-1 h-1.5 rounded-full lc-gradient-aqua" />
          <span
            className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
              step === 'OTP' ? 'lc-gradient-aqua' : 'bg-[#D9E9E5]'
            }`}
          />
        </div>

        <AuthErrorBanner message={errorMessage} />

        {statusMessage && (
          <div className="bg-[#D9E9E5]/70 border border-[#087F8C]/25 text-[#073B43] p-3 rounded-xl text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#087F8C] shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'FORM' ? (
            <motion.form
              key={`modal-email-${authTab}`}
              initial={{ opacity: 0, x: authTab === 'SIGN_IN' ? -8 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: authTab === 'SIGN_IN' ? 8 : -8 }}
              transition={{ duration: 0.18, ease: LC_EASE }}
              onSubmit={handleSendOtp}
              className="space-y-3.5 text-xs"
            >
              {authTab === 'SIGN_UP' && (
                <div>
                  <label className="block font-semibold text-[#172C32] mb-1.5">Full Name</label>
                  <div className="flex items-center bg-[#F3F7F4] border border-[#C8DDD7] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#21D4C2]/20 transition-all">
                    <User className="w-4 h-4 text-[#556B70] shrink-0" />
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Muhammad Bilal Arshad"
                      className="w-full bg-transparent px-2.5 py-2.5 font-medium text-[#172C32] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#172C32] mb-1.5">Email Address (OTP &amp; PDF Reports)</label>
                <div className="flex items-center bg-[#F3F7F4] border border-[#C8DDD7] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#21D4C2]/20 transition-all">
                  <Mail className="w-4 h-4 text-[#556B70] shrink-0" />
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent px-2.5 py-2.5 font-medium text-[#172C32] focus:outline-none"
                  />
                </div>
              </div>

              {authTab === 'SIGN_UP' && (
                <div>
                  <label className="block font-semibold text-[#172C32] mb-1.5">Pakistani Mobile Number (Home Sampling Contact)</label>
                  <div className="flex items-center bg-[#F3F7F4] border border-[#C8DDD7] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#21D4C2]/20 transition-all">
                    <Phone className="w-4 h-4 text-[#556B70] shrink-0" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300 4567891 or +92 300 4567891"
                      className="w-full bg-transparent px-2.5 py-2.5 font-mono text-[#172C32] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={isSending}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                className="w-full py-3 lc-gradient-ocean hover:brightness-110 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin text-[#21D4C2]" /> : <ArrowRight className="w-4 h-4 text-[#21D4C2]" />}
                <span>{isSending ? 'Sending Code...' : 'Send Real-Time Email OTP'}</span>
              </motion.button>
            </motion.form>
          ) : (
            <motion.form
              key="modal-step-otp"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18, ease: LC_EASE }}
              onSubmit={handleVerifyOtp}
              className="space-y-4 text-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-[#172C32]">
                    Code sent to {userEmail}
                  </label>
                  <span className="font-mono text-[#087F8C] font-bold tabular-nums">
                    {formatTimer(countdown)}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-[0.4em] text-xl font-mono font-bold bg-[#F3F7F4] border border-[#C8DDD7] rounded-xl p-3.5 text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white focus:ring-3 focus:ring-[#21D4C2]/25 transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep('FORM')}
                  className="text-[#556B70] hover:text-[#172C32] font-medium min-h-[36px]"
                >
                  Change Details
                </button>
                <button
                  type="button"
                  disabled={countdown > 240}
                  onClick={handleSendOtp}
                  className="text-[#087F8C] hover:text-[#073B43] font-semibold disabled:text-[#556B70]/45 min-h-[36px]"
                >
                  Resend OTP
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={isVerifying || otpCode.length < 6}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                className="w-full py-3 bg-[#B9ED69] hover:brightness-105 text-[#172C32] rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-45 min-h-[44px]"
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isVerifying ? 'Verifying...' : 'Verify & Open Patient Portal'}</span>
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </AnimatedModal>
  );
};
