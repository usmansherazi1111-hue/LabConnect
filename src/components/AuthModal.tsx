/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Phone, Mail, User, CheckCircle2, ArrowRight, X, Loader2 } from 'lucide-react';
import { AnimatedModal, AnimatedTabBar, LC_EASE } from './ui/MotionPrimitives';
import { AuthErrorBanner } from './ui/PortalAuthShell';
import { AnimatePresence, motion } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { sendOtp, verifyOtp } = useAuth();

  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(300);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (authTab === 'SIGN_UP') {
      if (userName.trim().length < 3) {
        setErrorMessage('Please enter your full name (minimum 3 characters).');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) {
        setErrorMessage('Please enter a valid email address to receive PDF lab reports.');
        return;
      }
    }

    setIsSending(true);
    const res = await sendOtp(phone);
    setIsSending(false);

    if (res.success) {
      setStep('OTP');
      setCountdown(300);
      setStatusMessage(res.message || '6-digit verification code sent to your mobile.');
    } else {
      setErrorMessage(res.error || 'Failed to dispatch OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMessage(null);

    const res = await verifyOtp(
      phone,
      otpCode,
      authTab === 'SIGN_UP' ? userName.trim() : undefined,
      authTab === 'SIGN_UP' ? userEmail.trim() : undefined
    );
    setIsVerifying(false);

    if (res.success) {
      onClose();
      onSuccess?.();
    } else {
      setErrorMessage(res.error || 'Incorrect or expired OTP');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-md">
      <div className="p-6 space-y-5 pb-safe">
        <div className="flex items-start justify-between border-b border-[#E8EFE8] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8EFE8] text-[#174C3C] flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#28745B]">
                Patient Identity &amp; PDF Delivery
              </span>
              <h3 className="text-lg font-bold text-[#202A27]">
                {step === 'OTP'
                  ? 'Enter 6-Digit SMS Code'
                  : authTab === 'SIGN_IN'
                  ? 'Patient Sign In'
                  : 'Create Patient Account'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#737D78] hover:text-[#202A27] p-2 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'PHONE' && (
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
        )}

        {/* Step Indicator Bar */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="flex-1 h-1.5 rounded-full bg-[#174C3C]" />
          <span
            className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${
              step === 'OTP' ? 'bg-[#174C3C]' : 'bg-[#E8EFE8]'
            }`}
          />
        </div>

        <AuthErrorBanner message={errorMessage} />

        {statusMessage && (
          <div className="bg-[#E8EFE8]/70 border border-[#28745B]/25 text-[#174C3C] p-3 rounded-xl text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#28745B] shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'PHONE' ? (
            <motion.form
              key={`modal-phone-${authTab}`}
              initial={{ opacity: 0, x: authTab === 'SIGN_IN' ? -8 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: authTab === 'SIGN_IN' ? 8 : -8 }}
              transition={{ duration: 0.18, ease: LC_EASE }}
              onSubmit={handleSendOtp}
              className="space-y-4 text-xs"
            >
              {authTab === 'SIGN_UP' && (
                <>
                  <div>
                    <label className="block font-semibold text-[#202A27] mb-1.5">Full Name</label>
                    <div className="flex items-center bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 focus-within:border-[#174C3C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#174C3C]/10 transition-all">
                      <User className="w-4 h-4 text-[#737D78] shrink-0" />
                      <input
                        type="text"
                        required
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="e.g. Muhammad Bilal Arshad"
                        className="w-full bg-transparent px-2.5 py-3 font-medium text-[#202A27] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#202A27] mb-1.5">Email Address (PDF Reports)</label>
                    <div className="flex items-center bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 focus-within:border-[#174C3C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#174C3C]/10 transition-all">
                      <Mail className="w-4 h-4 text-[#737D78] shrink-0" />
                      <input
                        type="email"
                        required
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-transparent px-2.5 py-3 font-medium text-[#202A27] focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-[#202A27] mb-1.5">Pakistani Mobile Number</label>
                <div className="flex items-center bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 focus-within:border-[#174C3C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#174C3C]/10 transition-all">
                  <Phone className="w-4 h-4 text-[#737D78] shrink-0" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300 4567891 or +92 300 4567891"
                    className="w-full bg-transparent px-2.5 py-3 font-mono text-[#202A27] focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-[#737D78] mt-1.5">
                  Receive a one-time 6-digit SMS verification code to continue.
                </p>
              </div>

              <motion.button
                type="submit"
                disabled={isSending}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                className="w-full py-3 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 min-h-[44px]"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{isSending ? 'Sending OTP...' : 'Send 6-Digit SMS Code'}</span>
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
                  <label className="font-semibold text-[#202A27]">Code sent to {phone}</label>
                  <span className="font-mono text-[#174C3C] font-bold tabular-nums">
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
                  className="w-full text-center tracking-[0.4em] text-xl font-mono font-bold bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-3.5 text-[#202A27] focus:outline-none focus:border-[#174C3C] focus:bg-white focus:ring-3 focus:ring-[#174C3C]/10 transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="text-[#737D78] hover:text-[#202A27] font-medium min-h-[36px]"
                >
                  Change Details
                </button>
                <button
                  type="button"
                  disabled={countdown > 240}
                  onClick={handleSendOtp}
                  className="text-[#174C3C] hover:text-[#28745B] font-semibold disabled:text-[#737D78]/50 min-h-[36px]"
                >
                  Resend OTP
                </button>
              </div>

              <motion.button
                type="submit"
                disabled={isVerifying || otpCode.length < 6}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                className="w-full py-3 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-45 min-h-[44px]"
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
