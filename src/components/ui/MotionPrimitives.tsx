/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { MotionConfig, AnimatePresence, motion } from 'motion/react';

export const LC_EASE = [0.16, 1, 0.3, 1] as const;

export const AppMotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
};

interface PageTransitionProps {
  children: React.ReactNode;
  transitionKey: string;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  transitionKey,
  className = '',
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: LC_EASE }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface AnimatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
  mobileBottomSheet?: boolean;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidthClass = 'max-w-lg',
  mobileBottomSheet = true,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className={`fixed inset-0 z-50 bg-[#202A27]/45 backdrop-blur-[2px] flex ${
            mobileBottomSheet ? 'items-end sm:items-center p-0 sm:p-4' : 'items-center p-4'
          } justify-center overflow-y-auto`}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, y: mobileBottomSheet ? 24 : 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: mobileBottomSheet ? 20 : 8, scale: 0.985 }}
            transition={{ duration: 0.22, ease: LC_EASE }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full ${maxWidthClass} bg-white border border-[#DCE4DE] shadow-[0_24px_60px_-15px_rgba(23,76,60,0.18)] ${
              mobileBottomSheet ? 'rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto' : 'rounded-2xl my-auto'
            }`}
          >
            {mobileBottomSheet && (
              <div className="w-10 h-1 bg-[#DCE4DE] rounded-full mx-auto mt-3 sm:hidden" />
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AnimatedTabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface AnimatedTabBarProps<T extends string> {
  items: AnimatedTabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
  layoutId: string;
  variant?: 'pill' | 'underline';
  className?: string;
}

export function AnimatedTabBar<T extends string>({
  items,
  activeId,
  onChange,
  layoutId,
  variant = 'pill',
  className = '',
}: AnimatedTabBarProps<T>) {
  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-6 ${className}`}>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`relative py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive ? 'text-[#174C3C] font-semibold' : 'text-[#737D78] hover:text-[#202A27]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="font-mono text-[11px] text-[#737D78]">({item.count})</span>
              )}
              {isActive && (
                <motion.span
                  layoutId={layoutId}
                  transition={{ type: 'spring', stiffness: 460, damping: 36 }}
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#174C3C] rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1 p-1 rounded-xl bg-[#E8EFE8]/75 border border-[#DCE4DE] overflow-x-auto max-w-full ${className}`}
    >
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`relative px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-h-[36px] flex items-center gap-1.5 ${
              isActive ? 'text-white font-semibold' : 'text-[#202A27]/80 hover:text-[#174C3C]'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                className="absolute inset-0 bg-[#174C3C] rounded-lg shadow-2xs"
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {item.icon}
              <span>{item.label}</span>
              {typeof item.count === 'number' && (
                <span
                  className={`font-mono text-[11px] tabular-nums ${
                    isActive ? 'text-white/80' : 'text-[#737D78]'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}> = ({ value, prefix = '', suffix = '', decimals = 0, className = '' }) => {
  const [display, setDisplay] = useState<number>(value);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (Math.abs(diff) < 0.001) {
      setDisplay(value);
      return;
    }
    const duration = 380;
    const startTime = performance.now();
    let frameId = 0;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(start + diff * eased);
      if (t < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplay(value);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString();

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

export const SkeletonBlock: React.FC<{ className?: string }> = ({ className = 'h-4 w-full rounded-lg' }) => (
  <div className={`lc-skeleton ${className}`} aria-hidden="true" />
);

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="bg-white border border-[#DCE4DE] rounded-2xl p-8 sm:p-10 text-center max-w-lg mx-auto space-y-3">
    <div className="w-11 h-11 rounded-xl bg-[#E8EFE8] text-[#174C3C] flex items-center justify-center mx-auto">
      {icon}
    </div>
    <h3 className="text-base font-bold text-[#202A27]">{title}</h3>
    <p className="text-xs text-[#737D78] leading-relaxed">{description}</p>
    {action && <div className="pt-2">{action}</div>}
  </div>
);
