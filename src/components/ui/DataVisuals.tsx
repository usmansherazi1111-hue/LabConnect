/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { LC_EASE, AnimatedNumber } from './MotionPrimitives';

/* ─── Animated Interactive Bar Chart ─────────────────────────────────────── */

export interface BarChartDatum {
  label: string;
  value: number;
  hint?: string;
  accent?: 'teal' | 'lime' | 'periwinkle' | 'coral';
}

export const AnimatedBarChart: React.FC<{
  data: BarChartDatum[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  emptyLabel?: string;
}> = ({ data, height = 160, valuePrefix = '', valueSuffix = '', emptyLabel = 'No activity recorded yet' }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-[#C8DDD7] bg-[#F3F7F4]/60 text-xs text-[#556B70]"
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }

  const barGradient = (accent?: BarChartDatum['accent']) => {
    if (accent === 'lime') return 'linear-gradient(180deg, #B9ED69 0%, #21D4C2 100%)';
    if (accent === 'periwinkle') return 'linear-gradient(180deg, #A5B9FF 0%, #087F8C 100%)';
    if (accent === 'coral') return 'linear-gradient(180deg, #FF927E 0%, #087F8C 100%)';
    return 'linear-gradient(180deg, #21D4C2 0%, #087F8C 65%, #073B43 100%)';
  };

  return (
    <div className="w-full select-none">
      <div className="relative flex items-end gap-2 sm:gap-3 pt-7 pb-1" style={{ height }}>
        {/* Horizontal hairlines */}
        <div className="pointer-events-none absolute inset-x-0 top-7 bottom-1 flex flex-col justify-between">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-full border-t border-dashed border-[#D9E9E5]" />
          ))}
        </div>

        {data.map((item, idx) => {
          const pct = Math.max(6, Math.round((item.value / maxVal) * 100));
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={`${item.label}-${idx}`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onFocus={() => setHoveredIdx(idx)}
              onBlur={() => setHoveredIdx(null)}
              tabIndex={0}
              className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer focus:outline-none"
            >
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.14 }}
                    className="absolute -top-1 z-20 px-2.5 py-1 rounded-lg bg-[#172C32] text-white text-[10px] font-mono whitespace-nowrap shadow-md pointer-events-none"
                  >
                    {valuePrefix}
                    {item.value.toLocaleString()}
                    {valueSuffix}
                    {item.hint ? ` · ${item.hint}` : ''}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ height: 0, opacity: 0.5 }}
                animate={{ height: `${pct}%`, opacity: 1 }}
                transition={{ duration: 0.45, delay: idx * 0.04, ease: LC_EASE }}
                style={{ background: barGradient(item.accent) }}
                className={`w-full max-w-[42px] rounded-t-lg transition-transform duration-150 ${
                  isHovered ? 'scale-x-105 brightness-105 shadow-[0_6px_18px_-4px_rgba(33,212,194,0.45)]' : ''
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 pt-2 border-t border-[#D9E9E5]">
        {data.map((item, idx) => (
          <div key={`${item.label}-lbl-${idx}`} className="flex-1 text-center min-w-0">
            <div className="text-[10px] font-medium text-[#556B70] truncate">{item.label}</div>
            <div className="text-[11px] font-mono font-semibold text-[#172C32] tabular-nums">
              {valuePrefix}
              {item.value.toLocaleString()}
              {valueSuffix}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Animated Radial Gauge Ring ─────────────────────────────────────────── */

export const RadialGaugeRing: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  sublabel?: string;
  color?: string;
}> = ({
  percentage,
  size = 96,
  strokeWidth = 8,
  label,
  sublabel,
  color = '#21D4C2',
}) => {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="inline-flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#D9E9E5"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.7, ease: LC_EASE }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-base font-bold font-mono text-[#172C32] tabular-nums">
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-[#172C32]">{label}</div>
        {sublabel && <div className="text-[10px] text-[#556B70]">{sublabel}</div>}
      </div>
    </div>
  );
};

/* ─── Animated Sparkline / Trend Curve ───────────────────────────────────── */

export const AnimatedTrendCurve: React.FC<{
  points: { label: string; value: number }[];
  unit?: string;
  strokeColor?: string;
  height?: number;
}> = ({ points, unit = '', strokeColor = '#087F8C', height = 112 }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  if (points.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-[#C8DDD7] bg-[#F3F7F4]/60 text-xs text-[#556B70]"
        style={{ height }}
      >
        Additional readings needed to plot trend
      </div>
    );
  }

  const width = 360;
  const padX = 16;
  const padY = 16;
  const min = Math.min(...points.map((p) => p.value));
  const max = Math.max(...points.map((p) => p.value));
  const range = Math.max(1, max - min);

  const coords = points.map((pt, idx) => {
    const x = padX + (idx / (points.length - 1)) * (width - padX * 2);
    const y = height - padY - ((pt.value - min) / range) * (height - padY * 2);
    return { x, y, ...pt };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

  return (
    <div className="space-y-1.5">
      <div className="relative w-full overflow-hidden rounded-xl bg-[#F3F7F4]/70 border border-[#D9E9E5] p-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" style={{ height }}>
          <defs>
            <linearGradient id="lc-trend-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#21D4C2" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#21D4C2" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#lc-trend-area)" />
          <motion.path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.75, ease: LC_EASE }}
          />

          {coords.map((c, idx) => (
            <g
              key={`${c.label}-${idx}`}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              className="cursor-pointer"
            >
              <circle
                cx={c.x}
                cy={c.y}
                r={activeIdx === idx ? 5.5 : 3.5}
                fill={activeIdx === idx ? '#B9ED69' : '#FFFFFF'}
                stroke="#073B43"
                strokeWidth={2}
              />
            </g>
          ))}
        </svg>

        {activeIdx !== null && coords[activeIdx] && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-[#172C32] text-white text-[11px] font-mono shadow-sm">
            {coords[activeIdx].label}: {coords[activeIdx].value}
            {unit ? ` ${unit}` : ''}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono text-[#556B70] px-1">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
};

/* ─── Clean Single-Level KPI Metric Card ─────────────────────────────────── */

export const KpiMetricCard: React.FC<{
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  meta: string;
  icon: React.ReactNode;
  tone?: 'ocean' | 'teal' | 'lime' | 'periwinkle' | 'coral';
}> = ({ label, value, prefix = '', suffix = '', decimals = 0, meta, icon, tone = 'teal' }) => {
  const iconToneMap: Record<NonNullable<typeof tone>, string> = {
    ocean: 'bg-[#073B43] text-white',
    teal: 'bg-[#D9E9E5] text-[#073B43]',
    lime: 'bg-[#B9ED69]/45 text-[#172C32]',
    periwinkle: 'bg-[#A5B9FF]/35 text-[#073B43]',
    coral: 'bg-[#FF927E]/30 text-[#172C32]',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.16, ease: LC_EASE }}
      className="bg-white border border-[#D9E9E5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 transition-shadow hover:shadow-[0_12px_30px_-14px_rgba(7,59,67,0.14)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-[#556B70]">{label}</span>
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconToneMap[tone]}`}>
          {icon}
        </span>
      </div>
      <div>
        <div className="text-2xl font-extrabold text-[#172C32] tracking-tight tabular-nums">
          <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </div>
        <div className="text-[11px] font-mono text-[#556B70] mt-1 truncate">{meta}</div>
      </div>
    </motion.div>
  );
};

