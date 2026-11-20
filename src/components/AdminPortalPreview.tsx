/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LahoreLaboratory,
  EmailDispatchLog,
  AuditLogEntry,
  SettlementPayoutRecord,
  LabSubscriptionTier,
  LabReviewRecord,
  UserRole,
} from '../types';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  RotateCw,
  Mail,
  Download,
  Trash2,
  Plus,
  Building2,
  Wallet,
  Users,
  FileSearch,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  EyeOff,
  Loader2,
  User,
  MapPin,
  BarChart3,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { AnimatedTabBar, LC_EASE } from './ui/MotionPrimitives';
import { PortalAuthShell, AuthErrorBanner, AuthSessionLoader } from './ui/PortalAuthShell';
import {
  AnimatedBarChart,
  KpiMetricCard,
  RadialGaugeRing,
  SlideOverDrawer,
  ToastBanner,
} from './ui/DataVisuals';
import { AnimatePresence, motion } from 'motion/react';
import heroNexusImg from '../assets/images/hero_diagnostic_nexus_1795109387233.jpg';

interface AdminAccountSummary {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  staffCode?: string;
  labId?: string;
  branchId?: string;
  area: string;
  createdAt: string;
}

interface SettlementRow {
  labId: string;
  labName: string;
  phcLicence: string;
  verificationStatus: string;
  subscriptionTier: LabSubscriptionTier;
  monthlySaasFeePkr: number;
  bookingsCount: number;
  completedCount: number;
  grossPkr: number;
  commissionPkr: number;
  netPayablePkr: number;
  unsettledCount: number;
  unsettledNetPkr: number;
}

