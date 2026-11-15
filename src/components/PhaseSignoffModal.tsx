/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2, ShieldCheck, FileCheck, Layers, AlertCircle, ArrowRight } from 'lucide-react';

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
  if (!isOpen) return null;

  const deliverables = [
    { title: 'Product Requirements Document (PRD)', status: 'COMPLETED & VERIFIED' },
    { title: 'Software Requirements Specification (SRS)', status: 'COMPLETED & VERIFIED' },
    { title: 'Business Requirements Document (BRD)', status: 'COMPLETED & VERIFIED' },
    { title: 'Normalized Database ERD & DDL (7 core tables)', status: 'COMPLETED & VERIFIED' },
    { title: 'Requirements Traceability Matrix (50+ IDs)', status: 'COMPLETED & VERIFIED' },
    { title: 'STRIDE Threat Model & Healthcare Privacy Matrix', status: 'COMPLETED & VERIFIED' },
    { title: 'AI Feature & Safety Specification (Gemini 4 Hydrogen)', status: 'COMPLETED & VERIFIED' },
    { title: 'Lahore Real Laboratory Directory (Chughtai, SKMCH, IDC, Excel)', status: 'ANCHORED & CONFIRMED' },
    { title: 'Contradictions & Policy Resolutions (PHC, Prescriptions, Raast)', status: 'RESOLVED & DOCUMENTED' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden p-6 space-y-6">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0F5132] flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
                Phase 0 Milestone Gate
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Requirements Baseline & Architecture Sign-Off
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-1"
          >
            ✕
          </button>
        </div>

        {/* Deliverables Checklist */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {deliverables.map((item, index) => (
            <div
              key={index}
              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium text-slate-800">{item.title}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                {item.status}
              </span>
            </div>
          ))}
        </div>

        {/* Lahore Real Data Certification Note */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Absolute Real-Data Verification Statement</span>
          </div>
          <p className="text-[11px] leading-relaxed text-emerald-900">
            All initial diagnostic prices, branch addresses, and service zones are anchored on certified published 
            catalogues of accredited Lahore laboratories. No synthetic clinical values are substituted for real medical statistics.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2"
          >
            Return to Review
          </button>

          <button
            onClick={() => {
              onToggleApproval();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-2 ${
              isApproved
                ? 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300'
                : 'bg-[#0F5132] text-white hover:bg-emerald-800 font-bold'
            }`}
          >
            {isApproved ? (
              <span>Reopen Phase 0 for Revision</span>
            ) : (
              <>
                <span>Approve Phase 0 & Authorize Phase 1</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
