/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DiagnosticReportRecord, DiagnosticTest } from '../../types';
import { apiClient } from '../../api/client';
import { Sparkles, FileText, ShieldAlert, ArrowRight, RotateCw, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LC_EASE } from '../ui/MotionPrimitives';
import aiMolecularImg from '../../assets/images/ai_molecular_guide_1795109387009.jpg';

interface PatientIntelligenceViewProps {
  reports: DiagnosticReportRecord[];
  tests: DiagnosticTest[];
  selectedReport: DiagnosticReportRecord | null;
  onSelectReport: (report: DiagnosticReportRecord) => void;
  onJumpToReports: () => void;
  defaultLanguage?: 'en' | 'ur';
}

export const PatientIntelligenceView: React.FC<PatientIntelligenceViewProps> = ({
  reports,
  tests,
  selectedReport,
  onSelectReport,
  onJumpToReports,
  defaultLanguage = 'en',
}) => {
  const [aiLang, setAiLang] = useState<'EN' | 'UR'>(defaultLanguage === 'ur' ? 'UR' : 'EN');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [customValue, setCustomValue] = useState<string>('');
  const [customRef, setCustomRef] = useState<string>('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [activePromptTitle, setActivePromptTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imgFailed, setImgFailed] = useState<boolean>(false);

  const runExplanation = async (payload: {
    testName: string;
    testValue: string;
    referenceRange: string;
    parameters?: DiagnosticReportRecord['parameters'];
    langOverride?: 'EN' | 'UR';
  }) => {
    const lang = payload.langOverride || aiLang;
    setIsLoading(true);
    setActivePromptTitle(payload.testName);
    setExplanation(null);
    try {
      const res = await apiClient.explainReport({
        testName: payload.testName,
        testValue: payload.testValue,
        referenceRange: payload.referenceRange,
        language: lang,
        parameters: payload.parameters,
      });
      if (res.success) {
        setExplanation(res.explanation);
      } else {
        setExplanation('Unable to generate educational guidance right now.');
      }
    } catch {
      setExplanation('Network error reaching LabConnect Intelligence.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopic.trim()) return;
    runExplanation({
      testName: customTopic.trim(),
      testValue: customValue.trim() || 'Reference guidance request',
      referenceRange: customRef.trim() || 'Standard Clinical Range',
    });
  };

  const suggestionChips = [
    {
      label: aiLang === 'UR' ? 'HbA1c کیا ظاہر کرتا ہے؟' : 'What does HbA1c measure?',
      testName: 'HbA1c (Glycated Hemoglobin)',
      testValue: '6.1%',
      referenceRange: '< 5.7%',
    },
    {
      label: aiLang === 'UR' ? 'وٹامن ڈی کی کمی' : 'Vitamin D 25-OH context',
      testName: 'Vitamin D (25-OH)',
      testValue: '18 ng/mL',
      referenceRange: '30 – 100 ng/mL',
    },
    {
      label: aiLang === 'UR' ? 'CBC پلیٹلیٹس اور ہیموگلوبن' : 'CBC Hemoglobin & Platelets',
      testName: 'Complete Blood Count (CBC)',
      testValue: 'Hemoglobin 11.4 g/dL',
      referenceRange: '12.0 – 16.0 g/dL',
    },
    {
      label: aiLang === 'UR' ? 'لپڈ پروفائل کولیسٹرول' : 'Lipid Profile Cholesterol',
      testName: 'Lipid Profile (Total Cholesterol / LDL)',
      testValue: 'LDL 142 mg/dL',
      referenceRange: '< 100 mg/dL',
    },
  ];

  return (
    <div className="space-y-6">
      {/* AI Showcase Banner */}
      <div className="relative overflow-hidden rounded-3xl lc-gradient-midnight text-white border border-[#A5B9FF]/35 p-6 sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #A5B9FF 0%, transparent 70%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-10 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #21D4C2 0%, transparent 70%)' }}
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A5B9FF]">
              <Sparkles className="w-4 h-4 text-[#21D4C2]" />
              <span>LabConnect Intelligence · Bilingual Educational Layer</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Understand every diagnostic marker in plain English or اردو.
            </h2>
            <p className="text-xs sm:text-sm text-[#D9E9E5]/90 max-w-2xl leading-relaxed">
              Select any published laboratory report from your Health Passport or ask about any clinical biomarker to receive structured educational explanations and physician visit preparation tips.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <div className="inline-flex items-center gap-1 bg-white/10 border border-white/20 rounded-xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setAiLang('EN')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    aiLang === 'EN' ? 'bg-[#21D4C2] text-[#172C32]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setAiLang('UR')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    aiLang === 'UR' ? 'bg-[#A5B9FF] text-[#172C32]' : 'text-white/80 hover:text-white'
                  }`}
                >
                  اردو (Urdu RTL)
                </button>
              </div>

              <span className="text-[11px] font-mono text-[#B9ED69] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Non-Diagnostic · Kept separate from signed PDF</span>
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-end">
            <div className="w-full max-w-[240px] h-36 rounded-2xl overflow-hidden border border-[#A5B9FF]/40 shadow-lg">
              {!imgFailed ? (
                <img
                  src={aiMolecularImg}
                  alt="LabConnect AI molecular diagnostic guide"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full lc-gradient-ai flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-[#21D4C2]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Panel: Saved Reports + Quick Biomarker Lookup */}
        <div className="lg:col-span-5 space-y-5">
          {/* Published Report Panel Selector */}
          <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5 space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b border-[#D9E9E5] pb-2.5">
              <span className="font-bold text-[#172C32] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#087F8C]" />
                <span>Analyze Your Published Report</span>
              </span>
              {reports.length > 0 && (
                <button
                  type="button"
                  onClick={onJumpToReports}
                  className="text-[11px] font-semibold text-[#087F8C] hover:underline"
                >
                  Open PDFs
                </button>
              )}
            </div>

            {reports.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-[#F3F7F4] border border-[#D9E9E5] text-[#556B70]">
                No released pathology reports in your Health Passport yet. You can still explore any marker below or select a catalog test.
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedReport?.id || reports[0]?.id || ''}
                  onChange={(e) => {
                    const found = reports.find((r) => r.id === e.target.value);
                    if (found) onSelectReport(found);
                  }}
                  className="w-full bg-[#F3F7F4] border border-[#C8DDD7] rounded-xl p-2.5 font-medium text-[#172C32]"
                >
                  {reports.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.bookingNumber} · {rep.familyMemberName || rep.patientName} ({rep.branchName})
                    </option>
                  ))}
                </select>

                {selectedReport && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() =>
                      runExplanation({
                        testName: `${selectedReport.bookingNumber} Full Panel`,
                        testValue: `${selectedReport.parameters.length} parameters`,
                        referenceRange: 'Verified Laboratory Reference Ranges',
                        parameters: selectedReport.parameters,
                      })
                    }
                    className="w-full py-2.5 lc-gradient-ocean hover:brightness-110 text-white rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[42px] transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-[#21D4C2]" />
                    <span>
                      {aiLang === 'UR' ? 'مکمل رپورٹ کا اردو خلاصہ دیکھیں' : 'Summarize Selected Full Panel'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Ask About Any Diagnostic Parameter */}
          <form onSubmit={handleCustomSubmit} className="bg-white border border-[#D9E9E5] rounded-2xl p-5 space-y-3.5 text-xs">
            <div className="font-bold text-[#172C32] flex items-center gap-1.5 border-b border-[#D9E9E5] pb-2.5">
              <Languages className="w-4 h-4 text-[#087F8C]" />
              <span>Explain Specific Marker or Catalog Panel</span>
            </div>

            <div>
              <label className="block font-semibold text-[#172C32] mb-1">Biomarker or Test Name</label>
              <input
                type="text"
                required
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                list="lc-catalog-test-suggestions"
                placeholder="e.g. HbA1c, Serum Creatinine, Platelets, TSH..."
                className="w-full bg-[#F3F7F4] border border-[#C8DDD7] rounded-xl p-2.5 text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white"
              />
              <datalist id="lc-catalog-test-suggestions">
                {tests.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold text-[#172C32] mb-1">Observed Value (Optional)</label>
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="e.g. 6.4%"
                  className="w-full bg-[#F3F7F4] border border-[#C8DDD7] rounded-xl p-2.5 font-mono text-[#172C32]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#172C32] mb-1">Ref Range (Optional)</label>
                <input
                  type="text"
                  value={customRef}
                  onChange={(e) => setCustomRef(e.target.value)}
                  placeholder="e.g. < 5.7%"
                  className="w-full bg-[#F3F7F4] border border-[#C8DDD7] rounded-xl p-2.5 font-mono text-[#172C32]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !customTopic.trim()}
              className="w-full py-2.5 bg-[#B9ED69] hover:brightness-105 text-[#172C32] rounded-xl font-bold flex items-center justify-center gap-2 min-h-[42px] disabled:opacity-50"
            >
              <span>Generate {aiLang === 'UR' ? 'Urdu' : 'English'} Explanation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Output Canvas: Quick Suggestion Chips + Animated AI Response Card */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5 space-y-3 text-xs">
            <div className="font-semibold text-[#556B70] uppercase tracking-wider text-[11px]">
              Quick Educational Topics
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((chip) => (
                <button
                  key={chip.testName}
                  type="button"
                  disabled={isLoading}
                  onClick={() => runExplanation(chip)}
                  className={`px-3.5 py-2 rounded-xl border border-[#C8DDD7] bg-[#F3F7F4] hover:border-[#087F8C] hover:bg-[#D9E9E5]/60 text-[#172C32] font-semibold transition-colors ${
                    aiLang === 'UR' ? 'font-urdu text-xs' : ''
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#A5B9FF]/60 rounded-2xl p-5 sm:p-6 min-h-[260px] flex flex-col justify-between space-y-4 shadow-[0_14px_34px_-16px_rgba(7,59,67,0.14)]">
            <div className="flex items-center justify-between border-b border-[#D9E9E5] pb-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#087F8C] font-semibold">
                  Educational Summary Output · {aiLang === 'UR' ? 'Urdu RTL' : 'English'}
                </div>
                <h3 className="text-base font-bold text-[#172C32] mt-0.5">
                  {activePromptTitle || 'Ready for Biomarker Context'}
                </h3>
              </div>
              {isLoading && <RotateCw className="w-4 h-4 animate-spin text-[#087F8C]" />}
            </div>

            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="ai-wave"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-8 space-y-4"
                >
                  <div className="flex items-center justify-center gap-1.5 h-8">
                    {[0, 1, 2, 3, 4].map((bar) => (
                      <motion.span
                        key={bar}
                        animate={{ height: ['8px', '28px', '8px'] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: bar * 0.12 }}
                        className="w-1.5 rounded-full bg-gradient-to-t from-[#087F8C] via-[#21D4C2] to-[#A5B9FF]"
                      />
                    ))}
                  </div>
                  <p className="text-center text-xs text-[#556B70]">
                    Synthesizing clear {aiLang === 'UR' ? 'Urdu' : 'English'} educational overview...
                  </p>
                </motion.div>
              ) : explanation ? (
                <motion.div
                  key="ai-answer"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: LC_EASE }}
                  dir={aiLang === 'UR' ? 'rtl' : 'ltr'}
                  className={`text-sm text-[#172C32] leading-relaxed bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl p-4 sm:p-5 ${
                    aiLang === 'UR' ? 'font-urdu text-base' : ''
                  }`}
                >
                  {explanation}
                </motion.div>
              ) : (
                <div className="py-8 text-center space-y-2 text-xs text-[#556B70]">
                  <p>
                    Choose a verified report from your passport, enter a marker on the left, or tap any quick topic above to view plain-language educational guidance.
                  </p>
                </div>
              )}
            </AnimatePresence>

            <div className="pt-3 border-t border-[#D9E9E5] flex items-start gap-2 text-[11px] text-[#556B70]">
              <ShieldAlert className="w-4 h-4 text-[#087F8C] shrink-0 mt-0.5" />
              <span>
                <strong>Medical Boundary:</strong> LabConnect Intelligence explains reference concepts and questions to ask your physician. It does not issue medical diagnoses and never alters verified laboratory values.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
