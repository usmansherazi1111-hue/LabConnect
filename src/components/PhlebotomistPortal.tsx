/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MockBooking, LahoreLaboratory, DiagnosticTest } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Bike,
  MapPin,
  Phone,
  Mail,
  Thermometer,
  RotateCw,
  QrCode,
  Navigation,
  FileCheck,
  UserPlus,
  Loader2,
  ShieldCheck,
  Clock,
  FlaskConical,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { AnimatedTabBar, LC_EASE, SkeletonBlock } from './ui/MotionPrimitives';
import { PortalAuthShell, AuthErrorBanner, AuthSessionLoader } from './ui/PortalAuthShell';
import { GoogleOAuthButton, OAuthOrDivider } from './ui/OAuthSignInBar';
import { KpiMetricCard, RadialGaugeRing, ToastBanner } from './ui/DataVisuals';
import { AnimatePresence, motion } from 'motion/react';
import coldChainImg from '../assets/images/coldchain_capsule_transit_1795109387264.jpg';

export const PhlebotomistPortal: React.FC = () => {
  const {
    authReady,
    phlebUser,
    loginPhlebotomist,
    registerPhlebotomist,
    signInWithGoogle,
    sendEmailOtp,
    verifyEmailOtp,
  } = useAuth();

  const [laboratories, setLaboratories] = useState<LahoreLaboratory[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);

  // Auth Form State
  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [phlebAuthMethod, setPhlebAuthMethod] = useState<'EMAIL_OTP' | 'STAFF_CODE'>('EMAIL_OTP');
  const [staffCode, setStaffCode] = useState<string>('');
  const [staffPhone, setStaffPhone] = useState<string>('');
  const [staffEmail, setStaffEmail] = useState<string>('');
  const [regFullName, setRegFullName] = useState<string>('');
  const [regCnicLast4, setRegCnicLast4] = useState<string>('');
  const [emailOtpSent, setEmailOtpSent] = useState<boolean>(false);
  const [emailOtpCode, setEmailOtpCode] = useState<string>('');
  const [selectedLabId, setSelectedLabId] = useState<string>('lab-chughtai');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('c-branch-jailrd');
  const [loginStatus, setLoginStatus] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Field Operations State
  const [coldBoxTemp, setColdBoxTemp] = useState<number>(4.2);
  const [assignedBookings, setAssignedBookings] = useState<MockBooking[]>([]);
  const [activeBooking, setActiveBooking] = useState<MockBooking | null>(null);
  const [queueFilter, setQueueFilter] = useState<'ALL' | 'ACTIVE' | 'DONE'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [fastingVerified, setFastingVerified] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    apiClient
      .getCatalog()
      .then((res) => {
        if (res.success && res.data) {
          setLaboratories(res.data.laboratories || []);
          setTests(res.data.tests || []);
        }
      })
      .catch((err) => console.error('Failed to fetch catalog:', err));
  }, []);

  const fetchPhlebotomistQueue = useCallback(async () => {
    if (!phlebUser) return;
    setIsLoading(true);
    try {
      const res = await apiClient.getBookings({}, 'phlebotomist');
      if (res.success && Array.isArray(res.data)) {
        setAssignedBookings(res.data);
        if (res.data.length > 0) {
          const defaultStop =
            res.data.find((b: MockBooking) => b.status !== 'CANCELLED' && b.status !== 'COMPLETED') || res.data[0];
          setActiveBooking((prev) => res.data.find((b: MockBooking) => b.id === prev?.id) || defaultStop);
        } else {
          setActiveBooking(null);
        }
      }
    } catch (err) {
      console.error('Failed to load rider queue:', err);
    } finally {
      setIsLoading(false);
    }
  }, [phlebUser]);

  useEffect(() => {
    if (phlebUser) {
      fetchPhlebotomistQueue();
    } else {
      setAssignedBookings([]);
      setActiveBooking(null);
    }
  }, [phlebUser, fetchPhlebotomistQueue]);

  const currentLabObj = laboratories.find((l) => l.id === selectedLabId);
  const availableBranches = currentLabObj?.branches || [];

  const handlePhlebGoogleAuth = async () => {
    setLoginError(null);
    setLoginStatus(null);
    setIsGoogleLoading(true);
    const res = await signInWithGoogle('phlebotomist', {
      labId: selectedLabId,
      branchId: selectedBranchId,
      staffCode: staffCode.trim() || undefined,
      fullName: regFullName.trim() || undefined,
      phone: staffPhone.trim() || undefined,
    });
    setIsGoogleLoading(false);
    if (!res.success && res.error) {
      setLoginError(res.error);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginStatus(null);

    if (phlebAuthMethod === 'EMAIL_OTP') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffEmail.trim())) {
        setLoginError('Enter a valid courier email address for real-time OTP.');
        return;
      }
      setIsLoggingIn(true);
      if (!emailOtpSent) {
        const res = await sendEmailOtp(staffEmail.trim(), 'phlebotomist');
        setIsLoggingIn(false);
        if (res.success) {
          setEmailOtpSent(true);
          setLoginStatus(res.message || `6-digit code sent to ${staffEmail.trim()}`);
        } else {
          setLoginError(res.error || 'Failed to dispatch Email OTP');
        }
        return;
      }
      const res = await verifyEmailOtp({
        email: staffEmail.trim(),
        otp: emailOtpCode,
        portal: 'phlebotomist',
        name: regFullName.trim() || undefined,
        phone: staffPhone.trim() || undefined,
        labId: selectedLabId,
        branchId: selectedBranchId,
        staffCode: staffCode.trim() || undefined,
      });
      setIsLoggingIn(false);
      if (!res.success) setLoginError(res.error || 'Email verification failed');
      return;
    }

    if (regCnicLast4.trim().length !== 4) {
      setLoginError('Enter the last 4 digits of your registered CNIC.');
      return;
    }
    setIsLoggingIn(true);
    const res = await loginPhlebotomist(
      staffCode.trim(),
      staffPhone.trim(),
      regCnicLast4.trim(),
      selectedLabId,
      selectedBranchId
    );
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Authentication failed');
    }
  };

  const handleStaffRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginStatus(null);
    if (phlebAuthMethod === 'EMAIL_OTP') {
      return handleStaffLogin(e);
    }
    setIsLoggingIn(true);
    const res = await registerPhlebotomist({
      fullName: regFullName.trim(),
      staffCode: staffCode.trim(),
      phone: staffPhone.trim(),
      cnicLast4: regCnicLast4.trim(),
      labId: selectedLabId,
      branchId: selectedBranchId,
    });
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Courier registration failed');
    }
  };

  const handleStatusTransition = async (
    bookingId: string,
    newStatus: MockBooking['status'],
    courierStatus: NonNullable<MockBooking['phlebotomistStatus']>,
    barcode?: string
  ) => {
    setActionError(null);
    setActionSuccess(null);

    if (courierStatus === 'SAMPLE_COLLECTED' && !fastingVerified) {
      setActionError('Please verify patient fasting status before confirming blood draw.');
      return;
    }
    if (courierStatus === 'SAMPLE_COLLECTED' && (!barcode || barcode.trim().length < 6)) {
      setActionError('Scan or enter a 6+ character Vacutainer Barcode before sealing specimen.');
      return;
    }
    if (coldBoxTemp < 2.0 || coldBoxTemp > 8.0) {
      setActionError(`Cold-chain violation (${coldBoxTemp}°C). Must be strictly 2.0°C – 8.0°C.`);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await apiClient.updateBookingStatus(
        bookingId,
        newStatus,
        phlebUser?.name,
        {
          phlebotomistStatus: courierStatus,
          sampleBarcode: barcode || barcodeInput || undefined,
          coldChainTempCelsius: coldBoxTemp,
          fastingConfirmed: fastingVerified,
        },
        'phlebotomist'
      );

      if (res.success && res.data) {
        setActionSuccess(`Live patient tracker updated: ${courierStatus.replace(/_/g, ' ')}`);
        setAssignedBookings((prev) => prev.map((b) => (b.id === bookingId ? res.data : b)));
        setActiveBooking(res.data);
        if (courierStatus === 'SAMPLE_COLLECTED') {
          setBarcodeInput('');
          setFastingVerified(false);
        }
      } else {
        setActionError(res.error || 'Failed to update status');
      }
    } catch {
      setActionError('Network error updating courier status');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredQueue = useMemo(() => {
    return assignedBookings.filter((b) => {
      const isDone = b.phlebotomistStatus === 'RECEIVED_AT_LAB' || b.status === 'COMPLETED';
      if (queueFilter === 'ACTIVE') return !isDone;
      if (queueFilter === 'DONE') return isDone;
      return true;
    });
  }, [assignedBookings, queueFilter]);

  const completedStopsCount = useMemo(
    () =>
      assignedBookings.filter(
        (b) => b.phlebotomistStatus === 'RECEIVED_AT_LAB' || b.status === 'COMPLETED'
      ).length,
    [assignedBookings]
  );

  const collectedOrInTransitCount = useMemo(
    () =>
      assignedBookings.filter((b) =>
        ['SAMPLE_COLLECTED', 'IN_TRANSIT', 'RECEIVED_AT_LAB'].includes(b.phlebotomistStatus || '')
      ).length,
    [assignedBookings]
  );

  if (!authReady) {
    return <AuthSessionLoader label="Verifying Phlebotomist route session..." />;
  }

  if (!phlebUser) {
    return (
      <PortalAuthShell
        portalTag="Phlebotomist Field Courier App"
        headline="Cold-Chain Home Sampling & Dispatch"
        subheadline="Sign in with your verified rider code, 4-digit CNIC suffix, and registered mobile number to execute Lahore doorstep collections within 2.0°C–8.0°C."
        icon={<Bike className="w-4 h-4" />}
        visualImageUrl={coldChainImg}
        visualImageAlt="LabConnect insulated cold-chain blood specimen capsule"
        highlights={[
          {
            label: 'Insulated Carrier Monitoring',
            value: '2.0°C – 8.0°C Enforced',
            meta: 'Thermal',
            icon: <Thermometer className="w-4 h-4" />,
          },
          {
            label: 'Vacutainer Sealing',
            value: '6+ Char Barcode & Fasting Check',
            meta: 'Chain',
            icon: <QrCode className="w-4 h-4" />,
          },
          {
            label: 'Lahore Street Dispatch',
            value: 'Branch-Assigned Route Stops',
            meta: 'GPS Route',
            icon: <Navigation className="w-4 h-4" />,
          },
        ]}
        checklist={[
          'Scoped strictly to your assigned laboratory hub',
          'Real-time status synced directly to patient tracker',
          'Tamper-safe chain-of-custody specimen timestamps',
        ]}
        footerNote="Lahore Field Dispatch Portal"
      >
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#087F8C]">
            Courier 3-Factor Authentication
          </span>
          <h2 className="text-2xl font-extrabold text-[#172C32] tracking-tight">
            {authTab === 'SIGN_IN' ? 'Phlebotomist Sign In' : 'Register Field Agent'}
          </h2>
          <p className="text-xs text-[#556B70]">
            Authenticate with your Rider Staff Code, 4-digit CNIC suffix, and registered +92 mobile number.
          </p>
        </div>

        <AnimatedTabBar
          layoutId="phleb-auth-tab"
          activeId={authTab}
          onChange={(t) => {
            setAuthTab(t);
            setLoginError(null);
            setLoginStatus(null);
            setEmailOtpSent(false);
          }}
          className="w-full grid grid-cols-2"
          items={[
            { id: 'SIGN_IN', label: 'Courier Sign In' },
            { id: 'SIGN_UP', label: 'Register Agent' },
          ]}
        />

        <GoogleOAuthButton
          label={authTab === 'SIGN_IN' ? 'Sign in with Google' : 'Register Courier with Google'}
          loading={isGoogleLoading}
          onClick={handlePhlebGoogleAuth}
        />

        <OAuthOrDivider text="or real-time email OTP / rider code" />

        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl text-[11px]">
          <button
            type="button"
            onClick={() => {
              setPhlebAuthMethod('EMAIL_OTP');
              setLoginError(null);
            }}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              phlebAuthMethod === 'EMAIL_OTP' ? 'bg-white text-[#073B43] shadow-2xs' : 'text-[#556B70]'
            }`}
          >
            Real-Time Email OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setPhlebAuthMethod('STAFF_CODE');
              setEmailOtpSent(false);
              setLoginError(null);
            }}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              phlebAuthMethod === 'STAFF_CODE' ? 'bg-white text-[#073B43] shadow-2xs' : 'text-[#556B70]'
            }`}
          >
            Rider Code + CNIC
          </button>
        </div>

        <AuthErrorBanner message={loginError} />

        {loginStatus && (
          <div className="bg-[#D9E9E5]/70 border border-[#087F8C]/25 text-[#073B43] p-3 rounded-xl text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#087F8C] shrink-0 mt-0.5" />
            <span>{loginStatus}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.form
            key={`${authTab}-${phlebAuthMethod}`}
            initial={{ opacity: 0, x: authTab === 'SIGN_IN' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: authTab === 'SIGN_IN' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            onSubmit={authTab === 'SIGN_IN' ? handleStaffLogin : handleStaffRegister}
            className="space-y-3.5 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#172C32] mb-1.5">Parent Laboratory</label>
                <select
                  value={selectedLabId}
                  onChange={(e) => {
                    const nid = e.target.value;
                    setSelectedLabId(nid);
                    const lab = laboratories.find((l) => l.id === nid);
                    if (lab && lab.branches.length > 0) setSelectedBranchId(lab.branches[0].id);
                  }}
                  className="w-full bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white transition-colors min-h-[42px]"
                >
                  {laboratories.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name}
                    </option>
                  ))}
                </select>
              </div>
              {availableBranches.length > 0 && (
                <div>
                  <label className="block font-semibold text-[#172C32] mb-1.5">Dispatch Hub</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white transition-colors min-h-[42px]"
                  >
                    {availableBranches.map((br) => (
                      <option key={br.id} value={br.id}>
                        {br.name} ({br.area})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {authTab === 'SIGN_UP' && (
              <div>
                <label className="block font-semibold text-[#172C32] mb-1.5">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Usman Ali"
                  className="w-full bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white transition-colors min-h-[42px]"
                />
              </div>
            )}

            {phlebAuthMethod === 'STAFF_CODE' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172C32] mb-1.5">Rider Staff Code</label>
                  <div className="flex items-center bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white transition-all">
                    <QrCode className="w-4 h-4 text-[#087F8C] shrink-0" />
                    <input
                      type="text"
                      required
                      value={staffCode}
                      onChange={(e) => setStaffCode(e.target.value)}
                      placeholder="MOTO-04"
                      className="w-full bg-transparent px-2.5 py-2.5 font-mono font-semibold text-[#172C32] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-[#172C32] mb-1.5">CNIC Last 4 Digits</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    required
                    maxLength={4}
                    value={regCnicLast4}
                    onChange={(e) => setRegCnicLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white transition-colors min-h-[42px]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-[#172C32] mb-1.5">Rider Staff Code (Optional)</label>
                <div className="flex items-center bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white transition-all">
                  <QrCode className="w-4 h-4 text-[#087F8C] shrink-0" />
                  <input
                    type="text"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    placeholder="e.g. MOTO-04"
                    className="w-full bg-transparent px-2.5 py-2.5 font-mono font-semibold text-[#172C32] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {phlebAuthMethod === 'EMAIL_OTP' && (
              <div>
                <label className="block font-semibold text-[#172C32] mb-1.5">Courier Email Address</label>
                <div className="flex items-center bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white transition-all">
                  <Mail className="w-4 h-4 text-[#087F8C] shrink-0" />
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="courier@labconnect.pk"
                    className="w-full bg-transparent px-2.5 py-2.5 text-[#172C32] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#172C32] mb-1.5">
                Registered Mobile (+92){phlebAuthMethod === 'EMAIL_OTP' && authTab === 'SIGN_IN' ? ' (Optional)' : ''}
              </label>
              <div className="flex items-center bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white transition-all">
                <Phone className="w-4 h-4 text-[#087F8C] shrink-0" />
                <input
                  type="text"
                  required={phlebAuthMethod === 'STAFF_CODE' || authTab === 'SIGN_UP'}
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  placeholder="+92 3XX XXXXXXX"
                  className="w-full bg-transparent px-2.5 py-2.5 font-mono text-[#172C32] focus:outline-none"
                />
              </div>
            </div>

            {phlebAuthMethod === 'EMAIL_OTP' && emailOtpSent && (
              <div>
                <label className="block font-semibold text-[#172C32] mb-1.5">6-Digit Email Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={emailOtpCode}
                  onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  className="w-full text-center tracking-[0.4em] text-xl font-mono font-bold bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl p-3 text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white"
                />
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isLoggingIn}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              className="w-full py-3 bg-[#B9ED69] hover:brightness-95 text-[#172C32] rounded-xl font-bold min-h-[46px] flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-xs"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : authTab === 'SIGN_UP' ? (
                <UserPlus className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>
                {isLoggingIn
                  ? 'Verifying Courier...'
                  : phlebAuthMethod === 'EMAIL_OTP'
                  ? emailOtpSent
                    ? 'Verify Email Code & Open Route'
                    : 'Send 6-Digit Email OTP'
                  : authTab === 'SIGN_IN'
                  ? 'Open Field Route'
                  : 'Register & Activate Courier'}
              </span>
            </motion.button>
          </motion.form>
        </AnimatePresence>

        <div className="pt-3 border-t border-[#D9E9E5] text-[11px] text-[#556B70]">
          All home collection samples require mandatory fasting confirmation and 2.0°C–8.0°C thermal verification.
        </div>
      </PortalAuthShell>
    );
  }

  const riderLab = laboratories.find((l) => l.id === phlebUser.labId);
  const riderBranch = riderLab?.branches.find((b) => b.id === phlebUser.branchId) || riderLab?.branches[0];
  const isTempSafe = coldBoxTemp >= 2.0 && coldBoxTemp <= 8.0;
  const tempMeterPct = Math.max(8, Math.min(95, (coldBoxTemp / 10) * 100));
  const routeProgressPct =
    assignedBookings.length > 0 ? Math.round((completedStopsCount / assignedBookings.length) * 100) : 0;

  return (
    <div className="py-6 sm:py-8 px-4 md:px-6 max-w-7xl mx-auto space-y-6">
      {/* Rider Gradient Command Header + Live Cold-Box Telemetry */}
      <div className="lc-gradient-midnight text-white rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-[0_24px_60px_-24px_rgba(7,59,67,0.45)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 w-72 h-72 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #21D4C2 0%, transparent 70%)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 min-w-0">
            <div className="text-[11px] font-mono font-semibold text-[#21D4C2] uppercase tracking-wider">
              {riderLab?.name || 'Laboratory Hub'} · {phlebUser.staffCode || 'COURIER'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
              {phlebUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#D9E9E5]/85 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0 text-[#B9ED69]" />
              <span className="truncate">
                Dispatch Hub: {riderBranch ? `${riderBranch.name}, ${riderBranch.address}` : phlebUser.area}
              </span>
            </p>
          </div>

          {/* Interactive Cold-Box Sensor Card */}
          <div className="lc-glass-dark border border-white/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 min-w-[300px] lg:min-w-[360px]">
            <div className="flex items-center gap-3.5 flex-1">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isTempSafe ? 'bg-[#B9ED69] text-[#172C32]' : 'bg-[#FF927E] text-[#172C32]'
                }`}
              >
                <Thermometer className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#D9E9E5]/80 font-medium">Cold Capsule Probe</span>
                  <span
                    className={`font-mono font-bold ${
                      isTempSafe ? 'text-[#B9ED69]' : 'text-[#FF927E]'
                    }`}
                  >
                    {isTempSafe ? '2.0–8.0°C SAFE' : 'THERMAL ALERT'}
                  </span>
                </div>
                <div className="text-xl font-extrabold font-mono text-white tabular-nums mt-0.5">
                  {coldBoxTemp.toFixed(1)}°C
                </div>
                <div className="mt-1.5 h-1.5 bg-white/15 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${tempMeterPct}%` }}
                    transition={{ duration: 0.35, ease: LC_EASE }}
                    className={`h-full rounded-full ${isTempSafe ? 'bg-[#21D4C2]' : 'bg-[#FF927E]'}`}
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setColdBoxTemp(+(2.6 + Math.random() * 3.8).toFixed(1))}
              className="px-4 py-2.5 bg-[#B9ED69] hover:brightness-95 text-[#172C32] rounded-xl text-xs font-bold min-h-[44px] shrink-0 transition-all cursor-pointer whitespace-nowrap"
            >
              Read Sensor
            </button>
          </div>
        </div>
      </div>

      {/* Operational KPI Bento Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiMetricCard
          label="Assigned Pickups"
          value={assignedBookings.length}
          meta={`${assignedBookings.length - completedStopsCount} active stops`}
          icon={<Bike className="w-4 h-4" />}
          tone="ocean"
        />
        <KpiMetricCard
          label="Specimens Sealed"
          value={collectedOrInTransitCount}
          meta="Verified barcode + fasting"
          icon={<FlaskConical className="w-4 h-4" />}
          tone="teal"
        />
        <KpiMetricCard
          label="Handed Over"
          value={completedStopsCount}
          meta={`${routeProgressPct}% route completion`}
          icon={<FileCheck className="w-4 h-4" />}
          tone="lime"
        />
        <div className="bg-white border border-[#D9E9E5] rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
          <div>
            <div className="text-xs font-semibold text-[#556B70]">Route Completion</div>
            <div className="text-sm font-bold text-[#172C32] mt-1">
              {completedStopsCount} / {assignedBookings.length} Stops
            </div>
            <div className="text-[11px] font-mono text-[#556B70] mt-0.5">Live Lab Sync</div>
          </div>
          <RadialGaugeRing
            percentage={routeProgressPct}
            size={62}
            strokeWidth={6}
            label=""
            color={routeProgressPct === 100 ? '#B9ED69' : '#21D4C2'}
          />
        </div>
      </div>

      {/* Queue + Thumb-Friendly Execution Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white border border-[#D9E9E5] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#D9E9E5]">
            <div>
              <h2 className="text-sm font-bold text-[#172C32]">
                Home Collection Stops ({filteredQueue.length})
              </h2>
              <p className="text-[11px] text-[#556B70]">Tap a stop to run checkpoints</p>
            </div>
            <button
              type="button"
              onClick={fetchPhlebotomistQueue}
              className="px-3 py-2 bg-[#F3F7F4] hover:bg-[#D9E9E5]/60 border border-[#D9E9E5] rounded-xl text-xs text-[#073B43] font-semibold flex items-center gap-1.5 min-h-[40px] transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#F3F7F4] rounded-xl border border-[#D9E9E5]">
            {(['ALL', 'ACTIVE', 'DONE'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setQueueFilter(tab)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors min-h-[38px] whitespace-nowrap ${
                  queueFilter === tab
                    ? 'bg-[#073B43] text-white'
                    : 'text-[#556B70] hover:text-[#172C32]'
                }`}
              >
                {tab === 'ALL' ? 'All Stops' : tab === 'ACTIVE' ? 'Pending Draw' : 'Handed Over'}
              </button>
            ))}
          </div>

          {isLoading && assignedBookings.length === 0 ? (
            <div className="space-y-2.5">
              <SkeletonBlock className="h-24 w-full rounded-xl" />
              <SkeletonBlock className="h-24 w-full rounded-xl" />
            </div>
          ) : filteredQueue.length === 0 ? (
            <div className="bg-[#F3F7F4] border border-dashed border-[#C8DDD7] rounded-2xl p-8 text-center text-xs text-[#556B70]">
              No home sampling pickups match this filter for {riderLab?.name || 'your laboratory'}.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredQueue.map((b) => {
                const isSelected = activeBooking?.id === b.id;
                const rawStage = b.status === 'CANCELLED' ? 'Cancelled' : b.phlebotomistStatus || b.status;
                const stageLabel = rawStage
                  .replace(/_/g, ' ')
                  .toLowerCase()
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <motion.button
                    key={b.id}
                    type="button"
                    whileHover={{ y: -1 }}
                    onClick={() => {
                      setActiveBooking(b);
                      setActionError(null);
                      setActionSuccess(null);
                    }}
                    className={`w-full text-left border rounded-2xl p-4 text-xs space-y-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#D9E9E5]/45 border-[#087F8C] shadow-[0_8px_20px_-12px_rgba(8,127,140,0.4)]'
                        : 'bg-white border-[#D9E9E5] hover:bg-[#F3F7F4]/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[#172C32] truncate">{b.patientName}</span>
                      <span
                        className={`font-mono text-[11px] font-bold shrink-0 ${
                          b.status === 'CANCELLED' ? 'text-[#9C2A1A]' : 'text-[#087F8C]'
                        }`}
                      >
                        {stageLabel}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-[#556B70] flex items-center gap-2">
                      <span>{b.bookingNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {b.scheduledTimeSlot}
                      </span>
                    </div>
                    <div className="text-[#556B70] flex items-start gap-1.5 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#087F8C]" />
                      <span className="line-clamp-2">{b.streetAddress || b.patientArea}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {activeBooking ? (
              <motion.div
                key={activeBooking.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="bg-white border border-[#D9E9E5] rounded-2xl p-5 sm:p-6 space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-[#D9E9E5] pb-4 gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="font-mono text-xs font-bold text-[#087F8C]">
                      {activeBooking.bookingNumber} · {activeBooking.scheduledTimeSlot}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[#172C32] tracking-tight">
                      {activeBooking.patientName}
                    </h2>
                    <p className="text-xs text-[#556B70] flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#087F8C]" />
                      <span>{activeBooking.streetAddress || activeBooking.patientArea}</span>
                    </p>
                  </div>
                  <a
                    href={`tel:${activeBooking.patientPhone}`}
                    className="px-4 py-2.5 bg-[#087F8C] hover:bg-[#073B43] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 min-h-[44px] shrink-0 transition-colors whitespace-nowrap"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call {activeBooking.patientPhone}</span>
                  </a>
                </div>

                <div>
                  <div className="text-xs font-bold text-[#556B70] uppercase tracking-wider mb-2.5">
                    Specimens Ordered ({activeBooking.testIds.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeBooking.testIds.map((tid) => {
                      const t = tests.find((item) => item.id === tid);
                      return (
                        <div
                          key={tid}
                          className="text-xs bg-[#F3F7F4] border border-[#D9E9E5] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2"
                        >
                          <span className="font-semibold text-[#172C32] truncate">
                            {t ? t.name : tid}
                          </span>
                          {t && (
                            <span className="font-mono text-[10px] text-[#087F8C] shrink-0">
                              {t.sampleType}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <ToastBanner
                  message={actionError}
                  variant="warning"
                  onDismiss={() => setActionError(null)}
                />
                <ToastBanner
                  message={actionSuccess}
                  variant="success"
                  onDismiss={() => setActionSuccess(null)}
                />

                {activeBooking.status === 'CANCELLED' && (
                  <div className="bg-[#FF927E]/20 border border-[#FF927E] text-[#172C32] rounded-xl p-3.5 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#9C2A1A] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#9C2A1A]">Stop Cancelled: </span>
                      This pickup was cancelled. Collection checkpoints are locked—select an active pending stop from your queue.
                    </div>
                  </div>
                )}

                {/* Steps 1 & 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(activeBooking.id, 'DISPATCHED', 'EN_ROUTE')}
                    disabled={isUpdating || activeBooking.status === 'CANCELLED'}
                    className={`p-4 rounded-2xl border text-left text-xs min-h-[56px] transition-all active:scale-[0.99] flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                      activeBooking.phlebotomistStatus === 'EN_ROUTE'
                        ? 'bg-[#D9E9E5]/60 border-[#087F8C]'
                        : 'bg-[#F3F7F4] border-[#D9E9E5] hover:border-[#087F8C]'
                    }`}
                  >
                    <div className="font-bold text-[#172C32] flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#073B43] text-[#21D4C2] flex items-center justify-center shrink-0">
                        <Navigation className="w-4 h-4" />
                      </span>
                      <span>1. Mark En Route</span>
                    </div>
                    {activeBooking.phlebotomistStatus === 'EN_ROUTE' && (
                      <CheckCircle2 className="w-4 h-4 text-[#087F8C] shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusTransition(activeBooking.id, 'DISPATCHED', 'ARRIVED')}
                    disabled={isUpdating || activeBooking.status === 'CANCELLED'}
                    className={`p-4 rounded-2xl border text-left text-xs min-h-[56px] transition-all active:scale-[0.99] flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                      activeBooking.phlebotomistStatus === 'ARRIVED'
                        ? 'bg-[#D9E9E5]/60 border-[#087F8C]'
                        : 'bg-[#F3F7F4] border-[#D9E9E5] hover:border-[#087F8C]'
                    }`}
                  >
                    <div className="font-bold text-[#172C32] flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#A5B9FF]/40 text-[#073B43] flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <span>2. Arrived at Door</span>
                    </div>
                    {activeBooking.phlebotomistStatus === 'ARRIVED' && (
                      <CheckCircle2 className="w-4 h-4 text-[#087F8C] shrink-0" />
                    )}
                  </button>
                </div>

                {/* Step 3 Fasting & Vacutainer Sealing */}
                <div className="bg-[#F3F7F4] border border-[#C8DDD7] rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-[#172C32] flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-[#087F8C]" />
                      <span>3. Fasting Verification &amp; Vacutainer Seal</span>
                    </div>
                    {activeBooking.sampleBarcode && (
                      <span className="font-mono text-[11px] font-bold text-[#087F8C]">
                        {activeBooking.sampleBarcode}
                      </span>
                    )}
                  </div>

                  <label className="flex items-start gap-3 bg-white border border-[#D9E9E5] p-3.5 rounded-xl cursor-pointer min-h-[48px]">
                    <input
                      type="checkbox"
                      checked={fastingVerified}
                      disabled={activeBooking.status === 'CANCELLED'}
                      onChange={(e) => setFastingVerified(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#087F8C]"
                    />
                    <span className="text-xs font-medium text-[#172C32]">
                      Confirmed patient fasting window and vacutainer tube identity label match.
                    </span>
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={barcodeInput}
                      disabled={activeBooking.status === 'CANCELLED'}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="VAC-LHR-98214"
                      className="flex-1 bg-white border border-[#D9E9E5] rounded-xl px-3.5 py-2.5 font-mono font-semibold text-[#172C32] min-h-[46px] focus:outline-none focus:border-[#087F8C] disabled:opacity-50"
                    />
                    <button
                      type="button"
                      disabled={activeBooking.status === 'CANCELLED'}
                      onClick={() => setBarcodeInput(`VAC-LHR-${Math.floor(10000 + Math.random() * 90000)}`)}
                      className="px-4 py-2 bg-[#A5B9FF]/35 hover:bg-[#A5B9FF]/55 border border-[#A5B9FF]/60 rounded-xl font-bold text-[#172C32] min-h-[46px] transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                      Scan / Gen
                    </button>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.985 }}
                    onClick={() =>
                      handleStatusTransition(activeBooking.id, 'SAMPLE_COLLECTED', 'SAMPLE_COLLECTED', barcodeInput)
                    }
                    disabled={isUpdating || activeBooking.status === 'CANCELLED'}
                    className="w-full py-3 bg-[#B9ED69] hover:brightness-95 text-[#172C32] rounded-xl font-bold min-h-[48px] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Confirm Sample Collected &amp; Sealed ({coldBoxTemp.toFixed(1)}°C)</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Steps 4 & 5 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleStatusTransition(activeBooking.id, 'PROCESSING', 'IN_TRANSIT')}
                    disabled={isUpdating || activeBooking.status === 'CANCELLED'}
                    className={`p-4 rounded-2xl border text-left text-xs min-h-[56px] transition-all active:scale-[0.99] flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                      activeBooking.phlebotomistStatus === 'IN_TRANSIT'
                        ? 'bg-[#D9E9E5]/60 border-[#087F8C]'
                        : 'bg-[#F3F7F4] border-[#D9E9E5] hover:border-[#087F8C]'
                    }`}
                  >
                    <div className="font-bold text-[#172C32] flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#21D4C2]/25 text-[#073B43] flex items-center justify-center shrink-0">
                        <Bike className="w-4 h-4" />
                      </span>
                      <span>4. In Cold-Chain Transit</span>
                    </div>
                    {activeBooking.phlebotomistStatus === 'IN_TRANSIT' && (
                      <CheckCircle2 className="w-4 h-4 text-[#087F8C] shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusTransition(activeBooking.id, 'PROCESSING', 'RECEIVED_AT_LAB')}
                    disabled={isUpdating || activeBooking.status === 'CANCELLED'}
                    className={`p-4 rounded-2xl border text-left text-xs min-h-[56px] transition-all active:scale-[0.99] flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                      activeBooking.phlebotomistStatus === 'RECEIVED_AT_LAB'
                        ? 'bg-[#B9ED69]/40 border-[#087F8C]'
                        : 'bg-[#F3F7F4] border-[#D9E9E5] hover:border-[#087F8C]'
                    }`}
                  >
                    <div className="font-bold text-[#172C32] flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-[#B9ED69]/60 text-[#172C32] flex items-center justify-center shrink-0">
                        <FileCheck className="w-4 h-4" />
                      </span>
                      <span>5. Handed Over to Lab Desk</span>
                    </div>
                    {activeBooking.phlebotomistStatus === 'RECEIVED_AT_LAB' && (
                      <CheckCircle2 className="w-4 h-4 text-[#087F8C] shrink-0" />
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-[#D9E9E5] rounded-2xl p-12 text-center text-xs text-[#556B70]">
                Select a pickup stop from the queue on the left to execute field checkpoints.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
