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
} from 'lucide-react';
import { AnimatedModal, AnimatedNumber, AnimatedTabBar, LC_EASE, SkeletonBlock } from './ui/MotionPrimitives';
import { PortalAuthShell, AuthErrorBanner, AuthSessionLoader } from './ui/PortalAuthShell';
import { AnimatePresence, motion } from 'motion/react';

export const LabPortalPreview: React.FC = () => {
  const { authReady, labUser, loginLabStaff, registerLabStaff } = useAuth();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Live Catalog State
  const [laboratories, setLaboratories] = useState<LahoreLaboratory[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [pricings, setPricings] = useState<LaboratoryTestPricing[]>([]);

  // Gate State
  const [authTab, setAuthTab] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [selectedLabId, setSelectedLabId] = useState<string>('lab-chughtai');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('c-branch-jailrd');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [regFullName, setRegFullName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Operations Workspace State
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [bookings, setBookings] = useState<MockBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<MockBooking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilterMode, setBranchFilterMode] = useState<'ALL_BRANCHES' | 'MY_BRANCH'>('ALL_BRANCHES');
  const [activeSubTab, setActiveSubTab] = useState<'QUEUE' | 'TARIFFS' | 'ANALYTICS'>('QUEUE');
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
          setSelectedRiderId((prev) => (ridersRes.data.some((r: LabPhlebotomistSummary) => r.id === prev) ? prev : ridersRes.data[0].id));
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
    setIsLoggingIn(true);
    const res = await loginLabStaff(loginEmail.trim(), loginPassword, selectedLabId, selectedBranchId);
    setIsLoggingIn(false);
    if (!res.success) {
      setLoginError(res.error || 'Authentication failed');
    }
  };

  const handleLabRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
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

  const pipelineBreakdown = useMemo(() => {
    const stages: { key: MockBooking['status']; label: string; tone: string }[] = [
      { key: 'PENDING', label: 'Pending', tone: 'bg-amber-500' },
      { key: 'ACCEPTED', label: 'Accepted', tone: 'bg-[#4C9184]' },
      { key: 'DISPATCHED', label: 'Dispatched', tone: 'bg-[#28745B]' },
      { key: 'SAMPLE_COLLECTED', label: 'Collected', tone: 'bg-[#174C3C]' },
      { key: 'PROCESSING', label: 'Processing', tone: 'bg-[#202A27]' },
      { key: 'COMPLETED', label: 'Completed PDF', tone: 'bg-[#28745B]' },
    ];
    const maxCount = Math.max(1, ...stages.map((s) => bookings.filter((b) => b.status === s.key).length));
    return stages.map((s) => {
      const count = bookings.filter((b) => b.status === s.key).length;
      return { ...s, count, pct: Math.round((count / maxCount) * 100) };
    });
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
        subheadline="Sign in with your verified laboratory branch credentials to manage incoming requisitions, dispatch cold-chain phlebotomists, update tariffs, and release signed pathology PDFs."
        icon={<Building2 className="w-4 h-4" />}
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
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#28745B]">
            Laboratory Authentication
          </span>
          <h2 className="text-2xl font-bold text-[#202A27] tracking-tight">
            {authTab === 'SIGN_IN' ? 'Branch Lead Sign In' : 'Register Branch Staff'}
          </h2>
          <p className="text-xs text-[#737D78]">
            Select your verified Lahore diagnostic brand and physical branch hub.
          </p>
        </div>

        <AnimatedTabBar
          layoutId="lab-auth-tab"
          activeId={authTab}
          onChange={(t) => {
            setAuthTab(t);
            setLoginError(null);
          }}
          className="w-full grid grid-cols-2"
          items={[
            { id: 'SIGN_IN', label: 'Staff Sign In' },
            { id: 'SIGN_UP', label: 'Register Staff' },
          ]}
        />

        <AuthErrorBanner message={loginError} />

        <AnimatePresence mode="wait">
          <motion.form
            key={authTab}
            initial={{ opacity: 0, x: authTab === 'SIGN_IN' ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: authTab === 'SIGN_IN' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            onSubmit={authTab === 'SIGN_IN' ? handleLabLogin : handleLabRegister}
            className="space-y-3.5 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#202A27] mb-1.5">Diagnostic Brand</label>
                <select
                  value={selectedLabId}
                  onChange={(e) => {
                    const nid = e.target.value;
                    setSelectedLabId(nid);
                    const found = laboratories.find((l) => l.id === nid);
                    if (found && found.branches.length > 0) setSelectedBranchId(found.branches[0].id);
                  }}
                  className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27] focus:outline-none focus:border-[#174C3C] focus:bg-white transition-colors"
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
                  <label className="block font-semibold text-[#202A27] mb-1.5">Lahore Branch</label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27] focus:outline-none focus:border-[#174C3C] focus:bg-white transition-colors"
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
                  <label className="block font-semibold text-[#202A27] mb-1.5">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Dr. Kamran Chughtai"
                    className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27] focus:outline-none focus:border-[#174C3C] focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#202A27] mb-1.5">Mobile (+92)</label>
                  <input
                    type="text"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+92 3XX XXXXXXX"
                    className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 font-mono text-[#202A27] focus:outline-none focus:border-[#174C3C] focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#202A27] mb-1.5">Institutional Email</label>
              <div className="flex items-center bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 focus-within:border-[#174C3C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#174C3C]/10 transition-all">
                <Mail className="w-4 h-4 text-[#737D78] shrink-0" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="operator@laboratory.pk"
                  className="w-full bg-transparent px-2.5 py-2.5 text-[#202A27] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#202A27] mb-1.5">Password</label>
              <div className="flex items-center bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 focus-within:border-[#174C3C] focus-within:bg-white focus-within:ring-3 focus-within:ring-[#174C3C]/10 transition-all">
                <Lock className="w-4 h-4 text-[#737D78] shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter staff password"
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
                  : authTab === 'SIGN_IN'
                  ? 'Sign In to Lab Console'
                  : 'Register Branch Lead'}
              </span>
            </motion.button>
          </motion.form>
        </AnimatePresence>

        <div className="pt-3 border-t border-[#E8EFE8] text-[11px] text-[#737D78]">
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
  const grossRevenuePkr = bookings.reduce((sum, b) => sum + (b.totalPkr || 0), 0);

  const navItems: { id: typeof activeSubTab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'QUEUE', label: 'Order Queue', icon: <ClipboardList className="w-4 h-4" />, count: bookings.length },
    { id: 'TARIFFS', label: 'Tariffs & Branches', icon: <Settings className="w-4 h-4" /> },
    { id: 'ANALYTICS', label: 'Settlements & Plan', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="py-6 px-4 md:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Collapsible Desktop SaaS Sidebar */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 72 : 244 }}
          transition={{ duration: 0.22, ease: LC_EASE }}
          className="hidden lg:flex flex-col shrink-0 bg-white border border-[#DCE4DE] rounded-2xl p-3 space-y-4 sticky top-20 overflow-hidden"
        >
          <div className="flex items-center justify-between px-1.5 pt-1">
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-semibold text-[#28745B] uppercase truncate">
                  {operatorLab?.phcLicence || 'PHC Verified'}
                </div>
                <div className="text-xs font-bold text-[#202A27] truncate">{operatorLab?.name}</div>
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
              const isActive = activeSubTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSubTab(item.id)}
                  className={`relative w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive ? 'text-white font-semibold' : 'text-[#737D78] hover:text-[#202A27] hover:bg-[#F8F8F3]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="lab-sidebar-active"
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

          {!sidebarCollapsed && (
            <div className="pt-3 border-t border-[#E8EFE8] px-2 space-y-1.5 text-[11px] text-[#737D78]">
              <div className="font-semibold text-[#202A27] truncate">{operatorBranch?.name}</div>
              <div className="truncate">{operatorBranch?.address}</div>
              <div className="font-mono text-[#28745B]">Operator: {labUser.name}</div>
            </div>
          )}
        </motion.aside>

        {/* Main Operations Column */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Top Operational Header + Mobile Navigation */}
          <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] font-mono font-semibold text-[#28745B] uppercase tracking-wider">
                {operatorLab?.phcLicence || 'PHC Verified'} · Branch Operations Console
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#202A27] truncate">{operatorLab?.name}</h1>
              <p className="text-xs text-[#737D78] mt-0.5 truncate">
                {operatorBranch?.name} · Operator: <strong className="text-[#202A27]">{labUser.name}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLabNotifs((prev) => !prev)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[40px] border transition-colors ${
                  showLabNotifs
                    ? 'bg-[#174C3C] text-white border-[#174C3C]'
                    : 'bg-[#F8F8F3] hover:bg-[#E8EFE8] text-[#202A27] border-[#DCE4DE]'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Alerts ({unreadLabNotifs})</span>
              </button>

              <button
                type="button"
                onClick={fetchLiveBookings}
                className="p-2.5 bg-[#F8F8F3] hover:bg-[#E8EFE8] border border-[#DCE4DE] rounded-xl text-[#174C3C]"
                title="Refresh Queue"
              >
                <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Mobile/Tablet Tabs */}
          <div className="lg:hidden">
            <AnimatedTabBar
              layoutId="lab-mobile-tabs"
              activeId={activeSubTab}
              onChange={setActiveSubTab}
              items={navItems.map((n) => ({ id: n.id, label: n.label, count: n.count }))}
            />
          </div>

          {/* Live Notifications Feed */}
          <AnimatePresence>
            {showLabNotifs && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4 sm:p-5 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-[#E8EFE8] pb-2">
                    <span className="font-bold text-[#202A27]">
                      Laboratory Alerts &amp; Compliance Feed ({labNotifications.length})
                    </span>
                    <div className="flex items-center gap-3">
                      {unreadLabNotifs > 0 && (
                        <button type="button" onClick={handleMarkLabNotifsRead} className="text-[#174C3C] font-semibold hover:underline">
                          Mark All Read
                        </button>
                      )}
                      {labNotifications.some((n) => n.read) && (
                        <button type="button" onClick={handleClearReadLabNotifs} className="text-rose-700 font-semibold hover:underline">
                          Clear Read
                        </button>
                      )}
                      <button type="button" onClick={() => setShowLabNotifs(false)} className="text-[#737D78]">
                        Close
                      </button>
                    </div>
                  </div>
                  {labNotifications.length === 0 ? (
                    <div className="text-[#737D78] py-2">No laboratory alerts yet.</div>
                  ) : (
                    <div className="divide-y divide-[#E8EFE8] max-h-48 overflow-y-auto">
                      {labNotifications.slice(0, 8).map((n) => (
                        <div key={n.id} className={`py-2 flex items-start justify-between gap-3 ${n.read ? 'opacity-65' : ''}`}>
                          <div>
                            <div className="font-semibold text-[#202A27]">{n.title}</div>
                            <div className="text-[#737D78]">{n.message}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[11px] text-[#737D78] tabular-nums">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteLabNotif(n.id)}
                              title="Dismiss notification"
                              className="p-1 text-[#737D78] hover:text-rose-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {labOpsMsg && (
            <div className="p-3 bg-[#E8EFE8]/70 border border-[#28745B]/25 text-[#174C3C] rounded-xl text-xs flex items-center justify-between">
              <span>{labOpsMsg}</span>
              <button type="button" onClick={() => setLabOpsMsg(null)} className="font-semibold p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {labOpsError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
              <span>{labOpsError}</span>
              <button type="button" onClick={() => setLabOpsError(null)} className="font-semibold p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {operatorLab && operatorLab.verificationStatus !== 'VERIFIED' && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900">
              <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">PHC Regulatory Licence Revoked — New Patient Bookings Disabled</div>
                <div className="text-rose-800 mt-0.5">
                  PHC Regulatory Admin has marked {operatorLab.name} as{' '}
                  <span className="font-mono font-bold">{operatorLab.verificationStatus}</span>. Existing in-progress orders can still be completed.
                </div>
              </div>
            </div>
          )}

          {/* Computed KPI Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4">
              <div className="text-[11px] font-medium text-[#737D78]">Total Orders</div>
              <div className="text-xl font-bold font-mono text-[#202A27] mt-1">
                <AnimatedNumber value={bookings.length} />
              </div>
            </div>
            <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4">
              <div className="text-[11px] font-medium text-[#737D78]">Published PDFs</div>
              <div className="text-xl font-bold font-mono text-[#28745B] mt-1">
                <AnimatedNumber value={completedCount} />
              </div>
            </div>
            <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4">
              <div className="text-[11px] font-medium text-[#737D78]">Gross Lab Volume</div>
              <div className="text-xl font-bold font-mono text-[#202A27] mt-1">
                <AnimatedNumber value={grossRevenuePkr} prefix="PKR " />
              </div>
            </div>
            <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4">
              <div className="text-[11px] font-medium text-[#737D78]">Unsettled Payout</div>
              <div className="text-xl font-bold font-mono text-[#174C3C] mt-1">
                <AnimatedNumber value={settlementSummary?.unsettledNetPayablePkr ?? 0} prefix="PKR " />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* QUEUE WORKSPACE */}
            {activeSubTab === 'QUEUE' && (
              <motion.div
                key="LAB_QUEUE"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: LC_EASE }}
                className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"
              >
                {/* Bookings List */}
                <div className="xl:col-span-5 bg-white border border-[#DCE4DE] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E8EFE8]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#737D78]">
                      Branch Queue ({filteredBookings.length})
                    </span>
                    <select
                      value={branchFilterMode}
                      onChange={(e) => setBranchFilterMode(e.target.value as 'ALL_BRANCHES' | 'MY_BRANCH')}
                      className="text-[11px] bg-[#F8F8F3] border border-[#DCE4DE] rounded-lg px-2.5 py-1 text-[#202A27]"
                    >
                      <option value="ALL_BRANCHES">All Lab Branches</option>
                      <option value="MY_BRANCH">My Branch Only</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {['ALL', 'PENDING', 'ACCEPTED', 'DISPATCHED', 'SAMPLE_COLLECTED', 'COMPLETED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg whitespace-nowrap transition-colors ${
                          statusFilter === st
                            ? 'bg-[#174C3C] text-white'
                            : 'bg-[#F8F8F3] text-[#737D78] hover:text-[#202A27]'
                        }`}
                      >
                        {st === 'ALL' ? 'All' : st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                    {isLoading && bookings.length === 0 ? (
                      <div className="space-y-2">
                        <SkeletonBlock className="h-24 w-full rounded-xl" />
                        <SkeletonBlock className="h-24 w-full rounded-xl" />
                      </div>
                    ) : filteredBookings.length === 0 ? (
                      <div className="py-10 text-center text-xs text-[#737D78] bg-[#F8F8F3] rounded-xl">
                        No appointments in queue for this filter.
                      </div>
                    ) : (
                      filteredBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => {
                            setSelectedBooking(b);
                            setUploadSuccessMsg(null);
                            setUploadErrorMsg(null);
                            setEmailOnlySuccess(null);
                            setEmailOnlyError(null);
                          }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all text-xs ${
                            selectedBooking?.id === b.id
                              ? 'bg-[#E8EFE8]/70 border-[#174C3C]'
                              : 'bg-white border-[#DCE4DE] hover:bg-[#F8F8F3]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-[#202A27]">{b.bookingNumber}</span>
                            <span className="text-[10px] font-mono font-semibold text-[#174C3C]">
                              {b.phlebotomistStatus || b.status}
                            </span>
                          </div>
                          <div className="font-bold text-sm text-[#202A27]">{b.patientName}</div>
                          <div className="text-[#737D78] mt-0.5 truncate">
                            {b.branchName} · {b.scheduledTimeSlot}
                          </div>
                          <div className="mt-2 pt-2 border-t border-[#E8EFE8] flex justify-between font-mono">
                            <span className="text-[#737D78]">{b.collectionType.replace('_', ' ')}</span>
                            <span className="font-bold text-[#202A27] tabular-nums">PKR {b.totalPkr.toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Detail & Report Release */}
                {selectedBooking ? (
                  <div className="xl:col-span-7 bg-white border border-[#DCE4DE] rounded-2xl p-5 sm:p-6 space-y-6">
                    <div className="border-b border-[#E8EFE8] pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <span className="font-mono text-xs font-bold text-[#174C3C]">
                          {selectedBooking.bookingNumber}
                        </span>
                        <h2 className="text-xl font-bold text-[#202A27]">{selectedBooking.patientName}</h2>
                        <div className="text-xs text-[#737D78] flex flex-wrap gap-3">
                          <span className="font-mono flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {selectedBooking.patientPhone}
                          </span>
                          {selectedBooking.patientEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5" />
                              {selectedBooking.patientEmail}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#737D78] flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{selectedBooking.streetAddress || selectedBooking.branchName}</span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-[#737D78] uppercase font-semibold">Total Tariff</div>
                        <div className="text-xl font-bold font-mono text-[#202A27] tabular-nums">
                          PKR {selectedBooking.totalPkr.toLocaleString()}
                        </div>
                        {selectedBooking.sampleBarcode && (
                          <span className="text-[10px] font-mono text-[#174C3C] block mt-1">
                            Barcode: {selectedBooking.sampleBarcode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Milestone Buttons */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#737D78]">
                        Update Laboratory Stage (Syncs Live Patient Tracking)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['ACCEPTED', 'DISPATCHED', 'PROCESSING'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateStatus(selectedBooking.id, st)}
                            className={`px-3.5 py-2 text-xs font-semibold border rounded-xl min-h-[38px] transition-colors ${
                              selectedBooking.status === st
                                ? 'bg-[#174C3C] text-white border-[#174C3C]'
                                : 'bg-[#F8F8F3] hover:bg-[#E8EFE8] text-[#202A27] border-[#DCE4DE]'
                            }`}
                          >
                            Mark {st}
                          </button>
                        ))}
                        {selectedBooking.status === 'CANCELLED' && !selectedBooking.reportUrl && (
                          pendingDeleteBookingId === selectedBooking.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDeleteCancelledBooking(selectedBooking.id, selectedBooking.bookingNumber)}
                                className="px-3 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl min-h-[38px]"
                              >
                                Confirm Remove Cancelled Order
                              </button>
                              <button
                                type="button"
                                onClick={() => setPendingDeleteBookingId(null)}
                                className="px-2.5 py-2 text-xs font-semibold bg-[#F8F8F3] border border-[#DCE4DE] text-[#202A27] rounded-xl min-h-[38px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPendingDeleteBookingId(selectedBooking.id)}
                              className="px-3.5 py-2 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl min-h-[38px] flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Cancelled Order</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Home Phlebotomist Assignment Dispatch */}
                    {selectedBooking.collectionType === 'HOME_COLLECTION' && selectedBooking.status !== 'CANCELLED' && (
                      <div className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-4 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#202A27] flex items-center gap-1.5 uppercase tracking-wider">
                            <Bike className="w-4 h-4 text-[#174C3C]" />
                            <span>Assign Field Phlebotomist</span>
                          </span>
                          {selectedBooking.phlebotomistName && (
                            <span className="font-mono text-[11px] text-[#28745B] font-semibold">
                              Assigned: {selectedBooking.phlebotomistName}
                            </span>
                          )}
                        </div>

                        {labRiders.length === 0 ? (
                          <div className="text-[11px] text-[#737D78]">
                            No registered couriers found for this lab yet. Couriers can register at /phlebotomist.
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <select
                              value={selectedRiderId}
                              onChange={(e) => setSelectedRiderId(e.target.value)}
                              className="flex-1 bg-white border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27] min-h-[40px]"
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
                              className="px-4 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold whitespace-nowrap min-h-[40px] disabled:opacity-50"
                            >
                              {isDispatchingRider ? 'Dispatching...' : 'Assign & Dispatch Rider'}
                            </button>
                          </div>
                        )}

                        {dispatchMsg && (
                          <div className="p-2.5 bg-[#E8EFE8]/70 border border-[#28745B]/25 text-[#174C3C] rounded-lg">{dispatchMsg}</div>
                        )}
                        {dispatchError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">{dispatchError}</div>
                        )}
                      </div>
                    )}

                    {/* Multi-Parameter PDF Result Publisher & Automated Email Dispatch */}
                    <form onSubmit={handleReleasePdfReport} className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-4 sm:p-5 space-y-4 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-[#202A27] uppercase tracking-wider">
                            Pathology Workbench · Generate Signed PDF &amp; Email Patient
                          </h3>
                          <p className="text-[11px] text-[#737D78]">
                            Creates verifiable %PDF-1.4 document with SHA-256 checksum &amp; delivers to patient portal + email.
                          </p>
                        </div>
                        <FileText className="w-5 h-5 text-[#174C3C]" />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#202A27] mb-1">Signing Pathologist</label>
                        <input
                          type="text"
                          required
                          value={pathologistName}
                          onChange={(e) => setPathologistName(e.target.value)}
                          className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-[#202A27]">
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
                            className="text-[11px] font-semibold text-[#174C3C] flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Parameter</span>
                          </button>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {reportParams.map((param, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-1.5 bg-white border border-[#DCE4DE] rounded-xl p-2 items-center">
                              <input
                                type="text"
                                value={param.parameter}
                                placeholder="Parameter"
                                onChange={(e) =>
                                  setReportParams((prev) =>
                                    prev.map((item, i) => (i === idx ? { ...item, parameter: e.target.value } : item))
                                  )
                                }
                                className="col-span-4 border border-[#DCE4DE] rounded-lg px-2 py-1.5 text-[11px] font-medium"
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
                                className="col-span-3 border border-[#DCE4DE] rounded-lg px-2 py-1.5 font-mono text-[11px] font-bold"
                              />
                              <span className="col-span-2 text-[10px] font-mono text-[#737D78] truncate" title={param.referenceRange}>
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
                                className="col-span-2 border border-[#DCE4DE] rounded-lg px-1.5 py-1.5 font-mono text-[10px] font-bold bg-[#F8F8F3]"
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
                                  className="p-1 text-[#737D78] hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#202A27] mb-1">Clinical Pathologist Notes</label>
                        <textarea
                          rows={2}
                          value={clinicalNotes}
                          onChange={(e) => setClinicalNotes(e.target.value)}
                          className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#202A27] mb-1">
                          Patient Email Recipient (Simultaneous Portal + Email Delivery)
                        </label>
                        <input
                          type="email"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="patient@example.com"
                          className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
                        />
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer bg-white border border-[#DCE4DE] rounded-xl p-3">
                        <input
                          type="checkbox"
                          checked={sendEmailOnRelease}
                          onChange={(e) => setSendEmailOnRelease(e.target.checked)}
                          className="accent-[#174C3C]"
                        />
                        <span className="text-[#202A27] font-medium">
                          Send PDF attachment to patient email at the exact time report is published to Patient Portal
                        </span>
                      </label>

                      {uploadErrorMsg && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">{uploadErrorMsg}</div>
                      )}
                      {uploadSuccessMsg && (
                        <div className="p-2.5 bg-[#E8EFE8] border border-[#28745B]/25 text-[#174C3C] rounded-xl flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            {uploadSuccessMsg}
                          </span>
                          <button
                            type="button"
                            disabled={isLoadingPdf}
                            onClick={() => handleOpenPdfModal(selectedBooking.bookingNumber)}
                            className="font-bold underline flex items-center gap-1 shrink-0 disabled:opacity-50"
                          >
                            {isLoadingPdf ? 'Opening...' : 'Open PDF'} <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isUploading}
                        className="w-full py-2.5 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[42px] transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{isUploading ? 'Publishing & Dispatching...' : 'Publish Signed PDF & Email Patient'}</span>
                      </button>
                    </form>

                    {/* Lab-Exclusive Email Control for Published Reports */}
                    {selectedBooking.reportUrl && (
                      <div className="bg-[#E8EFE8]/45 border border-[#28745B]/25 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-[#202A27] uppercase tracking-wider flex items-center gap-1.5">
                              <Mail className="w-4 h-4 text-[#174C3C]" />
                              <span>Lab-Controlled Patient Email Dispatch</span>
                            </h3>
                            <p className="text-[11px] text-[#737D78] mt-0.5">
                              {selectedBooking.emailDispatchedAt
                                ? `Last emailed to patient at ${new Date(selectedBooking.emailDispatchedAt).toLocaleString()}`
                                : 'Signed PDF is live in Patient Portal; send directly to patient email below.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={isLoadingPdf}
                            onClick={() => handleOpenPdfModal(selectedBooking.bookingNumber)}
                            className="px-3 py-1.5 bg-white border border-[#DCE4DE] hover:border-[#174C3C] rounded-xl font-semibold text-[#174C3C] flex items-center gap-1 self-start disabled:opacity-50"
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
                            className="flex-1 bg-white border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27] min-h-[40px]"
                          />
                          <button
                            type="button"
                            disabled={isSendingEmailOnly}
                            onClick={handleSendExistingReportEmail}
                            className="px-4 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold whitespace-nowrap min-h-[40px] disabled:opacity-50"
                          >
                            {isSendingEmailOnly ? 'Sending PDF...' : 'Send / Resend PDF to Patient Email'}
                          </button>
                        </div>

                        {emailOnlySuccess && (
                          <div className="p-2.5 bg-[#E8EFE8] border border-[#28745B]/25 text-[#174C3C] rounded-xl flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>{emailOnlySuccess}</span>
                          </div>
                        )}
                        {emailOnlyError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{emailOnlyError}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="xl:col-span-7 bg-white border border-[#DCE4DE] rounded-2xl p-12 text-center text-xs text-[#737D78]">
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
                <div className="bg-white border border-[#DCE4DE] rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-[#E8EFE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-[#202A27] flex items-center gap-2">
                        <Settings className="w-4 h-4 text-[#174C3C]" />
                        <span>Live Published Tariffs — {operatorLab?.name}</span>
                      </h2>
                      <p className="text-xs text-[#737D78]">Updates persist to database and reflect immediately in Patient Marketplace.</p>
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
                          className="px-3.5 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[38px]"
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
                        className="px-3.5 py-2 bg-[#F8F8F3] hover:bg-[#E8EFE8] text-[#202A27] border border-[#DCE4DE] rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[38px]"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#174C3C]" />
                        <span>{showCustomPanelForm ? 'Close Panel Form' : 'New Custom Panel'}</span>
                      </button>
                    </div>
                  </div>

                  {showAddTariff && (
                    <form onSubmit={handleCreateTariff} className="p-4 sm:p-5 bg-[#E8EFE8]/45 border-b border-[#DCE4DE] grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-[#202A27] mb-1">Diagnostic Test *</label>
                        <select
                          required
                          value={newTariffTestId}
                          onChange={(e) => setNewTariffTestId(e.target.value)}
                          className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
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
                        <label className="block font-semibold text-[#202A27] mb-1">Rate (PKR) *</label>
                        <input
                          type="number"
                          required
                          min={100}
                          max={100000}
                          value={newTariffPrice}
                          onChange={(e) => setNewTariffPrice(e.target.value)}
                          className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#202A27] mb-1">Discounted PKR / TAT Hrs</label>
                        <div className="flex gap-1.5">
                          <input
                            type="number"
                            min={100}
                            placeholder="Opt"
                            value={newTariffDiscount}
                            onChange={(e) => setNewTariffDiscount(e.target.value)}
                            className="w-1/2 bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                          />
                          <input
                            type="number"
                            required
                            min={1}
                            max={168}
                            value={newTariffTat}
                            onChange={(e) => setNewTariffTat(e.target.value)}
                            className="w-1/2 bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                            title="Turnaround Hours"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isSavingLabEntity}
                          className="flex-1 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold min-h-[38px]"
                        >
                          {isSavingLabEntity ? 'Saving...' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddTariff(false)}
                          className="px-3 py-2 bg-white border border-[#DCE4DE] text-[#737D78] rounded-xl font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {showCustomPanelForm && (
                    <form onSubmit={handleCreateCustomPanel} className="p-4 sm:p-5 bg-[#E8EFE8]/45 border-b border-[#DCE4DE] space-y-3 text-xs">
                      <div className="font-bold text-[#202A27] uppercase tracking-wider">
                        Create Custom Diagnostic Panel &amp; Publish Initial Rate
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block font-semibold text-[#202A27] mb-1">Panel Code *</label>
                          <input
                            type="text"
                            required
                            value={panelCode}
                            onChange={(e) => setPanelCode(e.target.value)}
                            placeholder="CRP-QUANT"
                            className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono uppercase text-[#202A27]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#202A27] mb-1">Diagnostic Panel Name *</label>
                          <input
                            type="text"
                            required
                            value={panelName}
                            onChange={(e) => setPanelName(e.target.value)}
                            placeholder="C-Reactive Protein (Quantitative)"
                            className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#202A27] mb-1">Clinical Category</label>
                          <select
                            value={panelCategory}
                            onChange={(e) => setPanelCategory(e.target.value as DiagnosticTest['category'])}
                            className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
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
                          <label className="block font-semibold text-[#202A27] mb-1">Sample Specimen</label>
                          <select
                            value={panelSampleType}
                            onChange={(e) => setPanelSampleType(e.target.value as DiagnosticTest['sampleType'])}
                            className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                          >
                            <option value="Serum (Plain/Gel)">Serum (Plain/Gel)</option>
                            <option value="Whole Blood (EDTA)">Whole Blood (EDTA)</option>
                            <option value="Plasma (Fluoride)">Plasma (Fluoride)</option>
                            <option value="Midstream Urine">Midstream Urine</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold text-[#202A27] mb-1">Reference Normal Range</label>
                          <input
                            type="text"
                            value={panelNormalRange}
                            onChange={(e) => setPanelNormalRange(e.target.value)}
                            placeholder="< 5.0 mg/L"
                            className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#202A27] mb-1">Fasting Hours (0–24)</label>
                          <input
                            type="number"
                            min={0}
                            max={24}
                            value={panelFasting}
                            onChange={(e) => setPanelFasting(e.target.value)}
                            className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#202A27] mb-1">Initial Rate (PKR) *</label>
                          <input
                            type="number"
                            required
                            min={100}
                            max={100000}
                            value={panelPrice}
                            onChange={(e) => setPanelPrice(e.target.value)}
                            className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#202A27] mb-1">Turnaround (Hrs)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            max={168}
                            value={panelTat}
                            onChange={(e) => setPanelTat(e.target.value)}
                            className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isSavingLabEntity}
                          className="px-4 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold min-h-[38px]"
                        >
                          {isSavingLabEntity ? 'Creating...' : 'Create Panel & Publish Tariff'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomPanelForm(false)}
                          className="px-3 py-2 bg-white border border-[#DCE4DE] text-[#737D78] rounded-xl font-semibold min-h-[38px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8F8F3] border-b border-[#DCE4DE] text-[#737D78] font-semibold">
                        <tr>
                          <th className="py-3 px-4">Code</th>
                          <th className="py-3 px-4">Test Name</th>
                          <th className="py-3 px-4">Published Rate</th>
                          <th className="py-3 px-4">Discounted</th>
                          <th className="py-3 px-4">TAT (Hrs)</th>
                          <th className="py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8EFE8]">
                        {labPricings.map((pr) => {
                          const test = tests.find((t) => t.id === pr.testId);
                          const isEditing = editingPricingId === pr.id;
                          return (
                            <tr key={pr.id} className="hover:bg-[#F8F8F3]/60">
                              <td className="py-3 px-4 font-mono font-bold text-[#202A27]">{test?.code}</td>
                              <td className="py-3 px-4 font-medium text-[#202A27]">{test?.name}</td>
                              <td className="py-3 px-4 font-mono tabular-nums">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editPriceVal}
                                    onChange={(e) => setEditPriceVal(e.target.value)}
                                    className="w-24 border border-[#DCE4DE] rounded-lg px-2 py-1"
                                  />
                                ) : (
                                  `PKR ${pr.pricePkr.toLocaleString()}`
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono tabular-nums text-[#174C3C]">
                                {pr.discountedPricePkr ? `PKR ${pr.discountedPricePkr.toLocaleString()}` : '—'}
                              </td>
                              <td className="py-3 px-4 font-mono tabular-nums">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editTatVal}
                                    onChange={(e) => setEditTatVal(e.target.value)}
                                    className="w-16 border border-[#DCE4DE] rounded-lg px-2 py-1"
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
                                      className="px-2.5 py-1 bg-[#174C3C] text-white rounded-lg font-semibold"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPricingId(null)}
                                      className="px-2 py-1 text-[#737D78]"
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
                                      className="text-[#174C3C] font-semibold hover:underline"
                                    >
                                      Edit Rate
                                    </button>
                                    {pendingDeletePricingId === pr.id ? (
                                      <span className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleDeletePricing(pr.id)}
                                          className="px-2 py-0.5 bg-rose-600 text-white rounded-lg text-[11px] font-semibold"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setPendingDeletePricingId(null)}
                                          className="text-[#737D78] text-[11px]"
                                        >
                                          Cancel
                                        </button>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setPendingDeletePricingId(pr.id)}
                                        className="text-rose-700 hover:underline font-semibold inline-flex items-center gap-1"
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
                  <div className="bg-white border border-[#DCE4DE] rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-[#E8EFE8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-[#202A27]">Lahore Branches &amp; Home Collection Fees</h2>
                        <p className="text-xs text-[#737D78]">Add new collection centres and update branch operating hours and home sampling tariffs live.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddBranch((prev) => !prev)}
                        className="px-3.5 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center min-h-[38px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{showAddBranch ? 'Close Branch Form' : 'Add Lahore Branch'}</span>
                      </button>
                    </div>
                    {showAddBranch && (
                      <form onSubmit={handleCreateBranch} className="p-4 sm:p-5 bg-[#E8EFE8]/45 border-b border-[#DCE4DE] space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">Branch Name *</label>
                            <input
                              type="text"
                              required
                              value={branchName}
                              onChange={(e) => setBranchName(e.target.value)}
                              placeholder="DHA Phase 6 Collection Centre"
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">Lahore Zone / Area *</label>
                            <input
                              type="text"
                              required
                              value={branchArea}
                              onChange={(e) => setBranchArea(e.target.value)}
                              placeholder="DHA Phase 6"
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">Street Address *</label>
                            <input
                              type="text"
                              required
                              value={branchAddress}
                              onChange={(e) => setBranchAddress(e.target.value)}
                              placeholder="Plot 42-C Raya Commercial, DHA Phase 6, Lahore"
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">Direct Phone (+92)</label>
                            <input
                              type="text"
                              value={branchPhone}
                              onChange={(e) => setBranchPhone(e.target.value)}
                              placeholder="+92 42 357 000 11"
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">Operating Hours</label>
                            <input
                              type="text"
                              value={branchHours}
                              onChange={(e) => setBranchHours(e.target.value)}
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#202A27] mb-1">Home Collection Fee (PKR)</label>
                            <input
                              type="number"
                              min={0}
                              max={5000}
                              value={branchFee}
                              onChange={(e) => setBranchFee(e.target.value)}
                              className="w-full bg-white border border-[#DCE4DE] rounded-xl p-2 font-mono text-[#202A27]"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            disabled={isSavingLabEntity}
                            className="px-4 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold min-h-[38px]"
                          >
                            {isSavingLabEntity ? 'Adding...' : 'Save Lahore Branch'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddBranch(false)}
                            className="px-3 py-2 bg-white border border-[#DCE4DE] text-[#737D78] rounded-xl font-semibold min-h-[38px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                    <div className="divide-y divide-[#E8EFE8] text-xs">
                      {operatorLab.branches.map((br) => {
                        const isEd = editingBranchId === br.id;
                        return (
                          <div key={br.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <div className="font-bold text-[#202A27]">{br.name} · {br.area}</div>
                              <div className="text-[#737D78]">{br.address}</div>
                              <div className="font-mono text-[11px] text-[#737D78]">
                                {isEd ? (
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <input
                                      type="text"
                                      value={editBranchHours}
                                      onChange={(e) => setEditBranchHours(e.target.value)}
                                      className="border border-[#DCE4DE] rounded-lg px-2 py-1 w-44 text-[#202A27]"
                                      placeholder="Operating hours"
                                    />
                                    <input
                                      type="number"
                                      value={editBranchFee}
                                      onChange={(e) => setEditBranchFee(e.target.value)}
                                      className="border border-[#DCE4DE] rounded-lg px-2 py-1 w-28 text-[#202A27]"
                                      placeholder="Fee PKR"
                                    />
                                  </div>
                                ) : (
                                  `Hours: ${br.operatingHours} · Home Fee: ${br.homeCollectionFeePkr === 0 ? 'FREE (PKR 0)' : `PKR ${br.homeCollectionFeePkr}`}`
                                )}
                              </div>
                            </div>
                            <div>
                              {isEd ? (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveBranchConfig(br.id)}
                                    className="px-3 py-1.5 bg-[#174C3C] text-white rounded-lg font-semibold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingBranchId(null)}
                                    className="px-2 py-1.5 text-[#737D78]"
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
                                    className="text-[#174C3C] font-semibold hover:underline"
                                  >
                                    Edit Branch
                                  </button>
                                  {!br.isHeadquarters && operatorLab.branches.length > 1 && (
                                    pendingDeleteBranchId === br.id ? (
                                      <span className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteBranch(br.id)}
                                          className="px-2 py-1 bg-rose-600 text-white rounded-lg font-semibold"
                                        >
                                          Confirm
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setPendingDeleteBranchId(null)}
                                          className="text-[#737D78]"
                                        >
                                          Cancel
                                        </button>
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setPendingDeleteBranchId(br.id)}
                                        className="text-rose-700 hover:underline font-semibold inline-flex items-center gap-1"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete Branch</span>
                                      </button>
                                    )
                                  )}
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
                {/* Real Computed Pipeline Visualization + Plan Tier */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-8 bg-white border border-[#DCE4DE] rounded-2xl p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-[#202A27]">Diagnostic Order Pipeline Breakdown</h2>
                        <p className="text-xs text-[#737D78]">Live operational stage counts across {bookings.length} orders</p>
                      </div>
                      <span className="text-[11px] font-mono text-[#28745B] font-semibold">Order Pipeline</span>
                    </div>

                    <div className="space-y-3">
                      {pipelineBreakdown.map((stage) => (
                        <div key={stage.key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#202A27]">{stage.label}</span>
                            <span className="font-mono font-semibold text-[#737D78] tabular-nums">{stage.count}</span>
                          </div>
                          <div className="h-2 bg-[#F8F8F3] border border-[#E8EFE8] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${stage.count === 0 ? 0 : Math.max(6, stage.pct)}%` }}
                              transition={{ duration: 0.45, ease: LC_EASE }}
                              className={`h-full ${stage.tone} rounded-full`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-white border border-[#DCE4DE] rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-[#737D78] uppercase tracking-wider">SaaS Plan Tier</span>
                      <div className="text-2xl font-bold font-mono text-[#174C3C] mt-1">
                        {settlementSummary?.subscriptionTier || operatorLab?.subscriptionTier || 'GROWTH'}
                      </div>
                      <div className="text-xs text-[#737D78] mt-1 font-mono tabular-nums">
                        PKR {(settlementSummary?.monthlySaasFeePkr ?? operatorLab?.monthlySaasFeePkr ?? 18500).toLocaleString()} / month
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#E8EFE8] space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#737D78]">Unsettled Bookings</span>
                        <span className="font-mono font-bold text-[#202A27]">{settlementSummary?.unsettledBookingsCount ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#737D78]">Platform Fee Rate</span>
                        <span className="font-mono font-bold text-[#202A27]">{settlementSummary?.commissionRatePct ?? 8}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#737D78]">Unsettled Commission</span>
                        <span className="font-mono font-bold text-[#202A27]">
                          PKR {(settlementSummary?.unsettledCommissionPkr ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* IBFT Ledger Table */}
                <div className="bg-white border border-[#DCE4DE] rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-[#E8EFE8] flex items-center justify-between text-xs font-bold text-[#202A27] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 text-[#174C3C]" />
                      <span>IBFT Disbursement &amp; Settlement Ledger ({settlementSummary?.settlementHistory.length || 0})</span>
                    </span>
                  </div>
                  {!settlementSummary || settlementSummary.settlementHistory.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#737D78]">
                      No settled IBFT payouts recorded yet. Disbursements settled by Platform Admin appear here automatically.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8F8F3] border-b border-[#DCE4DE] text-[#737D78] font-semibold">
                          <tr>
                            <th className="py-3 px-4">Reference</th>
                            <th className="py-3 px-4">Bookings</th>
                            <th className="py-3 px-4">Gross PKR</th>
                            <th className="py-3 px-4">Commission</th>
                            <th className="py-3 px-4">Net Disbursed</th>
                            <th className="py-3 px-4">Settled At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8EFE8] font-mono text-[11px]">
                          {settlementSummary.settlementHistory.map((st) => (
                            <tr key={st.id}>
                              <td className="py-3 px-4 font-bold text-[#202A27]">{st.referenceCode}</td>
                              <td className="py-3 px-4 tabular-nums">{st.bookingCount}</td>
                              <td className="py-3 px-4 tabular-nums">PKR {st.grossPkr.toLocaleString()}</td>
                              <td className="py-3 px-4 tabular-nums">PKR {st.commissionPkr.toLocaleString()}</td>
                              <td className="py-3 px-4 tabular-nums font-bold text-[#174C3C]">PKR {st.netPayablePkr.toLocaleString()}</td>
                              <td className="py-3 px-4 text-[#737D78]">{new Date(st.settledAt).toLocaleString()}</td>
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

      {/* Authenticated Clinical PDF Viewer Modal */}
      <AnimatedModal
        isOpen={Boolean(pdfPreviewUrl)}
        onClose={handleClosePdfModal}
        maxWidthClass="max-w-4xl"
      >
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8EFE8] pb-3 gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-[#28745B]">
                Signed Pathology Report
              </span>
              <h3 className="text-base font-bold text-[#202A27]">
                {pdfPreviewBookingNum ? `Report ${pdfPreviewBookingNum}` : 'Pathology PDF'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {pdfPreviewBookingNum && (
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(pdfPreviewBookingNum)}
                  className="px-3.5 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleClosePdfModal}
                className="p-2 rounded-lg text-[#737D78] hover:text-[#202A27] hover:bg-[#F8F8F3]"
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
              className="w-full h-[70vh] rounded-xl border border-[#DCE4DE] bg-[#F8F8F3]"
            />
          )}
        </div>
      </AnimatedModal>
    </div>
  );
};