export const AdminPortalPreview: React.FC = () => {
  const { authReady, adminUser, loginAdmin, setupAdmin } = useAuth();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [setupName, setSetupName] = useState<string>('');
  const [setupRequired, setSetupRequired] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SETUP'>('SIGN_IN');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    'PHC_VERIFICATION' | 'COMMISSION_LEDGER' | 'EMAIL_DISPATCH' | 'ACCOUNTS_REVIEWS' | 'AUDIT_LOGS'
  >('PHC_VERIFICATION');
  const [laboratories, setLaboratories] = useState<LahoreLaboratory[]>([]);
  const [inspectedLab, setInspectedLab] = useState<LahoreLaboratory | null>(null);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [settlementHistory, setSettlementHistory] = useState<SettlementPayoutRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailDispatchLog[]>([]);
  const [adminUsersList, setAdminUsersList] = useState<AdminAccountSummary[]>([]);
  const [reviewsList, setReviewsList] = useState<LabReviewRecord[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showAddLabForm, setShowAddLabForm] = useState<boolean>(false);
  const [newLabName, setNewLabName] = useState<string>('');
  const [newLabPhc, setNewLabPhc] = useState<string>('');
  const [newLabTier, setNewLabTier] = useState<LabSubscriptionTier>('GROWTH');
  const [newLabEmail, setNewLabEmail] = useState<string>('');
  const [newLabPhone, setNewLabPhone] = useState<string>('');
  const [newLabHqName, setNewLabHqName] = useState<string>('');
  const [newLabHqArea, setNewLabHqArea] = useState<string>('Gulberg III');
  const [newLabHqAddress, setNewLabHqAddress] = useState<string>('');
  const [newLabHqFee, setNewLabHqFee] = useState<string>('0');
  const [isCreatingLab, setIsCreatingLab] = useState<boolean>(false);
  const [securityStatus, setSecurityStatus] = useState<Record<string, string>>({});
  const [lahoreCoverage, setLahoreCoverage] = useState<{
    verifiedLabsCount: number;
    totalLabsCount: number;
    totalBranchesCount: number;
    coveredAreas: string[];
    verifiedTestsCount: number;
    verifiedTariffsCount: number;
    envHygiene?: { hasAuthSecretEnv: boolean; hasGeminiKey: boolean; hasSmtpConfigured: boolean };
  } | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    totalBookings: number;
    totalReports: number;
    totalEmailsSent: number;
    grossVolumePkr: number;
    totalCommissionPkr: number;
    totalSaasMrrPkr?: number;
  }>({
    totalBookings: 0,
    totalReports: 0,
    totalEmailsSent: 0,
    grossVolumePkr: 0,
    totalCommissionPkr: 0,
    totalSaasMrrPkr: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchOverview = useCallback(async () => {
    if (!adminUser) return;
    setIsLoading(true);
    try {
      const [res, usersRes, revRes] = await Promise.all([
        apiClient.getAdminOverview(),
        apiClient.getAdminUsers(),
        apiClient.getReviews(),
      ]);
      if (res.success && res.data) {
        setLaboratories(res.data.laboratories || []);
        setSettlements(res.data.settlements || []);
        setSettlementHistory(res.data.settlementHistory || []);
        setAuditLogs(res.data.auditLogs || []);
        setEmailLogs(res.data.emailLogs || []);
        if (res.data.securityStatus) setSecurityStatus(res.data.securityStatus);
        if (res.data.lahoreCoverage) setLahoreCoverage(res.data.lahoreCoverage);
        if (res.data.metrics) setMetrics(res.data.metrics);
      }
      if (usersRes.success && Array.isArray(usersRes.data)) {
        setAdminUsersList(usersRes.data);
      }
      if (revRes.success && Array.isArray(revRes.data)) {
        setReviewsList(revRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch admin overview:', err);
    } finally {
      setIsLoading(false);
    }
  }, [adminUser]);

  useEffect(() => {
    if (adminUser) {
      fetchOverview();
    } else {
      apiClient
        .getAdminStatus()
        .then((res) => {
          if (res.success && res.setupRequired) {
            setSetupRequired(true);
            setAuthMode('SETUP');
          } else {
            setSetupRequired(false);
            setAuthMode('SIGN_IN');
          }
        })
        .catch(() => {});
    }
  }, [adminUser, fetchOverview]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    const res =
      authMode === 'SETUP'
        ? await setupAdmin(setupName.trim(), email.trim(), password)
        : await loginAdmin(email.trim(), password);
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Access denied');
    }
  };

  const handleToggleVerification = async (labId: string) => {
    setActionMsg(null);
    setActionError(null);
    const res = await apiClient.toggleLabVerification(labId);
    if (res.success) {
      setActionMsg('PHC licence status updated and reflected across Marketplace.');
      fetchOverview();
    } else {
      setActionError(res.error || 'Unable to update PHC verification status');
    }
  };

  const handleUpdateTier = async (labId: string, tier: LabSubscriptionTier) => {
    const res = await apiClient.updateLabSubscription(labId, tier);
    if (res.success) {
      setActionMsg(`Updated SaaS subscription tier to ${tier}.`);
      fetchOverview();
    }
  };

  const handleSettlePayout = async (labId: string) => {
    setActionMsg(null);
    setActionError(null);
    const res = await apiClient.settleLabPayout(labId, false);
    if (res.success) {
      setActionMsg(res.message || 'Settlement recorded');
      fetchOverview();
    } else {
      setActionError(res.error || 'Unable to settle payout');
    }
  };

  const handleDeleteLab = async (labId: string) => {
    setActionMsg(null);
    setActionError(null);
    const res = await apiClient.deleteLab(labId);
    setPendingDeleteId(null);
    if (res.success) {
      setActionMsg(res.message || 'Laboratory removed');
      fetchOverview();
    } else {
      setActionError(res.error || 'Unable to remove laboratory');
    }
  };

  const handleDeleteAccount = async (userId: string) => {
    setActionMsg(null);
    setActionError(null);
    const res = await apiClient.deleteAdminUser(userId);
    setPendingDeleteId(null);
    if (res.success) {
      setActionMsg(res.message || 'Account deleted');
      fetchOverview();
    } else {
      setActionError(res.error || 'Unable to delete account');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setActionMsg(null);
    setActionError(null);
    const res = await apiClient.deleteReview(reviewId, 'admin');
    setPendingDeleteId(null);
    if (res.success) {
      setActionMsg('Moderated patient review removed');
      fetchOverview();
    } else {
      setActionError(res.error || 'Unable to remove review');
    }
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(null);
    setActionError(null);
    setIsCreatingLab(true);
    try {
      const res = await apiClient.createAdminLab({
        name: newLabName.trim(),
        phcLicence: newLabPhc.trim(),
        subscriptionTier: newLabTier,
        contactEmail: newLabEmail.trim() || undefined,
        contactPhone: newLabPhone.trim() || undefined,
        hqBranchName: newLabHqName.trim() || `${newLabName.trim()} Main HQ`,
        hqArea: newLabHqArea.trim(),
        hqAddress: newLabHqAddress.trim(),
        hqHomeCollectionFeePkr: Number(newLabHqFee || 0),
      });
      if (res.success) {
        setActionMsg(`Onboarded PHC laboratory ${res.data?.name || newLabName.trim()}.`);
        setNewLabName('');
        setNewLabPhc('');
        setNewLabEmail('');
        setNewLabPhone('');
        setNewLabHqName('');
        setNewLabHqAddress('');
        setNewLabHqFee('0');
        setShowAddLabForm(false);
        fetchOverview();
      } else {
        setActionError(res.error || 'Unable to onboard laboratory');
      }
    } catch {
      setActionError('Network error onboarding laboratory');
    } finally {
      setIsCreatingLab(false);
    }
  };

  const settlementChartData = useMemo(
    () =>
      settlements.map((row, idx) => ({
        label: row.labName.split(' ').slice(0, 2).join(' '),
        value: row.grossPkr,
        hint: `${row.bookingsCount} orders`,
        accent: idx === 0 ? ('lime' as const) : idx % 2 === 0 ? ('teal' as const) : ('periwinkle' as const),
      })),
    [settlements]
  );

  const verifiedCount = useMemo(
    () => laboratories.filter((l) => l.verificationStatus === 'VERIFIED').length,
    [laboratories]
  );
  const verifiedPct = laboratories.length > 0 ? Math.round((verifiedCount / laboratories.length) * 100) : 0;

  if (!authReady) {
    return <AuthSessionLoader label="Verifying PHC Regulatory session..." />;
  }

  if (!adminUser) {
    return (
      <PortalAuthShell
        portalTag="PHC Regulatory & Admin Console"
        headline="Punjab Healthcare Commission Oversight"
        subheadline="Restricted governance portal for verifying Lahore diagnostic licences, auditing 8% marketplace settlements, moderating user accounts, and inspecting compliance trails."
        icon={<ShieldCheck className="w-4 h-4" />}
        visualImageUrl={heroNexusImg}
        visualImageAlt="Punjab Healthcare oversight diagnostic governance terminal"
        highlights={[
          {
            label: 'PHC Licence Authority',
            value: 'Verify or Revoke Lab Status',
            meta: 'Live Gate',
            icon: <Building2 className="w-4 h-4" />,
          },
          {
            label: 'Commission Ledger',
            value: '8% Settlement & SaaS MRR',
            meta: 'PKR Audit',
            icon: <Wallet className="w-4 h-4" />,
          },
          {
            label: 'Regulatory Trail',
            value: 'Append-Only Audit & Snapshots',
            meta: 'SHA-256',
            icon: <FileSearch className="w-4 h-4" />,
          },
        ]}
        checklist={[
          'Restricted strictly to authorized PHC & Platform Administrators',
          'Verified institutional session required for all regulatory actions',
          'Full audit trail maintained for Punjab Healthcare inspections',
        ]}
        footerNote="Punjab Healthcare Regulatory Governance"
      >
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#087F8C]">
            Governance Authentication
          </span>
          <h2 className="text-2xl font-extrabold text-[#172C32] tracking-tight">
            {authMode === 'SETUP' ? 'Initialize Super Admin' : 'Admin & Inspector Sign In'}
          </h2>
          <p className="text-xs text-[#556B70]">
            {authMode === 'SETUP'
              ? 'One-time bootstrap for the primary regulatory Super Admin account.'
              : 'Enter your official institutional email and regulatory password.'}
          </p>
        </div>

        {setupRequired && (
          <AnimatedTabBar
            layoutId="admin-auth-tab"
            activeId={authMode}
            onChange={(m) => {
              setAuthMode(m);
              setLoginError(null);
            }}
            className="w-full grid grid-cols-2"
            items={[
              { id: 'SIGN_IN', label: 'Sign In' },
              { id: 'SETUP', label: 'Initial Setup' },
            ]}
          />
        )}

        <AuthErrorBanner message={loginError} />

        <AnimatePresence mode="wait">
          <motion.form
            key={authMode}
            initial={{ opacity: 0, x: authMode === 'SIGN_IN' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: authMode === 'SIGN_IN' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            onSubmit={handleAdminSignIn}
            className="space-y-4 text-xs"
          >
            {authMode === 'SETUP' && (
              <div>
                <label className="block font-semibold text-[#172C32] mb-1.5">Administrator Full Name</label>
                <div className="flex items-center bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white transition-all">
                  <User className="w-4 h-4 text-[#087F8C] shrink-0" />
                  <input
                    type="text"
                    required
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    placeholder="Dr. Tariq Mahmood"
                    className="w-full bg-transparent px-2.5 py-2.5 text-[#172C32] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#172C32] mb-1.5">Regulatory Email</label>
              <div className="flex items-center bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white transition-all">
                <Mail className="w-4 h-4 text-[#087F8C] shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="regulatory@institution.pk"
                  className="w-full bg-transparent px-2.5 py-2.5 text-[#172C32] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#172C32] mb-1.5">
                {authMode === 'SETUP' ? 'Create Strong Password (min 8 chars)' : 'Admin Password'}
              </label>
              <div className="flex items-center bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white transition-all">
                <Lock className="w-4 h-4 text-[#087F8C] shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent px-2.5 py-2.5 font-mono text-[#172C32] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-[#556B70] hover:text-[#172C32] p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoggingIn}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              className="w-full py-3 bg-[#B9ED69] hover:brightness-95 text-[#172C32] rounded-xl font-bold min-h-[46px] flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-xs"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              <span>
                {isLoggingIn
                  ? 'Verifying Credentials...'
                  : authMode === 'SETUP'
                  ? 'Initialize Super Admin Account'
                  : 'Sign In to Admin Console'}
              </span>
            </motion.button>
          </motion.form>
        </AnimatePresence>

        <div className="pt-3 border-t border-[#D9E9E5] text-[11px] text-[#556B70]">
          Access is restricted strictly to authorized Punjab Healthcare regulatory and platform administrators.
        </div>
      </PortalAuthShell>
    );
  }

  const navItems: { id: typeof activeTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'PHC_VERIFICATION', label: 'PHC Licences', icon: <Building2 className="w-4 h-4" />, count: laboratories.length },
    { id: 'COMMISSION_LEDGER', label: 'Settlements', icon: <Wallet className="w-4 h-4" />, count: settlements.length },
    { id: 'EMAIL_DISPATCH', label: 'Emails', icon: <Mail className="w-4 h-4" />, count: emailLogs.length },
    { id: 'ACCOUNTS_REVIEWS', label: 'Accounts', icon: <Users className="w-4 h-4" />, count: adminUsersList.length },
    { id: 'AUDIT_LOGS', label: 'Audit Trail', icon: <FileSearch className="w-4 h-4" />, count: auditLogs.length },
  ];

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Collapsible Midnight-Ocean Governance Sidebar */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 74 : 252 }}
          transition={{ duration: 0.22, ease: LC_EASE }}
          className="hidden lg:flex flex-col shrink-0 lc-gradient-midnight text-white rounded-3xl p-3.5 space-y-5 sticky top-20 overflow-hidden shadow-[0_24px_60px_-24px_rgba(7,59,67,0.45)]"
        >
          <div className="flex items-center justify-between px-1.5 pt-1">
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-[#21D4C2] truncate">
                  {adminUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'PHC Inspector'}
                </div>
                <div className="text-sm font-bold text-white truncate">PHC Division</div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-2 rounded-xl text-[#D9E9E5] hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-[#172C32] font-bold'
                      : 'text-[#D9E9E5]/80 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="admin-sidebar-active"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-[#21D4C2] rounded-xl shadow-xs"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5 min-w-0">
                    {item.icon}
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </span>
                  {!sidebarCollapsed && typeof item.count === 'number' && (
                    <span
                      className={`relative z-10 font-mono text-[11px] tabular-nums ${
                        isActive ? 'text-[#073B43] font-bold' : 'text-[#D9E9E5]/70'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {!sidebarCollapsed && (
            <div className="pt-4 border-t border-white/15 px-2 space-y-1 text-[11px] text-[#D9E9E5]/80">
              <div className="font-semibold text-white truncate">{adminUser.name}</div>
              <div className="font-mono text-[#B9ED69] truncate">
                {verifiedCount}/{laboratories.length} Labs PHC Active
              </div>
            </div>
          )}
        </motion.aside>

        {/* Main Governance Content */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Header Bar */}
          <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-[#087F8C] uppercase tracking-wider">
                {adminUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'PHC Inspector'} · Punjab Healthcare Commission Division
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#172C32] tracking-tight">
                Governance, Licencing &amp; Live Audit Ledger
              </h1>
              <p className="text-xs text-[#556B70] mt-0.5">
                Platform totals computed dynamically from runtime bookings, reports, and email logs.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchOverview}
              className="px-4 py-2.5 bg-[#073B43] hover:bg-[#087F8C] text-white rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-center min-h-[42px] transition-colors shrink-0"
              title="Refresh live data"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Registry</span>
            </button>
          </div>

          {/* Mobile/Tablet Tab Navigation */}
          <div className="lg:hidden">
            <AnimatedTabBar
              layoutId="admin-mobile-tabs"
              activeId={activeTab}
              onChange={setActiveTab}
              items={navItems.map((n) => ({ id: n.id, label: n.label, count: n.count }))}
            />
          </div>

          {/* 4-Column Ecosystem KPI Bento Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiMetricCard
              label="Live Gross Volume"
              value={metrics.grossVolumePkr}
              prefix="PKR "
              meta={`${metrics.totalBookings} total marketplace orders`}
              icon={<BarChart3 className="w-4 h-4" />}
              tone="ocean"
            />
            <KpiMetricCard
              label="Commission (8%)"
              value={metrics.totalCommissionPkr}
              prefix="PKR "
              meta="Calculated from verified orders"
              icon={<Wallet className="w-4 h-4" />}
              tone="lime"
            />
            <KpiMetricCard
              label="Monthly SaaS MRR"
              value={metrics.totalSaasMrrPkr || 0}
              prefix="PKR "
              meta={`${laboratories.length} accredited lab networks`}
              icon={<Building2 className="w-4 h-4" />}
              tone="teal"
            />
            <KpiMetricCard
              label="Published PDF Reports"
              value={metrics.totalReports}
              meta={`${metrics.totalEmailsSent} signed emails dispatched`}
              icon={<FileText className="w-4 h-4" />}
              tone="periwinkle"
            />
          </div>

          <ToastBanner message={actionMsg} variant="success" onDismiss={() => setActionMsg(null)} />
          <ToastBanner message={actionError} variant="warning" onDismiss={() => setActionError(null)} />

          <AnimatePresence mode="wait">
            {activeTab === 'PHC_VERIFICATION' && (
              <motion.div
                key="ADMIN_PHC"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="bg-white border border-[#D9E9E5] rounded-2xl overflow-hidden"
              >
                <div className="p-5 bg-[#F3F7F4] border-b border-[#D9E9E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#172C32] uppercase tracking-wider block">
                      Lahore Accredited Laboratories ({laboratories.length})
                    </span>
                    <span className="text-[11px] text-[#556B70]">
                      Revoking a lab&apos;s PHC licence immediately disables patient booking across Marketplace &amp; API.
                    </span>
                  </div>
                  {adminUser.role === 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      onClick={() => setShowAddLabForm((prev) => !prev)}
                      className="px-4 py-2.5 bg-[#B9ED69] hover:brightness-95 text-[#172C32] rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-center shrink-0 min-h-[40px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddLabForm ? 'Close Onboarding Form' : 'Onboard New Lab'}</span>
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showAddLabForm && adminUser.role === 'SUPER_ADMIN' && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: LC_EASE }}
                      onSubmit={handleCreateLab}
                      className="overflow-hidden border-b border-[#D9E9E5] bg-[#F3F7F4]"
                    >
                      <div className="p-5 space-y-4 text-xs">
                        <div className="font-bold text-[#172C32] uppercase tracking-wider">
                          Register New PHC-Licensed Lahore Laboratory &amp; HQ Branch
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">Laboratory Name *</label>
                            <input
                              type="text"
                              required
                              value={newLabName}
                              onChange={(e) => setNewLabName(e.target.value)}
                              placeholder="Lahore Diagnostics Centre"
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">PHC Licence Number *</label>
                            <input
                              type="text"
                              required
                              value={newLabPhc}
                              onChange={(e) => setNewLabPhc(e.target.value)}
                              placeholder="PHC-REG-LHR-2026-099"
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">SaaS Plan Tier</label>
                            <select
                              value={newLabTier}
                              onChange={(e) => setNewLabTier(e.target.value as LabSubscriptionTier)}
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                            >
                              <option value="STARTER">Starter (PKR 0/mo)</option>
                              <option value="GROWTH">Growth (PKR 18,500/mo)</option>
                              <option value="ENTERPRISE">Enterprise (PKR 45,000/mo)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">HQ Branch Name *</label>
                            <input
                              type="text"
                              required
                              value={newLabHqName}
                              onChange={(e) => setNewLabHqName(e.target.value)}
                              placeholder="Main Jail Road Flagship"
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">HQ Lahore Area *</label>
                            <input
                              type="text"
                              required
                              value={newLabHqArea}
                              onChange={(e) => setNewLabHqArea(e.target.value)}
                              placeholder="Gulberg III / DHA Phase 5"
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">HQ Street Address *</label>
                            <input
                              type="text"
                              required
                              value={newLabHqAddress}
                              onChange={(e) => setNewLabHqAddress(e.target.value)}
                              placeholder="14-A Main Boulevard, Gulberg III, Lahore"
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">Official Contact Email</label>
                            <input
                              type="email"
                              value={newLabEmail}
                              onChange={(e) => setNewLabEmail(e.target.value)}
                              placeholder="compliance@lab.pk"
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">Helpline Phone (+92)</label>
                            <input
                              type="text"
                              value={newLabPhone}
                              onChange={(e) => setNewLabPhone(e.target.value)}
                              placeholder="+92 42 111 XXX XXX"
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">HQ Home Sampling Fee (PKR)</label>
                            <input
                              type="number"
                              min={0}
                              max={5000}
                              value={newLabHqFee}
                              onChange={(e) => setNewLabHqFee(e.target.value)}
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={isCreatingLab}
                            className="px-4 py-2.5 bg-[#073B43] hover:bg-[#087F8C] text-white rounded-xl font-bold min-h-[40px]"
                          >
                            {isCreatingLab ? 'Onboarding...' : 'Register & Verify Laboratory'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddLabForm(false)}
                            className="px-3.5 py-2.5 bg-white border border-[#D9E9E5] text-[#556B70] rounded-xl font-semibold min-h-[40px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="divide-y divide-[#D9E9E5] text-xs">
                  {laboratories.map((lab) => {
                    const isVerified = lab.verificationStatus === 'VERIFIED';
                    return (
                      <div
                        key={lab.id}
                        className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F3F7F4]/40 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                            <span className="text-base font-extrabold text-[#172C32]">{lab.name}</span>
                            <span
                              className={`text-[11px] font-mono font-bold whitespace-nowrap ${
                                isVerified ? 'text-[#087F8C]' : 'text-[#9C2A1A]'
                              }`}
                            >
                              {isVerified ? 'PHC Verified' : 'PHC Revoked · Bookings Blocked'}
                            </span>
                          </div>
                          <div className="text-[#556B70]">{lab.tagline}</div>
                          <div className="text-[11px] font-mono text-[#556B70] flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>PHC: {lab.phcLicence}</span>
                            <button
                              type="button"
                              onClick={() => setInspectedLab(lab)}
                              className="text-[#087F8C] font-bold hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>{lab.branches.length} Lahore Branches</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <span>Updated by {lab.verifiedBy}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {adminUser.role === 'SUPER_ADMIN' && (
                            <select
                              value={lab.subscriptionTier || 'GROWTH'}
                              onChange={(e) => handleUpdateTier(lab.id, e.target.value as LabSubscriptionTier)}
                              className="bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl px-3 py-2 text-xs font-mono text-[#172C32] min-h-[40px]"
                              title="Laboratory SaaS Plan"
                            >
                              <option value="STARTER">Starter (PKR 0/mo)</option>
                              <option value="GROWTH">Growth (PKR 18,500/mo)</option>
                              <option value="ENTERPRISE">Enterprise (PKR 45,000/mo)</option>
                            </select>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleVerification(lab.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold min-h-[40px] shrink-0 transition-colors ${
                              isVerified
                                ? 'bg-[#FF927E]/25 hover:bg-[#FF927E]/45 text-[#9C2A1A] border border-[#FF927E]'
                                : 'bg-[#073B43] hover:bg-[#087F8C] text-white'
                            }`}
                          >
                            {isVerified ? 'Revoke PHC Licence' : 'Recognize & Restore PHC Licence'}
                          </button>
                          {adminUser.role === 'SUPER_ADMIN' && (
                            pendingDeleteId === lab.id ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLab(lab.id)}
                                  className="px-3 py-2 bg-[#FF927E] text-[#172C32] rounded-xl text-xs font-bold min-h-[40px]"
                                >
                                  Confirm Delete Lab
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteId(null)}
                                  className="px-2.5 py-2 bg-[#F3F7F4] border border-[#D9E9E5] text-[#172C32] rounded-xl text-xs font-semibold min-h-[40px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(lab.id)}
                                title="Delete laboratory (only permitted if zero clinical history exists)"
                                className="px-3 py-2 bg-white hover:bg-[#FF927E]/20 text-[#9C2A1A] border border-[#FF927E]/70 rounded-xl text-xs font-semibold min-h-[40px] flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Lab</span>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'COMMISSION_LEDGER' && (
              <motion.div
                key="ADMIN_COMMISSION"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="space-y-6"
              >
                {/* Computed Gross Volume Chart + PHC Compliance Ring */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-8 bg-white border border-[#D9E9E5] rounded-2xl p-5 sm:p-6 space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-[#172C32]">
                        Laboratory Marketplace Volume Distribution (PKR)
                      </h2>
                      <p className="text-xs text-[#556B70]">
                        Gross requisition volume and order throughput across accredited Lahore diagnostic networks
                      </p>
                    </div>
                    <AnimatedBarChart
                      data={settlementChartData}
                      valuePrefix="PKR "
                      height={180}
                      emptyLabel="Marketplace settlements will populate as patient orders flow"
                    />
                  </div>

                  <div className="lg:col-span-4 bg-white border border-[#D9E9E5] rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center gap-4 text-center">
                    <RadialGaugeRing
                      percentage={verifiedPct}
                      size={110}
                      strokeWidth={9}
                      label="PHC Network Compliance"
                      sublabel={`${verifiedCount} of ${laboratories.length} Labs Active`}
                      color="#21D4C2"
                    />
                    <div className="w-full pt-3 border-t border-[#D9E9E5] text-xs flex justify-between font-mono">
                      <span className="text-[#556B70]">Platform Cut Rate</span>
                      <span className="font-bold text-[#087F8C]">8.0% Flat</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#D9E9E5] rounded-2xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F3F7F4] border-b border-[#D9E9E5] text-[#556B70] font-semibold">
                      <tr>
                        <th className="py-3 px-4">Laboratory</th>
                        <th className="py-3 px-4">SaaS Plan</th>
                        <th className="py-3 px-4">Orders</th>
                        <th className="py-3 px-4">Gross PKR</th>
                        <th className="py-3 px-4">Fee (8%)</th>
                        <th className="py-3 px-4">Unsettled Payable</th>
                        <th className="py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9E9E5] font-mono text-[11px]">
                      {settlements.map((row) => (
                        <tr key={row.labId} className="hover:bg-[#F3F7F4]/60">
                          <td className="py-3 px-4 font-sans font-bold text-[#172C32]">{row.labName}</td>
                          <td className="py-3 px-4 text-[#087F8C] font-semibold">{row.subscriptionTier}</td>
                          <td className="py-3 px-4 tabular-nums">{row.bookingsCount}</td>
                          <td className="py-3 px-4 tabular-nums">PKR {row.grossPkr.toLocaleString()}</td>
                          <td className="py-3 px-4 tabular-nums text-[#087F8C]">
                            PKR {row.commissionPkr.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 tabular-nums font-bold text-[#172C32]">
                            {row.unsettledNetPkr > 0
                              ? `PKR ${row.unsettledNetPkr.toLocaleString()} (${row.unsettledCount})`
                              : 'Settled'}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            {adminUser.role === 'SUPER_ADMIN' && row.unsettledNetPkr > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleSettlePayout(row.labId)}
                                className="px-3.5 py-1.5 bg-[#B9ED69] hover:brightness-95 text-[#172C32] rounded-xl font-bold text-[11px] whitespace-nowrap"
                              >
                                Settle Payout
                              </button>
                            ) : (
                              <span className="text-[#556B70]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {settlementHistory.length > 0 && (
                  <div className="bg-white border border-[#D9E9E5] rounded-2xl overflow-x-auto">
                    <div className="p-4 bg-[#F3F7F4] border-b border-[#D9E9E5] text-xs font-bold text-[#172C32] uppercase tracking-wider">
                      Completed IBFT Settlement Payouts ({settlementHistory.length})
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F3F7F4] border-b border-[#D9E9E5] text-[#556B70] font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Reference</th>
                          <th className="py-2.5 px-4">Laboratory</th>
                          <th className="py-2.5 px-4">Orders</th>
                          <th className="py-2.5 px-4">Net Disbursed</th>
                          <th className="py-2.5 px-4">Authorized By</th>
                          <th className="py-2.5 px-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D9E9E5] font-mono text-[11px]">
                        {settlementHistory.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2.5 px-4 font-bold text-[#172C32]">{item.referenceCode}</td>
                            <td className="py-2.5 px-4 font-sans font-medium">{item.labName}</td>
                            <td className="py-2.5 px-4 tabular-nums">{item.bookingCount}</td>
                            <td className="py-2.5 px-4 tabular-nums text-[#087F8C] font-bold">
                              PKR {item.netPayablePkr.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 font-sans text-[#556B70]">{item.settledBy}</td>
                            <td className="py-2.5 px-4 text-[#556B70]">
                              {new Date(item.settledAt).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'EMAIL_DISPATCH' && (
              <motion.div
                key="ADMIN_EMAILS"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="bg-white border border-[#D9E9E5] rounded-2xl overflow-hidden"
              >
                <div className="p-4 sm:p-5 bg-[#F3F7F4] border-b border-[#D9E9E5] text-xs font-bold text-[#172C32] uppercase tracking-wider">
                  Patient Report Email Dispatch Ledger ({emailLogs.length})
                </div>
                <div className="divide-y divide-[#D9E9E5] text-xs">
                  {emailLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F3F7F4]/40"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#087F8C]" />
                          <span className="font-bold text-[#172C32]">{log.recipientEmail}</span>
                          <span className="font-mono text-[10px] text-[#087F8C] font-bold whitespace-nowrap">
                            · {log.status === 'QUEUED_MIME_VERIFIED' ? 'MIME Verified' : log.status === 'SENT_SMTP' ? 'SMTP Sent' : log.status}
                          </span>
                        </div>
                        <div className="text-[#172C32] font-medium">{log.subject}</div>
                        <div className="text-[11px] font-mono text-[#556B70]">
                          Attachment: {log.attachmentFileName}
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-[#556B70] shrink-0 tabular-nums">
                        {new Date(log.sentAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'ACCOUNTS_REVIEWS' && (
              <motion.div
                key="ADMIN_ACCOUNTS"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="space-y-6"
              >
                <div className="bg-white border border-[#D9E9E5] rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-5 bg-[#F3F7F4] border-b border-[#D9E9E5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#172C32] uppercase tracking-wider">
                      Registered Platform Accounts ({adminUsersList.length})
                    </span>
                    <span className="text-[11px] text-[#556B70]">
                      Only a Super Admin can remove inactive accounts (self and last Super Admin are protected).
                    </span>
                  </div>
                  <div className="divide-y divide-[#D9E9E5] text-xs">
                    {adminUsersList.map((u) => {
                      const isSelf = u.id === adminUser.id;
                      const roleLabel =
                        u.role === 'SUPER_ADMIN'
                          ? 'Super Admin'
                          : u.role === 'PHC_INSPECTOR'
                          ? 'PHC Inspector'
                          : u.role === 'LAB_ADMIN'
                          ? 'Branch Lead'
                          : u.role === 'PHLEBOTOMIST'
                          ? 'Field Courier'
                          : u.role === 'PATIENT'
                          ? 'Patient'
                          : u.role;
                      return (
                        <div
                          key={u.id}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F3F7F4]/40"
                        >
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-[#172C32]">{u.name}</span>
                              <span className="text-[10px] font-mono font-bold text-[#087F8C]">· {roleLabel}</span>
                              {u.staffCode && (
                                <span className="text-[10px] font-mono text-[#556B70]">· {u.staffCode}</span>
                              )}
                              {isSelf && (
                                <span className="text-[10px] font-mono font-bold text-[#073B43]">
                                  · Current Session
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-[#556B70]">
                              {u.email} · {u.phone} · {u.area}
                            </div>
                          </div>
                          {adminUser.role === 'SUPER_ADMIN' &&
                            !isSelf &&
                            (pendingDeleteId === u.id ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAccount(u.id)}
                                  className="px-3 py-1.5 bg-[#FF927E] text-[#172C32] rounded-xl font-bold"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteId(null)}
                                  className="px-2.5 py-1.5 bg-[#F3F7F4] border border-[#D9E9E5] text-[#172C32] rounded-xl font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(u.id)}
                                className="px-3 py-1.5 bg-[#FF927E]/20 hover:bg-[#FF927E]/40 text-[#9C2A1A] border border-[#FF927E] rounded-xl font-semibold flex items-center gap-1 self-start sm:self-center shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Account</span>
                              </button>
                            ))}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-[#D9E9E5] rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-5 bg-[#F3F7F4] border-b border-[#D9E9E5] text-xs font-bold text-[#172C32] uppercase tracking-wider">
                    Verified Patient Reviews Moderation ({reviewsList.length})
                  </div>
                  {reviewsList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#556B70]">No patient reviews published yet.</div>
                  ) : (
                    <div className="divide-y divide-[#D9E9E5] text-xs">
                      {reviewsList.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-[#172C32]">{rev.bookingNumber}</span>
                              <span className="text-[#087F8C] font-mono font-bold">{rev.rating}/5 ★</span>
                              <span className="text-[#556B70]">by {rev.patientName}</span>
                            </div>
                            <p className="text-[#172C32]">{rev.comment}</p>
                          </div>
                          {adminUser.role === 'SUPER_ADMIN' &&
                            (pendingDeleteId === rev.id ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(rev.id)}
                                  className="px-3 py-1.5 bg-[#FF927E] text-[#172C32] rounded-xl font-bold"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteId(null)}
                                  className="px-2.5 py-1.5 bg-[#F3F7F4] border border-[#D9E9E5] text-[#172C32] rounded-xl font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(rev.id)}
                                className="px-3 py-1.5 bg-[#FF927E]/20 hover:bg-[#FF927E]/40 text-[#9C2A1A] border border-[#FF927E] rounded-xl font-semibold flex items-center gap-1 self-start sm:self-center shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Review</span>
                              </button>
                            ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'AUDIT_LOGS' && (
              <motion.div
                key="ADMIN_AUDIT"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="space-y-5"
              >
                {Object.keys(securityStatus).length > 0 && (
                  <div className="lc-gradient-midnight text-white rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-[#D9E9E5]/80 block">Session Verification</span>
                      <span className="font-mono font-bold text-[#21D4C2] mt-0.5 block">
                        {securityStatus.authAlgorithm}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#D9E9E5]/80 block">Credential Storage</span>
                      <span className="font-mono font-bold text-white mt-0.5 block">
                        {securityStatus.passwordHashing}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#D9E9E5]/80 block">Rate Protection</span>
                      <span className="font-mono font-bold text-[#B9ED69] mt-0.5 block">
                        {securityStatus.rateLimiter}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#D9E9E5]/80 block">Report Integrity</span>
                      <span className="font-mono font-bold text-white mt-0.5 block">
                        {securityStatus.pdfIntegrity}
                      </span>
                    </div>
                  </div>
                )}

                {lahoreCoverage && (
                  <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-[#172C32] uppercase tracking-wider">
                        Lahore Coverage &amp; Network Readiness
                      </span>
                      <span className="font-mono text-[11px] text-[#087F8C] font-bold">
                        {lahoreCoverage.verifiedLabsCount}/{lahoreCoverage.totalLabsCount} Labs Verified ·{' '}
                        {lahoreCoverage.totalBranchesCount} Branches
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#D9E9E5]">
                      <div>
                        <span className="text-[11px] font-semibold text-[#556B70] block">
                          Covered Lahore Zones ({lahoreCoverage.coveredAreas.length})
                        </span>
                        <span className="font-medium text-[#172C32]">{lahoreCoverage.coveredAreas.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-[#556B70] block">
                          Verified Diagnostic Catalogue
                        </span>
                        <span className="font-mono font-semibold text-[#172C32]">
                          {lahoreCoverage.verifiedTestsCount} Panels · {lahoreCoverage.verifiedTariffsCount} Branch Tariffs
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-[#556B70] block">
                          Service Integration Status
                        </span>
                        <span className="font-mono text-[11px] text-[#556B70]">
                          Auth: {lahoreCoverage.envHygiene?.hasAuthSecretEnv ? 'Configured' : 'Managed'} · AI Guide:{' '}
                          {lahoreCoverage.envHygiene?.hasGeminiKey ? 'Live' : 'Standard'} · Email Dispatch:{' '}
                          {lahoreCoverage.envHygiene?.hasSmtpConfigured ? 'SMTP Active' : 'Dispatch Queue'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white border border-[#D9E9E5] rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-5 bg-[#F3F7F4] border-b border-[#D9E9E5] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#172C32] uppercase tracking-wider">
                      Append-Only Security &amp; Clinical Audit Trail ({auditLogs.length})
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {adminUser.role === 'SUPER_ADMIN' && (
                        <button
                          type="button"
                          onClick={async () => {
                            setActionError(null);
                            try {
                              await apiClient.downloadBackupSnapshot();
                              setActionMsg('Sanitized backup snapshot downloaded.');
                            } catch {
                              setActionError('Unable to export sanitized backup snapshot.');
                            }
                          }}
                          className="px-3.5 py-2 bg-white border border-[#D9E9E5] hover:border-[#087F8C] text-[#172C32] rounded-xl text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-[#087F8C]" />
                          <span>Sanitized Backup (.JSON)</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          setActionError(null);
                          try {
                            await apiClient.downloadAuditCsv();
                            setActionMsg('Audit log CSV downloaded.');
                          } catch {
                            setActionError('Unable to export audit log CSV.');
                          }
                        }}
                        className="px-3.5 py-2 bg-[#073B43] hover:bg-[#087F8C] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-[#B9ED69]" />
                        <span>Download CSV</span>
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-[#D9E9E5] text-xs">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F3F7F4]/40"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-[#087F8C]">{log.action}</span>
                            <span className="text-[#C8DDD7]" aria-hidden="true">
                              ·
                            </span>
                            <span className="font-semibold text-[#172C32]">{log.actor}</span>
                            <span className="text-[10px] font-mono text-[#556B70]">({log.role})</span>
                          </div>
                          <div className="text-[11px] text-[#556B70] mt-1">Target: {log.target}</div>
                        </div>
                        <span className="font-mono text-[11px] text-[#556B70] shrink-0 tabular-nums">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Slide-Over Drawer for Inspecting Verified Lab Branches */}
      <SlideOverDrawer
        isOpen={Boolean(inspectedLab)}
        onClose={() => setInspectedLab(null)}
        title={inspectedLab?.name || 'Laboratory Branches'}
        subtitle={inspectedLab ? `${inspectedLab.phcLicence} · ${inspectedLab.branches.length} Locations` : undefined}
      >
        {inspectedLab && (
          <div className="space-y-3 text-xs">
            <div className="bg-white border border-[#D9E9E5] rounded-2xl p-4 space-y-1">
              <div className="font-mono text-[11px] text-[#087F8C] font-bold">
                {inspectedLab.verificationStatus} · {inspectedLab.subscriptionTier || 'GROWTH'} TIER
              </div>
              <p className="text-[#556B70]">{inspectedLab.tagline}</p>
            </div>

            {inspectedLab.branches.map((br) => (
              <div key={br.id} className="bg-white border border-[#D9E9E5] rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-[#172C32]">{br.name}</span>
                  <span className="font-mono text-[11px] font-semibold text-[#087F8C]">{br.area}</span>
                </div>
                <div className="text-[#556B70] flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#087F8C]" />
                  <span>{br.address}</span>
                </div>
                <div className="pt-2 border-t border-[#D9E9E5] flex justify-between font-mono text-[11px] text-[#556B70]">
                  <span>{br.operatingHours}</span>
                  <span className="font-bold text-[#172C32]">
                    {br.homeCollectionFeePkr === 0 ? 'Free Home Draw' : `Home Fee: PKR ${br.homeCollectionFeePkr}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};
