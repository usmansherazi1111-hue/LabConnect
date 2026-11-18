/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  children,
}) => {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: LC_EASE }}
        className="w-full max-w-5xl bg-white border border-[#DCE4DE] rounded-3xl shadow-[0_24px_64px_-20px_rgba(23,76,60,0.14)] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
      >
        {/* Left Brand & Domain Showcase Panel */}
        <div className="lg:col-span-5 bg-[#174C3C] text-white p-7 sm:p-9 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Architectural Grid Lines */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          <div className="relative z-10 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05, ease: LC_EASE }}
              className="inline-flex items-center gap-2.5 bg-white/10 border border-white/15 rounded-xl px-3.5 py-2 text-xs font-semibold tracking-wide"
            >
              <span className="text-[#E8EFE8]">{icon}</span>
              <span>{portalTag}</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1, ease: LC_EASE }}
              className="space-y-3"
            >
              <h1 className="text-2xl sm:text-3xl font-bold leading-[1.15] tracking-tight text-white">
                {headline}
              </h1>
              <p className="text-xs sm:text-sm text-[#E8EFE8]/85 leading-relaxed">{subheadline}</p>
            </motion.div>

            {/* Animated Live Metric / Feature Preview Cards */}
            <div className="space-y-2.5 pt-2">
              {highlights.map((card, idx) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + idx * 0.07, ease: LC_EASE }}
                  whileHover={{ x: 3 }}
                  className="bg-white/[0.08] border border-white/12 rounded-xl p-3.5 flex items-center gap-3.5 transition-colors hover:bg-white/[0.12]"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/12 text-[#E8EFE8] flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-[#E8EFE8]/75">{card.label}</div>
                    <div className="text-xs sm:text-sm font-bold text-white truncate">{card.value}</div>
                  </div>
                  <span className="font-mono text-[10px] text-[#E8EFE8]/80 shrink-0">{card.meta}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Security & Role Isolation Checklist */}
          <div className="relative z-10 pt-8 mt-8 border-t border-white/15 space-y-2.5">
            {checklist.map((item, idx) => (
              <motion.div
                key={item}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.3 + idx * 0.06 }}
                className="flex items-start gap-2 text-xs text-[#E8EFE8]/90"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4C9184] shrink-0 mt-0.5" />
                <span>{item}</span>
              </motion.div>
            ))}

            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-mono text-[#E8EFE8]/65">
              <Lock className="w-3 h-3 shrink-0" />
              <span>{footerNote}</span>
            </div>
          </div>
        </div>

        {/* Right Interactive Auth Form Surface */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
          <div className="w-full max-w-md mx-auto space-y-6">{children}</div>
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
        className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2"
      >
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
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
      className="bg-white border border-[#DCE4DE] rounded-2xl px-6 py-5 flex items-center gap-3 shadow-xs"
    >
      <span className="w-4 h-4 rounded-full border-2 border-[#174C3C] border-t-transparent animate-spin" />
      <span className="text-xs font-medium text-[#202A27]">{label}</span>
    </motion.div>
  </div>
);
