/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DiagnosticTest,
  LahoreLaboratory,
  LaboratoryTestPricing,
  MockBooking,
  TrackingEvent,
  DiagnosticReportRecord,
  LabReviewRecord,
  LabRatingSummary,
  NotificationRecord,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { apiClient, triggerBlobDownload } from '../api/client';
import {
  Search,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Users,
  Phone,
  RotateCw,
  FileText,
  Download,
  Mail,
  Thermometer,
  QrCode,
  Truck,
  ExternalLink,
  LogIn,
  Star,
  Plus,
  ShoppingBag,
  XCircle,
  Bell,
  TrendingUp,
  Trash2,
  X,
  Home,
  Building2,
  Clock,
} from 'lucide-react';
import {
  AnimatedModal,
  AnimatedNumber,
  AnimatedTabBar,
  EmptyState,
  LC_EASE,
  SkeletonBlock,
} from './ui/MotionPrimitives';
import { AuthSessionLoader } from './ui/PortalAuthShell';
import { PatientAuthGate } from './PatientAuthGate';
import { AnimatePresence, motion } from 'motion/react';

interface PatientPortalPreviewProps {
  activeTab: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE';
  onSelectTab: (tab: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE') => void;
  onOpenAuth: () => void;
  onOpenFamily: () => void;
  initialSearchTerm?: string;
  initialCategory?: string;
}

interface TrackingLookupResult {
  booking: MockBooking;
  labName: string;
  phcLicence?: string;
  branchName?: string;
  branchAddress?: string;
  trackingEvents: TrackingEvent[];
  reportAvailable: boolean;
  reportPdfUrl?: string;
  emailDispatchedAt?: string;
}

const TIME_SLOTS = [
  '07:30 AM – 08:30 AM',
  '08:30 AM – 09:30 AM',
  '09:30 AM – 10:30 AM',
  '11:00 AM – 12:00 PM',
  '04:00 PM – 05:00 PM',
];

export const PatientPortalPreview: React.FC<PatientPortalPreviewProps> = ({
  activeTab,
  onSelectTab,
  onOpenAuth,
  onOpenFamily,
  initialSearchTerm = '',
  initialCategory = 'ALL',
}) => {
  const { authReady, patientUser, activeFamilyMember, setActiveFamilyMember, updatePatientProfile } = useAuth();

  // Live Catalog State
  const [laboratories, setLaboratories] = useState<LahoreLaboratory[]>([]);
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [pricings, setPricings] = useState<LaboratoryTestPricing[]>([]);
  const [reviewSummaries, setReviewSummaries] = useState<LabRatingSummary[]>([]);
  const [reviews, setReviews] = useState<LabReviewRecord[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);

  // Patient Authenticated Bookings & Reports
  const [myBookings, setMyBookings] = useState<MockBooking[]>([]);
  const [myReports, setMyReports] = useState<DiagnosticReportRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);

  // Discovery Filters, Sort & Multi-Test Requisition Basket
  const [searchTerm, setSearchTerm] = useState<string>(initialSearchTerm);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<'PRICE' | 'TAT' | 'NAME'>('PRICE');
  const [freeHomeOnly, setFreeHomeOnly] = useState<boolean>(false);
  const [comparingTestId, setComparingTestId] = useState<string>('test-cbc');
  const [basketTestIds, setBasketTestIds] = useState<string[]>([]);

