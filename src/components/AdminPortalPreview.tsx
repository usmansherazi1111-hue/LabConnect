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
  AlertCircle,
  RotateCw,
  Mail,
  Download,
  CheckCircle2,
  Trash2,
  Plus,
  Building2,
  Wallet,
  Users,
  FileSearch,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Eye,
  EyeOff,
  Loader2,
  User,
} from 'lucide-react';
import { AnimatedNumber, AnimatedTabBar, LC_EASE } from './ui/MotionPrimitives';
import { PortalAuthShell, AuthErrorBanner, AuthSessionLoader } from './ui/PortalAuthShell';
import { AnimatePresence, motion } from 'motion/react';

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
    const res = await apiClient.toggleLabVerification(labId);
    if (res.success) {
      fetchOverview();
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

  const maxLabGross = useMemo(() => Math.max(1, ...settlements.map((s) => s.grossPkr)), [settlements]);

  if (!authReady) {
    return <AuthSessionLoader label="Verifying PHC Regulatory session..." />;
  }

  if (!adminUser) {
    return (
      <PortalAuthShell
        portalTag="PHC Regulatory & Admin Console"
        headline="Punjab Healthcare Commission Oversight"
        subheadline="Restricted governance portal for verifying Lahore diagnostic licences, auditing 8% marketplace settlements, and inspecting dispatch compliance logs."
        icon={<ShieldCheck className="w-4 h-4" />}
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
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#28745B]">
            Governance Authentication
          </span>
          <h2 className="text-2xl font-bold text-[#202A27] tracking-tight">
            {authMode === 'SETUP' ? 'Initialize Super Admin' : 'Admin & Inspector Sign In'}
          </h2>
          <p className="text-xs text-[#737D78]">
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
                <label className="block font-semibold text-[#202A27] mb-1.5">Administrator Full Name</label>
                <div className="flex items-center bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 focus-within:border-[#174C3C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#174C3C]/10 transition-all">
                  <User className="w-4 h-4 text-[#737D78] shrink-0" />
                  <input
                    type="text"
                    required
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    placeholder="Dr. Tariq Mahmood"
                    className="w-full bg-transparent px-2.5 py-2.5 text-[#202A27] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#202A27] mb-1.5">Regulatory Email</label>
              <div className="flex items-center bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 focus-within:border-[#174C3C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#174C3C]/10 transition-all">
                <Mail className="w-4 h-4 text-[#737D78] shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="regulatory@institution.pk"
                  className="w-full bg-transparent px-2.5 py-2.5 text-[#202A27] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#202A27] mb-1.5">
                {authMode === 'SETUP' ? 'Create Strong Password (min 8 chars)' : 'Admin Password'}
              </label>
              <div className="flex items-center bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 focus-within:border-[#174C3C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#174C3C]/10 transition-all">
                <Lock className="w-4 h-4 text-[#737D78] shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent px-2.5 py-2.5 font-mono text-[#202A27] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-[#737D78] hover:text-[#202A27] p-1"
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
              className="w-full py-3 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold min-h-[46px] flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
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

        <div className="pt-3 border-t border-[#E8EFE8] text-[11px] text-[#737D78]">
          Access is restricted strictly to authorized Punjab Healthcare regulatory and platform administrators.
        </div>
      </PortalAuthShell>
    );
  }

  const navItems: { id: typeof activeTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'PHC_VERIFICATION', label: 'PHC Licences', icon: <Building2 className="w-4 h-4" />, count: laboratories.length },
    { id: 'COMMISSION_LEDGER', label: 'Settlements', icon: <Wallet className="w-4 h-4" /> },
    { id: 'EMAIL_DISPATCH', label: 'Emails', icon: <Mail className="w-4 h-4" />, count: emailLogs.length },
    { id: 'ACCOUNTS_REVIEWS', label: 'Accounts', icon: <Users className="w-4 h-4" />, count: adminUsersList.length },
    { id: 'AUDIT_LOGS', label: 'Audit Trail', icon: <FileSearch className="w-4 h-4" />, count: auditLogs.length },
  ];

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Collapsible Desktop Governance Sidebar */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 72 : 244 }}
          transition={{ duration: 0.22, ease: LC_EASE }}
          className="hidden lg:flex flex-col shrink-0 bg-white border border-[#DCE4DE] rounded-2xl p-3 space-y-4 sticky top-20 overflow-hidden"
        >
          <div className="flex items-center justify-between px-1.5 pt-1">
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-semibold text-[#28745B] uppercase truncate">
                  {adminUser.role}
                </div>
                <div className="text-xs font-bold text-[#202A27] truncate">PHC Division</div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-2 rounded-lg text-[#737D78] hover:text-[#174C3C] hover:bg-[#F8F8F3] transition-colors shrink-0"
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive ? 'text-white font-semibold' : 'text-[#737D78] hover:text-[#202A27] hover:bg-[#F8F8F3]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="admin-sidebar-active"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-[#174C3C] rounded-xl"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2.5 min-w-0">
                    {item.icon}
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </span>
                  {!sidebarCollapsed && typeof item.count === 'number' && (
                    <span className={`relative z-10 font-mono text-[11px] ${isActive ? 'text-white/80' : 'text-[#737D78]'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </motion.aside>

        {/* Main Governance Content */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Header Bar */}
          <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono font-semibold text-[#28745B] uppercase tracking-wider">
                {adminUser.role} · Punjab Healthcare Commission Division
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#202A27]">
                Governance, Licencing &amp; Live Audit Ledger
              </h1>
              <p className="text-xs text-[#737D78] mt-0.5">
                Platform totals computed dynamically from runtime bookings, reports, and email logs.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchOverview}
              className="p-2.5 bg-[#F8F8F3] hover:bg-[#E8EFE8] border border-[#DCE4DE] rounded-xl text-[#174C3C] self-start sm:self-center"
              title="Refresh live data"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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

          {actionMsg && (
            <div className="p-3 bg-[#E8EFE8]/70 border border-[#28745B]/25 text-[#174C3C] rounded-xl text-xs flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionMsg}</span>
              </span>
              <button type="button" onClick={() => setActionMsg(null)} className="p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {actionError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </span>
              <button type="button" onClick={() => setActionError(null)} className="p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'PHC_VERIFICATION' && (
              <motion.div
                key="ADMIN_PHC"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="bg-white border border-[#DCE4DE] rounded-2xl overflow-hidden"
              >
                <div className="p-5 bg-[#F8F8F3] border-b border-[#DCE4DE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-[#202A27] uppercase tracking-wider block">
                      Lahore Accredited Laboratories ({laboratories.length})
                    </span>
                    <span className="text-[11px] text-[#737D78]">
                      Revoking a lab&apos;s PHC licence immediately disables patient booking across the Patient Marketplace &amp; API.
                    </span>
                  </div>
                  {adminUser.role === 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      onClick={() => setShowAddLabForm((prev) => !prev)}
                      className="px-3.5 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center shrink-0 min-h-[38px]"
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
                      className="overflow-hidden border-b border-[#DCE4DE] bg-[#E8EFE8]/45"
                    >
                      <div className="p-5 space-y-4 text-xs">
                        <div className="font-bold text-[#202A27] uppercase tracking-wider">
                          Register New PHC-Licensed Lahore Laboratory &amp; HQ Branch
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">Laboratory Name *</label>
                            <input
                              type="text"
                              required
                              value={newLabName}
                              onChange={(e) => setNewLabName(e.target.value)}
                              placeholder="Lahore Diagnostics Centre"
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">PHC Licence Number *</label>
                            <input
                              type="text"
                              required
                              value={newLabPhc}
                              onChange={(e) => setNewLabPhc(e.target.value)}
                              placeholder="PHC-REG-LHR-2026-099"
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">SaaS Plan Tier</label>
                            <select
                              value={newLabTier}
                              onChange={(e) => setNewLabTier(e.target.value as LabSubscriptionTier)}
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                            >
                              <option value="STARTER">Starter (PKR 0/mo)</option>
                              <option value="GROWTH">Growth (PKR 18,500/mo)</option>
                              <option value="ENTERPRISE">Enterprise (PKR 45,000/mo)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">HQ Branch Name *</label>
                            <input
                              type="text"
                              required
                              value={newLabHqName}
                              onChange={(e) => setNewLabHqName(e.target.value)}
                              placeholder="Main Jail Road Flagship"
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">HQ Lahore Area *</label>
                            <input
                              type="text"
                              required
                              value={newLabHqArea}
                              onChange={(e) => setNewLabHqArea(e.target.value)}
                              placeholder="Gulberg III / DHA Phase 5"
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">HQ Street Address *</label>
                            <input
                              type="text"
                              required
                              value={newLabHqAddress}
                              onChange={(e) => setNewLabHqAddress(e.target.value)}
                              placeholder="14-A Main Boulevard, Gulberg III, Lahore"
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">Official Contact Email</label>
                            <input
                              type="email"
                              value={newLabEmail}
                              onChange={(e) => setNewLabEmail(e.target.value)}
                              placeholder="compliance@lab.pk"
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">Helpline Phone (+92)</label>
                            <input
                              type="text"
                              value={newLabPhone}
                              onChange={(e) => setNewLabPhone(e.target.value)}
                              placeholder="+92 42 111 XXX XXX"
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">HQ Home Sampling Fee (PKR)</label>
                            <input
                              type="number"
                              min={0}
                              max={5000}
                              value={newLabHqFee}
                              onChange={(e) => setNewLabHqFee(e.target.value)}
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={isCreatingLab}
                            className="px-4 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold min-h-[38px]"
                          >
                            {isCreatingLab ? 'Onboarding...' : 'Register & Verify Laboratory'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddLabForm(false)}
                            className="px-3 py-2 bg-white border border-[#DCE4DE] text-[#737D78] rounded-xl font-semibold min-h-[38px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="divide-y divide-[#E8EFE8] text-xs">
                  {laboratories.map((lab) => {
                    const isVerified = lab.verificationStatus === 'VERIFIED';
                    return (
                      <div key={lab.id} className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold text-[#202A27]">{lab.name}</span>
                            <span
                              className={`text-[10px] font-mono font-bold ${
                                isVerified ? 'text-[#28745B]' : 'text-rose-700'
                              }`}
                            >
                              · {isVerified ? 'PHC VERIFIED' : 'PHC LICENCE REVOKED — BOOKINGS BLOCKED'}
                            </span>
                          </div>
                          <div className="text-[#737D78]">{lab.tagline}</div>
                          <div className="text-[11px] font-mono text-[#737D78]">
                            PHC: {lab.phcLicence} · Branches: {lab.branches.length} · Updated By: {lab.verifiedBy}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {adminUser.role === 'SUPER_ADMIN' && (
                            <select
                              value={lab.subscriptionTier || 'GROWTH'}
                              onChange={(e) => handleUpdateTier(lab.id, e.target.value as LabSubscriptionTier)}
                              className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 py-2 text-xs font-mono text-[#202A27] min-h-[40px]"
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
                            className={`px-4 py-2 rounded-xl text-xs font-semibold min-h-[40px] shrink-0 transition-colors ${
                              isVerified
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-[#174C3C] hover:bg-[#28745B] text-white'
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
                                  className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold min-h-[40px]"
                                >
                                  Confirm Delete Lab
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteId(null)}
                                  className="px-2.5 py-2 bg-[#F8F8F3] border border-[#DCE4DE] text-[#202A27] rounded-xl text-xs font-semibold min-h-[40px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(lab.id)}
                                title="Delete laboratory (only permitted if zero clinical history exists)"
                                className="px-3 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold min-h-[40px] flex items-center gap-1"
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5">
                    <span className="text-[11px] font-semibold text-[#737D78] uppercase">Live Gross Volume</span>
                    <div className="text-2xl font-bold font-mono text-[#202A27] mt-1">
                      <AnimatedNumber value={metrics.grossVolumePkr} prefix="PKR " />
                    </div>
                    <span className="text-[11px] text-[#737D78]">{metrics.totalBookings} active bookings</span>
                  </div>
                  <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5">
                    <span className="text-[11px] font-semibold text-[#737D78] uppercase">Commission (8%)</span>
                    <div className="text-2xl font-bold font-mono text-[#174C3C] mt-1">
                      <AnimatedNumber value={metrics.totalCommissionPkr} prefix="PKR " />
                    </div>
                    <span className="text-[11px] text-[#737D78]">Calculated from DB orders</span>
                  </div>
                  <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5">
                    <span className="text-[11px] font-semibold text-[#737D78] uppercase">Monthly SaaS MRR</span>
                    <div className="text-2xl font-bold font-mono text-[#202A27] mt-1">
                      <AnimatedNumber value={metrics.totalSaasMrrPkr || 0} prefix="PKR " />
                    </div>
                    <span className="text-[11px] text-[#737D78]">{laboratories.length} subscribed lab networks</span>
                  </div>
                  <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5">
                    <span className="text-[11px] font-semibold text-[#737D78] uppercase">Reports &amp; Emails</span>
                    <div className="text-xl font-bold font-mono text-[#202A27] mt-1 tabular-nums">
                      {metrics.totalReports} PDFs · {metrics.totalEmailsSent} Emails
                    </div>
                  </div>
                </div>

                {/* Computed Gross Volume Breakdown Visual */}
                <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5 space-y-3">
                  <div className="text-xs font-bold text-[#202A27] uppercase tracking-wider">
                    Laboratory Marketplace Volume Distribution (PKR)
                  </div>
                  <div className="space-y-2.5">
                    {settlements.map((row) => {
                      const pct = Math.round((row.grossPkr / maxLabGross) * 100);
                      return (
                        <div key={row.labId} className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="font-medium text-[#202A27]">{row.labName}</span>
                            <span className="font-mono font-semibold text-[#174C3C] tabular-nums">
                              PKR {row.grossPkr.toLocaleString()} ({row.bookingsCount} orders)
                            </span>
                          </div>
                          <div className="h-2 bg-[#F8F8F3] border border-[#E8EFE8] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${row.grossPkr === 0 ? 0 : Math.max(4, pct)}%` }}
                              transition={{ duration: 0.45, ease: LC_EASE }}
                              className="h-full bg-[#174C3C] rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-[#DCE4DE] rounded-2xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F8F3] border-b border-[#DCE4DE] text-[#737D78] font-semibold">
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
                    <tbody className="divide-y divide-[#E8EFE8] font-mono text-[11px]">
                      {settlements.map((row) => (
                        <tr key={row.labId} className="hover:bg-[#F8F8F3]/60">
                          <td className="py-3 px-4 font-sans font-semibold text-[#202A27]">{row.labName}</td>
                          <td className="py-3 px-4">{row.subscriptionTier}</td>
                          <td className="py-3 px-4 tabular-nums">{row.bookingsCount}</td>
                          <td className="py-3 px-4 tabular-nums">PKR {row.grossPkr.toLocaleString()}</td>
                          <td className="py-3 px-4 tabular-nums text-[#28745B]">PKR {row.commissionPkr.toLocaleString()}</td>
                          <td className="py-3 px-4 tabular-nums font-bold">
                            {row.unsettledNetPkr > 0 ? `PKR ${row.unsettledNetPkr.toLocaleString()} (${row.unsettledCount})` : 'Settled'}
                          </td>
                          <td className="py-3 px-4 font-sans">
                            {adminUser.role === 'SUPER_ADMIN' && row.unsettledNetPkr > 0 ? (
                              <button
                                type="button"
                                onClick={() => handleSettlePayout(row.labId)}
                                className="px-3 py-1.5 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-lg font-semibold text-[11px] whitespace-nowrap"
                              >
                                Settle Payout
                              </button>
                            ) : (
                              <span className="text-[#737D78]">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {settlementHistory.length > 0 && (
                  <div className="bg-white border border-[#DCE4DE] rounded-2xl overflow-x-auto">
                    <div className="p-4 bg-[#F8F8F3] border-b border-[#DCE4DE] text-xs font-bold text-[#202A27] uppercase tracking-wider">
                      Completed IBFT Settlement Payouts ({settlementHistory.length})
                    </div>
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8F8F3] border-b border-[#DCE4DE] text-[#737D78] font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Reference</th>
                          <th className="py-2.5 px-4">Laboratory</th>
                          <th className="py-2.5 px-4">Orders</th>
                          <th className="py-2.5 px-4">Net Disbursed</th>
                          <th className="py-2.5 px-4">Authorized By</th>
                          <th className="py-2.5 px-4">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8EFE8] font-mono text-[11px]">
                        {settlementHistory.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2.5 px-4 font-bold text-[#202A27]">{item.referenceCode}</td>
                            <td className="py-2.5 px-4 font-sans font-medium">{item.labName}</td>
                            <td className="py-2.5 px-4 tabular-nums">{item.bookingCount}</td>
                            <td className="py-2.5 px-4 tabular-nums text-[#174C3C] font-bold">PKR {item.netPayablePkr.toLocaleString()}</td>
                            <td className="py-2.5 px-4 font-sans text-[#737D78]">{item.settledBy}</td>
                            <td className="py-2.5 px-4 text-[#737D78]">{new Date(item.settledAt).toLocaleString()}</td>
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
                className="bg-white border border-[#DCE4DE] rounded-2xl overflow-hidden"
              >
                <div className="p-4 bg-[#F8F8F3] border-b border-[#DCE4DE] text-xs font-bold text-[#202A27] uppercase tracking-wider">
                  Patient Report Email Dispatch Ledger ({emailLogs.length})
                </div>
                <div className="divide-y divide-[#E8EFE8] text-xs">
                  {emailLogs.map((log) => (
                    <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#174C3C]" />
                          <span className="font-bold text-[#202A27]">{log.recipientEmail}</span>
                          <span className="font-mono text-[10px] text-[#28745B] font-semibold">· {log.status}</span>
                        </div>
                        <div className="text-[#202A27] font-medium">{log.subject}</div>
                        <div className="text-[11px] font-mono text-[#737D78]">Attachment: {log.attachmentFileName}</div>
                      </div>
                      <span className="font-mono text-[11px] text-[#737D78] shrink-0 tabular-nums">
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
                <div className="bg-white border border-[#DCE4DE] rounded-2xl overflow-hidden">
                  <div className="p-4 bg-[#F8F8F3] border-b border-[#DCE4DE] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#202A27] uppercase tracking-wider">
                      Registered Platform Accounts ({adminUsersList.length})
                    </span>
                    <span className="text-[11px] text-[#737D78]">
                      Only SUPER_ADMIN can remove inactive accounts (self and last Super Admin are protected).
                    </span>
                  </div>
                  <div className="divide-y divide-[#E8EFE8] text-xs">
                    {adminUsersList.map((u) => {
                      const isSelf = u.id === adminUser.id;
                      return (
                        <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-[#202A27]">{u.name}</span>
                              <span className="text-[10px] font-mono font-semibold text-[#737D78]">· {u.role}</span>
                              {u.staffCode && (
                                <span className="text-[10px] font-mono text-[#28745B]">· {u.staffCode}</span>
                              )}
                              {isSelf && (
                                <span className="text-[10px] font-mono font-bold text-[#174C3C]">· CURRENT SESSION</span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-[#737D78]">
                              {u.email} · {u.phone} · {u.area}
                            </div>
                          </div>
                          {adminUser.role === 'SUPER_ADMIN' && !isSelf && (
                            pendingDeleteId === u.id ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAccount(u.id)}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteId(null)}
                                  className="px-2.5 py-1.5 bg-[#F8F8F3] border border-[#DCE4DE] text-[#202A27] rounded-xl font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(u.id)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold flex items-center gap-1 self-start sm:self-center shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Account</span>
                              </button>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-[#DCE4DE] rounded-2xl overflow-hidden">
                  <div className="p-4 bg-[#F8F8F3] border-b border-[#DCE4DE] text-xs font-bold text-[#202A27] uppercase tracking-wider">
                    Verified Patient Reviews Moderation ({reviewsList.length})
                  </div>
                  {reviewsList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#737D78]">No patient reviews published yet.</div>
                  ) : (
                    <div className="divide-y divide-[#E8EFE8] text-xs">
                      {reviewsList.map((rev) => (
                        <div key={rev.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-bold text-[#202A27]">{rev.bookingNumber}</span>
                              <span className="text-amber-700 font-mono font-bold">{rev.rating}/5 ★</span>
                              <span className="text-[#737D78]">by {rev.patientName}</span>
                            </div>
                            <p className="text-[#202A27]">{rev.comment}</p>
                          </div>
                          {adminUser.role === 'SUPER_ADMIN' && (
                            pendingDeleteId === rev.id ? (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReview(rev.id)}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold"
                                >
                                  Confirm Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteId(null)}
                                  className="px-2.5 py-1.5 bg-[#F8F8F3] border border-[#DCE4DE] text-[#202A27] rounded-xl font-semibold"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPendingDeleteId(rev.id)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold flex items-center gap-1 self-start sm:self-center shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Review</span>
                              </button>
                            )
                          )}
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
                className="space-y-4"
              >
                {Object.keys(securityStatus).length > 0 && (
                  <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-[#737D78] block">Session Verification</span>
                      <span className="font-mono font-semibold text-[#202A27]">{securityStatus.authAlgorithm}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#737D78] block">Credential Storage</span>
                      <span className="font-mono font-semibold text-[#202A27]">{securityStatus.passwordHashing}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#737D78] block">Rate Protection</span>
                      <span className="font-mono font-semibold text-[#174C3C]">{securityStatus.rateLimiter}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#737D78] block">Report Integrity</span>
                      <span className="font-mono font-semibold text-[#202A27]">{securityStatus.pdfIntegrity}</span>
                    </div>
                  </div>
                )}

                {lahoreCoverage && (
                  <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-[#202A27] uppercase tracking-wider">
                        Lahore Coverage &amp; Network Readiness
                      </span>
                      <span className="font-mono text-[11px] text-[#174C3C] font-semibold">
                        {lahoreCoverage.verifiedLabsCount}/{lahoreCoverage.totalLabsCount} Labs Verified · {lahoreCoverage.totalBranchesCount} Branches
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E8EFE8]">
                      <div>
                        <span className="text-[11px] font-semibold text-[#737D78] block">Covered Lahore Zones ({lahoreCoverage.coveredAreas.length})</span>
                        <span className="font-medium text-[#202A27]">{lahoreCoverage.coveredAreas.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-[#737D78] block">Verified Diagnostic Catalogue</span>
                        <span className="font-mono font-semibold text-[#202A27]">
                          {lahoreCoverage.verifiedTestsCount} Panels · {lahoreCoverage.verifiedTariffsCount} Branch Tariffs
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-[#737D78] block">Service Integration Status</span>
                        <span className="font-mono text-[11px] text-[#737D78]">
                          Auth: {lahoreCoverage.envHygiene?.hasAuthSecretEnv ? 'Configured' : 'Managed'} · AI Guide: {lahoreCoverage.envHygiene?.hasGeminiKey ? 'Live' : 'Standard'} · Email Dispatch: {lahoreCoverage.envHygiene?.hasSmtpConfigured ? 'SMTP Active' : 'Dispatch Queue'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white border border-[#DCE4DE] rounded-2xl overflow-hidden">
                  <div className="p-4 bg-[#F8F8F3] border-b border-[#DCE4DE] flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#202A27] uppercase tracking-wider">
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
                          className="px-3 py-1.5 bg-white border border-[#DCE4DE] hover:border-[#174C3C] text-[#202A27] rounded-xl text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-[#174C3C]" />
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
                        className="px-3 py-1.5 bg-white border border-[#DCE4DE] hover:border-[#174C3C] text-[#202A27] rounded-xl text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-[#174C3C]" />
                        <span>Download CSV</span>
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-[#E8EFE8] text-xs">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-[#174C3C]">{log.action}</span>
                            <span className="text-[#DCE4DE]" aria-hidden="true">·</span>
                            <span className="font-semibold text-[#202A27]">{log.actor}</span>
                            <span className="text-[10px] font-mono text-[#737D78]">({log.role})</span>
                          </div>
                          <div className="text-[11px] text-[#737D78] mt-1">Target: {log.target}</div>
                        </div>
                        <span className="font-mono text-[11px] text-[#737D78] shrink-0 tabular-nums">
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
    </div>
  );
};
