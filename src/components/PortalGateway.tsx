/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  DiagnosticTest,
  LahoreLaboratory,
  LaboratoryTestPricing,
  PatientPortalTab,
  PortalRoute,
} from '../types';
import { apiClient } from '../api/client';
import {
  ShieldCheck,
  ArrowRight,
  Search,
  Thermometer,
  FileText,
  Users,
  Sparkles,
  ChevronDown,
  MapPin,
  Clock,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { AnimatedTabBar, LC_EASE, SkeletonBlock } from './ui/MotionPrimitives';
import { AnimatePresence, motion } from 'motion/react';
import heroNexusImg from '../assets/images/hero_diagnostic_nexus_1795109387233.jpg';
import aiMolecularImg from '../assets/images/ai_molecular_guide_1795109387009.jpg';
import coldChainImg from '../assets/images/coldchain_capsule_transit_1795109387264.jpg';

interface PortalGatewayProps {
  onNavigate: (
    route: PortalRoute,
    options?: { searchTerm?: string; category?: string; tab?: PatientPortalTab }
  ) => void;
}

const FAQ_ITEMS = [
  {
    q: 'Are test prices on LabConnect authentic laboratory rates?',
    a: 'Yes. Every test tariff shown in Patient Marketplace is published directly from the verified Lahore partner catalog with its source reference and PHC licence status.',
  },
  {
    q: 'How does home sample collection maintain cold-chain integrity?',
    a: 'Assigned phlebotomists log vacutainer barcodes and insulated carrier box temperatures (2.0°C–8.0°C) at every checkpoint, synced live to your booking tracker.',
  },
  {
    q: 'Can I book tests for my parents or children from one account?',
    a: 'Yes. Family Health Passport lets you link dependent profiles with explicit consent logging and filter reports per household member.',
  },
  {
    q: 'How are signed PDF pathology reports verified and delivered?',
    a: 'Once the laboratory pathologist releases a report, it receives a SHA-256 checksum inside your Health Passport and is dispatched directly by the laboratory branch to your registered email.',
  },
  {
    q: 'Is LabConnect Intelligence a medical diagnosis?',
    a: 'No. LabConnect Intelligence translates parameters into plain English or Urdu educational summaries so you can prepare informed questions for your physician.',
  },
];

export const PortalGateway: React.FC<PortalGatewayProps> = ({ onNavigate }) => {
  const [heroSearch, setHeroSearch] = useState<string>('');
  const [previewTab, setPreviewTab] = useState<'COMPARE' | 'COLDCHAIN' | 'INTELLIGENCE'>('COMPARE');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [laboratories, setLaboratories] = useState<LahoreLaboratory[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [pricings, setPricings] = useState<LaboratoryTestPricing[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;
    apiClient
      .getCatalog()
      .then((res) => {
        if (mounted && res.success && res.data) {
          setLaboratories(res.data.laboratories || []);
          setTests(res.data.tests || []);
          setPricings(res.data.pricings || []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoadingCatalog(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const verifiedLabs = laboratories.filter((l) => l.verificationStatus === 'VERIFIED');
  const featuredTest = tests.find((t) => t.id === 'test-cbc') || tests[0];
  const featuredPrices = featuredTest
    ? verifiedLabs
        .map((lab) => ({
          lab,
          pricing: pricings.find((p) => p.labId === lab.id && p.testId === featuredTest.id),
        }))
        .filter((item) => item.pricing)
    : [];

  const categoryCounts = Array.from(
    tests.reduce((acc, test) => {
      acc.set(test.category, (acc.get(test.category) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  );

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('/patient', { searchTerm: heroSearch.trim(), category: 'ALL', tab: 'DISCOVER' });
  };

  return (
    <div className="space-y-16 sm:space-y-24 overflow-x-clip">
      {/* ============================================================ */}
      {/* 1. FUTURISTIC DEEP OCEAN HERO + INTERACTIVE LIVE PREVIEW      */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden lc-gradient-midnight text-white border-b border-[#087F8C]/35">
        {/* Controlled Radial Atmospheric Lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-20 w-[440px] h-[440px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #21D4C2 0%, transparent 70%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-24 w-[380px] h-[380px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #A5B9FF 0%, transparent 70%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #21D4C2 1px, transparent 1px), linear-gradient(to bottom, #21D4C2 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headline & Interactive Test Search */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: LC_EASE }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-[#21D4C2] tracking-wide uppercase">
              <ShieldCheck className="w-4 h-4 text-[#B9ED69] shrink-0" />
              <span>Lahore Verified Diagnostic Network</span>
              <span className="text-white/30" aria-hidden="true">·</span>
              <span className="text-[#D9E9E5] font-medium normal-case">PHC Regulated</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-[1.08] tracking-tight">
              Next-generation diagnostic booking across Lahore.
            </h1>

            <p className="text-sm sm:text-base text-[#D9E9E5]/90 max-w-xl leading-relaxed">
              Compare published PKR tariffs across PHC-recognized laboratories, track 2.0°C–8.0°C cold-chain sample collection live, and store signed family reports in one Health Passport.
            </p>

            {/* Primary Search Interface */}
            <form
              onSubmit={handleHeroSearch}
              className="bg-white/95 border border-[#21D4C2]/40 rounded-2xl p-2 flex flex-col sm:flex-row gap-2 shadow-[0_20px_50px_-14px_rgba(7,59,67,0.55)] focus-within:border-[#B9ED69] transition-colors"
            >
              <div className="relative flex-1 flex items-center">
                <Search className="w-4 h-4 text-[#087F8C] ml-3 shrink-0" />
                <input
                  type="text"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  placeholder="Search CBC, HbA1c, Lipid Profile, Dengue, یا ٹیسٹ..."
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-[#172C32] placeholder:text-[#556B70] focus:outline-none min-h-[44px]"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#B9ED69] hover:brightness-105 text-[#172C32] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 min-h-[44px] whitespace-nowrap transition-all active:scale-[0.98]"
              >
                <span>Compare Rates</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Interactive Search Suggestions */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#D9E9E5]/80">
              <span className="font-semibold text-white">Popular panels:</span>
              {['CBC', 'HbA1c', 'Lipid', 'Vitamin D', 'Thyroid'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onNavigate('/patient', { searchTerm: term, category: 'ALL', tab: 'DISCOVER' })}
                  className="font-medium text-[#21D4C2] hover:text-[#B9ED69] underline underline-offset-4 decoration-white/25 hover:decoration-[#B9ED69] transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('/patient', { tab: 'DISCOVER' })}
                className="px-5 py-3 lc-gradient-aqua hover:brightness-105 text-[#172C32] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 min-h-[44px] transition-all active:scale-[0.98]"
              >
                <span>Open Patient Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/patient', { tab: 'TRACKING' })}
                className="px-5 py-3 bg-white/10 hover:bg-white/18 text-white border border-white/20 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 min-h-[44px] transition-colors"
              >
                <MapPin className="w-4 h-4 text-[#21D4C2]" />
                <span>Track Live Sample</span>
              </button>
            </div>
          </motion.div>

          {/* Right Column: Visual Clinical Showcase + Live Interactive Preview */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08, ease: LC_EASE }}
            className="lg:col-span-6 space-y-4"
          >
            {/* Clinical Visual Frame */}
            <div className="relative h-44 sm:h-52 rounded-2xl overflow-hidden border border-white/20 shadow-xl">
              {!imgErrors.hero ? (
                <img
                  src={heroNexusImg}
                  alt="LabConnect Lahore modern diagnostic laboratory capsule"
                  referrerPolicy="no-referrer"
                  onError={() => setImgErrors((prev) => ({ ...prev, hero: true }))}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full lc-gradient-ocean" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#073B43]/95 via-[#073B43]/65 to-[#073B43]/15" />
              <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#21D4C2] drop-shadow-xs">
                    Lahore Clinical Telemetry
                  </div>
                  <div className="text-sm sm:text-base font-bold text-white drop-shadow-xs">
                    Verified PKR Tariffs · 2.0°C–8.0°C Transit · Signed PDFs
                  </div>
                </div>
                <span className="font-mono text-xs font-bold text-[#B9ED69] shrink-0">
                  {verifiedLabs.length} Labs Active
                </span>
              </div>
            </div>

            {/* Interactive Live Product Switcher */}
            <div className="bg-[#F3F7F4] text-[#172C32] border border-[#D9E9E5] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <AnimatedTabBar
                  layoutId="hero-preview-tab"
                  activeId={previewTab}
                  onChange={setPreviewTab}
                  items={[
                    { id: 'COMPARE', label: 'Live Tariffs' },
                    { id: 'COLDCHAIN', label: '2–8°C Cold Chain' },
                    { id: 'INTELLIGENCE', label: 'EN / اردو AI' },
                  ]}
                />
                <span className="text-[11px] font-mono text-[#087F8C] font-semibold">Live Network</span>
              </div>

              <AnimatePresence mode="wait">
                {previewTab === 'COMPARE' && (
                  <motion.div
                    key="COMPARE"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: LC_EASE }}
                    className="bg-white border border-[#D9E9E5] rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#D9E9E5] pb-2.5">
                      <div>
                        <div className="text-[11px] font-mono text-[#556B70] uppercase">
                          Published PKR Comparison · {featuredTest?.code || 'CBC'}
                        </div>
                        <div className="text-sm font-bold text-[#172C32]">
                          {featuredTest?.name || 'Complete Blood Count (CBC)'}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[#087F8C]">
                        {verifiedLabs.length} Verified Labs
                      </span>
                    </div>

                    {isLoadingCatalog ? (
                      <div className="space-y-2 py-1">
                        <SkeletonBlock className="h-10 w-full rounded-lg" />
                        <SkeletonBlock className="h-10 w-full rounded-lg" />
                        <SkeletonBlock className="h-10 w-full rounded-lg" />
                      </div>
                    ) : featuredPrices.length > 0 ? (
                      <div className="divide-y divide-[#D9E9E5]">
                        {featuredPrices.slice(0, 3).map(({ lab, pricing }) => (
                          <div key={lab.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <div className="font-semibold text-[#172C32] truncate">{lab.name}</div>
                              <div className="text-[11px] text-[#556B70] font-mono">
                                {lab.phcLicence} · TAT {pricing!.statedTurnaroundHours}h
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-mono font-bold text-[#073B43] tabular-nums">
                                PKR {(pricing!.discountedPricePkr ?? pricing!.pricePkr).toLocaleString()}
                              </div>
                              <div className="text-[10px] text-[#556B70]">
                                Home:{' '}
                                {lab.branches[0]?.homeCollectionFeePkr === 0
                                  ? 'FREE'
                                  : `PKR ${lab.branches[0]?.homeCollectionFeePkr ?? 0}`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-5 text-center text-xs text-[#556B70]">
                        Open Patient Marketplace to view live catalog rates.
                      </div>
                    )}
                  </motion.div>
                )}

                {previewTab === 'COLDCHAIN' && (
                  <motion.div
                    key="COLDCHAIN"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: LC_EASE }}
                    className="bg-white border border-[#D9E9E5] rounded-xl p-4 space-y-3 text-xs"
                  >
                    <div className="flex items-center gap-3.5 border-b border-[#D9E9E5] pb-3">
                      {!imgErrors.cold ? (
                        <img
                          src={coldChainImg}
                          alt="2-8C insulated transport capsule"
                          referrerPolicy="no-referrer"
                          onError={() => setImgErrors((prev) => ({ ...prev, cold: true }))}
                          className="w-16 h-12 rounded-lg object-cover shrink-0 border border-[#D9E9E5]"
                        />
                      ) : (
                        <div className="w-16 h-12 rounded-lg bg-[#D9E9E5] flex items-center justify-center shrink-0">
                          <Thermometer className="w-5 h-5 text-[#073B43]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-mono text-[#087F8C] uppercase">
                          Cold-Chain Specimen Tracking
                        </div>
                        <div className="text-sm font-bold text-[#172C32]">
                          2.0°C – 8.0°C Barcode Telemetry
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { stage: '01', title: 'Slot Confirmed', meta: 'Branch & Lahore area locked' },
                        { stage: '02', title: 'Rider CNIC Verified', meta: '3-factor dispatch audit' },
                        { stage: '03', title: 'Thermal Sensor Active', meta: 'Gel carrier logged live' },
                        { stage: '04', title: 'Lab Desk Accession', meta: 'Pathologist PDF signing' },
                      ].map((row) => (
                        <div key={row.stage} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#F3F7F4]">
                          <span className="font-mono text-[11px] font-bold text-[#087F8C] mt-0.5">{row.stage}</span>
                          <div>
                            <div className="font-semibold text-[#172C32]">{row.title}</div>
                            <div className="text-[11px] text-[#556B70]">{row.meta}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {previewTab === 'INTELLIGENCE' && (
                  <motion.div
                    key="INTELLIGENCE"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: LC_EASE }}
                    className="bg-white border border-[#D9E9E5] rounded-xl p-4 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#D9E9E5] pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#087F8C]" />
                        <span className="font-bold text-[#172C32] text-sm">LabConnect Intelligence</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#087F8C] font-semibold">English + اردو</span>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl lc-gradient-ai border border-[#A5B9FF]/50">
                      {!imgErrors.ai ? (
                        <img
                          src={aiMolecularImg}
                          alt="Molecular educational AI visualization"
                          referrerPolicy="no-referrer"
                          onError={() => setImgErrors((prev) => ({ ...prev, ai: true }))}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#A5B9FF]/40 flex items-center justify-center shrink-0">
                          <Sparkles className="w-5 h-5 text-[#073B43]" />
                        </div>
                      )}
                      <div className="space-y-1 min-w-0">
                        <div className="font-bold text-[#073B43]">Plain-Language Parameter Translation</div>
                        <p className="text-[#172C32] leading-relaxed">
                          Explains flagged markers and reference ranges clearly in English or Urdu—kept strictly separate from signed lab reports.
                        </p>
                      </div>
                    </div>

                    <p className="font-urdu text-right text-[#073B43] text-xs px-1" dir="rtl">
                      لیبارٹری رپورٹ کے نتائج کو سادہ اردو اور انگریزی میں سمجھنے کے لیے رہنمائی۔
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. POPULAR DIAGNOSTIC TEST CATEGORIES                        */}
      {/* ============================================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#087F8C]">
              Test Discovery
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172C32] mt-1">
              Browse diagnostic panels by specialty
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/patient', { category: 'ALL', searchTerm: '' })}
            className="text-xs font-semibold text-[#073B43] hover:text-[#087F8C] flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View all {tests.length} diagnostic tests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {(categoryCounts.length > 0
            ? categoryCounts
            : ([
                ['HEMATOLOGY', 2],
                ['ENDOCRINOLOGY', 2],
                ['CARDIOLOGY', 1],
                ['BIOCHEMISTRY', 2],
                ['VITAMINS', 1],
                ['INFECTIOUS_DISEASE', 2],
              ] as [string, number][])
          ).map(([cat, count]) => (
            <button
              key={cat}
              type="button"
              onClick={() => onNavigate('/patient', { category: cat, searchTerm: '', tab: 'DISCOVER' })}
              className="group bg-white border border-[#D9E9E5] hover:border-[#087F8C] rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(8,127,140,0.28)] space-y-2"
            >
              <div className="text-xs font-bold text-[#172C32] group-hover:text-[#087F8C] transition-colors">
                {cat.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#556B70] font-mono tabular-nums">
                <span>{count} panels</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#087F8C]" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. HOW LABCONNECT WORKS + HOME COLLECTION COLD-CHAIN         */}
      {/* ============================================================ */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#087F8C]">
            End-to-End Diagnostic Journey
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172C32] mt-1">
            Transparent pricing, verified sampling, and signed results.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: '01',
              title: 'Compare Published Rates',
              desc: 'Inspect authentic PKR test fees, home sampling charges, and published turnaround hours side by side before booking.',
              icon: <Search className="w-4 h-4 text-[#073B43]" />,
              accentBg: 'bg-[#D9E9E5]',
            },
            {
              step: '02',
              title: 'Home Visit or Branch Walk-In',
              desc: 'Select an exact Lahore branch, choose a time window, and acknowledge any fasting guidance up front.',
              icon: <Clock className="w-4 h-4 text-[#073B43]" />,
              accentBg: 'bg-[#21D4C2]/25',
            },
            {
              step: '03',
              title: '2.0°C–8.0°C Cold-Chain Pickup',
              desc: 'Verified phlebotomists record vacutainer barcodes and insulated box temperatures at each transit checkpoint.',
              icon: <Thermometer className="w-4 h-4 text-[#172C32]" />,
              accentBg: 'bg-[#B9ED69]/55',
            },
            {
              step: '04',
              title: 'Signed PDF & Health Passport',
              desc: 'Pathologist-signed PDF reports arrive via lab email dispatch and remain archived per family profile.',
              icon: <FileText className="w-4 h-4 text-[#073B43]" />,
              accentBg: 'bg-[#A5B9FF]/40',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="bg-white border border-[#D9E9E5] rounded-2xl p-6 space-y-3 flex flex-col justify-between transition-shadow hover:shadow-[0_14px_32px_-16px_rgba(7,59,67,0.16)]"
            >
              <div className="flex items-center justify-between">
                <span className={`w-10 h-10 rounded-xl ${item.accentBg} flex items-center justify-center`}>
                  {item.icon}
                </span>
                <span className="font-mono text-xs font-bold text-[#087F8C]">{item.step}</span>
              </div>
              <div className="space-y-1.5 pt-2">
                <h3 className="text-base font-bold text-[#172C32]">{item.title}</h3>
                <p className="text-xs text-[#556B70] leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. FAMILY PASSPORT + INTELLIGENCE SHOWCASE                   */}
      {/* ============================================================ */}
      <section id="passport" className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#D9E9E5] rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="w-11 h-11 rounded-xl bg-[#D9E9E5] text-[#073B43] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-[#172C32]">Family Health Passport</h3>
          <p className="text-xs sm:text-sm text-[#556B70] leading-relaxed">
            Book tests for parents, spouse, or dependents under one mobile OTP account with logged consent timestamps, blood group metadata, and household report filtering.
          </p>
          <div className="pt-3 border-t border-[#D9E9E5] flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#172C32] font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#087F8C]" /> Consent Audit Logged
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#087F8C]" /> SHA-256 Signed PDFs
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#A5B9FF]/60 rounded-2xl p-6 sm:p-8 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="w-11 h-11 rounded-xl lc-gradient-ai border border-[#A5B9FF]/50 text-[#073B43] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#087F8C]" />
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/patient', { tab: 'INTELLIGENCE' })}
              className="text-xs font-bold text-[#073B43] hover:text-[#087F8C] inline-flex items-center gap-1"
            >
              <span>Open AI Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <h3 className="text-xl font-bold text-[#172C32]">Bilingual LabConnect Intelligence</h3>
          <p className="text-xs sm:text-sm text-[#556B70] leading-relaxed">
            Request plain-language English or Urdu (اردو) educational context for individual test parameters or full panels—strictly separated from verified laboratory data.
          </p>
          <div className="pt-3 border-t border-[#D9E9E5] flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#172C32] font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#087F8C]" /> English &amp; Urdu RTL Support
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#087F8C]" /> Non-Diagnostic Awareness Layer
            </span>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. VERIFIED LAHORE PARTNER LABORATORIES                      */}
      {/* ============================================================ */}
      <section id="partners" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#087F8C]">
              PHC Verification Registry
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172C32] mt-1">
              Active partner laboratories in Lahore
            </h2>
          </div>
          <span className="text-xs text-[#556B70]">
            Revoked or unverified centres are automatically blocked from patient booking.
          </span>
        </div>

        {isLoadingCatalog ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-[#D9E9E5] rounded-2xl p-5 space-y-3">
                <SkeletonBlock className="h-5 w-3/4 rounded" />
                <SkeletonBlock className="h-3 w-1/2 rounded" />
                <SkeletonBlock className="h-10 w-full rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {verifiedLabs.map((lab) => (
              <div
                key={lab.id}
                className="bg-white border border-[#D9E9E5] rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-[#087F8C] transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#087F8C]">
                    <span>{lab.phcLicence}</span>
                    <span className="text-[#073B43] font-semibold">Verified</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172C32]">{lab.name}</h3>
                  <p className="text-xs text-[#556B70] line-clamp-2 leading-relaxed">{lab.tagline}</p>
                </div>
                <div className="pt-3 border-t border-[#D9E9E5] flex items-center justify-between text-xs">
                  <span className="text-[#556B70]">{lab.branches.length} Lahore branch(es)</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('/patient', { tab: 'DISCOVER' })}
                    className="font-bold text-[#073B43] hover:text-[#087F8C] inline-flex items-center gap-1"
                  >
                    <span>Rates</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/* 6. FREQUENTLY ASKED QUESTIONS                                */}
      {/* ============================================================ */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#087F8C]">
            Patient &amp; Clinical Clarity
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172C32]">Frequently asked questions</h2>
        </div>

        <div className="bg-white border border-[#D9E9E5] rounded-2xl divide-y divide-[#D9E9E5] overflow-hidden">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full px-5 sm:px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-[#F3F7F4]/70 transition-colors"
                >
                  <span className="text-sm font-semibold text-[#172C32]">{item.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#556B70] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#087F8C]' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: LC_EASE }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 sm:px-6 pb-4 text-xs sm:text-sm text-[#556B70] leading-relaxed">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
