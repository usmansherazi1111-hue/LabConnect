/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { LC_EASE } from './MotionPrimitives';

export interface AuthHighlightCard {
  label: string;
  value: string;
  meta: string;
  icon: React.ReactNode;
}

interface PortalAuthShellProps {
  portalTag: string;
  headline: string;
  subheadline: string;
  icon: React.ReactNode;
  highlights: AuthHighlightCard[];
  checklist: string[];
  footerNote: string;
  visualImageUrl?: string;
  visualImageAlt?: string;
  children: React.ReactNode;
}

export const PortalAuthShell: React.FC<PortalAuthShellProps> = ({
  portalTag,
  headline,
  subheadline,
  icon,
  highlights,
  checklist,
  footerNote,
  visualImageUrl,
  visualImageAlt,
  children,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center px-4 py-5 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: LC_EASE }}
        className="w-full max-w-5xl bg-white border border-[#C8DDD7] rounded-3xl shadow-[0_28px_72px_-20px_rgba(7,59,67,0.20)] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
      >
        {/* Brand & Domain Showcase Panel (below form on mobile so sign-in is above the fold) */}
        <div className="order-2 lg:order-1 lg:col-span-5 lc-gradient-midnight text-white p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
          {/* Controlled Electric Aqua & Digital Periwinkle Ambient Light */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, #21D4C2 0%, transparent 70%)' }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-16 w-64 h-64 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #A5B9FF 0%, transparent 70%)' }}
          />

          {/* Subtle Precision Grid Lines */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #21D4C2 1px, transparent 1px), linear-gradient(to bottom, #21D4C2 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05, ease: LC_EASE }}
              className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#21D4C2]"
            >
              <span className="text-[#B9ED69]">{icon}</span>
              <span>{portalTag}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1, ease: LC_EASE }}
              className="space-y-2"
            >
              <h1 className="text-xl sm:text-2xl font-bold leading-[1.16] tracking-tight text-white">
                {headline}
              </h1>
              <p className="text-xs text-[#D9E9E5]/85 leading-relaxed">{subheadline}</p>
            </motion.div>

            {visualImageUrl && !imgFailed && (
              <div className="relative h-24 rounded-2xl overflow-hidden border border-white/15">
                <img
                  src={visualImageUrl}
                  alt={visualImageAlt || portalTag}
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#073B43]/85 via-transparent to-transparent" />
              </div>
            )}

            {/* Animated Live Metric / Feature Preview Cards */}
            <div className="space-y-2 pt-0.5">
              {highlights.map((card, idx) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.14 + idx * 0.06, ease: LC_EASE }}
                  whileHover={{ x: 3 }}
                  className="bg-white/[0.08] border border-white/15 rounded-xl p-3 flex items-center gap-3 transition-colors hover:bg-white/[0.12]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#21D4C2]/15 text-[#21D4C2] flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-[#D9E9E5]/80">{card.label}</div>
                    <div className="text-xs font-bold text-white truncate">{card.value}</div>
                  </div>
                  <span className="font-mono text-[10px] text-[#B9ED69] shrink-0">{card.meta}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Security & Role Isolation Checklist */}
          <div className="relative z-10 pt-4 mt-4 border-t border-white/15 space-y-1.5">
            {checklist.map((item, idx) => (
              <motion.div
                key={item}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.28 + idx * 0.05 }}
                className="flex items-start gap-2 text-[11px] text-[#D9E9E5]/90"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#B9ED69] shrink-0 mt-0.5" />
                <span>{item}</span>
              </motion.div>
            ))}

            <div className="pt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-[#21D4C2]/85">
              <Lock className="w-3 h-3 shrink-0" />
              <span>{footerNote}</span>
            </div>
          </div>
        </div>

        {/* Interactive Auth Form Surface (first on mobile) */}
        <div className="order-1 lg:order-2 lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center bg-white">
          <div className="w-full max-w-md mx-auto space-y-5">{children}</div>
        </div>
      </motion.div>
    </div>
  );
};

export const AuthErrorBanner: React.FC<{ message: string | null }> = ({ message }) => (
  <AnimatePresence mode="wait">
    {message && (
      <motion.div
        key={message}
        initial={{ opacity: 0, y: -6, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: LC_EASE }}
        className="p-3 bg-[#FF927E]/20 border border-[#FF927E] text-[#172C32] rounded-xl text-xs font-medium flex items-start gap-2"
      >
        <AlertCircle className="w-4 h-4 text-[#9C2A1A] shrink-0 mt-0.5" />
        <span>{message}</span>
      </motion.div>
    )}
  </AnimatePresence>
);

export const AuthSessionLoader: React.FC<{ label?: string }> = ({
  label = 'Verifying encrypted session...',
}) => (
  <div className="min-h-[65vh] flex items-center justify-center p-6">
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-[#D9E9E5] rounded-2xl px-6 py-5 flex items-center gap-3 shadow-xs"
    >
      <span className="w-4 h-4 rounded-full border-2 border-[#087F8C] border-t-transparent animate-spin" />
      <span className="text-xs font-semibold text-[#172C32]">{label}</span>
    </motion.div>
  </div>
);
