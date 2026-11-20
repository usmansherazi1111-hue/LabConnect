/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MockBooking,
  LahoreLaboratory,
  DiagnosticTest,
  LaboratoryTestPricing,
  ReportParameter,
  LabPhlebotomistSummary,
  NotificationRecord,
  SettlementPayoutRecord,
} from '../types';
import { apiClient, triggerBlobDownload } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  CheckCircle2,
  Upload,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  Settings,
  RotateCw,
  Lock,
  UserPlus,
  Mail,
  ExternalLink,
  Bike,
  Plus,
  Bell,
  Wallet,
  Trash2,
  ClipboardList,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Download,
  Users,
} from 'lucide-react';
import { AnimatedModal, AnimatedTabBar, LC_EASE, SkeletonBlock } from './ui/MotionPrimitives';
import { PortalAuthShell, AuthErrorBanner, AuthSessionLoader } from './ui/PortalAuthShell';
import { GoogleOAuthButton, OAuthOrDivider } from './ui/OAuthSignInBar';
import {
  AnimatedBarChart,
  KpiMetricCard,
  RadialGaugeRing,
  SlideOverDrawer,
  ToastBanner,
} from './ui/DataVisuals';
import { AnimatePresence, motion } from 'motion/react';
import heroNexusImg from '../assets/images/hero_diagnostic_nexus_1795109387233.jpg';

