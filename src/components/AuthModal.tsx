/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Phone, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { sendOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState<string>('0300 4567891');
  const [userName, setUserName] = useState<string>('Muhammad Bilal Arshad');
  const [userEmail, setUserEmail] = useState<string>('bilal.arshad@gmail.com');
  const [otpCode, setOtpCode] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(300);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 'OTP' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (userName.trim().length < 3) {
      setErrorMessage('Please enter your full name (minimum 3 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim())) {
      setErrorMessage('Please enter a valid email address to receive PDF lab reports.');
      return;
    }

    setIsSending(true);
    const res = await sendOtp(phone);
    setIsSending(false);

    if (res.success) {
      setStep('OTP');
      setCountdown(300);
      setStatusMessage(res.message || '6-digit verification code sent to your mobile.');
      if (res.demoCode) {
        setDemoOtp(res.demoCode);
      }
    } else {
      setErrorMessage(res.error || 'Failed to dispatch OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setErrorMessage(null);

    const res = await verifyOtp(phone, otpCode, userName.trim(), userEmail.trim());
    setIsVerifying(false);

    if (res.success) {
      onClose();
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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0F5132] flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
                Patient Identity & Report Delivery
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                {step === 'PHONE' ? 'Patient Sign In / Register' : 'Enter 6-Digit SMS Code'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-2 min-h-[36px] min-w-[36px]"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name:</label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Muhammad Bilal Arshad"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address (for PDF Reports):</label>
              <input
                type="email"
                required
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pakistani Mobile Number:</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300 4567891 or +92 300 4567891"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Used to secure your medical PDF reports and booking history.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2.5 bg-[#0F5132] text-white rounded-lg font-semibold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <span>{isSending ? 'Sending OTP...' : 'Send 6-Digit SMS Code'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Code sent to {phone}:</label>
                <span className="font-mono text-emerald-800 font-bold tabular-nums">
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
                className="w-full text-center tracking-widest text-xl font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {demoOtp && (
              <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-[11px] text-slate-600">
                  Verification OTP: <strong className="font-mono">{demoOtp}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(demoOtp)}
                  className="text-[11px] font-semibold text-emerald-800 bg-white border border-slate-200 px-2.5 py-1 rounded hover:bg-slate-50 min-h-[32px]"
                >
                  Fill Code
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-slate-500 hover:text-slate-800 font-medium min-h-[36px]"
              >
                Change Details
              </button>
              <button
                type="button"
                disabled={countdown > 240}
                onClick={handleSendOtp}
                className="text-emerald-800 hover:text-emerald-950 font-semibold disabled:text-slate-400 min-h-[36px]"
              >
                Resend OTP
              </button>
            </div>

            <button
              type="submit"
              disabled={isVerifying || otpCode.length < 6}
              className="w-full py-2.5 bg-[#0F5132] text-white rounded-lg font-semibold hover:bg-emerald-800 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-300 min-h-[44px]"
            >
              <span>{isVerifying ? 'Verifying...' : 'Verify & Open Patient Portal'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
