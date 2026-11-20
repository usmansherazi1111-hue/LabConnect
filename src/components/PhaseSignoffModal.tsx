/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, ShieldCheck, FileCheck, ArrowRight } from 'lucide-react';
import { AnimatedModal } from './ui/MotionPrimitives';

interface PhaseSignoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  isApproved: boolean;
  onToggleApproval: () => void;
}

export const PhaseSignoffModal: React.FC<PhaseSignoffModalProps> = ({
  isOpen,
  onClose,
  isApproved,
  onToggleApproval,
}) => {
  const deliverables = [
    { title: 'Product Requirements Document (PRD)', status: 'VERIFIED' },
    { title: 'Software Requirements Specification (SRS)', status: 'VERIFIED' },
    { title: 'Business Requirements Document (BRD)', status: 'VERIFIED' },
    { title: 'Normalized Database ERD & DDL (7 core tables)', status: 'VERIFIED' },
    { title: 'Requirements Traceability Matrix (50+ IDs)', status: 'VERIFIED' },
    { title: 'STRIDE Threat Model & Healthcare Privacy Matrix', status: 'VERIFIED' },
    { title: 'AI Feature & Safety Specification', status: 'VERIFIED' },
    { title: 'Lahore Real Laboratory Directory (Chughtai, SKMCH, IDC, Excel)', status: 'CONFIRMED' },
    { title: 'Contradictions & Policy Resolutions (PHC, Prescriptions, Raast)', status: 'RESOLVED' },
  ];

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-xl">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between border-b border-[#D9E9E5] pb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D9E9E5] text-[#073B43] flex items-center justify-center font-bold shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#087F8C]">
                Phase 0 Milestone Gate
              </span>
              <h3 className="text-lg font-extrabold text-[#172C32]">
                Requirements Baseline &amp; Architecture Sign-Off
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#556B70] hover:text-[#172C32] text-sm font-semibold p-1.5"
            aria-label="Close sign-off modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {deliverables.map((item, index) => (
            <div
              key={index}
              className="p-2.5 rounded-xl bg-[#F3F7F4] border border-[#D9E9E5] flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-[#087F8C] shrink-0" />
                <span className="font-medium text-[#172C32] truncate">{item.title}</span>
              </div>
              <span className="text-[10px] font-mono text-[#073B43] font-bold bg-[#D9E9E5] px-2 py-0.5 rounded-md shrink-0">
                {item.status}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-[#D9E9E5]/60 border border-[#087F8C]/25 rounded-xl p-3.5 text-xs text-[#073B43] space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#087F8C]" />
            <span>Real-Data Verification Statement</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#172C32]/85">
            All initial diagnostic prices, branch addresses, and service zones are anchored on published catalogues of
            accredited Lahore laboratories.
          </p>
        </div>

        <div className="pt-2 border-t border-[#D9E9E5] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-[#556B70] hover:text-[#172C32] px-3 py-2"
          >
            Return to Review
          </button>

          <button
            type="button"
            onClick={() => {
              onToggleApproval();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              isApproved
                ? 'bg-[#F3F7F4] text-[#172C32] hover:bg-[#D9E9E5] border border-[#C8DDD7]'
                : 'lc-gradient-ocean text-white hover:brightness-110'
            }`}
          >
            {isApproved ? (
              <span>Reopen Phase 0 for Revision</span>
            ) : (
              <>
                <span>Approve Phase 0 &amp; Authorize Phase 1</span>
                <ArrowRight className="w-4 h-4 text-[#21D4C2]" />
              </>
            )}
          </button>
        </div>
      </div>
    </AnimatedModal>
  );
};