export const LabPortalPreview: React.FC = () => {
  const { authReady, labUser, loginLabStaff, registerLabStaff, signInWithGoogle, sendEmailOtp, verifyEmailOtp } = useAuth();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Live Catalog State
  const [laboratories, setLaboratories] = useState<LahoreLaboratory[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [pricings, setPricings] = useState<LaboratoryTestPricing[]>([]);

  // Gate State
  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [labAuthMethod, setLabAuthMethod] = useState<'PASSWORD' | 'EMAIL_OTP'>('PASSWORD');
  const [selectedLabId, setSelectedLabId] = useState<string>('lab-chughtai');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('c-branch-jailrd');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [regFullName, setRegFullName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [emailOtpSent, setEmailOtpSent] = useState<boolean>(false);
  const [emailOtpCode, setEmailOtpCode] = useState<string>('');
  const [loginStatus, setLoginStatus] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);

  // Operations Workspace State
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [bookings, setBookings] = useState<MockBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<MockBooking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilterMode, setBranchFilterMode] = useState<'ALL_BRANCHES' | 'MY_BRANCH'>('ALL_BRANCHES');
  const [activeSubTab, setActiveSubTab] = useState<'QUEUE' | 'TARIFFS' | 'COURIERS' | 'ANALYTICS'>('QUEUE');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Structured PDF Report & Email Release State
  const [pathologistName, setPathologistName] = useState<string>('');
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    'Analyzed on calibrated automated clinical chemistry & hematology analyzers. Correlate with clinical findings.'
  );
  const [reportParams, setReportParams] = useState<ReportParameter[]>([]);
  const [sendEmailOnRelease, setSendEmailOnRelease] = useState<boolean>(true);
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadErrorMsg, setUploadErrorMsg] = useState<string | null>(null);
  const [isSendingEmailOnly, setIsSendingEmailOnly] = useState<boolean>(false);
  const [emailOnlySuccess, setEmailOnlySuccess] = useState<string | null>(null);
  const [emailOnlyError, setEmailOnlyError] = useState<string | null>(null);

  // Phlebotomist Dispatch State
  const [labRiders, setLabRiders] = useState<LabPhlebotomistSummary[]>([]);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [dispatchMsg, setDispatchMsg] = useState<string | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);
  const [isDispatchingRider, setIsDispatchingRider] = useState<boolean>(false);

  // Live Tariff & Branch Config Edit State
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState<string>('');
  const [editTatVal, setEditTatVal] = useState<string>('');
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editBranchHours, setEditBranchHours] = useState<string>('');
  const [editBranchFee, setEditBranchFee] = useState<string>('');
  const [pendingDeletePricingId, setPendingDeletePricingId] = useState<string | null>(null);
  const [pendingDeleteBranchId, setPendingDeleteBranchId] = useState<string | null>(null);
  const [pendingDeleteBookingId, setPendingDeleteBookingId] = useState<string | null>(null);
  const [labOpsMsg, setLabOpsMsg] = useState<string | null>(null);
  const [labOpsError, setLabOpsError] = useState<string | null>(null);

  // Add Tariff / Custom Panel / Branch State
  const [showAddTariff, setShowAddTariff] = useState<boolean>(false);
  const [newTariffTestId, setNewTariffTestId] = useState<string>('');
  const [newTariffPrice, setNewTariffPrice] = useState<string>('1500');
  const [newTariffDiscount, setNewTariffDiscount] = useState<string>('');
  const [newTariffTat, setNewTariffTat] = useState<string>('12');
  const [showCustomPanelForm, setShowCustomPanelForm] = useState<boolean>(false);
  const [panelCode, setPanelCode] = useState<string>('');
  const [panelName, setPanelName] = useState<string>('');
  const [panelCategory, setPanelCategory] = useState<DiagnosticTest['category']>('BIOCHEMISTRY');
  const [panelSampleType, setPanelSampleType] = useState<DiagnosticTest['sampleType']>('Serum (Plain/Gel)');
  const [panelFasting, setPanelFasting] = useState<string>('0');
  const [panelNormalRange, setPanelNormalRange] = useState<string>('Within Clinical Reference');
  const [panelPrice, setPanelPrice] = useState<string>('2200');
  const [panelTat, setPanelTat] = useState<string>('12');
  const [showAddBranch, setShowAddBranch] = useState<boolean>(false);
  const [branchName, setBranchName] = useState<string>('');
  const [branchArea, setBranchArea] = useState<string>('DHA Phase 6');
  const [branchAddress, setBranchAddress] = useState<string>('');
  const [branchPhone, setBranchPhone] = useState<string>('');
  const [branchHours, setBranchHours] = useState<string>('07:30 AM - 10:30 PM');
  const [branchFee, setBranchFee] = useState<string>('0');
  const [isSavingLabEntity, setIsSavingLabEntity] = useState<boolean>(false);

  // Settlements & Notifications State
  const [labNotifications, setLabNotifications] = useState<NotificationRecord[]>([]);
  const [unreadLabNotifs, setUnreadLabNotifs] = useState<number>(0);
  const [showLabNotifs, setShowLabNotifs] = useState<boolean>(false);
  const [settlementSummary, setSettlementSummary] = useState<{
    subscriptionTier: string;
    monthlySaasFeePkr: number;
    commissionRatePct: number;
    unsettledBookingsCount: number;
    unsettledGrossPkr: number;
    unsettledCommissionPkr: number;
    unsettledNetPayablePkr: number;
    settlementHistory: SettlementPayoutRecord[];
  } | null>(null);

  // Authenticated PDF Preview Modal State
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewBookingNum, setPdfPreviewBookingNum] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  const handleClosePdfModal = useCallback(() => {
    setPdfPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPdfPreviewBookingNum(null);
  }, []);

  const handleOpenPdfModal = useCallback(async (bookingNumber: string) => {
    setIsLoadingPdf(true);
    setEmailOnlyError(null);
    try {
      const blob = await apiClient.fetchReportPdfBlob(bookingNumber, false, 'lab');
      const nextUrl = URL.createObjectURL(blob);
      setPdfPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
      setPdfPreviewBookingNum(bookingNumber);
    } catch {
      setEmailOnlyError('Unable to load clinical PDF report. Please refresh and try again.');
    } finally {
      setIsLoadingPdf(false);
    }
  }, []);

  const handleDownloadPdf = useCallback(async (bookingNumber: string) => {
    try {
      const blob = await apiClient.fetchReportPdfBlob(bookingNumber, true, 'lab');
      triggerBlobDownload(blob, `LabConnect-${bookingNumber}.pdf`);
    } catch {
      setEmailOnlyError('Unable to download clinical PDF report.');
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    try {
      const res = await apiClient.getCatalog();
      if (res.success && res.data) {
        setLaboratories(res.data.laboratories || []);
        setTests(res.data.tests || []);
        setPricings(res.data.pricings || []);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    }
  }, []);

  const fetchLiveBookings = useCallback(async () => {
    if (!labUser) return;
    setIsLoading(true);
    try {
      const [bkRes, ridersRes, notifRes, setRes] = await Promise.all([
        apiClient.getBookings({}, 'lab'),
        apiClient.getLabPhlebotomists(),
        apiClient.getNotifications('lab'),
        apiClient.getLabSettlements(),
      ]);
      if (bkRes.success && Array.isArray(bkRes.data)) {
        setBookings(bkRes.data);
        if (bkRes.data.length > 0) {
          setSelectedBooking((prev) => bkRes.data.find((b: MockBooking) => b.id === prev?.id) || bkRes.data[0]);
        } else {
          setSelectedBooking(null);
        }
      }
      if (ridersRes.success && Array.isArray(ridersRes.data)) {
        setLabRiders(ridersRes.data);
        if (ridersRes.data.length > 0) {
          setSelectedRiderId((prev) =>
            ridersRes.data.some((r: LabPhlebotomistSummary) => r.id === prev) ? prev : ridersRes.data[0].id
          );
        }
      }
      if (notifRes.success && Array.isArray(notifRes.data)) {
        setLabNotifications(notifRes.data);
        setUnreadLabNotifs(notifRes.unreadCount || 0);
      }
      if (setRes.success && setRes.data) {
        setSettlementSummary(setRes.data);
      }
    } catch (err) {
      console.error('Failed to load lab bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [labUser]);

  useEffect(() => {
    loadCatalog();
    const onFocus = () => loadCatalog();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadCatalog]);

  useEffect(() => {
    if (labUser) {
      setPathologistName(`${labUser.name}, FCPS Pathology`);
      fetchLiveBookings();
    } else {
      setBookings([]);
      setSelectedBooking(null);
      setLabRiders([]);
    }
  }, [labUser, fetchLiveBookings]);

  useEffect(() => {
    if (selectedBooking) {
      setRecipientEmail(selectedBooking.patientEmail || '');
      const initialParams: ReportParameter[] = [];
      for (const tid of selectedBooking.testIds) {
        const testDef = tests.find((t) => t.id === tid);
        if (testDef?.defaultParameters?.length) {
          for (const dp of testDef.defaultParameters) {
            initialParams.push({
              parameter: dp.parameter,
              observedValue: dp.defaultValue,
              unit: dp.unit,
              referenceRange: dp.referenceRange,
              flag: dp.flag,
            });
          }
        } else if (testDef) {
          initialParams.push({
            parameter: testDef.name,
            observedValue: 'Within Reference',
            unit: 'Std',
            referenceRange: testDef.commonNormalRange.slice(0, 32),
            flag: 'NORMAL',
          });
        }
      }
      setReportParams(initialParams);
    } else {
      setReportParams([]);
    }
  }, [selectedBooking?.id, selectedBooking?.patientEmail, tests]);

  const gateLab = laboratories.find((l) => l.id === selectedLabId) || laboratories[0];
  const operatorLab = laboratories.find((l) => l.id === labUser?.labId) || gateLab;
  const operatorBranch =
    operatorLab?.branches.find((b) => b.id === labUser?.branchId) || operatorLab?.branches[0];

  const handleLabLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginStatus(null);
    setIsLoggingIn(true);
    if (labAuthMethod === 'EMAIL_OTP') {
      if (!emailOtpSent) {
        const res = await sendEmailOtp(loginEmail.trim(), 'lab');
        setIsLoggingIn(false);
        if (res.success) {
          setEmailOtpSent(true);
          setLoginStatus(res.message || `6-digit code sent to ${loginEmail.trim()}`);
        } else {
          setLoginError(res.error || 'Failed to send Email OTP');
        }
        return;
      }
      const res = await verifyEmailOtp({
        email: loginEmail.trim(),
        otp: emailOtpCode,
        portal: 'lab',
        name: authTab === 'SIGN_UP' ? regFullName.trim() : undefined,
        phone: authTab === 'SIGN_UP' ? regPhone.trim() : undefined,
        labId: selectedLabId,
        branchId: selectedBranchId,
      });
      setIsLoggingIn(false);
      if (!res.success) setLoginError(res.error || 'Email OTP verification failed');
      return;
    }

    const res = await loginLabStaff(loginEmail.trim(), loginPassword, selectedLabId, selectedBranchId);
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Authentication failed');
    }
  };

  const handleLabRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginStatus(null);
    if (labAuthMethod === 'EMAIL_OTP') {
      return handleLabLogin(e);
    }
    setIsLoggingIn(true);
    const res = await registerLabStaff({
      fullName: regFullName.trim(),
      email: loginEmail.trim(),
      password: loginPassword,
      phone: regPhone.trim(),
      labId: selectedLabId,
      branchId: selectedBranchId,
    });
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Registration failed');
    }
  };

  const handleLabGoogleAuth = async () => {
    setLoginError(null);
    setLoginStatus(null);
    setIsGoogleLoading(true);
    const res = await signInWithGoogle('lab', {
      labId: selectedLabId,
      branchId: selectedBranchId,
      fullName: authTab === 'SIGN_UP' ? regFullName.trim() : undefined,
      phone: authTab === 'SIGN_UP' ? regPhone.trim() : undefined,
    });
    setIsGoogleLoading(false);
    if (!res.success && res.error) {
      setLoginError(res.error);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: MockBooking['status']) => {
    try {
      const res = await apiClient.updateBookingStatus(id, newStatus, undefined, undefined, 'lab');
      if (res.success && res.data) {
        setBookings((prev) => prev.map((b) => (b.id === id ? res.data : b)));
        setSelectedBooking(res.data);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleReleasePdfReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setUploadSuccessMsg(null);
    setUploadErrorMsg(null);

    const targetEmail = recipientEmail.trim();
    if (sendEmailOnRelease && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setUploadErrorMsg('Enter a valid patient email address so the report can be emailed simultaneously on release.');
      return;
    }

    const cleanedParams = reportParams.filter((p) => p.parameter.trim() && p.observedValue.trim());
    if (cleanedParams.length === 0) {
      setUploadErrorMsg('Enter at least one observed clinical parameter value before publishing the PDF.');
      return;
    }

    setIsUploading(true);

    try {
      const res = await apiClient.uploadReport({
        bookingNumber: selectedBooking.bookingNumber,
        pathologistName: pathologistName.trim(),
        clinicalNotes: clinicalNotes.trim(),
        parameters: cleanedParams,
        sendEmailToPatient: sendEmailOnRelease,
        recipientEmailOverride: targetEmail || undefined,
      });

      if (res.success) {
        setUploadSuccessMsg(res.message || `PDF published for ${selectedBooking.bookingNumber}`);
        await fetchLiveBookings();
      } else {
        setUploadErrorMsg(res.error || 'Failed to publish report');
      }
    } catch {
      setUploadErrorMsg('Network error releasing report');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAssignRider = async () => {
    if (!selectedBooking || !selectedRiderId) return;
    setDispatchMsg(null);
    setDispatchError(null);
    setIsDispatchingRider(true);
    try {
      const res = await apiClient.assignPhlebotomist(selectedBooking.id, selectedRiderId);
      if (res.success && res.data) {
        setDispatchMsg(res.message || 'Phlebotomist dispatched');
        setBookings((prev) => prev.map((b) => (b.id === selectedBooking.id ? res.data : b)));
        setSelectedBooking(res.data);
      } else {
        setDispatchError(res.error || 'Failed to assign phlebotomist');
      }
    } catch {
      setDispatchError('Network error assigning phlebotomist');
    } finally {
      setIsDispatchingRider(false);
    }
  };

  const handleSendExistingReportEmail = async () => {
    if (!selectedBooking) return;
    setEmailOnlySuccess(null);
    setEmailOnlyError(null);
    const targetEmail = recipientEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      setEmailOnlyError('Enter a valid patient email address before sending the PDF report.');
      return;
    }
    setIsSendingEmailOnly(true);
    try {
      const res = await apiClient.sendReportEmail(selectedBooking.bookingNumber, targetEmail, 'lab');
      if (res.success) {
        setEmailOnlySuccess(res.message || `Signed PDF dispatched to ${targetEmail}`);
        await fetchLiveBookings();
      } else {
        setEmailOnlyError(res.error || 'Failed to email report to patient');
      }
    } catch {
      setEmailOnlyError('Network error emailing PDF report');
    } finally {
      setIsSendingEmailOnly(false);
    }
  };

  const handleSaveTariff = async (pricingId: string) => {
    const res = await apiClient.updatePricing(pricingId, {
      pricePkr: Number(editPriceVal),
      statedTurnaroundHours: Number(editTatVal),
    });
    if (res.success) {
      setEditingPricingId(null);
      setLabOpsMsg('Diagnostic test tariff updated across Patient Marketplace.');
      loadCatalog();
    }
  };

  const handleSaveBranchConfig = async (branchId: string) => {
    const res = await apiClient.updateLabBranch(branchId, {
      operatingHours: editBranchHours,
      homeCollectionFeePkr: Number(editBranchFee),
    });
    if (res.success) {
      setEditingBranchId(null);
      setLabOpsMsg('Branch configuration updated live.');
      loadCatalog();
    }
  };

  const handleMarkLabNotifsRead = async () => {
    await apiClient.markNotificationsRead('lab');
    setLabNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadLabNotifs(0);
  };

  const handleDeleteLabNotif = async (id: string) => {
    const res = await apiClient.deleteNotification(id, 'lab');
    if (res.success) {
      setLabNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id);
        setUnreadLabNotifs(next.filter((n) => !n.read).length);
        return next;
      });
    }
  };

  const handleClearReadLabNotifs = async () => {
    const res = await apiClient.clearReadNotifications('lab');
    if (res.success) {
      setLabNotifications((prev) => prev.filter((n) => !n.read));
    }
  };

  const handleDeleteCancelledBooking = async (bookingId: string, bookingNumber: string) => {
    setLabOpsMsg(null);
    setLabOpsError(null);
    const res = await apiClient.deleteBooking(bookingId, 'lab');
    setPendingDeleteBookingId(null);
    if (res.success) {
      setLabOpsMsg(`Removed cancelled order ${bookingNumber} from queue.`);
      await fetchLiveBookings();
    } else {
      setLabOpsError(res.error || 'Unable to delete booking');
    }
  };

  const handleDeletePricing = async (pricingId: string) => {
    setLabOpsMsg(null);
    setLabOpsError(null);
    const res = await apiClient.deletePricing(pricingId);
    setPendingDeletePricingId(null);
    if (res.success) {
      setLabOpsMsg('Test tariff removed from laboratory price list.');
      loadCatalog();
    } else {
      setLabOpsError(res.error || 'Unable to remove tariff');
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    setLabOpsMsg(null);
    setLabOpsError(null);
    const res = await apiClient.deleteLabBranch(branchId);
    setPendingDeleteBranchId(null);
    if (res.success) {
      setLabOpsMsg(res.message || 'Branch removed from laboratory network.');
      loadCatalog();
    } else {
      setLabOpsError(res.error || 'Unable to remove branch');
    }
  };

  const handleCreateTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTariffTestId) return;
    setLabOpsMsg(null);
    setLabOpsError(null);
    setIsSavingLabEntity(true);
    try {
      const res = await apiClient.createPricing({
        testId: newTariffTestId,
        pricePkr: Number(newTariffPrice),
        discountedPricePkr: newTariffDiscount.trim() ? Number(newTariffDiscount) : undefined,
        statedTurnaroundHours: Number(newTariffTat || 12),
      });
      if (res.success) {
        setLabOpsMsg('Published new diagnostic test tariff to Patient Marketplace.');
        setNewTariffTestId('');
        setNewTariffPrice('1500');
        setNewTariffDiscount('');
        setShowAddTariff(false);
        await loadCatalog();
      } else {
        setLabOpsError(res.error || 'Unable to publish tariff');
      }
    } catch {
      setLabOpsError('Network error publishing tariff');
    } finally {
      setIsSavingLabEntity(false);
    }
  };

  const handleCreateCustomPanel = async (e: React.FormEvent) => {
    e.preventDefault();
    setLabOpsMsg(null);
    setLabOpsError(null);
    setIsSavingLabEntity(true);
    try {
      const res = await apiClient.createCustomTestPanel(
        {
          code: panelCode.trim(),
          name: panelName.trim(),
          category: panelCategory,
          sampleType: panelSampleType,
          fastingHours: Number(panelFasting || 0),
          commonNormalRange: panelNormalRange.trim() || 'Within Clinical Reference',
          initialPricePkr: panelPrice.trim() ? Number(panelPrice) : undefined,
          statedTurnaroundHours: Number(panelTat || 12),
        },
        'lab'
      );
      if (res.success) {
        setLabOpsMsg(`Created diagnostic test panel ${panelCode.trim().toUpperCase()} and published tariff.`);
        setPanelCode('');
        setPanelName('');
        setPanelPrice('2200');
        setShowCustomPanelForm(false);
        await loadCatalog();
      } else {
        setLabOpsError(res.error || 'Unable to create test panel');
      }
    } catch {
      setLabOpsError('Network error creating test panel');
    } finally {
      setIsSavingLabEntity(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLabOpsMsg(null);
    setLabOpsError(null);
    setIsSavingLabEntity(true);
    try {
      const res = await apiClient.createLabBranch({
        name: branchName.trim(),
        area: branchArea.trim(),
        address: branchAddress.trim(),
        phone: branchPhone.trim() || undefined,
        operatingHours: branchHours.trim() || '07:30 AM - 10:30 PM',
        homeCollectionFeePkr: Number(branchFee || 0),
      });
      if (res.success) {
        setLabOpsMsg(`Added Lahore branch ${branchName.trim()} (${branchArea.trim()}).`);
        setBranchName('');
        setBranchAddress('');
        setBranchPhone('');
        setShowAddBranch(false);
        await loadCatalog();
      } else {
        setLabOpsError(res.error || 'Unable to add branch');
      }
    } catch {
      setLabOpsError('Network error adding branch');
    } finally {
      setIsSavingLabEntity(false);
    }
  };

  const pipelineChartData = useMemo(() => {
    const stages: { key: MockBooking['status']; label: string; accent: 'coral' | 'periwinkle' | 'teal' | 'lime' }[] = [
      { key: 'PENDING', label: 'Pending', accent: 'coral' },
      { key: 'ACCEPTED', label: 'Accepted', accent: 'periwinkle' },
      { key: 'DISPATCHED', label: 'Dispatch', accent: 'teal' },
      { key: 'SAMPLE_COLLECTED', label: 'Collected', accent: 'teal' },
      { key: 'PROCESSING', label: 'Lab Run', accent: 'periwinkle' },
      { key: 'COMPLETED', label: 'PDF Ready', accent: 'lime' },
    ];
    return stages.map((s) => ({
      label: s.label,
      value: bookings.filter((b) => b.status === s.key).length,
      accent: s.accent,
    }));
  }, [bookings]);

  if (!authReady) {
    return <AuthSessionLoader label="Verifying Branch Lead session..." />;
  }

  // Unauthenticated Institutional Gate
  if (!labUser) {
    return (
      <PortalAuthShell
        portalTag="Branch Lead & Laboratory Portal"
        headline="Institutional Clinical Operations Console"
        subheadline="Sign in with your verified laboratory branch credentials to manage incoming requisitions, dispatch cold-chain phlebotomists, configure live tariffs, and release signed pathology PDFs."
        icon={<Building2 className="w-4 h-4" />}
        visualImageUrl={heroNexusImg}
        visualImageAlt="Modern automated diagnostic laboratory workspace"
        highlights={[
          {
            label: 'Branch-Isolated Queue',
            value: 'Live Requisitions & Walk-Ins',
            meta: 'Real-Time',
            icon: <ClipboardList className="w-4 h-4" />,
          },
          {
            label: 'Pathologist Workbench',
            value: 'Structured PDF & Auto Email',
            meta: 'SHA-256',
            icon: <FileText className="w-4 h-4" />,
          },
          {
            label: 'Rider Dispatch & Ledger',
            value: 'Courier Tracking & Payouts',
            meta: 'PKR',
            icon: <Wallet className="w-4 h-4" />,
          },
        ]}
        checklist={[
          'Strict brand & Lahore branch credential isolation',
          'Encrypted staff credentials per laboratory branch',
          'Full audit trail on every clinical release & tariff edit',
        ]}
        footerNote="Verified Diagnostic Lab Console · Branch Access"
      >
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#087F8C]">
            Laboratory Authentication
          </span>
          <h2 className="text-2xl font-extrabold text-[#172C32] tracking-tight">
            {authTab === 'SIGN_IN' ? 'Branch Lead Sign In' : 'Register Branch Staff'}
          </h2>
          <p className="text-xs text-[#556B70]">
            Select your verified Lahore diagnostic brand and physical branch hub.
          </p>
        </div>

        <AnimatedTabBar
          layoutId="lab-auth-tab"
          activeId={authTab}
          onChange={(t) => {
            setAuthTab(t);
            setLoginError(null);
            setLoginStatus(null);
            setEmailOtpSent(false);
          }}
          className="w-full grid grid-cols-2"
          items={[
            { id: 'SIGN_IN', label: 'Staff Sign In' },
            { id: 'SIGN_UP', label: 'Register Staff' },
          ]}
        />

        <GoogleOAuthButton
          label={authTab === 'SIGN_IN' ? 'Sign in with Google Workspace' : 'Register Branch Staff with Google'}
          loading={isGoogleLoading}
          onClick={handleLabGoogleAuth}
        />

        <OAuthOrDivider text="or branch credentials / email OTP" />

        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl text-[11px]">
          <button
            type="button"
            onClick={() => {
              setLabAuthMethod('PASSWORD');
              setEmailOtpSent(false);
              setLoginError(null);
            }}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              labAuthMethod === 'PASSWORD' ? 'bg-white text-[#073B43] shadow-2xs' : 'text-[#556B70]'
            }`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => {
              setLabAuthMethod('EMAIL_OTP');
              setLoginError(null);
            }}
            className={`py-1.5 rounded-lg font-semibold transition-all ${
              labAuthMethod === 'EMAIL_OTP' ? 'bg-white text-[#073B43] shadow-2xs' : 'text-[#556B70]'
            }`}
          >
            Real-Time Email OTP
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
            key={`${authTab}-${labAuthMethod}`}
            initial={{ opacity: 0, x: authTab === 'SIGN_IN' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: authTab === 'SIGN_IN' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            onSubmit={authTab === 'SIGN_IN' ? handleLabLogin : handleLabRegister}
            className="space-y-3.5 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#172C32] mb-1.5">Diagnostic Brand</label>
                <select
                  value={selectedLabId}
                  onChange={(e) => {
                    const nid = e.target.value;
                    setSelectedLabId(nid);
                    const found = laboratories.find((l) => l.id === nid);
                    if (found && found.branches.length > 0) setSelectedBranchId(found.branches[0].id);
                  }}
                  className="w-full bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white transition-colors min-h-[42px]"
                >
                  {laboratories.map((lab) => (
                    <option key={lab.id} value={lab.id}>
                      {lab.name} ({lab.phcLicence})
                    </option>
                  ))}
                </select>
              </div>

              {gateLab && (
                <div>
                  <label className="block font-semibold text-[#172C32] mb-1.5">Lahore Branch</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white transition-colors min-h-[42px]"
                  >
                    {gateLab.branches.map((br) => (
                      <option key={br.id} value={br.id}>
                        {br.name} — {br.area}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {authTab === 'SIGN_UP' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#172C32] mb-1.5">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Dr. Kamran Chughtai"
                    className="w-full bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white transition-colors min-h-[42px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#172C32] mb-1.5">Mobile (+92)</label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+92 3XX XXXXXXX"
                    className="w-full bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32] focus:outline-none focus:border-[#087F8C] focus:bg-white transition-colors min-h-[42px]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#172C32] mb-1.5">Institutional Email</label>
              <div className="flex items-center bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white transition-all">
                <Mail className="w-4 h-4 text-[#087F8C] shrink-0" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="operator@laboratory.pk"
                  className="w-full bg-transparent px-2.5 py-2.5 text-[#172C32] focus:outline-none"
                />
              </div>
            </div>

            {labAuthMethod === 'PASSWORD' ? (
              <div>
                <label className="block font-semibold text-[#172C32] mb-1.5">Password</label>
                <div className="flex items-center bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl px-3 focus-within:border-[#087F8C] focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-[#087F8C] shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter staff password"
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
            ) : (
              emailOtpSent && (
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
              )
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
                  ? 'Verifying Credentials...'
                  : labAuthMethod === 'EMAIL_OTP'
                  ? emailOtpSent
                    ? 'Verify Email OTP & Open Console'
                    : 'Send 6-Digit Email OTP'
                  : authTab === 'SIGN_IN'
                  ? 'Sign In to Lab Console'
                  : 'Register Branch Lead'}
              </span>
            </motion.button>
          </motion.form>
        </AnimatePresence>

        <div className="pt-3 border-t border-[#D9E9E5] text-[11px] text-[#556B70]">
          Branch pathologists and lab managers operate strictly within their verified Lahore laboratory scope.
        </div>
      </PortalAuthShell>
    );
  }

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const matchesBranch = branchFilterMode === 'ALL_BRANCHES' || b.branchId === labUser.branchId;
    return matchesStatus && matchesBranch;
  });

  const labPricings = pricings.filter((p) => p.labId === labUser.labId);
  const completedCount = bookings.filter((b) => b.status === 'COMPLETED').length;
  const completionRatePct = bookings.length > 0 ? Math.round((completedCount / bookings.length) * 100) : 0;
  const homeCollectionCount = bookings.filter((b) => b.collectionType === 'HOME_COLLECTION').length;
  const homeSharePct = bookings.length > 0 ? Math.round((homeCollectionCount / bookings.length) * 100) : 0;
  const grossRevenuePkr = bookings.reduce((sum, b) => sum + (b.totalPkr || 0), 0);

  const navItems: { id: typeof activeSubTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'QUEUE', label: 'Order Queue', icon: <ClipboardList className="w-4 h-4" />, count: bookings.length },
    { id: 'TARIFFS', label: 'Tariffs & Branches', icon: <Settings className="w-4 h-4" />, count: labPricings.length },
    { id: 'COURIERS', label: 'Collection Team', icon: <Users className="w-4 h-4" />, count: labRiders.length },
    { id: 'ANALYTICS', label: 'Settlements & Plan', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="py-6 sm:py-8 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Collapsible Midnight-Ocean SaaS Sidebar */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 74 : 252 }}
          transition={{ duration: 0.22, ease: LC_EASE }}
          className="hidden lg:flex flex-col shrink-0 lc-gradient-midnight text-white rounded-3xl p-3.5 space-y-5 sticky top-20 overflow-hidden shadow-[0_24px_60px_-24px_rgba(7,59,67,0.45)]"
        >
          <div className="flex items-center justify-between px-1.5 pt-1">
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-semibold text-[#21D4C2] uppercase truncate">
                  {operatorLab?.phcLicence || 'PHC Verified'}
                </div>
                <div className="text-sm font-bold text-white truncate">{operatorLab?.name}</div>
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
              const isActive = activeSubTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSubTab(item.id)}
                  className={`relative w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-[#172C32] font-bold'
                      : 'text-[#D9E9E5]/80 hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="lab-sidebar-active"
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
              <div className="font-semibold text-white truncate">{operatorBranch?.name}</div>
              <div className="truncate text-[#D9E9E5]/70">{operatorBranch?.address}</div>
              <div className="font-mono text-[#B9ED69] pt-0.5 truncate">Lead: {labUser.name}</div>
            </div>
          )}
        </motion.aside>

        {/* Main Operations Viewport */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Operational Top Context Header */}
          <div className="bg-white border border-[#D9E9E5] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-mono font-semibold text-[#087F8C] uppercase tracking-wider">
                {operatorLab?.phcLicence || 'PHC Verified'} · Branch Operations Console
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#172C32] tracking-tight truncate">
                {operatorLab?.name}
              </h1>
              <p className="text-xs text-[#556B70] mt-0.5 truncate">
                {operatorBranch?.name} · Operator: <strong className="text-[#172C32]">{labUser.name}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowLabNotifs(true)}
                className="px-4 py-2.5 bg-[#F3F7F4] hover:bg-[#D9E9E5]/70 border border-[#D9E9E5] text-[#172C32] rounded-xl text-xs font-semibold flex items-center gap-2 min-h-[42px] transition-colors whitespace-nowrap"
              >
                <Bell className="w-4 h-4 text-[#087F8C]" />
                <span>Alerts ({unreadLabNotifs})</span>
              </button>

              <button
                type="button"
                onClick={fetchLiveBookings}
                className="px-3.5 py-2.5 bg-[#073B43] hover:bg-[#087F8C] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[42px] transition-colors whitespace-nowrap"
                title="Refresh Live Queue"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync Queue</span>
              </button>
            </div>
          </div>

          {/* Mobile/Tablet Horizontal Navigation */}
          <div className="lg:hidden">
            <AnimatedTabBar
              layoutId="lab-mobile-tabs"
              activeId={activeSubTab}
              onChange={setActiveSubTab}
              items={navItems.map((n) => ({ id: n.id, label: n.label, count: n.count }))}
            />
          </div>

          <ToastBanner message={labOpsMsg} variant="success" onDismiss={() => setLabOpsMsg(null)} />
          <ToastBanner message={labOpsError} variant="warning" onDismiss={() => setLabOpsError(null)} />

          {operatorLab && operatorLab.verificationStatus !== 'VERIFIED' && (
            <div className="bg-[#FF927E]/25 border border-[#FF927E] rounded-2xl p-4 flex items-start gap-3 text-xs text-[#172C32]">
              <AlertCircle className="w-5 h-5 text-[#9C2A1A] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">PHC Regulatory Licence Revoked — New Patient Bookings Disabled</div>
                <div className="mt-0.5">
                  Punjab Healthcare Commission status for {operatorLab.name} is{' '}
                  <span className="font-mono font-bold">{operatorLab.verificationStatus}</span>. Existing orders can still be finalized.
                </div>
              </div>
            </div>
          )}

          {/* 4-Column KPI Bento Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <KpiMetricCard
              label="Total Orders"
              value={bookings.length}
              meta={`${filteredBookings.length} matching active filter`}
              icon={<ClipboardList className="w-4 h-4" />}
              tone="ocean"
            />
            <KpiMetricCard
              label="Published PDFs"
              value={completedCount}
              meta={`${completionRatePct}% turnaround completion`}
              icon={<FileText className="w-4 h-4" />}
              tone="teal"
            />
            <KpiMetricCard
              label="Gross Lab Volume"
              value={grossRevenuePkr}
              prefix="PKR "
              meta={`${homeCollectionCount} home collections`}
              icon={<BarChart3 className="w-4 h-4" />}
              tone="lime"
            />
            <KpiMetricCard
              label="Unsettled Payout"
              value={settlementSummary?.unsettledNetPayablePkr ?? 0}
              prefix="PKR "
              meta={`${settlementSummary?.unsettledBookingsCount ?? 0} orders pending IBFT`}
              icon={<Wallet className="w-4 h-4" />}
              tone="periwinkle"
            />
          </div>

          <AnimatePresence mode="wait">
            {/* QUEUE & PATHOLOGY WORKBENCH */}
            {activeSubTab === 'QUEUE' && (
              <motion.div
                key="LAB_QUEUE"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"
              >
                {/* Requisition List */}
                <div className="xl:col-span-5 bg-white border border-[#D9E9E5] rounded-2xl p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-[#D9E9E5]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#556B70]">
                      Branch Queue ({filteredBookings.length})
                    </span>
                    <select
                      value={branchFilterMode}
                      onChange={(e) => setBranchFilterMode(e.target.value as 'ALL_BRANCHES' | 'MY_BRANCH')}
                      className="text-xs bg-[#F3F7F4] border border-[#D9E9E5] rounded-xl px-3 py-1.5 text-[#172C32] font-medium"
                    >
                      <option value="ALL_BRANCHES">All Lab Branches</option>
                      <option value="MY_BRANCH">My Branch Only</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'ALL', label: 'All' },
                      { id: 'PENDING', label: 'Pending' },
                      { id: 'ACCEPTED', label: 'Accepted' },
                      { id: 'DISPATCHED', label: 'Dispatched' },
                      { id: 'SAMPLE_COLLECTED', label: 'Collected' },
                      { id: 'COMPLETED', label: 'Completed' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatusFilter(st.id)}
                        className={`px-3 py-1.5 text-[11px] font-semibold rounded-xl whitespace-nowrap transition-colors ${
                          statusFilter === st.id
                            ? 'bg-[#073B43] text-white'
                            : 'bg-[#F3F7F4] text-[#556B70] hover:text-[#172C32]'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                    {isLoading && bookings.length === 0 ? (
                      <div className="space-y-2.5">
                        <SkeletonBlock className="h-24 w-full rounded-xl" />
                        <SkeletonBlock className="h-24 w-full rounded-xl" />
                      </div>
                    ) : filteredBookings.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#556B70] bg-[#F3F7F4] border border-dashed border-[#C8DDD7] rounded-2xl">
                        No appointments in queue for this filter.
                      </div>
                    ) : (
                      filteredBookings.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            setSelectedBooking(b);
                            setUploadSuccessMsg(null);
                            setUploadErrorMsg(null);
                            setEmailOnlySuccess(null);
                            setEmailOnlyError(null);
                          }}
                          className={`w-full text-left p-4 rounded-2xl border transition-all text-xs cursor-pointer ${
                            selectedBooking?.id === b.id
                              ? 'bg-[#D9E9E5]/45 border-[#087F8C] shadow-[0_8px_20px_-12px_rgba(8,127,140,0.4)]'
                              : 'bg-white border-[#D9E9E5] hover:bg-[#F3F7F4]/70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="font-mono font-bold text-[#172C32]">{b.bookingNumber}</span>
                            <span
                              className={`text-[11px] font-mono font-bold ${
                                b.status === 'CANCELLED' ? 'text-[#9C2A1A]' : 'text-[#087F8C]'
                              }`}
                            >
                              {(b.status === 'CANCELLED' ? 'Cancelled' : b.phlebotomistStatus || b.status)
                                .replace(/_/g, ' ')
                                .toLowerCase()
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                            </span>
                          </div>
                          <div className="font-bold text-sm text-[#172C32]">{b.patientName}</div>
                          <div className="text-[#556B70] mt-0.5 truncate">
                            {b.branchName} · {b.scheduledTimeSlot}
                          </div>
                          <div className="mt-2.5 pt-2 border-t border-[#D9E9E5] flex justify-between font-mono">
                            <span className="text-[#556B70] font-sans">
                              {b.collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Branch Walk-In'}
                            </span>
                            <span className="font-bold text-[#172C32] tabular-nums">
                              PKR {b.totalPkr.toLocaleString()}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Selected Requisition & Pathologist Workbench */}
                {selectedBooking ? (
                  <div className="xl:col-span-7 bg-white border border-[#D9E9E5] rounded-2xl p-5 sm:p-6 space-y-6">
                    <div className="border-b border-[#D9E9E5] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <span className="font-mono text-xs font-bold text-[#087F8C]">
                          {selectedBooking.bookingNumber} ·{' '}
                          {selectedBooking.collectionType === 'HOME_COLLECTION' ? 'Home Collection' : 'Branch Walk-In'}
                        </span>
                        <h2 className="text-xl font-extrabold text-[#172C32] tracking-tight">
                          {selectedBooking.patientName}
                        </h2>
                        <div className="text-xs text-[#556B70] flex flex-wrap gap-3">
                          <span className="font-mono flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-[#087F8C]" />
                            {selectedBooking.patientPhone}
                          </span>
                          {selectedBooking.patientEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-[#087F8C]" />
                              {selectedBooking.patientEmail}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#556B70] flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#087F8C]" />
                          <span>{selectedBooking.streetAddress || selectedBooking.branchName}</span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-[11px] text-[#556B70] uppercase font-semibold">Total Tariff</div>
                        <div className="text-2xl font-extrabold font-mono text-[#172C32] tabular-nums">
                          PKR {selectedBooking.totalPkr.toLocaleString()}
                        </div>
                        {selectedBooking.sampleBarcode && (
                          <span className="text-[11px] font-mono font-semibold text-[#087F8C] block mt-1">
                            Barcode: {selectedBooking.sampleBarcode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stage Transition Controls */}
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#556B70]">
                        Laboratory Operational Stage (Syncs Live Patient Tracking)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {([
                          { status: 'ACCEPTED', label: 'Accept Order' },
                          { status: 'DISPATCHED', label: 'Mark Dispatched' },
                          { status: 'PROCESSING', label: 'Mark Processing' },
                        ] as const).map(({ status: st, label }) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateStatus(selectedBooking.id, st)}
                            className={`px-4 py-2 text-xs font-bold border rounded-xl min-h-[40px] transition-colors whitespace-nowrap ${
                              selectedBooking.status === st
                                ? 'bg-[#073B43] text-white border-[#073B43]'
                                : 'bg-[#F3F7F4] hover:bg-[#D9E9E5]/60 text-[#172C32] border-[#D9E9E5]'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                        {selectedBooking.status === 'CANCELLED' && !selectedBooking.reportUrl && (
                          pendingDeleteBookingId === selectedBooking.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteCancelledBooking(selectedBooking.id, selectedBooking.bookingNumber)
                                }
                                className="px-3.5 py-2 text-xs font-bold bg-[#FF927E] text-[#172C32] rounded-xl min-h-[40px]"
                              >
                                Confirm Remove Cancelled Order
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteBookingId(null)}
                                className="px-3 py-2 text-xs font-semibold bg-[#F3F7F4] border border-[#D9E9E5] text-[#172C32] rounded-xl min-h-[40px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPendingDeleteBookingId(selectedBooking.id)}
                              className="px-3.5 py-2 text-xs font-bold bg-[#FF927E]/25 hover:bg-[#FF927E]/45 text-[#9C2A1A] border border-[#FF927E] rounded-xl min-h-[40px] flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Cancelled Order</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Home Phlebotomist Assignment Dispatch */}
                    {selectedBooking.collectionType === 'HOME_COLLECTION' &&
                      selectedBooking.status !== 'CANCELLED' && (
                        <div className="bg-[#F3F7F4] border border-[#C8DDD7] rounded-2xl p-4 space-y-3 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#172C32] flex items-center gap-2 uppercase tracking-wider">
                              <Bike className="w-4 h-4 text-[#087F8C]" />
                              <span>Assign Field Phlebotomist</span>
                            </span>
                            {selectedBooking.phlebotomistName && (
                              <span className="font-mono text-[11px] text-[#087F8C] font-bold">
                                Assigned: {selectedBooking.phlebotomistName}
                              </span>
                            )}
                          </div>

                          {labRiders.length === 0 ? (
                            <div className="text-xs text-[#556B70]">
                              No registered couriers found for this lab yet. Couriers can register on the Phlebotomist Portal.
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <select
                                value={selectedRiderId}
                                onChange={(e) => setSelectedRiderId(e.target.value)}
                                className="flex-1 bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32] min-h-[42px]"
                              >
                                {labRiders.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name} {r.staffCode ? `(${r.staffCode})` : ''} — {r.phone}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={isDispatchingRider}
                                onClick={handleAssignRider}
                                className="px-4 py-2.5 bg-[#087F8C] hover:bg-[#073B43] text-white rounded-xl font-bold whitespace-nowrap min-h-[42px] disabled:opacity-50 transition-colors"
                              >
                                {isDispatchingRider ? 'Dispatching...' : 'Assign & Dispatch Rider'}
                              </button>
                            </div>
                          )}

                          <ToastBanner
                            message={dispatchMsg}
                            variant="success"
                            onDismiss={() => setDispatchMsg(null)}
                          />
                          <ToastBanner
                            message={dispatchError}
                            variant="warning"
                            onDismiss={() => setDispatchError(null)}
                          />
                        </div>
                      )}

                    {/* Multi-Parameter PDF Result Publisher & Automated Email Dispatch */}
                    <form
                      onSubmit={handleReleasePdfReport}
                      className="bg-[#F3F7F4] border border-[#C8DDD7] rounded-2xl p-4 sm:p-5 space-y-4 text-xs"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-[#172C32] uppercase tracking-wider">
                            Pathology Workbench · Generate Signed PDF &amp; Email Patient
                          </h3>
                          <p className="text-[11px] text-[#556B70] mt-0.5">
                            Generates verifiable %PDF-1.4 clinical report with SHA-256 checksum &amp; delivers to patient portal + email.
                          </p>
                        </div>
                        <FileText className="w-5 h-5 text-[#087F8C] shrink-0" />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#172C32] mb-1">Signing Pathologist</label>
                        <input
                          type="text"
                          required
                          value={pathologistName}
                          onChange={(e) => setPathologistName(e.target.value)}
                          className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-[#172C32]">
                            Structured Clinical Parameters ({reportParams.length})
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setReportParams((prev) => [
                                ...prev,
                                { parameter: '', observedValue: '', unit: 'mg/dL', referenceRange: 'Reference', flag: 'NORMAL' },
                              ])
                            }
                            className="text-xs font-bold text-[#087F8C] flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Parameter</span>
                          </button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {reportParams.map((param, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-12 gap-1.5 bg-white border border-[#D9E9E5] rounded-xl p-2 items-center"
                            >
                              <input
                                type="text"
                                value={param.parameter}
                                placeholder="Parameter"
                                onChange={(e) =>
                                  setReportParams((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, parameter: e.target.value } : item))
                                  )
                                }
                                className="col-span-4 border border-[#D9E9E5] rounded-lg px-2 py-1.5 text-[11px] font-medium text-[#172C32]"
                              />
                              <input
                                type="text"
                                value={param.observedValue}
                                placeholder="Observed"
                                onChange={(e) =>
                                  setReportParams((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, observedValue: e.target.value } : item))
                                  )
                                }
                                className="col-span-3 border border-[#D9E9E5] rounded-lg px-2 py-1.5 font-mono text-[11px] font-bold text-[#172C32]"
                              />
                              <span
                                className="col-span-2 text-[10px] font-mono text-[#556B70] truncate"
                                title={param.referenceRange}
                              >
                                {param.unit || '-'}
                              </span>
                              <select
                                value={param.flag}
                                onChange={(e) =>
                                  setReportParams((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, flag: e.target.value as ReportParameter['flag'] } : item
                                    )
                                  )
                                }
                                className="col-span-2 border border-[#D9E9E5] rounded-lg px-1.5 py-1.5 font-mono text-[10px] font-bold bg-[#F3F7F4] text-[#172C32]"
                              >
                                <option value="NORMAL">NORMAL</option>
                                <option value="HIGH">HIGH</option>
                                <option value="LOW">LOW</option>
                                <option value="CRITICAL">CRITICAL</option>
                              </select>
                              <div className="col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  disabled={reportParams.length <= 1}
                                  onClick={() => setReportParams((prev) => prev.filter((_, i) => i !== idx))}
                                  title="Remove parameter row"
                                  className="p-1 text-[#556B70] hover:text-[#9C2A1A] disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#172C32] mb-1">Clinical Pathologist Notes</label>
                        <textarea
                          rows={2}
                          value={clinicalNotes}
                          onChange={(e) => setClinicalNotes(e.target.value)}
                          className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#172C32] mb-1">
                          Patient Email Recipient (Simultaneous Portal + Email Delivery)
                        </label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="patient@example.com"
                          className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                        />
                      </div>

                      <label className="flex items-center gap-2.5 cursor-pointer bg-white border border-[#D9E9E5] rounded-xl p-3">
                        <input
                          type="checkbox"
                          checked={sendEmailOnRelease}
                          onChange={(e) => setSendEmailOnRelease(e.target.checked)}
                          className="accent-[#087F8C] w-4 h-4"
                        />
                        <span className="text-[#172C32] font-medium">
                          Send PDF attachment to patient email at the exact time report is published to Patient Portal
                        </span>
                      </label>

                      <ToastBanner
                        message={uploadErrorMsg}
                        variant="warning"
                        onDismiss={() => setUploadErrorMsg(null)}
                      />

                      {uploadSuccessMsg && (
                        <div className="p-3 bg-[#073B43] text-white border border-[#21D4C2]/30 rounded-xl flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-[#B9ED69] shrink-0" />
                            {uploadSuccessMsg}
                          </span>
                          <button
                            type="button"
                            disabled={isLoadingPdf}
                            onClick={() => handleOpenPdfModal(selectedBooking.bookingNumber)}
                            className="font-bold text-[#B9ED69] underline flex items-center gap-1 shrink-0 disabled:opacity-50"
                          >
                            {isLoadingPdf ? 'Opening...' : 'Open PDF'} <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <motion.button
                        type="submit"
                        disabled={isUploading}
                        whileTap={{ scale: 0.985 }}
                        className="w-full py-3 bg-[#B9ED69] hover:brightness-95 text-[#172C32] rounded-xl font-bold flex items-center justify-center gap-2 min-h-[46px] transition-all disabled:opacity-60"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{isUploading ? 'Publishing & Dispatching...' : 'Publish Signed PDF & Email Patient'}</span>
                      </motion.button>
                    </form>

                    {/* Lab-Exclusive Email Control for Published Reports */}
                    {selectedBooking.reportUrl && (
                      <div className="bg-[#A5B9FF]/20 border border-[#A5B9FF]/50 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-[#172C32] uppercase tracking-wider flex items-center gap-1.5">
                              <Mail className="w-4 h-4 text-[#073B43]" />
                              <span>Lab-Controlled Patient Email Dispatch</span>
                            </h3>
                            <p className="text-[11px] text-[#556B70] mt-0.5">
                              {selectedBooking.emailDispatchedAt
                                ? `Last emailed to patient at ${new Date(selectedBooking.emailDispatchedAt).toLocaleString()}`
                                : 'Signed PDF is live in Patient Portal; send directly to patient email below.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={isLoadingPdf}
                            onClick={() => handleOpenPdfModal(selectedBooking.bookingNumber)}
                            className="px-3.5 py-2 bg-white border border-[#C8DDD7] hover:border-[#087F8C] rounded-xl font-bold text-[#073B43] flex items-center gap-1.5 self-start disabled:opacity-50 whitespace-nowrap"
                          >
                            <span>{isLoadingPdf ? 'Loading PDF...' : 'View Signed PDF'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="patient@example.com"
                            className="flex-1 bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32] min-h-[42px]"
                          />
                          <button
                            type="button"
                            disabled={isSendingEmailOnly}
                            onClick={handleSendExistingReportEmail}
                            className="px-4 py-2.5 bg-[#073B43] hover:bg-[#087F8C] text-white rounded-xl font-bold whitespace-nowrap min-h-[42px] disabled:opacity-50 transition-colors"
                          >
                            {isSendingEmailOnly ? 'Sending PDF...' : 'Send / Resend PDF to Patient Email'}
                          </button>
                        </div>

                        <ToastBanner
                          message={emailOnlySuccess}
                          variant="success"
                          onDismiss={() => setEmailOnlySuccess(null)}
                        />
                        <ToastBanner
                          message={emailOnlyError}
                          variant="warning"
                          onDismiss={() => setEmailOnlyError(null)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="xl:col-span-7 bg-white border border-[#D9E9E5] rounded-2xl p-12 text-center text-xs text-[#556B70]">
                    Select a booking on the left to manage operational stages and publish reports.
                  </div>
                )}
              </motion.div>
            )}

            {/* TARIFFS & BRANCH MANAGEMENT */}
            {activeSubTab === 'TARIFFS' && (
              <motion.div
                key="LAB_TARIFFS"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="space-y-6"
              >
                <div className="bg-white border border-[#D9E9E5] rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-[#D9E9E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-[#172C32] flex items-center gap-2">
                        <Settings className="w-4 h-4 text-[#087F8C]" />
                        <span>Live Published Tariffs — {operatorLab?.name}</span>
                      </h2>
                      <p className="text-xs text-[#556B70]">
                        Updates persist to database and reflect immediately in Patient Marketplace.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {tests.some((t) => !labPricings.some((p) => p.testId === t.id)) && (
                        <button
                          type="button"
                          onClick={() => {
                            const unpriced = tests.find((t) => !labPricings.some((p) => p.testId === t.id));
                            if (unpriced && !newTariffTestId) setNewTariffTestId(unpriced.id);
                            setShowAddTariff((prev) => !prev);
                            setShowCustomPanelForm(false);
                          }}
                          className="px-3.5 py-2 bg-[#B9ED69] hover:brightness-95 text-[#172C32] rounded-xl text-xs font-bold flex items-center gap-1.5 min-h-[40px]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{showAddTariff ? 'Close Tariff Form' : 'Add Test Tariff'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomPanelForm((prev) => !prev);
                          setShowAddTariff(false);
                        }}
                        className="px-3.5 py-2 bg-[#F3F7F4] hover:bg-[#D9E9E5]/60 text-[#172C32] border border-[#D9E9E5] rounded-xl text-xs font-bold flex items-center gap-1.5 min-h-[40px]"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#087F8C]" />
                        <span>{showCustomPanelForm ? 'Close Panel Form' : 'New Custom Panel'}</span>
                      </button>
                    </div>
                  </div>

                  {showAddTariff && (
                    <form
                      onSubmit={handleCreateTariff}
                      className="p-4 sm:p-5 bg-[#F3F7F4] border-b border-[#D9E9E5] grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs"
                    >
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-[#172C32] mb-1">Diagnostic Test *</label>
                        <select
                          required
                          value={newTariffTestId}
                          onChange={(e) => setNewTariffTestId(e.target.value)}
                          className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                        >
                          <option value="">Select unpriced test...</option>
                          {tests
                            .filter((t) => !labPricings.some((p) => p.testId === t.id))
                            .map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.code} — {t.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-[#172C32] mb-1">Rate (PKR) *</label>
                        <input
                          type="number"
                          required
                          min={100}
                          max={100000}
                          value={newTariffPrice}
                          onChange={(e) => setNewTariffPrice(e.target.value)}
                          className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#172C32] mb-1">Discounted PKR / TAT Hrs</label>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            min={100}
                            placeholder="Opt"
                            value={newTariffDiscount}
                            onChange={(e) => setNewTariffDiscount(e.target.value)}
                            className="w-1/2 bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                          />
                          <input
                            type="number"
                            required
                            min={1}
                            max={168}
                            value={newTariffTat}
                            onChange={(e) => setNewTariffTat(e.target.value)}
                            className="w-1/2 bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                            title="Turnaround Hours"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isSavingLabEntity}
                          className="flex-1 py-2.5 bg-[#073B43] hover:bg-[#087F8C] text-white rounded-xl font-bold min-h-[40px]"
                        >
                          {isSavingLabEntity ? 'Saving...' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddTariff(false)}
                          className="px-3 py-2.5 bg-white border border-[#D9E9E5] text-[#556B70] rounded-xl font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {showCustomPanelForm && (
                    <form
                      onSubmit={handleCreateCustomPanel}
                      className="p-4 sm:p-5 bg-[#F3F7F4] border-b border-[#D9E9E5] space-y-3 text-xs"
                    >
                      <div className="font-bold text-[#172C32] uppercase tracking-wider">
                        Create Custom Diagnostic Panel &amp; Publish Initial Rate
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block font-semibold text-[#172C32] mb-1">Panel Code *</label>
                          <input
                            type="text"
                            required
                            value={panelCode}
                            onChange={(e) => setPanelCode(e.target.value)}
                            placeholder="CRP-QUANT"
                            className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono uppercase text-[#172C32]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#172C32] mb-1">Diagnostic Panel Name *</label>
                          <input
                            type="text"
                            required
                            value={panelName}
                            onChange={(e) => setPanelName(e.target.value)}
                            placeholder="C-Reactive Protein (Quantitative)"
                            className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#172C32] mb-1">Clinical Category</label>
                          <select
                            value={panelCategory}
                            onChange={(e) => setPanelCategory(e.target.value as DiagnosticTest['category'])}
                            className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                          >
                            <option value="BIOCHEMISTRY">BIOCHEMISTRY</option>
                            <option value="HEMATOLOGY">HEMATOLOGY</option>
                            <option value="ENDOCRINOLOGY">ENDOCRINOLOGY</option>
                            <option value="CARDIOLOGY">CARDIOLOGY</option>
                            <option value="INFECTIOUS_DISEASE">INFECTIOUS_DISEASE</option>
                            <option value="VITAMINS">VITAMINS</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold text-[#172C32] mb-1">Sample Specimen</label>
                          <select
                            value={panelSampleType}
                            onChange={(e) => setPanelSampleType(e.target.value as DiagnosticTest['sampleType'])}
                            className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                          >
                            <option value="Serum (Plain/Gel)">Serum (Plain/Gel)</option>
                            <option value="Whole Blood (EDTA)">Whole Blood (EDTA)</option>
                            <option value="Plasma (Fluoride)">Plasma (Fluoride)</option>
                            <option value="Midstream Urine">Midstream Urine</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold text-[#172C32] mb-1">Reference Normal Range</label>
                          <input
                            type="text"
                            value={panelNormalRange}
                            onChange={(e) => setPanelNormalRange(e.target.value)}
                            placeholder="< 5.0 mg/L"
                            className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#172C32] mb-1">Fasting Hours (0–24)</label>
                          <input
                            type="number"
                            min={0}
                            max={24}
                            value={panelFasting}
                            onChange={(e) => setPanelFasting(e.target.value)}
                            className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#172C32] mb-1">Initial Rate (PKR) *</label>
                          <input
                            type="number"
                            required
                            min={100}
                            max={100000}
                            value={panelPrice}
                            onChange={(e) => setPanelPrice(e.target.value)}
                            className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#172C32] mb-1">Turnaround (Hrs)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            max={168}
                            value={panelTat}
                            onChange={(e) => setPanelTat(e.target.value)}
                            className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isSavingLabEntity}
                          className="px-4 py-2.5 bg-[#073B43] hover:bg-[#087F8C] text-white rounded-xl font-bold min-h-[40px]"
                        >
                          {isSavingLabEntity ? 'Creating...' : 'Create Panel & Publish Tariff'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomPanelForm(false)}
                          className="px-3.5 py-2.5 bg-white border border-[#D9E9E5] text-[#556B70] rounded-xl font-semibold min-h-[40px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F3F7F4] border-b border-[#D9E9E5] text-[#556B70] font-semibold">
                        <tr>
                          <th className="py-3 px-4">Code</th>
                          <th className="py-3 px-4">Test Name</th>
                          <th className="py-3 px-4">Published Rate</th>
                          <th className="py-3 px-4">Discounted</th>
                          <th className="py-3 px-4">TAT (Hrs)</th>
                          <th className="py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D9E9E5]">
                        {labPricings.map((pr) => {
                          const test = tests.find((t) => t.id === pr.testId);
                          const isEditing = editingPricingId === pr.id;
                          return (
                            <tr key={pr.id} className="hover:bg-[#F3F7F4]/60">
                              <td className="py-3 px-4 font-mono font-bold text-[#087F8C]">{test?.code}</td>
                              <td className="py-3 px-4 font-semibold text-[#172C32]">{test?.name}</td>
                              <td className="py-3 px-4 font-mono tabular-nums text-[#172C32]">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editPriceVal}
                                    onChange={(e) => setEditPriceVal(e.target.value)}
                                    className="w-24 border border-[#087F8C] rounded-lg px-2 py-1"
                                  />
                                ) : (
                                  `PKR ${pr.pricePkr.toLocaleString()}`
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono tabular-nums text-[#087F8C] font-semibold">
                                {pr.discountedPricePkr ? `PKR ${pr.discountedPricePkr.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-3 px-4 font-mono tabular-nums">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editTatVal}
                                    onChange={(e) => setEditTatVal(e.target.value)}
                                    className="w-16 border border-[#087F8C] rounded-lg px-2 py-1"
                                  />
                                ) : (
                                  `${pr.statedTurnaroundHours}h`
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isEditing ? (
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveTariff(pr.id)}
                                      className="px-2.5 py-1 bg-[#073B43] text-white rounded-lg font-semibold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPricingId(null)}
                                      className="px-2 py-1 text-[#556B70]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPricingId(pr.id);
                                        setEditPriceVal(String(pr.pricePkr));
                                        setEditTatVal(String(pr.statedTurnaroundHours));
                                      }}
                                      className="text-[#087F8C] font-bold hover:underline"
                                    >
                                      Edit Rate
                                    </button>
                                    {pendingDeletePricingId === pr.id ? (
                                      <span className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleDeletePricing(pr.id)}
                                          className="px-2 py-0.5 bg-[#FF927E] text-[#172C32] rounded-lg text-[11px] font-bold"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setPendingDeletePricingId(null)}
                                          className="text-[#556B70] text-[11px]"
                                        >
                                          Cancel
                                        </button>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setPendingDeletePricingId(pr.id)}
                                        className="text-[#9C2A1A] hover:underline font-semibold inline-flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {operatorLab && (
                  <div className="bg-white border border-[#D9E9E5] rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-[#D9E9E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-[#172C32]">Lahore Branches &amp; Home Collection Fees</h2>
                        <p className="text-xs text-[#556B70]">
                          Add new collection centres and update branch operating hours and home sampling tariffs live.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddBranch((prev) => !prev)}
                        className="px-3.5 py-2 bg-[#073B43] hover:bg-[#087F8C] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-center min-h-[40px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{showAddBranch ? 'Close Branch Form' : 'Add Lahore Branch'}</span>
                      </button>
                    </div>
                    {showAddBranch && (
                      <form
                        onSubmit={handleCreateBranch}
                        className="p-4 sm:p-5 bg-[#F3F7F4] border-b border-[#D9E9E5] space-y-3 text-xs"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">Branch Name *</label>
                            <input
                              type="text"
                              required
                              value={branchName}
                              onChange={(e) => setBranchName(e.target.value)}
                              placeholder="DHA Phase 6 Collection Centre"
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">Lahore Zone / Area *</label>
                            <input
                              type="text"
                              required
                              value={branchArea}
                              onChange={(e) => setBranchArea(e.target.value)}
                              placeholder="DHA Phase 6"
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">Street Address *</label>
                            <input
                              type="text"
                              required
                              value={branchAddress}
                              onChange={(e) => setBranchAddress(e.target.value)}
                              placeholder="Plot 42-C Raya Commercial, DHA Phase 6, Lahore"
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">Direct Phone (+92)</label>
                            <input
                              type="text"
                              value={branchPhone}
                              onChange={(e) => setBranchPhone(e.target.value)}
                              placeholder="+92 42 357 000 11"
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">Operating Hours</label>
                            <input
                              type="text"
                              value={branchHours}
                              onChange={(e) => setBranchHours(e.target.value)}
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#172C32] mb-1">Home Collection Fee (PKR)</label>
                            <input
                              type="number"
                              min={0}
                              max={5000}
                              value={branchFee}
                              onChange={(e) => setBranchFee(e.target.value)}
                              className="w-full bg-white border border-[#D9E9E5] rounded-xl p-2.5 font-mono text-[#172C32]"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={isSavingLabEntity}
                            className="px-4 py-2.5 bg-[#073B43] hover:bg-[#087F8C] text-white rounded-xl font-bold min-h-[40px]"
                          >
                            {isSavingLabEntity ? 'Adding...' : 'Save Lahore Branch'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddBranch(false)}
                            className="px-3.5 py-2.5 bg-white border border-[#D9E9E5] text-[#556B70] rounded-xl font-semibold min-h-[40px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                    <div className="divide-y divide-[#D9E9E5] text-xs">
                      {operatorLab.branches.map((br) => {
                        const isEd = editingBranchId === br.id;
                        return (
                          <div
                            key={br.id}
                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-[#172C32]">
                                {br.name} · {br.area}
                                {br.isHeadquarters && (
                                  <span className="font-mono text-[10px] text-[#087F8C] ml-2">HQ FLAGSHIP</span>
                                )}
                              </div>
                              <div className="text-[#556B70]">{br.address}</div>
                              <div className="font-mono text-[11px] text-[#556B70]">
                                {isEd ? (
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <input
                                      type="text"
                                      value={editBranchHours}
                                      onChange={(e) => setEditBranchHours(e.target.value)}
                                      className="border border-[#087F8C] rounded-lg px-2 py-1 w-44 text-[#172C32]"
                                      placeholder="Operating hours"
                                    />
                                    <input
                                      type="number"
                                      value={editBranchFee}
                                      onChange={(e) => setEditBranchFee(e.target.value)}
                                      className="border border-[#087F8C] rounded-lg px-2 py-1 w-28 text-[#172C32]"
                                      placeholder="Fee PKR"
                                    />
                                  </div>
                                ) : (
                                  `Hours: ${br.operatingHours} · Home Fee: ${
                                    br.homeCollectionFeePkr === 0 ? 'FREE (PKR 0)' : `PKR ${br.homeCollectionFeePkr}`
                                  }`
                                )}
                              </div>
                            </div>
                            <div>
                              {isEd ? (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveBranchConfig(br.id)}
                                    className="px-3 py-1.5 bg-[#073B43] text-white rounded-lg font-bold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingBranchId(null)}
                                    className="px-2 py-1.5 text-[#556B70]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingBranchId(br.id);
                                      setEditBranchHours(br.operatingHours);
                                      setEditBranchFee(String(br.homeCollectionFeePkr));
                                    }}
                                    className="text-[#087F8C] font-bold hover:underline"
                                  >
                                    Edit Branch
                                  </button>
                                  {!br.isHeadquarters &&
                                    operatorLab.branches.length > 1 &&
                                    (pendingDeleteBranchId === br.id ? (
                                      <span className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteBranch(br.id)}
                                          className="px-2 py-1 bg-[#FF927E] text-[#172C32] rounded-lg font-bold"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setPendingDeleteBranchId(null)}
                                          className="text-[#556B70]"
                                        >
                                          Cancel
                                        </button>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setPendingDeleteBranchId(br.id)}
                                        className="text-[#9C2A1A] hover:underline font-semibold inline-flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete Branch</span>
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* REGISTERED COLLECTION STAFF ROSTER */}
            {activeSubTab === 'COURIERS' && (
              <motion.div
                key="LAB_COURIERS"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="bg-white border border-[#D9E9E5] rounded-2xl overflow-hidden"
              >
                <div className="p-5 border-b border-[#D9E9E5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-[#172C32]">
                      Registered Field Phlebotomists ({labRiders.length})
                    </h2>
                    <p className="text-xs text-[#556B70]">
                      Active cold-chain couriers linked to {operatorLab?.name} and available for dispatch in the Order Queue.
                    </p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#087F8C]">
                    {homeCollectionCount} Home Visits Total
                  </span>
                </div>

                {labRiders.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#556B70]">
                    No couriers registered under {operatorLab?.name} yet. Phlebotomists can onboard via `/phlebotomist`.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
                    {labRiders.map((rider) => {
                      const assignedCount = bookings.filter(
                        (b) => b.phlebotomistPhone === rider.phone || b.phlebotomistName === rider.name
                      ).length;
                      const branchObj = operatorLab?.branches.find((b) => b.id === rider.branchId);
                      return (
                        <div
                          key={rider.id}
                          className="border border-[#D9E9E5] bg-[#F3F7F4]/60 rounded-2xl p-4 space-y-2.5 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-[#172C32] truncate">{rider.name}</div>
                              <div className="font-mono text-[11px] font-semibold text-[#087F8C]">
                                {rider.staffCode || 'COURIER'} · {rider.phone}
                              </div>
                            </div>
                            <span className="w-8 h-8 rounded-xl bg-[#073B43] text-[#21D4C2] flex items-center justify-center shrink-0">
                              <Bike className="w-4 h-4" />
                            </span>
                          </div>
                          <div className="pt-2 border-t border-[#D9E9E5] flex items-center justify-between text-[11px] text-[#556B70]">
                            <span className="truncate">{branchObj ? branchObj.area : rider.area}</span>
                            <span className="font-mono font-bold text-[#172C32] shrink-0">
                              {assignedCount} Assigned
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* SETTLEMENTS & ANALYTICS */}
            {activeSubTab === 'ANALYTICS' && (
              <motion.div
                key="LAB_ANALYTICS"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-8 bg-white border border-[#D9E9E5] rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h2 className="text-base font-bold text-[#172C32]">Diagnostic Order Pipeline</h2>
                        <p className="text-xs text-[#556B70]">
                          Live volume distribution across {bookings.length} active &amp; completed orders
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <RadialGaugeRing
                          percentage={completionRatePct}
                          size={62}
                          strokeWidth={6}
                          label="Reports Live"
                          color="#21D4C2"
                        />
                        <RadialGaugeRing
                          percentage={homeSharePct}
                          size={62}
                          strokeWidth={6}
                          label="Home Draw"
                          color="#B9ED69"
                        />
                      </div>
                    </div>

                    <AnimatedBarChart
                      data={pipelineChartData}
                      height={170}
                      emptyLabel="Pipeline telemetry populates once orders arrive"
                    />
                  </div>

                  <div className="lg:col-span-4 lc-gradient-ocean text-white rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5">
                    <div>
                      <span className="text-[11px] font-mono font-semibold text-[#21D4C2] uppercase tracking-wider">
                        SaaS Plan Tier
                      </span>
                      <div className="text-2xl font-extrabold font-mono text-[#B9ED69] mt-1">
                        {settlementSummary?.subscriptionTier || operatorLab?.subscriptionTier || 'GROWTH'}
                      </div>
                      <div className="text-xs text-[#D9E9E5]/85 mt-1 font-mono tabular-nums">
                        PKR{' '}
                        {(settlementSummary?.monthlySaasFeePkr ?? operatorLab?.monthlySaasFeePkr ?? 18500).toLocaleString()}{' '}
                        / month
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/15 space-y-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#D9E9E5]/80">Unsettled Bookings</span>
                        <span className="font-mono font-bold text-white tabular-nums">
                          {settlementSummary?.unsettledBookingsCount ?? 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#D9E9E5]/80">Platform Fee Rate</span>
                        <span className="font-mono font-bold text-white tabular-nums">
                          {settlementSummary?.commissionRatePct ?? 8}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#D9E9E5]/80">Unsettled Commission</span>
                        <span className="font-mono font-bold text-[#B9ED69] tabular-nums">
                          PKR {(settlementSummary?.unsettledCommissionPkr ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* IBFT Ledger Table */}
                <div className="bg-white border border-[#D9E9E5] rounded-2xl overflow-hidden">
                  <div className="p-4 sm:p-5 border-b border-[#D9E9E5] flex items-center justify-between text-xs font-bold text-[#172C32] uppercase tracking-wider">
                    <span className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#087F8C]" />
                      <span>
                        IBFT Disbursement &amp; Settlement Ledger ({settlementSummary?.settlementHistory.length || 0})
                      </span>
                    </span>
                  </div>
                  {!settlementSummary || settlementSummary.settlementHistory.length === 0 ? (
                    <div className="p-10 text-center text-xs text-[#556B70]">
                      No settled IBFT payouts recorded yet. Disbursements settled by Platform Admin appear here automatically.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F3F7F4] border-b border-[#D9E9E5] text-[#556B70] font-semibold">
                          <tr>
                            <th className="py-3 px-4">Reference</th>
                            <th className="py-3 px-4">Bookings</th>
                            <th className="py-3 px-4">Gross PKR</th>
                            <th className="py-3 px-4">Commission</th>
                            <th className="py-3 px-4">Net Disbursed</th>
                            <th className="py-3 px-4">Settled At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D9E9E5] font-mono text-[11px]">
                          {settlementSummary.settlementHistory.map((st) => (
                            <tr key={st.id} className="hover:bg-[#F3F7F4]/50">
                              <td className="py-3 px-4 font-bold text-[#172C32]">{st.referenceCode}</td>
                              <td className="py-3 px-4 tabular-nums">{st.bookingCount}</td>
                              <td className="py-3 px-4 tabular-nums">PKR {st.grossPkr.toLocaleString()}</td>
                              <td className="py-3 px-4 tabular-nums text-[#556B70]">
                                PKR {st.commissionPkr.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 tabular-nums font-bold text-[#087F8C]">
                                PKR {st.netPayablePkr.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-[#556B70]">
                                {new Date(st.settledAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Slide-Over Drawer for Alerts & Compliance Notifications */}
      <SlideOverDrawer
        isOpen={showLabNotifs}
        onClose={() => setShowLabNotifs(false)}
        title="Laboratory Alerts & Dispatch Feed"
        subtitle={`${unreadLabNotifs} unread · ${labNotifications.length} total`}
      >
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#D9E9E5] text-xs">
          {unreadLabNotifs > 0 ? (
            <button
              type="button"
              onClick={handleMarkLabNotifsRead}
              className="text-[#087F8C] font-bold hover:underline"
            >
              Mark All Read
            </button>
          ) : (
            <span className="text-[#556B70]">All alerts read</span>
          )}
          {labNotifications.some((n) => n.read) && (
            <button
              type="button"
              onClick={handleClearReadLabNotifs}
              className="text-[#9C2A1A] font-semibold hover:underline"
            >
              Clear Read
            </button>
          )}
        </div>

        {labNotifications.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#556B70]">
            No laboratory alerts recorded yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {labNotifications.map((n) => (
              <div
                key={n.id}
                className={`bg-white border border-[#D9E9E5] rounded-2xl p-3.5 text-xs space-y-1 transition-opacity ${
                  n.read ? 'opacity-65' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-[#172C32]">{n.title}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteLabNotif(n.id)}
                    title="Dismiss notification"
                    className="p-1 text-[#556B70] hover:text-[#9C2A1A] rounded shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[#556B70] leading-relaxed">{n.message}</p>
                <div className="font-mono text-[10px] text-[#087F8C] tabular-nums">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </SlideOverDrawer>

      {/* Authenticated Clinical PDF Viewer Modal */}
      <AnimatedModal isOpen={Boolean(pdfPreviewUrl)} onClose={handleClosePdfModal} maxWidthClass="max-w-4xl">
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#D9E9E5] pb-3 gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-[#087F8C]">
                Signed Pathology Report
              </span>
              <h3 className="text-base font-bold text-[#172C32]">
                {pdfPreviewBookingNum ? `Report ${pdfPreviewBookingNum}` : 'Pathology PDF'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {pdfPreviewBookingNum && (
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(pdfPreviewBookingNum)}
                  className="px-3.5 py-2 bg-[#B9ED69] hover:brightness-95 text-[#172C32] rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleClosePdfModal}
                className="p-2 rounded-lg text-[#556B70] hover:text-[#172C32] hover:bg-[#F3F7F4]"
                aria-label="Close PDF preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {pdfPreviewUrl && (
            <iframe
              src={pdfPreviewUrl}
              title="Signed Pathology PDF"
              className="w-full h-[70vh] rounded-xl border border-[#D9E9E5] bg-[#F3F7F4]"
            />
          )}
        </div>
      </AnimatedModal>
    </div>
  );
};