  useEffect(() => {
    if (initialSearchTerm !== undefined && initialSearchTerm !== '') {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm]);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Booking Modal State (Supports single or multi-test panel checkout)
  const [bookingTestIds, setBookingTestIds] = useState<string[]>([]);
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [collectionType, setCollectionType] = useState<'HOME_COLLECTION' | 'BRANCH_VISIT'>('HOME_COLLECTION');
  const [streetAddress, setStreetAddress] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('07:30 AM – 08:30 AM');
  const [patientName, setPatientName] = useState<string>('');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail, setPatientEmail] = useState<string>('');
  const [fastingAcknowledged, setFastingAcknowledged] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccessNum, setBookingSuccessNum] = useState<string | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);

  // Reschedule & Review Modals State
  const [rescheduleTarget, setRescheduleTarget] = useState<MockBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('08:30 AM – 09:30 AM');
  const [bookingActionMsg, setBookingActionMsg] = useState<string | null>(null);
  const [bookingActionError, setBookingActionError] = useState<string | null>(null);
  const [pendingDeleteBookingId, setPendingDeleteBookingId] = useState<string | null>(null);
  const [reviewTargetBooking, setReviewTargetBooking] = useState<MockBooking | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Live Tracking State
  const [trackingQuery, setTrackingQuery] = useState<string>('');
  const [trackingData, setTrackingData] = useState<TrackingLookupResult | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState<boolean>(false);

  // PDF Reports Viewing State
  const [selectedReport, setSelectedReport] = useState<DiagnosticReportRecord | null>(null);
  const [reportFamilyFilter, setReportFamilyFilter] = useState<string>('ALL');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFileName, setPdfPreviewFileName] = useState<string | null>(null);
  const [pdfPreviewBookingNum, setPdfPreviewBookingNum] = useState<string | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // AI Explainer State
  const [aiLanguage, setAiLanguage] = useState<'EN' | 'UR'>('EN');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);

  // Profile Edit State
  const [profileName, setProfileName] = useState<string>('');
  const [profileEmail, setProfileEmail] = useState<string>('');
  const [profileArea, setProfileArea] = useState<string>('');
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);

  // Load runtime catalog + reviews
  const loadCatalog = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const [res, revRes] = await Promise.all([apiClient.getCatalog(), apiClient.getReviews()]);
      if (res.success && res.data) {
        setLaboratories(res.data.laboratories || []);
        setTests(res.data.tests || []);
        setPricings(res.data.pricings || []);
        setReviewSummaries(res.data.reviewSummaries || []);
        if (res.data.tests?.length && !res.data.tests.some((t: DiagnosticTest) => t.id === comparingTestId)) {
          setComparingTestId(res.data.tests[0].id);
        }
      }
      if (revRes.success && Array.isArray(revRes.data)) {
        setReviews(revRes.data);
      }
    } catch (err) {
      console.error('Failed to load diagnostic catalog:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, [comparingTestId]);

  const loadPatientRecords = useCallback(async () => {
    if (!patientUser) {
      setMyBookings([]);
      setMyReports([]);
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }
    setIsLoadingRecords(true);
    try {
      const [bkRes, repRes, notifRes] = await Promise.all([
        apiClient.getBookings({}, 'patient'),
        apiClient.getReports('patient'),
        apiClient.getNotifications('patient'),
      ]);
      if (bkRes.success && Array.isArray(bkRes.data)) {
        setMyBookings(bkRes.data);
        if (bkRes.data.length > 0) {
          setTrackingQuery((prev) => prev || bkRes.data[0].bookingNumber);
        }
      }
      if (repRes.success && Array.isArray(repRes.data)) {
        setMyReports(repRes.data);
        if (repRes.data.length > 0 && !selectedReport) {
          setSelectedReport(repRes.data[0]);
        }
      }
      if (notifRes.success && Array.isArray(notifRes.data)) {
        setNotifications(notifRes.data);
        setUnreadNotifications(notifRes.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load patient records:', err);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [patientUser, selectedReport]);

  useEffect(() => {
    loadCatalog();
    const onFocus = () => {
      loadCatalog();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [loadCatalog]);

  useEffect(() => {
    if (activeTab === 'DISCOVER') {
      loadCatalog();
    }
  }, [activeTab, loadCatalog]);

  useEffect(() => {
    loadPatientRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientUser]);

  useEffect(() => {
    if (patientUser) {
      setPatientName(activeFamilyMember?.name || patientUser.name);
      setPatientPhone(patientUser.phone);
      setPatientEmail(patientUser.email);
      setProfileName(patientUser.name);
      setProfileEmail(patientUser.email);
      setProfileArea(patientUser.area);
    }
  }, [patientUser, activeFamilyMember]);

  const handleLookupTracking = useCallback(
    async (bookingNum?: string) => {
      const target = (bookingNum || trackingQuery).trim();
      if (!target) return;
      setIsLoadingTracking(true);
      setTrackingError(null);
      try {
        const res = await apiClient.getBookingTracking(target, undefined, 'patient');
        if (res.success && res.data) {
          setTrackingData(res.data);
        } else {
          setTrackingError(res.error || 'Booking tracking not found');
          setTrackingData(null);
        }
      } catch {
        setTrackingError('Network error fetching live tracking timeline');
      } finally {
        setIsLoadingTracking(false);
      }
    },
    [trackingQuery]
  );

  const handleClosePdfModal = useCallback(() => {
    setPdfPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setPdfPreviewFileName(null);
    setPdfPreviewBookingNum(null);
  }, []);

  const handleOpenPdfModal = useCallback(async (bookingNumber: string, fileName?: string) => {
    setIsLoadingPdf(true);
    setPdfError(null);
    try {
      const blob = await apiClient.fetchReportPdfBlob(bookingNumber, false, 'patient');
      const nextUrl = URL.createObjectURL(blob);
      setPdfPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return nextUrl;
      });
      setPdfPreviewFileName(fileName || `LabConnect-${bookingNumber}.pdf`);
      setPdfPreviewBookingNum(bookingNumber);
    } catch {
      setPdfError('Unable to load clinical PDF report.');
    } finally {
      setIsLoadingPdf(false);
    }
  }, []);

  const handleDownloadPdf = useCallback(async (bookingNumber: string, fileName?: string) => {
    setPdfError(null);
    try {
      const blob = await apiClient.fetchReportPdfBlob(bookingNumber, true, 'patient');
      triggerBlobDownload(blob, fileName || `LabConnect-${bookingNumber}.pdf`);
    } catch {
      setPdfError('Unable to download clinical PDF report.');
    }
  }, []);

  // Auto-load tracking when switching to TRACKING tab
  useEffect(() => {
    if (activeTab === 'TRACKING' && trackingQuery) {
      handleLookupTracking(trackingQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        test.name.toLowerCase().includes(term) ||
        test.code.toLowerCase().includes(term) ||
        test.synonyms.some((syn) => syn.toLowerCase().includes(term));
      const matchesCategory = selectedCategory === 'ALL' || test.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tests, searchTerm, selectedCategory]);

  // Keep active comparing test aligned when search narrows results
  const activeTest = useMemo(() => {
    const exactMatch = filteredTests.find((t) => t.id === comparingTestId);
    return exactMatch || filteredTests[0] || tests.find((t) => t.id === comparingTestId) || tests[0];
  }, [filteredTests, tests, comparingTestId]);

  const testPrices = useMemo(
    () => (activeTest ? pricings.filter((p) => p.testId === activeTest.id) : []),
    [activeTest, pricings]
  );

  // Sorted & filtered lab offerings for activeTest
  const sortedLabEntries = useMemo(() => {
    const entries = laboratories
      .map((lab) => {
        const pricing = testPrices.find((p) => p.labId === lab.id);
        if (!pricing) return null;
        const homeFee = lab.branches[0]?.homeCollectionFeePkr ?? 0;
        const effectiveRate = pricing.discountedPricePkr ?? pricing.pricePkr;
        return { lab, pricing, homeFee, effectiveRate };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter((item) => (!freeHomeOnly ? true : item.homeFee === 0));

    return entries.sort((a, b) => {
      if (sortBy === 'PRICE') return a.effectiveRate - b.effectiveRate;
      if (sortBy === 'TAT') return a.pricing.statedTurnaroundHours - b.pricing.statedTurnaroundHours;
      return a.lab.name.localeCompare(b.lab.name);
    });
  }, [laboratories, testPrices, sortBy, freeHomeOnly]);

  const lowestVerifiedRate = useMemo(() => {
    const verified = sortedLabEntries.filter((e) => e.lab.verificationStatus === 'VERIFIED');
    if (verified.length === 0) return null;
    return Math.min(...verified.map((e) => e.effectiveRate));
  }, [sortedLabEntries]);

  const toggleBasketTest = (testId: string) => {
    setBasketTestIds((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const handleStartBooking = (test: DiagnosticTest, labId: string, overrideTestIds?: string[]) => {
    const lab = laboratories.find((l) => l.id === labId);
    if (!lab || lab.verificationStatus !== 'VERIFIED') {
      return;
    }
    const targetIds =
      overrideTestIds && overrideTestIds.length > 0
        ? overrideTestIds
        : basketTestIds.includes(test.id) && basketTestIds.length > 1
          ? basketTestIds
          : [test.id];
    setBookingTestIds(targetIds);
    setSelectedLabId(lab.id);
    if (lab.branches.length > 0) {
      setSelectedBranchId(lab.branches[0].id);
    }
    setBookingStep(1);
    setBookingSuccessNum(null);
    setBookingError(null);
    setFastingAcknowledged(false);
  };

  const handleCompleteBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingTestIds.length === 0) return;
    setBookingError(null);

    const selectedTestsList = tests.filter((t) => bookingTestIds.includes(t.id));
    const maxFasting = selectedTestsList.reduce((max, t) => Math.max(max, t.fastingHours), 0);

    if (!patientUser) {
      setBookingError('Please verify your mobile number via Patient Sign In before confirming this booking.');
      return;
    }

    if (!patientName || patientName.trim().length < 3) {
      setBookingError('Patient full name must be at least 3 characters.');
      return;
    }

    const cleanPhone = patientPhone.trim().replace(/[\s-]/g, '');
    if (!/^(\+92|0)?3\d{9}$/.test(cleanPhone)) {
      setBookingError('Enter a valid Pakistani mobile number (+92 3XX XXXXXXX or 03XX XXXXXXX).');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientEmail.trim())) {
      setBookingError('Enter a valid email address so your PDF test report can be delivered automatically.');
      return;
    }

    if (collectionType === 'HOME_COLLECTION' && (!streetAddress || streetAddress.trim().length < 8)) {
      setBookingError('Exact street address (min 8 chars) is required for home phlebotomy dispatch.');
      return;
    }

    if (maxFasting > 0 && !fastingAcknowledged) {
      setBookingError(`Confirm ${maxFasting}-hour fasting requirement before proceeding.`);
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const currentLab = laboratories.find((l) => l.id === selectedLabId);
      const currentBranch = currentLab?.branches.find((b) => b.id === selectedBranchId) || currentLab?.branches[0];

      const res = await apiClient.createBooking({
        patientName: patientName.trim(),
        familyMemberId: activeFamilyMember?.id,
        patientPhone: cleanPhone,
        patientEmail: patientEmail.trim(),
        patientArea: currentBranch?.area || 'Lahore',
        streetAddress: collectionType === 'HOME_COLLECTION' ? streetAddress.trim() : undefined,
        labId: selectedLabId,
        branchId: currentBranch?.id || selectedBranchId,
        testIds: bookingTestIds,
        collectionType,
        scheduledDate,
        scheduledTimeSlot: selectedTimeSlot,
        fastingAcknowledged: maxFasting > 0 ? fastingAcknowledged : true,
      });

      if (res.success && res.data) {
        setBookingSuccessNum(res.data.bookingNumber);
        setTrackingQuery(res.data.bookingNumber);
        setBasketTestIds([]);
        setBookingStep(3);
        loadPatientRecords();
      } else {
        setBookingError(res.error || 'Failed to submit booking');
      }
    } catch {
      setBookingError('Network error submitting booking');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleCancelBooking = async (booking: MockBooking) => {
    setBookingActionMsg(null);
    setBookingActionError(null);
    const res = await apiClient.cancelBooking(booking.id, 'Cancelled by patient from portal', 'patient');
    if (res.success) {
      setBookingActionMsg(`Cancelled ${booking.bookingNumber}`);
      loadPatientRecords();
    } else {
      setBookingActionError(res.error || 'Unable to cancel booking');
    }
  };

  const handleDeleteBooking = async (booking: MockBooking) => {
    setBookingActionMsg(null);
    setBookingActionError(null);
    const res = await apiClient.deleteBooking(booking.id, 'patient');
    setPendingDeleteBookingId(null);
    if (res.success) {
      setBookingActionMsg(`Removed cancelled booking ${booking.bookingNumber}`);
      loadPatientRecords();
    } else {
      setBookingActionError(res.error || 'Unable to remove booking');
    }
  };

  const handleDeleteReview = async (reviewId: string, bookingNumber: string) => {
    setBookingActionMsg(null);
    setBookingActionError(null);
    const res = await apiClient.deleteReview(reviewId, 'patient');
    if (res.success) {
      setBookingActionMsg(`Removed your review for ${bookingNumber}`);
      loadCatalog();
    } else {
      setBookingActionError(res.error || 'Unable to delete review');
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setBookingActionMsg(null);
    setBookingActionError(null);
    const res = await apiClient.rescheduleBooking(rescheduleTarget.id, rescheduleDate, rescheduleSlot, 'patient');
    if (res.success) {
      setBookingActionMsg(res.message || `Rescheduled ${rescheduleTarget.bookingNumber}`);
      setRescheduleTarget(null);
      loadPatientRecords();
    } else {
      setBookingActionError(res.error || 'Failed to reschedule booking');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTargetBooking) return;
    setReviewError(null);
    if (reviewComment.trim().length < 8) {
      setReviewError('Please write at least 8 characters describing your lab experience.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await apiClient.submitReview({
        bookingNumber: reviewTargetBooking.bookingNumber,
        rating: reviewRating,
        punctualityRating: reviewRating,
        turnaroundRating: reviewRating,
        comment: reviewComment.trim(),
      });
      if (res.success) {
        setBookingActionMsg(`Verified review published for ${reviewTargetBooking.bookingNumber}`);
        setReviewTargetBooking(null);
        setReviewComment('');
        loadCatalog();
      } else {
        setReviewError(res.error || 'Could not submit review');
      }
    } catch {
      setReviewError('Network error submitting review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleExplainParameter = async (paramName: string, observed: string, refRange: string) => {
    setIsLoadingAi(true);
    setAiExplanation(null);
    try {
      const res = await apiClient.explainReport({
        testName: paramName,
        testValue: observed,
        referenceRange: refRange,
        language: aiLanguage,
      });
      if (res.success) {
        setAiExplanation(res.explanation);
      }
    } catch {
      setAiExplanation('Unable to load explanation right now.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleExplainFullReport = async (report: DiagnosticReportRecord, langOverride?: 'EN' | 'UR') => {
    setIsLoadingAi(true);
    setAiExplanation(null);
    try {
      const res = await apiClient.explainReport({
        testName: `${report.bookingNumber} Full Panel`,
        testValue: `${report.parameters.length} parameters`,
        referenceRange: 'Laboratory Printed Ranges',
        language: langOverride || aiLanguage,
        parameters: report.parameters,
      });
      if (res.success) {
        setAiExplanation(res.explanation);
      }
    } catch {
      setAiExplanation('Unable to analyze full report panel right now.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    await apiClient.markNotificationsRead('patient');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadNotifications(0);
  };

  const handleDeleteNotification = async (id: string) => {
    const res = await apiClient.deleteNotification(id, 'patient');
    if (res.success) {
      setNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id);
        setUnreadNotifications(next.filter((n) => !n.read).length);
        return next;
      });
    }
  };

  const handleClearReadNotifications = async () => {
    const res = await apiClient.clearReadNotifications('patient');
    if (res.success) {
      setNotifications((prev) => prev.filter((n) => !n.read));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSavedMsg(null);
    const res = await updatePatientProfile({
      name: profileName,
      email: profileEmail,
      area: profileArea,
    });
    if (res.success) {
      setProfileSavedMsg('Profile updated. Future PDF reports will be sent to ' + profileEmail);
    }
  };

  const getTrackingStepIndex = (booking: MockBooking): number => {
    const pStatus = booking.phlebotomistStatus;
    if (booking.status === 'COMPLETED' || booking.reportUrl) return 5;
    if (booking.status === 'PROCESSING' || pStatus === 'RECEIVED_AT_LAB' || pStatus === 'IN_TRANSIT') return 4;
    if (booking.status === 'SAMPLE_COLLECTED' || pStatus === 'SAMPLE_COLLECTED') return 3;
    if (booking.status === 'DISPATCHED' || pStatus === 'EN_ROUTE' || pStatus === 'ARRIVED') return 2;
    if (booking.status === 'ACCEPTED') return 1;
    return 0;
  };

  const TRACKING_STEPS = [
    'Booked',
    'Lab Accepted',
    'Courier En Route',
    'Sample Collected',
    'Lab Analyzing',
    'PDF & Emailed',
  ];

  const activeBookingsCount = myBookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'COMPLETED').length;

  if (!authReady) {
    return <AuthSessionLoader label="Verifying your Patient Portal session..." />;
  }

  if (!patientUser) {
    return <PatientAuthGate pendingSearchTerm={initialSearchTerm} />;
  }

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Compact Patient Context Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#DCE4DE] rounded-2xl p-4 sm:p-5">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-[#202A27]">
            {activeTab === 'DISCOVER' && 'Compare Lahore Lab Rates & Book Tests'}
            {activeTab === 'TRACKING' && 'Live Sample & Cold-Chain Tracker'}
            {activeTab === 'REPORTS' && 'Verified PDF Pathology Reports'}
            {activeTab === 'PROFILE' && 'Patient Account & Family Passport'}
          </h1>
          <p className="text-xs text-[#737D78] mt-0.5 truncate">
            {patientUser.name} · {patientUser.phone} · {patientUser.email}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[40px] whitespace-nowrap border transition-colors ${
              showNotifications
                ? 'bg-[#174C3C] text-white border-[#174C3C]'
                : 'bg-[#F8F8F3] hover:bg-[#E8EFE8] text-[#202A27] border-[#DCE4DE]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alerts ({unreadNotifications})</span>
          </button>
          <div className="hidden sm:flex lg:hidden items-center">
            <AnimatedTabBar
              layoutId="tablet-patient-tabs"
              activeId={activeTab}
              onChange={onSelectTab}
              items={[
                { id: 'DISCOVER', label: 'Book' },
                { id: 'TRACKING', label: 'Track' },
                { id: 'REPORTS', label: 'Reports' },
                { id: 'PROFILE', label: 'Account' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Expandable Live Patient Notifications Panel */}
      <AnimatePresence>
        {patientUser && showNotifications && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#E8EFE8] pb-2.5">
                <span className="font-bold text-[#202A27]">
                  Clinical &amp; Dispatch Notifications ({notifications.length})
                </span>
                <div className="flex items-center gap-3">
                  {unreadNotifications > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[#174C3C] font-semibold hover:underline"
                    >
                      Mark All Read
                    </button>
                  )}
                  {notifications.some((n) => n.read) && (
                    <button
                      type="button"
                      onClick={handleClearReadNotifications}
                      className="text-rose-700 font-semibold hover:underline"
                    >
                      Clear Read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-[#737D78] hover:text-[#202A27]"
                  >
                    Close
                  </button>
                </div>
              </div>
              {notifications.length === 0 ? (
                <div className="text-[#737D78] py-2">No dispatch or report alerts yet.</div>
              ) : (
                <div className="divide-y divide-[#E8EFE8] max-h-56 overflow-y-auto">
                  {notifications.slice(0, 8).map((n) => (
                    <div key={n.id} className={`py-2.5 flex items-start justify-between gap-3 ${n.read ? 'opacity-65' : ''}`}>
                      <div>
                        <div className="font-semibold text-[#202A27]">
                          {n.title} <span className="font-normal text-[#737D78]">· {n.category}</span>
                        </div>
                        <div className="text-[#737D78] mt-0.5">{n.message}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[11px] text-[#737D78] tabular-nums">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(n.id)}
                          title="Delete alert"
                          className="p-1.5 text-[#737D78] hover:text-rose-600 rounded-lg transition-colors"
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

      {/* ========================================= */}
      {/* TAB 1: DISCOVER & COMPARE TESTS           */}
      {/* ========================================= */}
      <AnimatePresence mode="wait">
        {activeTab === 'DISCOVER' && (
          <motion.div
            key="TAB_DISCOVER"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            className="space-y-6"
          >
            {/* Signed-In Patient Overview Strip (Real Data Only) */}
            {patientUser && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-[#737D78]">Active Appointments</div>
                    <div className="text-xl font-bold font-mono text-[#202A27] mt-0.5">
                      <AnimatedNumber value={activeBookingsCount} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTab('TRACKING')}
                    className="text-xs font-semibold text-[#174C3C] hover:text-[#28745B] flex items-center gap-1"
                  >
                    <span>Track</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-[#737D78]">Signed PDF Reports</div>
                    <div className="text-xl font-bold font-mono text-[#174C3C] mt-0.5">
                      <AnimatedNumber value={myReports.length} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectTab('REPORTS')}
                    className="text-xs font-semibold text-[#174C3C] hover:text-[#28745B] flex items-center gap-1"
                  >
                    <span>Passport</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-medium text-[#737D78]">Family Members</div>
                    <div className="text-xl font-bold font-mono text-[#202A27] mt-0.5">
                      <AnimatedNumber value={patientUser.familyMembers.length + 1} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenFamily}
                    className="text-xs font-semibold text-[#174C3C] hover:text-[#28745B] flex items-center gap-1"
                  >
                    <span>Manage</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="bg-[#E8EFE8]/70 border border-[#28745B]/20 rounded-2xl p-4 flex flex-col justify-center">
                  <div className="text-[11px] font-semibold text-[#174C3C]">Active Booking Target</div>
                  <div className="text-xs font-bold text-[#202A27] truncate mt-0.5">
                    {activeFamilyMember
                      ? `${activeFamilyMember.name} (${activeFamilyMember.relationship})`
                      : `${patientUser.name} (Self)`}
                  </div>
                </div>
              </div>
            )}

            {/* Search, Categories & Result Filters */}
            <div className="bg-white border border-[#DCE4DE] rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#737D78] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search test name, code, or Urdu keywords (e.g. 'HbA1c', 'Lipid', 'Dengue', 'جگر')..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl text-[#202A27] focus:outline-none focus:border-[#174C3C] focus:bg-white transition-colors min-h-[44px]"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737D78] hover:text-[#202A27]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'PRICE' | 'TAT' | 'NAME')}
                    aria-label="Sort laboratories"
                    className="text-xs bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 py-2.5 font-medium text-[#202A27] min-h-[44px]"
                  >
                    <option value="PRICE">Sort: Lowest PKR First</option>
                    <option value="TAT">Sort: Fastest Report</option>
                    <option value="NAME">Sort: Lab Name A–Z</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setFreeHomeOnly((v) => !v)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border min-h-[44px] transition-colors ${
                      freeHomeOnly
                        ? 'bg-[#174C3C] text-white border-[#174C3C]'
                        : 'bg-[#F8F8F3] text-[#202A27] border-[#DCE4DE] hover:bg-[#E8EFE8]/70'
                    }`}
                  >
                    Free Home Sampling
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <AnimatedTabBar
                  layoutId="patient-category-tabs"
                  activeId={selectedCategory}
                  onChange={setSelectedCategory}
                  items={[
                    { id: 'ALL', label: 'All Panels' },
                    { id: 'HEMATOLOGY', label: 'Hematology' },
                    { id: 'ENDOCRINOLOGY', label: 'Endocrinology' },
                    { id: 'CARDIOLOGY', label: 'Cardiology' },
                    { id: 'BIOCHEMISTRY', label: 'Biochemistry' },
                    { id: 'VITAMINS', label: 'Vitamins' },
                    { id: 'INFECTIOUS_DISEASE', label: 'Infectious' },
                  ]}
                />
                <span className="text-xs text-[#737D78] font-mono tabular-nums">
                  {filteredTests.length} test{filteredTests.length === 1 ? '' : 's'} matching
                </span>
              </div>

              {/* Filtered Test Selection Rail */}
              {filteredTests.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-[#E8EFE8]">
                  {filteredTests.map((t) => {
                    const isSelected = activeTest?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setComparingTestId(t.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs border transition-colors ${
                          isSelected
                            ? 'bg-[#E8EFE8] border-[#174C3C] text-[#174C3C] font-bold'
                            : 'bg-white border-[#DCE4DE] text-[#202A27] hover:bg-[#F8F8F3]'
                        }`}
                      >
                        <span>{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-[#737D78] border-t border-[#E8EFE8]">
                  No diagnostic panels matched &ldquo;{searchTerm}&rdquo;. Try clearing your search filter.
                </div>
              )}
            </div>

            {/* Authentic Multi-Lab Comparison Matrix */}
            {isLoadingCatalog || !activeTest ? (
              <div className="bg-white border border-[#DCE4DE] rounded-2xl p-6 sm:p-8 space-y-5">
                <SkeletonBlock className="h-7 w-72 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonBlock key={i} className="h-64 w-full rounded-xl" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5 sm:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8EFE8] pb-5">
                  <div>
                    <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#28745B]">
                      Official PKR Tariff Comparison · {activeTest.code}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#202A27] mt-1">{activeTest.name}</h2>
                    <p className="text-xs text-[#737D78] mt-1">
                      Sample: {activeTest.sampleType} · Fasting:{' '}
                      {activeTest.fastingHours > 0 ? `${activeTest.fastingHours} hrs overnight` : 'No fasting required'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleBasketTest(activeTest.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[42px] self-start md:self-auto border transition-colors ${
                      basketTestIds.includes(activeTest.id)
                        ? 'bg-[#E8EFE8] border-[#174C3C] text-[#174C3C]'
                        : 'bg-[#F8F8F3] hover:bg-[#E8EFE8]/60 border-[#DCE4DE] text-[#202A27]'
                    }`}
                  >
                    {basketTestIds.includes(activeTest.id) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>In Multi-Test Basket ({basketTestIds.length})</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Add to Multi-Test Basket</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Combined Basket Strip */}
                <AnimatePresence>
                  {basketTestIds.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="bg-[#E8EFE8]/70 border border-[#28745B]/25 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="font-bold text-[#174C3C] flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4" />
                          <span>Combined Requisition Basket ({basketTestIds.length} tests · 1 shared collection fee)</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {tests
                            .filter((t) => basketTestIds.includes(t.id))
                            .map((bt) => (
                              <button
                                key={bt.id}
                                type="button"
                                onClick={() => toggleBasketTest(bt.id)}
                                className="px-2.5 py-1 rounded-lg bg-white border border-[#DCE4DE] text-[#202A27] font-medium inline-flex items-center gap-1.5 hover:border-rose-300"
                              >
                                <span className="font-mono">{bt.code}</span>
                                <span className="text-[#737D78]" aria-hidden="true">×</span>
                              </button>
                            ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBasketTestIds([])}
                        className="text-xs font-semibold text-[#737D78] hover:text-[#202A27] underline self-start sm:self-center"
                      >
                        Clear Basket
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {activeTest.fastingHours > 0 && (
                  <div className="bg-amber-50/75 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Preparation Guidance: </span>
                      {activeTest.preparationInstructions}
                    </div>
                  </div>
                )}

                {sortedLabEntries.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#737D78] bg-[#F8F8F3] rounded-xl">
                    No laboratories match the active free-home-sampling filter for this test.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {sortedLabEntries.map(({ lab, pricing, homeFee, effectiveRate }) => {
                      const isVerified = lab.verificationStatus === 'VERIFIED';
                      const ratingSummary = reviewSummaries.find((s) => s.labId === lab.id);
                      const basketSum = basketTestIds.reduce((sum, tid) => {
                        const pr = pricings.find((p) => p.labId === lab.id && p.testId === tid);
                        return sum + (pr?.discountedPricePkr ?? pr?.pricePkr ?? 0);
                      }, 0);
                      const isLowest = isVerified && lowestVerifiedRate === effectiveRate;

                      return (
                        <div
                          key={lab.id}
                          className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                            isVerified
                              ? isLowest
                                ? 'bg-white border-[#174C3C] shadow-[0_8px_24px_-12px_rgba(23,76,60,0.2)]'
                                : 'bg-[#F8F8F3]/65 border-[#DCE4DE] hover:border-[#28745B]/50'
                              : 'bg-rose-50/45 border-rose-200'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="font-bold text-[#202A27] text-sm leading-snug">{lab.name}</span>
                              {isVerified ? (
                                <span className="text-[11px] font-mono text-[#28745B] shrink-0">
                                  PHC ✓
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono font-bold text-rose-800 shrink-0">
                                  REVOKED
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] font-mono text-[#737D78] mb-2">
                              {lab.phcLicence} {isLowest ? '· Lowest Published Rate' : ''}
                            </div>
                            <p className="text-[11px] text-[#737D78] mb-3 line-clamp-2">{lab.tagline}</p>

                            {ratingSummary && ratingSummary.reviewCount > 0 && (
                              <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-semibold mb-3">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                <span className="font-mono">{ratingSummary.averageRating.toFixed(1)}</span>
                                <span className="text-[#737D78] font-normal">
                                  ({ratingSummary.reviewCount} verified)
                                </span>
                              </div>
                            )}

                            <div className="space-y-2 border-t border-[#DCE4DE] pt-3 text-xs">
                              <div className="flex items-baseline justify-between">
                                <span className="text-[#737D78]">Test Fee</span>
                                <div className="text-right">
                                  {pricing.discountedPricePkr ? (
                                    <div className="flex items-baseline gap-1.5 justify-end">
                                      <span className="text-[#737D78] line-through text-[11px] font-mono tabular-nums">
                                        PKR {pricing.pricePkr.toLocaleString()}
                                      </span>
                                      <span className="text-base font-bold text-[#202A27] font-mono tabular-nums">
                                        PKR {pricing.discountedPricePkr.toLocaleString()}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-base font-bold text-[#202A27] font-mono tabular-nums">
                                      PKR {pricing.pricePkr.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {basketTestIds.length > 1 && (
                                <div className="flex items-center justify-between text-[#174C3C] font-semibold">
                                  <span>Basket ({basketTestIds.length} tests)</span>
                                  <span className="font-mono tabular-nums">PKR {basketSum.toLocaleString()}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[#737D78]">
                                <span>Home Sampling</span>
                                <span
                                  className={`font-mono tabular-nums font-semibold ${
                                    homeFee === 0 ? 'text-[#174C3C]' : 'text-[#202A27]'
                                  }`}
                                >
                                  {homeFee === 0 ? 'FREE' : `PKR ${homeFee}`}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[#737D78]">
                                <span>Turnaround</span>
                                <span className="font-mono tabular-nums font-semibold text-[#28745B]">
                                  {pricing.statedTurnaroundHours} Hours
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[#737D78] text-[11px]">
                                <span>Lahore Centres</span>
                                <span className="font-medium text-[#202A27]">{lab.branches.length} branch(es)</span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 pt-3 border-t border-[#DCE4DE] space-y-2">
                            {isVerified ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleStartBooking(
                                    activeTest,
                                    lab.id,
                                    basketTestIds.length > 0 ? basketTestIds : [activeTest.id]
                                  )
                                }
                                className="w-full py-2.5 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[42px] active:scale-[0.98]"
                              >
                                <span>
                                  {basketTestIds.length > 1
                                    ? `Book ${basketTestIds.length} Tests @ ${lab.name.split(' ')[0]}`
                                    : `Book with ${lab.name.split(' ')[0]}`}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <>
                                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-start gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-700" />
                                  <span>PHC Licence Revoked — Booking disabled.</span>
                                </div>
                                <button
                                  type="button"
                                  disabled
                                  aria-disabled="true"
                                  className="w-full py-2.5 bg-slate-200 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed min-h-[42px]"
                                >
                                  Unavailable (Revoked)
                                </button>
                              </>
                            )}
                            <div className="text-[10px] text-[#737D78] text-center font-mono truncate">
                              {pricing.sourceUrl || pricing.verifiedBy}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Signed-in Patient Bookings Strip */}
            {patientUser && (
              <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8EFE8] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#202A27]">Recent Bookings ({myBookings.length})</h2>
                    <p className="text-xs text-[#737D78]">Scoped privately to {patientUser.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadPatientRecords}
                    className="px-3 py-1.5 bg-[#F8F8F3] hover:bg-[#E8EFE8] border border-[#DCE4DE] text-[#202A27] rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[36px] transition-colors"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isLoadingRecords ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {bookingActionMsg && (
                  <div className="p-3 bg-[#E8EFE8]/70 border border-[#28745B]/25 text-[#174C3C] rounded-xl text-xs">
                    {bookingActionMsg}
                  </div>
                )}
                {bookingActionError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                    {bookingActionError}
                  </div>
                )}

                {myBookings.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#737D78] bg-[#F8F8F3] rounded-xl">
                    No bookings found yet. Select any test above to schedule your appointment.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myBookings.map((bk) => {
                      const labObj = laboratories.find((l) => l.id === bk.labId);
                      const canModify = bk.status === 'PENDING' || bk.status === 'ACCEPTED';
                      const existingReview = reviews.find((r) => r.bookingNumber === bk.bookingNumber);
                      const alreadyReviewed = Boolean(existingReview);
                      const canDeleteCancelled = bk.status === 'CANCELLED' && !bk.reportUrl;
                      return (
                        <div
                          key={bk.id}
                          className="bg-[#F8F8F3]/75 border border-[#DCE4DE] rounded-xl p-4 space-y-3 text-xs flex flex-col justify-between"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-bold text-[#202A27]">{bk.bookingNumber}</span>
                              <span
                                className={`font-mono text-[10px] font-semibold ${
                                  bk.status === 'CANCELLED' ? 'text-rose-700' : 'text-[#174C3C]'
                                }`}
                              >
                                {bk.status === 'CANCELLED' ? 'CANCELLED' : bk.phlebotomistStatus || bk.status}
                              </span>
                            </div>
                            <div className="font-bold text-[#202A27]">{labObj?.name || bk.labId}</div>
                            <div className="text-[11px] text-[#737D78]">
                              {bk.branchName} · For {bk.familyMemberName || bk.patientName}
                            </div>
                            <div className="text-[11px] text-[#737D78]">
                              {bk.scheduledDate} · {bk.scheduledTimeSlot} · {bk.testIds.length} test(s)
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-[#DCE4DE] space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-bold text-[#174C3C] tabular-nums">
                                PKR {bk.totalPkr.toLocaleString()}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTrackingQuery(bk.bookingNumber);
                                    onSelectTab('TRACKING');
                                  }}
                                  className="px-2.5 py-1.5 bg-white border border-[#DCE4DE] hover:border-[#174C3C] text-[#202A27] rounded-lg font-semibold text-[11px] min-h-[34px] transition-colors"
                                >
                                  Track Live
                                </button>
                                {bk.reportUrl && (
                                  <button
                                    type="button"
                                    onClick={() => onSelectTab('REPORTS')}
                                    className="px-2.5 py-1.5 bg-[#174C3C] text-white rounded-lg font-semibold text-[11px] min-h-[34px]"
                                  >
                                    PDF Report
                                  </button>
                                )}
                              </div>
                            </div>

                            {(canModify || bk.status === 'COMPLETED' || canDeleteCancelled) && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-[#E8EFE8]">
                                {canModify && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRescheduleTarget(bk);
                                        setRescheduleDate(bk.scheduledDate);
                                        setRescheduleSlot(bk.scheduledTimeSlot);
                                        setBookingActionError(null);
                                      }}
                                      className="px-2.5 py-1 bg-white border border-[#DCE4DE] hover:bg-[#E8EFE8]/50 text-[#202A27] rounded-lg font-semibold text-[11px]"
                                    >
                                      Reschedule
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCancelBooking(bk)}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-[11px] flex items-center gap-1"
                                    >
                                      <XCircle className="w-3 h-3" />
                                      <span>Cancel</span>
                                    </button>
                                  </>
                                )}
                                {canDeleteCancelled && (
                                  pendingDeleteBookingId === bk.id ? (
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteBooking(bk)}
                                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold text-[11px]"
                                      >
                                        Confirm Delete
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingDeleteBookingId(null)}
                                        className="px-2.5 py-1 bg-white border border-[#DCE4DE] text-[#202A27] rounded-lg font-semibold text-[11px]"
                                      >
                                        Keep
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setPendingDeleteBookingId(bk.id)}
                                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-[11px] flex items-center gap-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  )
                                )}
                                {bk.status === 'COMPLETED' && !alreadyReviewed && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewTargetBooking(bk);
                                      setReviewRating(5);
                                      setReviewComment('');
                                      setReviewError(null);
                                    }}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-semibold text-[11px] flex items-center gap-1"
                                  >
                                    <Star className="w-3 h-3" />
                                    <span>Leave Verified Review</span>
                                  </button>
                                )}
                                {bk.status === 'COMPLETED' && existingReview && (
                                  <div className="flex items-center gap-2 w-full justify-between">
                                    <span className="text-[10px] font-mono text-amber-800 font-semibold">
                                      ★ Verified Review Submitted
                                    </span>
                                    {existingReview.patientUserId === patientUser.id && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteReview(existingReview.id, bk.bookingNumber)}
                                        className="text-[10px] text-rose-700 hover:underline font-semibold flex items-center gap-0.5"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        <span>Delete Review</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================= */}
        {/* TAB 2: LIVE SAMPLE & COURIER TRACKER      */}
        {/* ========================================= */}
        {activeTab === 'TRACKING' && (
          <motion.div
            key="TAB_TRACKING"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            className="space-y-6"
          >
            <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5 sm:p-6 space-y-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookupTracking();
                }}
                className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end text-xs"
              >
                <div className="flex-1">
                  <label className="block font-semibold text-[#202A27] mb-1.5">Booking Number</label>
                  <input
                    type="text"
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                    placeholder="Enter your Booking Number"
                    className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 font-mono font-semibold text-[#202A27] min-h-[44px] focus:outline-none focus:border-[#174C3C] focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoadingTracking}
                  className="px-5 py-2.5 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[44px] transition-colors"
                >
                  <RotateCw className={`w-4 h-4 ${isLoadingTracking ? 'animate-spin' : ''}`} />
                  <span>Track Sample</span>
                </button>
              </form>

              {myBookings.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E8EFE8] text-xs">
                  <span className="text-[#737D78] font-medium">Your Bookings:</span>
                  {myBookings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setTrackingQuery(b.bookingNumber);
                        handleLookupTracking(b.bookingNumber);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border transition-colors ${
                        trackingData?.booking.bookingNumber === b.bookingNumber
                          ? 'bg-[#E8EFE8] border-[#174C3C] text-[#174C3C] font-bold'
                          : 'bg-[#F8F8F3] border-[#DCE4DE] text-[#202A27] hover:bg-[#E8EFE8]/40'
                      }`}
                    >
                      {b.bookingNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {trackingError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{trackingError}</span>
              </div>
            )}

            {isLoadingTracking && !trackingData && (
              <div className="bg-white border border-[#DCE4DE] rounded-2xl p-6 space-y-4">
                <SkeletonBlock className="h-8 w-64 rounded-lg" />
                <SkeletonBlock className="h-20 w-full rounded-xl" />
                <SkeletonBlock className="h-32 w-full rounded-xl" />
              </div>
            )}

            {trackingData && (() => {
              const bk = trackingData.booking;
              const stepIdx = getTrackingStepIndex(bk);
              const progressPct = Math.round(((stepIdx + 1) / TRACKING_STEPS.length) * 100);
              const tempPct =
                bk.coldChainTempCelsius !== undefined
                  ? Math.max(5, Math.min(95, ((bk.coldChainTempCelsius - 0) / 10) * 100))
                  : 42;

              return (
                <div className="bg-white border border-[#DCE4DE] rounded-2xl p-5 sm:p-8 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#E8EFE8] pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-[#174C3C]">{bk.bookingNumber}</span>
                        <span className="text-[#DCE4DE]">·</span>
                        <span className="text-[#737D78]">{trackingData.phcLicence}</span>
                      </div>
                      <h2 className="text-xl font-bold text-[#202A27]">{trackingData.labName}</h2>
                      <p className="text-xs text-[#737D78]">
                        Branch: <strong className="text-[#202A27]">{trackingData.branchName}</strong> · {trackingData.branchAddress}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs">
                      {bk.sampleBarcode && (
                        <div className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3.5 py-2.5">
                          <span className="text-[10px] text-[#737D78] block uppercase font-semibold">Vacutainer ID</span>
                          <span className="font-mono font-bold text-[#202A27] flex items-center gap-1.5 mt-0.5">
                            <QrCode className="w-3.5 h-3.5 text-[#174C3C]" />
                            {bk.sampleBarcode}
                          </span>
                        </div>
                      )}
                      {bk.coldChainTempCelsius !== undefined && (
                        <div className="bg-[#E8EFE8]/70 border border-[#28745B]/25 rounded-xl px-3.5 py-2.5 min-w-[180px]">
                          <div className="flex items-center justify-between text-[10px] text-[#174C3C] uppercase font-semibold">
                            <span>Cold-Chain Temp</span>
                            <span className="font-mono">{bk.coldChainTempCelsius.toFixed(1)}°C</span>
                          </div>
                          <div className="mt-1.5 h-1.5 bg-white rounded-full overflow-hidden border border-[#28745B]/20 relative">
                            <div
                              className="h-full bg-[#28745B] rounded-full transition-all duration-500"
                              style={{ width: `${tempPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] text-[#28745B] flex items-center gap-1 mt-1">
                            <Thermometer className="w-3 h-3" /> 2.0–8.0°C Compliant
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Animated 6-Stage Horizontal Progress Rail */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#202A27]">Sample Chain Progress</span>
                      <span className="font-mono text-[#174C3C] font-semibold tabular-nums">
                        Stage {stepIdx + 1} of {TRACKING_STEPS.length} ({progressPct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#E8EFE8] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.45, ease: LC_EASE }}
                        className="h-full bg-[#174C3C] rounded-full"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                      {TRACKING_STEPS.map((label, idx) => {
                        const reached = idx <= stepIdx;
                        return (
                          <div
                            key={label}
                            className={`p-3 rounded-xl border text-xs transition-colors ${
                              reached
                                ? 'bg-[#E8EFE8]/70 border-[#174C3C] text-[#174C3C] font-bold'
                                : 'bg-[#F8F8F3] border-[#DCE4DE] text-[#737D78]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-[10px]">0{idx + 1}</span>
                              {reached && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <div>{label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Courier Card & Report Quick CTA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-4 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#DCE4DE] flex items-center justify-center text-[#174C3C]">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-[#202A27]">
                            {bk.phlebotomistName || 'Assigned Upon Lab Acceptance'}
                          </div>
                          <div className="text-[#737D78] mt-0.5">
                            Destination: {bk.streetAddress || bk.patientArea}
                          </div>
                        </div>
                      </div>
                      {bk.phlebotomistPhone && (
                        <a
                          href={`tel:${bk.phlebotomistPhone}`}
                          className="px-3 py-2 bg-white border border-[#DCE4DE] hover:border-[#174C3C] rounded-xl font-semibold text-[#174C3C] flex items-center gap-1 min-h-[36px]"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      )}
                    </div>

                    <div className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-4 text-xs flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-[#202A27]">Report &amp; Email Status</div>
                        <div className="text-[#737D78] mt-0.5">
                          {trackingData.reportAvailable
                            ? trackingData.emailDispatchedAt
                              ? `PDF Ready · Emailed at ${new Date(trackingData.emailDispatchedAt).toLocaleTimeString()}`
                              : 'Signed PDF Ready in Portal'
                            : 'Pending laboratory processing & pathologist sign-off'}
                        </div>
                      </div>
                      {trackingData.reportAvailable && (
                        <button
                          type="button"
                          onClick={() => onSelectTab('REPORTS')}
                          className="px-3.5 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold min-h-[36px] whitespace-nowrap"
                        >
                          Open PDF
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timestamped Checkpoints */}
                  <div className="space-y-3 pt-2 border-t border-[#E8EFE8]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#737D78]">
                      Chain-of-Custody Audit Timeline ({trackingData.trackingEvents.length} Checkpoints)
                    </h3>
                    <div className="space-y-2.5">
                      {[...trackingData.trackingEvents].reverse().map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3.5 rounded-xl bg-[#F8F8F3] border border-[#DCE4DE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold text-[#174C3C]">{ev.stage}</span>
                              <span className="text-[#DCE4DE]">·</span>
                              <span className="font-bold text-[#202A27]">{ev.title}</span>
                            </div>
                            <p className="text-[#737D78]">{ev.description}</p>
                            <div className="text-[11px] text-[#737D78]">
                              Actor: {ev.actor} {ev.location ? `· ${ev.location}` : ''}
                            </div>
                          </div>
                          <span className="font-mono text-[11px] text-[#737D78] shrink-0 tabular-nums">
                            {new Date(ev.timestamp).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}

        {/* ========================================= */}
        {/* TAB 3: PDF REPORTS & INTELLIGENCE         */}
        {/* ========================================= */}
        {activeTab === 'REPORTS' && (
          <motion.div
            key="TAB_REPORTS"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            className="space-y-6"
          >
            {!patientUser ? (
              <EmptyState
                icon={<FileText className="w-5 h-5" />}
                title="Sign In to Access Your Pathology PDF Reports"
                description="For Punjab Healthcare Commission clinical privacy, signed PDF pathology reports require verified Pakistani mobile OTP login."
                action={
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="px-5 py-2.5 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl text-xs font-semibold min-h-[42px]"
                  >
                    Verify Mobile via OTP
                  </button>
                }
              />
            ) : myReports.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-5 h-5" />}
                title="No Finalized PDF Reports Yet"
                description={`Once your laboratory pathologist releases a report in the Lab Console, it appears here as a downloadable PDF and is emailed to ${patientUser.email}.`}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Reports List + Family Filter */}
                <div className="lg:col-span-4 bg-white border border-[#DCE4DE] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E8EFE8]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#737D78]">
                      Health Passport ({myReports.length})
                    </span>
                    <button
                      type="button"
                      onClick={loadPatientRecords}
                      className="text-xs text-[#174C3C] hover:text-[#28745B] font-semibold"
                    >
                      Refresh
                    </button>
                  </div>

                  <select
                    value={reportFamilyFilter}
                    onChange={(e) => setReportFamilyFilter(e.target.value)}
                    className="w-full text-xs bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl px-3 py-2 text-[#202A27]"
                  >
                    <option value="ALL">All Household Members</option>
                    {Array.from(new Set(myReports.map((r) => r.patientName))).map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>

                  <div className="space-y-2">
                    {myReports
                      .filter((r) => reportFamilyFilter === 'ALL' || r.patientName === reportFamilyFilter)
                      .map((rep) => (
                        <div
                          key={rep.id}
                          onClick={() => {
                            setSelectedReport(rep);
                            setAiExplanation(null);
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer text-xs space-y-1 transition-all ${
                            selectedReport?.id === rep.id
                              ? 'bg-[#E8EFE8]/70 border-[#174C3C]'
                              : 'bg-white border-[#DCE4DE] hover:bg-[#F8F8F3]'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#737D78]">
                            <span className="font-mono font-bold text-[#202A27]">{rep.bookingNumber}</span>
                            <span className="font-mono text-[#174C3C] font-semibold">PDF Signed</span>
                          </div>
                          <div className="font-semibold text-[#202A27]">{rep.branchName}</div>
                          <div className="text-[11px] text-[#737D78]">
                            {rep.familyMemberName || rep.patientName} · {new Date(rep.publishedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Selected Report Viewer, PDF Download & Intelligence */}
                {selectedReport && (
                  <div className="lg:col-span-8 bg-white border border-[#DCE4DE] rounded-2xl p-5 sm:p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E8EFE8] pb-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#28745B] uppercase tracking-wider">
                          Verified Laboratory Clinical PDF
                        </span>
                        <h2 className="text-xl font-bold text-[#202A27] mt-0.5">{selectedReport.fileName}</h2>
                        <p className="text-xs text-[#737D78] mt-1">
                          Verified By: <strong className="text-[#202A27]">{selectedReport.pathologistName}</strong> · SHA-256:{' '}
                          <span className="font-mono">{selectedReport.checksumSha256.slice(0, 14)}...</span>
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isLoadingPdf}
                          onClick={() => handleOpenPdfModal(selectedReport.bookingNumber, selectedReport.fileName)}
                          className="px-3.5 py-2 bg-[#F8F8F3] hover:bg-[#E8EFE8] border border-[#DCE4DE] text-[#202A27] rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[40px] disabled:opacity-50"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{isLoadingPdf ? 'Opening...' : 'View PDF'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(selectedReport.bookingNumber, selectedReport.fileName)}
                          className="px-3.5 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[40px]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </div>

                    {pdfError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                        {pdfError}
                      </div>
                    )}

                    {/* Lab Email Delivery Status */}
                    <div className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <Mail className="w-4 h-4 text-[#174C3C] shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-[#202A27]">Laboratory Email Delivery Status</div>
                          <div className="text-[#737D78] mt-0.5">
                            {selectedReport.emailDispatchedAt
                              ? `Dispatched to ${selectedReport.patientEmail || patientUser.email} by ${selectedReport.branchName} on ${new Date(selectedReport.emailDispatchedAt).toLocaleString()}.`
                              : `Email dispatch is controlled by the Lab Branch Lead & Pathologist. Your PDF copy will be sent to ${selectedReport.patientEmail || patientUser.email}.`}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg shrink-0 border ${
                          selectedReport.emailDispatchedAt
                            ? 'bg-[#E8EFE8] text-[#174C3C] border-[#28745B]/25'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        {selectedReport.emailDispatchedAt ? 'EMAILED BY LAB' : 'LAB DISPATCH PENDING'}
                      </span>
                    </div>

                    {/* Structured Verified Results Table */}
                    <div className="overflow-x-auto border border-[#DCE4DE] rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8F8F3] border-b border-[#DCE4DE] text-[#737D78] font-semibold">
                          <tr>
                            <th className="py-2.5 px-4">Parameter</th>
                            <th className="py-2.5 px-4">Result</th>
                            <th className="py-2.5 px-4">Reference Range</th>
                            <th className="py-2.5 px-4">Flag</th>
                            <th className="py-2.5 px-4">Intelligence</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E8EFE8]">
                          {selectedReport.parameters.map((p, idx) => (
                            <tr key={idx} className="hover:bg-[#F8F8F3]/60 transition-colors">
                              <td className="py-2.5 px-4 font-semibold text-[#202A27]">{p.parameter}</td>
                              <td className="py-2.5 px-4 font-mono font-bold tabular-nums text-[#202A27]">
                                {p.observedValue} {p.unit}
                              </td>
                              <td className="py-2.5 px-4 font-mono text-[#737D78]">{p.referenceRange}</td>
                              <td className="py-2.5 px-4">
                                <span
                                  className={`text-[10px] font-mono font-bold ${
                                    p.flag === 'NORMAL' ? 'text-[#28745B]' : 'text-amber-800'
                                  }`}
                                >
                                  {p.flag}
                                </span>
                              </td>
                              <td className="py-2.5 px-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleExplainParameter(p.parameter, `${p.observedValue} ${p.unit}`, p.referenceRange)
                                  }
                                  className="text-[11px] font-semibold text-[#174C3C] hover:text-[#28745B] hover:underline flex items-center gap-1"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Explain</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Clear Boundary: Educational LabConnect Intelligence Layer */}
                    <div className="bg-[#E8EFE8]/55 border border-[#28745B]/25 rounded-xl p-4 sm:p-5 space-y-3 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-[#174C3C] flex items-center gap-1.5 text-sm">
                            <Sparkles className="w-4 h-4 text-[#28745B]" />
                            <span>LabConnect Intelligence ({aiLanguage === 'UR' ? 'Urdu' : 'English'})</span>
                          </span>
                          <span className="text-[10px] font-mono text-[#737D78]">
                            AI Educational Context · Distinct from Signed Lab Data
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleExplainFullReport(selectedReport)}
                            className="px-3 py-1.5 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Summarize Full Panel
                          </button>
                          <div className="flex items-center gap-1 bg-white border border-[#DCE4DE] rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => setAiLanguage('EN')}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                aiLanguage === 'EN' ? 'bg-[#174C3C] text-white' : 'text-[#737D78]'
                              }`}
                            >
                              English
                            </button>
                            <button
                              type="button"
                              onClick={() => setAiLanguage('UR')}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                                aiLanguage === 'UR' ? 'bg-[#174C3C] text-white' : 'text-[#737D78]'
                              }`}
                            >
                              اردو (Urdu)
                            </button>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {isLoadingAi ? (
                          <motion.div
                            key="ai-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-white border border-[#DCE4DE] rounded-xl p-4 flex items-center gap-3 text-[#737D78]"
                          >
                            <RotateCw className="w-4 h-4 animate-spin text-[#174C3C]" />
                            <span>Preparing calm {aiLanguage === 'UR' ? 'Urdu' : 'English'} explanation...</span>
                          </motion.div>
                        ) : aiExplanation ? (
                          <motion.div
                            key="ai-result"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-white border border-[#DCE4DE] rounded-xl p-4 text-[#202A27] leading-relaxed space-y-2 ${
                              aiLanguage === 'UR' ? 'font-urdu text-sm' : ''
                            }`}
                            dir={aiLanguage === 'UR' ? 'rtl' : 'ltr'}
                          >
                            <p>{aiExplanation}</p>
                            <div className="text-[10px] text-[#737D78] border-t border-[#E8EFE8] pt-2 font-sans" dir="ltr">
                              Educational awareness summary. Always consult a licensed physician for clinical diagnosis.
                            </div>
                          </motion.div>
                        ) : (
                          <p className="text-[#202A27]/85 leading-relaxed">
                            <strong>Pathologist Note:</strong> {selectedReport.clinicalNotes} Tap <strong>Explain</strong> on any row or <strong>Summarize Full Panel</strong> above for English or Urdu guidance.
                          </p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Historical Biomarker Comparison */}
                    {myReports.length > 1 && (
                      <div className="border-t border-[#E8EFE8] pt-4 space-y-2.5 text-xs">
                        <div className="font-bold text-[#202A27] flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-[#174C3C]" />
                          <span>Household Report History ({myReports.length} Records)</span>
                        </div>
                        <div className="overflow-x-auto border border-[#DCE4DE] rounded-xl">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-[#F8F8F3] border-b border-[#DCE4DE] text-[#737D78] font-semibold">
                              <tr>
                                <th className="py-2 px-3">Date</th>
                                <th className="py-2 px-3">Booking</th>
                                <th className="py-2 px-3">Patient</th>
                                <th className="py-2 px-3">Laboratory</th>
                                <th className="py-2 px-3">Markers Out of Range</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E8EFE8] font-mono">
                              {myReports.slice(0, 5).map((r) => {
                                const flagged = r.parameters.filter((p) => p.flag !== 'NORMAL').length;
                                return (
                                  <tr key={r.id}>
                                    <td className="py-2 px-3 tabular-nums">{new Date(r.publishedAt).toLocaleDateString()}</td>
                                    <td className="py-2 px-3">{r.bookingNumber}</td>
                                    <td className="py-2 px-3 font-sans">{r.familyMemberName || r.patientName}</td>
                                    <td className="py-2 px-3 font-sans">{r.branchName}</td>
                                    <td className={`py-2 px-3 font-bold ${flagged > 0 ? 'text-amber-700' : 'text-[#28745B]'}`}>
                                      {flagged === 0 ? 'All Normal' : `${flagged} Flagged`}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================= */}
        {/* TAB 4: PATIENT ACCOUNT & FAMILY PROFILE   */}
        {/* ========================================= */}
        {activeTab === 'PROFILE' && (
          <motion.div
            key="TAB_PROFILE"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: LC_EASE }}
            className="max-w-2xl mx-auto space-y-6"
          >
            {!patientUser ? (
              <EmptyState
                icon={<Users className="w-5 h-5" />}
                title="Sign In to Manage Your Patient Profile"
                description="Verify your Pakistani mobile number to configure your report delivery email and household dependent profiles."
                action={
                  <button
                    type="button"
                    onClick={onOpenAuth}
                    className="px-5 py-2.5 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl text-xs font-semibold min-h-[42px]"
                  >
                    Open Mobile OTP Sign In
                  </button>
                }
              />
            ) : (
              <form onSubmit={handleSaveProfile} className="bg-white border border-[#DCE4DE] rounded-2xl p-6 space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EFE8] pb-3.5">
                  <div>
                    <h2 className="text-base font-bold text-[#202A27]">Patient Account Settings</h2>
                    <span className="font-mono text-[11px] text-[#737D78]">Verified Mobile: {patientUser.phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenFamily}
                    className="px-3.5 py-2 bg-[#E8EFE8] hover:bg-[#DCE7DC] text-[#174C3C] rounded-xl font-semibold flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Manage Family ({patientUser.familyMembers.length})</span>
                  </button>
                </div>

                <div>
                  <label className="block font-semibold text-[#202A27] mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#202A27] mb-1.5">Primary Email (Automated PDF Reports)</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#202A27] mb-1.5">Lahore Residential Sector / Area</label>
                  <input
                    type="text"
                    value={profileArea}
                    onChange={(e) => setProfileArea(e.target.value)}
                    className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
                  />
                </div>

                {profileSavedMsg && (
                  <div className="p-3 bg-[#E8EFE8]/70 border border-[#28745B]/25 text-[#174C3C] rounded-xl">
                    {profileSavedMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold min-h-[42px] transition-colors"
                >
                  Save Account Changes
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================= */}
      {/* 3-STEP MULTI-TEST BOOKING MODAL           */}
      {/* ========================================= */}
      <AnimatedModal
        isOpen={bookingTestIds.length > 0}
        onClose={() => setBookingTestIds([])}
        maxWidthClass="max-w-lg"
      >
        {bookingTestIds.length > 0 && (() => {
          const selectedTestsList = tests.filter((t) => bookingTestIds.includes(t.id));
          const maxFasting = selectedTestsList.reduce((max, t) => Math.max(max, t.fastingHours), 0);
          const modalTitle =
            selectedTestsList.length > 1
              ? `Book ${selectedTestsList.length} Tests`
              : `Book ${selectedTestsList[0]?.name || 'Diagnostic Test'}`;

          return (
            <div className="p-6 space-y-5 pb-safe">
              <div className="flex items-start justify-between border-b border-[#E8EFE8] pb-3.5">
                <div>
                  <span className="text-[11px] font-mono font-semibold text-[#28745B] uppercase tracking-wider">
                    Step {bookingStep} of 3
                  </span>
                  <h3 className="text-lg font-bold text-[#202A27] mt-0.5">{modalTitle}</h3>
                  {selectedTestsList.length > 1 && (
                    <div className="text-[11px] text-[#737D78] mt-0.5">
                      {selectedTestsList.map((t) => t.name).join(' + ')}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setBookingTestIds([])}
                  className="text-[#737D78] hover:text-[#202A27] p-2 rounded-lg"
                  aria-label="Close booking dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Animated Step Bar */}
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-colors ${
                      bookingStep >= step ? 'bg-[#174C3C]' : 'bg-[#E8EFE8]'
                    }`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {bookingStep === 1 && (() => {
                  const currentLab = laboratories.find((l) => l.id === selectedLabId) || laboratories[0];
                  const currentBranch = currentLab.branches.find((b) => b.id === selectedBranchId) || currentLab.branches[0];
                  return (
                    <motion.div
                      key="booking-step-1"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.18, ease: LC_EASE }}
                      className="space-y-4 text-xs"
                    >
                      <div className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-[#737D78] font-semibold uppercase">Selected Diagnostic Lab</div>
                          <div className="text-sm font-bold text-[#202A27]">{currentLab.name}</div>
                          <div className="text-[11px] text-[#737D78] font-mono">{currentLab.phcLicence}</div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#174C3C]">
                          <ShieldCheck className="w-4 h-4 text-[#28745B]" /> Verified
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setCollectionType('HOME_COLLECTION')}
                          className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                            collectionType === 'HOME_COLLECTION'
                              ? 'border-[#174C3C] bg-[#E8EFE8]/70 text-[#174C3C]'
                              : 'border-[#DCE4DE] text-[#202A27] hover:bg-[#F8F8F3]'
                          }`}
                        >
                          <Home className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold">Home Collection</div>
                            <div className="text-[10px] text-[#737D78]">Courier visits address</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCollectionType('BRANCH_VISIT')}
                          className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                            collectionType === 'BRANCH_VISIT'
                              ? 'border-[#174C3C] bg-[#E8EFE8]/70 text-[#174C3C]'
                              : 'border-[#DCE4DE] text-[#202A27] hover:bg-[#F8F8F3]'
                          }`}
                        >
                          <Building2 className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold">Branch Walk-In</div>
                            <div className="text-[10px] text-[#737D78]">Visit Lahore centre</div>
                          </div>
                        </button>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#202A27] mb-1.5">
                          Select Exact Lahore Branch ({currentLab.branches.length})
                        </label>
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                          {currentLab.branches.map((b) => (
                            <label
                              key={b.id}
                              onClick={() => setSelectedBranchId(b.id)}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                                selectedBranchId === b.id ? 'border-[#174C3C] bg-[#E8EFE8]/55' : 'border-[#DCE4DE] hover:bg-[#F8F8F3]'
                              }`}
                            >
                              <input
                                type="radio"
                                name="branchChoice"
                                checked={selectedBranchId === b.id}
                                onChange={() => setSelectedBranchId(b.id)}
                                className="mt-1 accent-[#174C3C]"
                              />
                              <div className="flex-1">
                                <div className="font-bold text-[#202A27]">{b.name}</div>
                                <div className="text-[11px] text-[#737D78]">{b.address}</div>
                                <div className="text-[10px] text-[#737D78] mt-0.5 font-mono">
                                  {b.operatingHours} · Home Fee: {b.homeCollectionFeePkr === 0 ? 'FREE' : `PKR ${b.homeCollectionFeePkr}`}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      {collectionType === 'HOME_COLLECTION' && (
                        <div>
                          <label className="block font-semibold text-[#202A27] mb-1.5">
                            Exact Lahore Home Street Address
                          </label>
                          <input
                            type="text"
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="House #, Street #, Block, Sector, Lahore"
                            className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27] focus:outline-none focus:border-[#174C3C] focus:bg-white"
                          />
                          <span className="text-[10px] text-[#737D78] block mt-1">
                            Dispatch hub: {currentBranch.name}
                          </span>
                        </div>
                      )}

                      {bookingError && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">{bookingError}</div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (collectionType === 'HOME_COLLECTION' && streetAddress.trim().length < 8) {
                              setBookingError('Enter an exact Lahore street address (minimum 8 characters).');
                              return;
                            }
                            setBookingError(null);
                            setBookingStep(2);
                          }}
                          className="px-5 py-2.5 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold flex items-center gap-1.5 min-h-[42px]"
                        >
                          <span>Continue to Checkout</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}

                {bookingStep === 2 && (() => {
                  const currentLab = laboratories.find((l) => l.id === selectedLabId) || laboratories[0];
                  const currentBranch = currentLab.branches.find((b) => b.id === selectedBranchId) || currentLab.branches[0];
                  const testsFee = bookingTestIds.reduce((sum, tid) => {
                    const pr = pricings.find((p) => p.labId === currentLab.id && p.testId === tid);
                    return sum + (pr?.discountedPricePkr ?? pr?.pricePkr ?? 0);
                  }, 0);
                  const homeFee = collectionType === 'HOME_COLLECTION' ? currentBranch.homeCollectionFeePkr : 0;
                  const grandTotal = testsFee + homeFee;

                  return (
                    <motion.form
                      key="booking-step-2"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.18, ease: LC_EASE }}
                      onSubmit={handleCompleteBooking}
                      className="space-y-3.5 text-xs"
                    >
                      {!patientUser && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-2">
                          <span className="text-amber-950 font-medium">
                            Verify mobile via OTP first to secure your PDF report &amp; tracking.
                          </span>
                          <button
                            type="button"
                            onClick={onOpenAuth}
                            className="px-3 py-1.5 bg-[#174C3C] text-white rounded-lg font-semibold whitespace-nowrap"
                          >
                            Sign In Now
                          </button>
                        </div>
                      )}

                      {patientUser && patientUser.familyMembers.length > 0 && (
                        <div>
                          <label className="block font-semibold text-[#202A27] mb-1">Who is this test for?</label>
                          <select
                            value={activeFamilyMember?.id || 'SELF'}
                            onChange={(e) => {
                              if (e.target.value === 'SELF') {
                                setActiveFamilyMember(null);
                                setPatientName(patientUser.name);
                              } else {
                                const mem = patientUser.familyMembers.find((f) => f.id === e.target.value);
                                if (mem) {
                                  setActiveFamilyMember(mem);
                                  setPatientName(mem.name);
                                }
                              }
                            }}
                            className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 font-medium text-[#202A27]"
                          >
                            <option value="SELF">Self ({patientUser.name})</option>
                            {patientUser.familyMembers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.relationship})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-[#202A27] mb-1">Patient Name</label>
                          <input
                            type="text"
                            required
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#202A27] mb-1">Mobile (+92)</label>
                          <input
                            type="text"
                            required
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 font-mono text-[#202A27]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-[#202A27] mb-1">Email Address (PDF Delivery)</label>
                        <input
                          type="email"
                          required
                          value={patientEmail}
                          onChange={(e) => setPatientEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#202A27] mb-1">Scheduled Date</label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().slice(0, 10)}
                          max={new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)}
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-[#202A27] mb-1.5 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#28745B]" />
                          <span>Select Time Window</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {TIME_SLOTS.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedTimeSlot(slot)}
                              className={`py-2 px-2.5 rounded-xl border text-[11px] font-mono transition-colors ${
                                selectedTimeSlot === slot
                                  ? 'bg-[#174C3C] text-white border-[#174C3C] font-bold'
                                  : 'bg-[#F8F8F3] text-[#202A27] border-[#DCE4DE] hover:bg-[#E8EFE8]/60'
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>

                      {maxFasting > 0 && (
                        <label className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fastingAcknowledged}
                            onChange={(e) => setFastingAcknowledged(e.target.checked)}
                            className="mt-0.5 accent-[#174C3C]"
                          />
                          <span className="text-[11px] text-amber-950">
                            I confirm {maxFasting}h overnight fasting prior to sample collection.
                          </span>
                        </label>
                      )}

                      <div className="bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-3.5 flex items-center justify-between">
                        <span className="text-[#737D78]">
                          Total Payable ({bookingTestIds.length} test{bookingTestIds.length > 1 ? 's' : ''} + dispatch)
                        </span>
                        <span className="text-base font-bold font-mono text-[#174C3C] tabular-nums">
                          PKR {grandTotal.toLocaleString()}
                        </span>
                      </div>

                      {bookingError && (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">{bookingError}</div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setBookingStep(1)}
                          className="text-[#737D78] hover:text-[#202A27] font-semibold"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingBooking}
                          className="px-5 py-2.5 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold min-h-[42px] disabled:opacity-50"
                        >
                          {isSubmittingBooking ? 'Confirming...' : 'Confirm Appointment'}
                        </button>
                      </div>
                    </motion.form>
                  );
                })()}

                {bookingStep === 3 && bookingSuccessNum && (
                  <motion.div
                    key="booking-step-3"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, ease: LC_EASE }}
                    className="text-center space-y-4 py-4"
                  >
                    <motion.div
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                      className="w-12 h-12 rounded-full bg-[#E8EFE8] text-[#174C3C] flex items-center justify-center mx-auto"
                    >
                      <CheckCircle2 className="w-7 h-7" />
                    </motion.div>
                    <div>
                      <h4 className="text-lg font-bold text-[#202A27]">Appointment Confirmed</h4>
                      <p className="text-xs text-[#737D78] mt-1">
                        Booking Number: <strong className="font-mono text-[#174C3C]">{bookingSuccessNum}</strong>
                      </p>
                      <p className="text-xs text-[#737D78] mt-1">
                        Signed PDF results will also be emailed to <strong>{patientEmail}</strong> when released by the laboratory.
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBookingTestIds([]);
                          onSelectTab('TRACKING');
                        }}
                        className="px-4 py-2.5 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl text-xs font-semibold min-h-[40px]"
                      >
                        Track Live Status
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingTestIds([])}
                        className="px-4 py-2.5 bg-[#F8F8F3] border border-[#DCE4DE] text-[#202A27] rounded-xl text-xs font-semibold min-h-[40px]"
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}
      </AnimatedModal>

      {/* RESCHEDULE MODAL */}
      <AnimatedModal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        maxWidthClass="max-w-md"
      >
        {rescheduleTarget && (
          <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4 text-xs pb-safe">
            <div className="flex items-start justify-between border-b border-[#E8EFE8] pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#28745B]">{rescheduleTarget.bookingNumber}</span>
                <h3 className="text-base font-bold text-[#202A27]">Reschedule Appointment</h3>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="text-[#737D78] hover:text-[#202A27] p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-[#202A27] mb-1.5">New Date (Next 14 Days)</label>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                max={new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#202A27] mb-1.5">New Time Slot</label>
              <select
                value={rescheduleSlot}
                onChange={(e) => setRescheduleSlot(e.target.value)}
                className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="px-4 py-2 bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl font-semibold text-[#202A27]"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold">
                Save Schedule
              </button>
            </div>
          </form>
        )}
      </AnimatedModal>

      {/* VERIFIED BOOKING-GATED REVIEW MODAL */}
      <AnimatedModal
        isOpen={Boolean(reviewTargetBooking)}
        onClose={() => setReviewTargetBooking(null)}
        maxWidthClass="max-w-md"
      >
        {reviewTargetBooking && (
          <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 text-xs pb-safe">
            <div className="flex items-start justify-between border-b border-[#E8EFE8] pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#28745B]">
                  Verified Booking · {reviewTargetBooking.bookingNumber}
                </span>
                <h3 className="text-base font-bold text-[#202A27]">Rate Laboratory Experience</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewTargetBooking(null)}
                className="text-[#737D78] hover:text-[#202A27] p-1.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-[#202A27] mb-2">Overall Star Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setReviewRating(num)}
                    className={`px-3 py-2 rounded-xl border font-mono font-bold flex items-center gap-1 transition-colors ${
                      reviewRating >= num
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-[#F8F8F3] border-[#DCE4DE] text-[#737D78]'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${reviewRating >= num ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span>{num}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#202A27] mb-1.5">Verified Patient Feedback</label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share phlebotomist punctuality, cold-chain care, and PDF turnaround speed..."
                className="w-full bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl p-2.5 text-[#202A27]"
              />
            </div>

            {reviewError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">{reviewError}</div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReviewTargetBooking(null)}
                className="px-4 py-2 bg-[#F8F8F3] border border-[#DCE4DE] rounded-xl font-semibold text-[#202A27]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="px-4 py-2 bg-[#174C3C] hover:bg-[#28745B] text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {isSubmittingReview ? 'Publishing...' : 'Publish Verified Review'}
              </button>
            </div>
          </form>
        )}
      </AnimatedModal>

      {/* AUTHENTICATED CLINICAL PDF PREVIEW MODAL */}
      <AnimatedModal
        isOpen={Boolean(pdfPreviewUrl)}
        onClose={handleClosePdfModal}
        maxWidthClass="max-w-4xl"
      >
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8EFE8] pb-3 gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-[#28745B]">
                Verified Clinical Pathology Report
              </span>
              <h3 className="text-base font-bold text-[#202A27]">
                {pdfPreviewFileName || 'Pathology Report PDF'}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {pdfPreviewBookingNum && (
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(pdfPreviewBookingNum, pdfPreviewFileName || undefined)}
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
              title="Clinical Pathology Report PDF"
              className="w-full h-[70vh] rounded-xl border border-[#DCE4DE] bg-[#F8F8F3]"
            />
          )}
        </div>
      </AnimatedModal>
    </div>
  );
};