/* ─── Right Slide-Over Inspection Drawer ─────────────────────────────────── */

export const SlideOverDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, subtitle, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
          className="fixed inset-0 z-50 bg-[#172C32]/45 backdrop-blur-[2px] flex justify-end"
          role="dialog"
          aria-modal="true"
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.24, ease: LC_EASE }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg h-full bg-[#F3F7F4] border-l border-[#C8DDD7] shadow-2xl flex flex-col"
          >
            <div className="bg-white border-b border-[#D9E9E5] px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-[#172C32] truncate">{title}</h3>
                {subtitle && <p className="text-xs font-mono text-[#556B70] mt-0.5 truncate">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="p-2 rounded-xl border border-[#D9E9E5] text-[#556B70] hover:text-[#172C32] hover:bg-[#D9E9E5]/40 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─── Non-Blocking Semantic Toast Banner ─────────────────────────────────── */

export const ToastBanner: React.FC<{
  message: string | null;
  variant?: 'success' | 'warning' | 'info';
  onDismiss?: () => void;
}> = ({ message, variant = 'success', onDismiss }) => {
  const styles =
    variant === 'warning'
      ? 'bg-[#FF927E] text-[#172C32] border-[#172C32]/15'
      : variant === 'info'
      ? 'bg-[#A5B9FF] text-[#172C32] border-[#073B43]/15'
      : 'bg-[#073B43] text-white border-[#21D4C2]/30';

  const Icon = variant === 'warning' ? AlertTriangle : variant === 'info' ? Info : CheckCircle2;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: LC_EASE }}
          className={`rounded-xl border px-4 py-3 text-xs font-semibold flex items-center justify-between gap-3 shadow-sm ${styles}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Icon className={`w-4 h-4 shrink-0 ${variant === 'success' ? 'text-[#B9ED69]' : 'text-[#172C32]'}`} />
            <span className="leading-snug">{message}</span>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss message"
              className="p-1 rounded-md opacity-75 hover:opacity-100 transition-opacity shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
