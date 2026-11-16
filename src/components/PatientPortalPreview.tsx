/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { apiClient } from '../api/client';
import {
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Calendar,
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
} from 'lucide-react';

interface PatientPortalPreviewProps {
  activeTab: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE';
  onSelectTab: (tab: 'DISCOVER' | 'TRACKING' | 'REPORTS' | 'PROFILE') => void;
  onOpenAuth: () => void;
  onOpenFamily: () => void;
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

export const PatientPortalPreview: React.FC<PatientPortalPreviewProps> = ({
  activeTab,
  onSelectTab,
  onOpenAuth,
  onOpenFamily,
}) => {
  const { patientUser, activeFamilyMember, setActiveFamilyMember, updatePatientProfile } = useAuth();

  // 100% Runtime Catalog State
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

  // Discovery Filters & Multi-Test Requisition Basket
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [comparingTestId, setComparingTestId] = useState<string>('test-cbc');
  const [basketTestIds, setBasketTestIds] = useState<string[]>([]);

  // Booking Modal State (Supports single or multi-test panel checkout)
  const [bookingTestIds, setBookingTestIds] = useState<string[]>([]);
  const [bookingStep, setBookingStep] = useState<number>(1);
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [collectionType, setCollectionType] = useState<'HOME_COLLECTION' | 'BRANCH_VISIT'>('HOME_COLLECTION');
  const [streetAddress, setStreetAddress] = useState<string>('House 14-B, Street 3, Block L, Gulberg III, Lahore');
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
  const [trackingQuery, setTrackingQuery] = useState<string>('LC-LHR-2611-0081');
  const [trackingPhoneLast4, setTrackingPhoneLast4] = useState<string>('7891');
  const [trackingData, setTrackingData] = useState<TrackingLookupResult | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState<boolean>(false);

  // PDF Reports Viewing State (Email control belongs strictly to Lab Branch Leads & Pathologists)
  const [selectedReport, setSelectedReport] = useState<DiagnosticReportRecord | null>(null);
  const [reportFamilyFilter, setReportFamilyFilter] = useState<string>('ALL');

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // AI Explainer State
  const [aiLanguage, setAiLanguage] = useState<'EN' | 'UR'>('EN');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiModel, setAiModel] = useState<string>('gemini-4-hydrogen');
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
        const res = await apiClient.getBookingTracking(target, patientUser ? undefined : trackingPhoneLast4, 'patient');
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
    [trackingQuery, trackingPhoneLast4, patientUser]
  );

  // Auto-load tracking when switching to TRACKING tab
  useEffect(() => {
    if (activeTab === 'TRACKING' && trackingQuery) {
      handleLookupTracking(trackingQuery);
    }
  }, [activeTab]);

  const filteredTests = tests.filter((test) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      test.name.toLowerCase().includes(term) ||
      test.code.toLowerCase().includes(term) ||
      test.synonyms.some((syn) => syn.toLowerCase().includes(term));
    const matchesCategory = selectedCategory === 'ALL' || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeTest = tests.find((t) => t.id === comparingTestId) || tests[0];
  const testPrices = activeTest ? pricings.filter((p) => p.testId === activeTest.id) : [];

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
        if (res.model) setAiModel(res.model);
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
        if (res.model) setAiModel(res.model);
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

  // Helper to compute step index for tracking progress bar
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

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Compact Patient Sub-Navigation Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            {activeTab === 'DISCOVER' && 'Compare Lahore Lab Rates & Book Tests'}
            {activeTab === 'TRACKING' && 'Live Sample & Courier Tracker'}
            {activeTab === 'REPORTS' && 'Verified PDF Pathology Reports'}
            {activeTab === 'PROFILE' && 'Patient Account & Family Passport'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {patientUser
              ? `Signed in as ${patientUser.name} · ${patientUser.phone} · Email: ${patientUser.email}`
              : 'Compare PHC-verified rates freely. Sign in via mobile OTP to book and view/download signed PDF reports.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {patientUser && (
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[40px] whitespace-nowrap"
            >
              <Bell className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>Alerts ({unreadNotifications})</span>
            </button>
          )}
          {!patientUser && (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-2 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[40px]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Patient Sign In / Register</span>
            </button>
          )}
          <div className="hidden sm:flex lg:hidden items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['DISCOVER', 'TRACKING', 'REPORTS', 'PROFILE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => onSelectTab(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  activeTab === t ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                {t === 'DISCOVER' ? 'Book' : t === 'TRACKING' ? 'Track' : t === 'REPORTS' ? 'Reports' : 'Account'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Live Patient Notifications Panel */}
      {patientUser && showNotifications && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="font-bold text-slate-900">
              Clinical &amp; Dispatch Notifications ({notifications.length})
            </span>
            <div className="flex items-center gap-3">
              {unreadNotifications > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllNotificationsRead}
                  className="text-[#0F5132] font-semibold hover:underline"
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
                className="text-slate-500 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
          {notifications.length === 0 ? (
            <div className="text-slate-500 py-2">No dispatch or report alerts yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {notifications.slice(0, 8).map((n) => (
                <div key={n.id} className={`py-2.5 flex items-start justify-between gap-3 ${n.read ? 'opacity-70' : ''}`}>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {n.title} <span className="font-normal text-slate-500">· {n.category}</span>
                    </div>
                    <div className="text-slate-600 mt-0.5">{n.message}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotification(n.id)}
                      title="Delete alert"
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 1: DISCOVER & COMPARE TESTS           */}
      {/* ========================================= */}
      {activeTab === 'DISCOVER' && (
        <div className="space-y-8">
          {/* Search & Category Strip */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search test name, code, or Urdu terms (e.g. 'HbA1c', 'Lipid', 'Dengue', 'جگر')..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 min-h-[42px]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {['ALL', 'HEMATOLOGY', 'ENDOCRINOLOGY', 'CARDIOLOGY', 'BIOCHEMISTRY', 'VITAMINS', 'INFECTIOUS_DISEASE'].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors min-h-[38px] ${
                        selectedCategory === cat
                          ? 'bg-[#0F5132] text-white font-semibold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat === 'ALL' ? 'All Panels' : cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Quick Filtered Test Chips */}
            {filteredTests.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                {filteredTests.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setComparingTestId(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                      activeTest?.id === t.id
                        ? 'bg-emerald-50 border-[#0F5132] text-[#0F5132] font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Authentic Price Comparison Grid */}
          {isLoadingCatalog || !activeTest ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-500">
              Loading live Lahore diagnostic tariffs from server...
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Published PKR Tariff Comparison · {activeTest.code}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">{activeTest.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sample: {activeTest.sampleType} · Fasting:{' '}
                    {activeTest.fastingHours > 0 ? `${activeTest.fastingHours} hrs overnight` : 'None required'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBasketTest(activeTest.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[40px] self-start md:self-auto border transition-colors ${
                    basketTestIds.includes(activeTest.id)
                      ? 'bg-emerald-50 border-[#0F5132] text-[#0F5132]'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  {basketTestIds.includes(activeTest.id) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Added to Requisition ({basketTestIds.length})</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Add to Multi-Test Basket</span>
                    </>
                  )}
                </button>
              </div>

              {basketTestIds.length > 0 && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-[#0F5132] flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4" />
                      <span>Combined Requisition Basket ({basketTestIds.length} tests — 1 shared collection fee)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tests
                        .filter((t) => basketTestIds.includes(t.id))
                        .map((bt) => (
                          <button
                            key={bt.id}
                            type="button"
                            onClick={() => toggleBasketTest(bt.id)}
                            className="px-2 py-0.5 rounded bg-white border border-emerald-200 text-slate-700 font-medium inline-flex items-center gap-1"
                          >
                            <span>{bt.code}</span>
                            <span aria-hidden="true">×</span>
                          </button>
                        ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBasketTestIds([])}
                    className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline self-start sm:self-center"
                  >
                    Clear Basket
                  </button>
                </div>
              )}

              {activeTest.fastingHours > 0 && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-950">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Mandatory Fasting Notice: </span>
                    {activeTest.preparationInstructions}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {laboratories.map((lab) => {
                  const pricing = testPrices.find((p) => p.labId === lab.id);
                  if (!pricing) return null;
                  const homeFee = lab.branches[0]?.homeCollectionFeePkr ?? 0;
                  const isVerified = lab.verificationStatus === 'VERIFIED';
                  const ratingSummary = reviewSummaries.find((s) => s.labId === lab.id);
                  const basketSum = basketTestIds.reduce((sum, tid) => {
                    const pr = pricings.find((p) => p.labId === lab.id && p.testId === tid);
                    return sum + (pr?.discountedPricePkr ?? pr?.pricePkr ?? 0);
                  }, 0);

                  return (
                    <div
                      key={lab.id}
                      className={`border rounded-xl p-5 flex flex-col justify-between transition-colors ${
                        isVerified
                          ? 'bg-[#FBFBF9] border-slate-200 hover:border-slate-300'
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="font-bold text-slate-900 text-sm">{lab.name}</span>
                          {isVerified ? (
                            <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                              {lab.phcLicence}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                              LICENCE REVOKED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">{lab.tagline}</p>

                        {ratingSummary && ratingSummary.reviewCount > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-800 font-semibold mb-3">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span className="font-mono">{ratingSummary.averageRating.toFixed(1)}</span>
                            <span className="text-slate-500 font-normal">
                              ({ratingSummary.reviewCount} verified)
                            </span>
                          </div>
                        )}

                        <div className="space-y-2 border-t border-slate-200 pt-3 text-xs">
                          <div className="flex items-baseline justify-between">
                            <span className="text-slate-500">Test Rate:</span>
                            <div className="text-right">
                              {pricing.discountedPricePkr ? (
                                <div className="flex items-baseline gap-1.5 justify-end">
                                  <span className="text-slate-400 line-through text-[11px] font-mono tabular-nums">
                                    PKR {pricing.pricePkr.toLocaleString()}
                                  </span>
                                  <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                                    PKR {pricing.discountedPricePkr.toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                                  PKR {pricing.pricePkr.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          {basketTestIds.length > 1 && (
                            <div className="flex items-center justify-between text-[#0F5132] font-semibold">
                              <span>Basket ({basketTestIds.length} tests):</span>
                              <span className="font-mono tabular-nums">PKR {basketSum.toLocaleString()}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-slate-600">
                            <span>Home Sampling:</span>
                            <span
                              className={`font-mono tabular-nums font-semibold ${
                                homeFee === 0 ? 'text-[#0F5132]' : 'text-slate-800'
                              }`}
                            >
                              {homeFee === 0 ? 'FREE (PKR 0)' : `PKR ${homeFee}`}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600">
                            <span>Report Ready:</span>
                            <span className="font-mono tabular-nums font-semibold text-emerald-800">
                              {pricing.statedTurnaroundHours} Hours
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-slate-500 text-[11px]">
                            <span>Lahore Branches:</span>
                            <span className="font-medium text-slate-800">{lab.branches.length} centres</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-200 space-y-2">
                        {isVerified ? (
                          <button
                            onClick={() =>
                              handleStartBooking(
                                activeTest,
                                lab.id,
                                basketTestIds.length > 0 ? basketTestIds : [activeTest.id]
                              )
                            }
                            className="w-full py-2.5 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[42px]"
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
                            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-start gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-700" />
                              <span>
                                PHC Licence Revoked — Not recognized by PHC Regulatory Admin. Booking disabled.
                              </span>
                            </div>
                            <button
                              type="button"
                              disabled
                              aria-disabled="true"
                              className="w-full py-2.5 bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold cursor-not-allowed min-h-[42px]"
                            >
                              Booking Unavailable (Licence Revoked)
                            </button>
                          </>
                        )}
                        <div className="text-[10px] text-slate-400 text-center font-mono">
                          Source: {pricing.sourceUrl || pricing.verifiedBy}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signed-in Patient Bookings Strip */}
          {patientUser && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Your Recent Bookings ({myBookings.length})</h2>
                  <p className="text-xs text-slate-500">Scoped privately to {patientUser.phone}</p>
                </div>
                <button
                  onClick={loadPatientRecords}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 min-h-[36px]"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoadingRecords ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {bookingActionMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs">
                  {bookingActionMsg}
                </div>
              )}
              {bookingActionError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                  {bookingActionError}
                </div>
              )}

              {myBookings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
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
                        className="bg-[#FBFBF9] border border-slate-200 rounded-xl p-4 space-y-3 text-xs flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-slate-900">{bk.bookingNumber}</span>
                            <span
                              className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                bk.status === 'CANCELLED'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {bk.status === 'CANCELLED' ? 'CANCELLED' : bk.phlebotomistStatus || bk.status}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900">{labObj?.name || bk.labId}</div>
                          <div className="text-[11px] text-slate-600">
                            {bk.branchName} · For: {bk.familyMemberName || bk.patientName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {bk.scheduledDate} · {bk.scheduledTimeSlot} · {bk.testIds.length} test(s)
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-slate-200 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-[#0F5132] tabular-nums">
                              PKR {bk.totalPkr.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setTrackingQuery(bk.bookingNumber);
                                  onSelectTab('TRACKING');
                                }}
                                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-[#0F5132] text-slate-800 rounded-lg font-semibold text-[11px] min-h-[34px]"
                              >
                                Track Live
                              </button>
                              {bk.reportUrl && (
                                <button
                                  onClick={() => onSelectTab('REPORTS')}
                                  className="px-2.5 py-1.5 bg-[#0F5132] text-white rounded-lg font-semibold text-[11px] min-h-[34px]"
                                >
                                  PDF Report
                                </button>
                              )}
                            </div>
                          </div>

                          {(canModify || bk.status === 'COMPLETED' || canDeleteCancelled) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
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
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCancelBooking(bk)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold text-[11px] flex items-center gap-1"
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
                                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-semibold text-[11px]"
                                    >
                                      Confirm Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPendingDeleteBookingId(null)}
                                      className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-semibold text-[11px]"
                                    >
                                      Keep
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteBookingId(bk.id)}
                                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-semibold text-[11px] flex items-center gap-1"
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
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded font-semibold text-[11px] flex items-center gap-1"
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
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 2: LIVE SAMPLE & COURIER TRACKER      */}
      {/* ========================================= */}
      {activeTab === 'TRACKING' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookupTracking();
              }}
              className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end text-xs"
            >
              <div className="flex-1">
                <label className="block font-semibold text-slate-700 mb-1">Booking Number:</label>
                <input
                  type="text"
                  value={trackingQuery}
                  onChange={(e) => setTrackingQuery(e.target.value)}
                  placeholder="e.g. LC-LHR-2611-0081"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-semibold text-slate-900 min-h-[42px]"
                />
              </div>

              {!patientUser && (
                <div className="sm:w-44">
                  <label className="block font-semibold text-slate-700 mb-1">Phone Last 4 Digits:</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={trackingPhoneLast4}
                    onChange={(e) => setTrackingPhoneLast4(e.target.value.replace(/\D/g, ''))}
                    placeholder="7891"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-semibold text-slate-900 min-h-[42px]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoadingTracking}
                className="px-5 py-2.5 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-xl font-semibold flex items-center justify-center gap-2 min-h-[42px]"
              >
                <RotateCw className={`w-4 h-4 ${isLoadingTracking ? 'animate-spin' : ''}`} />
                <span>Track Sample</span>
              </button>
            </form>

            {myBookings.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Your Bookings:</span>
                {myBookings.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setTrackingQuery(b.bookingNumber);
                      handleLookupTracking(b.bookingNumber);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border ${
                      trackingData?.booking.bookingNumber === b.bookingNumber
                        ? 'bg-emerald-50 border-[#0F5132] text-[#0F5132] font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
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

          {trackingData && (() => {
            const bk = trackingData.booking;
            const stepIdx = getTrackingStepIndex(bk);
            return (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#0F5132] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                        {bk.bookingNumber}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{trackingData.phcLicence}</span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{trackingData.labName}</h2>
                    <p className="text-xs text-slate-600">
                      Branch: <strong>{trackingData.branchName}</strong> · {trackingData.branchAddress}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs">
                    {bk.sampleBarcode && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2">
                        <span className="text-[10px] text-slate-500 block uppercase font-semibold">Vacutainer ID</span>
                        <span className="font-mono font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                          <QrCode className="w-3.5 h-3.5 text-[#0F5132]" />
                          {bk.sampleBarcode}
                        </span>
                      </div>
                    )}
                    {bk.coldChainTempCelsius !== undefined && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2">
                        <span className="text-[10px] text-emerald-800 block uppercase font-semibold">Cold-Chain Temp</span>
                        <span className="font-mono font-bold text-[#0F5132] flex items-center gap-1 mt-0.5">
                          <Thermometer className="w-3.5 h-3.5" />
                          {bk.coldChainTempCelsius.toFixed(1)}°C (2–8°C Safe)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6-Stage Horizontal Step Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {TRACKING_STEPS.map((label, idx) => {
                    const reached = idx <= stepIdx;
                    return (
                      <div
                        key={label}
                        className={`p-3 rounded-xl border text-xs ${
                          reached
                            ? 'bg-emerald-50/70 border-[#0F5132] text-[#0F5132] font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
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

                {/* Courier Card & Email Quick CTA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0F5132]">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {bk.phlebotomistName || 'Assigned Upon Lab Acceptance'}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          Destination: {bk.streetAddress || bk.patientArea}
                        </div>
                      </div>
                    </div>
                    {bk.phlebotomistPhone && (
                      <a
                        href={`tel:${bk.phlebotomistPhone}`}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-[#0F5132] flex items-center gap-1 min-h-[36px]"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-900">Report & Email Status</div>
                      <div className="text-slate-600 mt-0.5">
                        {trackingData.reportAvailable
                          ? trackingData.emailDispatchedAt
                            ? `PDF Ready · Emailed at ${new Date(trackingData.emailDispatchedAt).toLocaleTimeString()}`
                            : 'Signed PDF Ready in Portal'
                          : 'Pending laboratory processing & pathologist verification'}
                      </div>
                    </div>
                    {trackingData.reportAvailable && (
                      <button
                        onClick={() => onSelectTab('REPORTS')}
                        className="px-3.5 py-2 bg-[#0F5132] text-white rounded-lg font-semibold min-h-[36px] whitespace-nowrap"
                      >
                        Open PDF
                      </button>
                    )}
                  </div>
                </div>

                {/* Timestamped Checkpoints */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Chain-of-Custody Audit Timeline ({trackingData.trackingEvents.length} Checkpoints)
                  </h3>
                  <div className="space-y-2.5">
                    {[...trackingData.trackingEvents].reverse().map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3.5 rounded-xl bg-[#FBFBF9] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                              {ev.stage}
                            </span>
                            <span className="font-bold text-slate-900">{ev.title}</span>
                          </div>
                          <p className="text-slate-600">{ev.description}</p>
                          <div className="text-[11px] text-slate-500">
                            Actor: {ev.actor} {ev.location ? `· ${ev.location}` : ''}
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">
                          {new Date(ev.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 3: PDF REPORTS & EMAIL DISPATCH       */}
      {/* ========================================= */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          {!patientUser ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#0F5132] flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Sign In to Access Your Pathology PDF Reports</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                For PHC clinical privacy, signed PDF pathology reports require verified Pakistani mobile OTP login.
              </p>
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold min-h-[42px]"
              >
                Verify Mobile via OTP
              </button>
            </div>
          ) : myReports.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <div className="text-sm font-bold text-slate-800">No Finalized PDF Reports Yet</div>
              <p className="text-xs text-slate-500">
                Once your laboratory pathologist releases a report in the Lab Portal, it appears here as a downloadable PDF and is emailed to{' '}
                <strong>{patientUser.email}</strong>.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Reports List + Family Filter */}
              <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Health Passport ({myReports.length})
                  </span>
                  <button onClick={loadPatientRecords} className="text-xs text-[#0F5132] font-semibold">
                    Refresh
                  </button>
                </div>

                <select
                  value={reportFamilyFilter}
                  onChange={(e) => setReportFamilyFilter(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-800"
                >
                  <option value="ALL">All Household Members</option>
                  {Array.from(new Set(myReports.map((r) => r.patientName))).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>

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
                        ? 'bg-emerald-50/50 border-[#0F5132]'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono font-bold text-slate-900">{rep.bookingNumber}</span>
                      <span className="font-mono text-[#0F5132] font-semibold">PDF Signed</span>
                    </div>
                    <div className="font-semibold text-slate-800">{rep.branchName}</div>
                    <div className="text-[11px] text-slate-500">
                      {rep.familyMemberName || rep.patientName} · {new Date(rep.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Report Viewer, PDF Download & Email Dispatch */}
              {selectedReport && (
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider">
                        Digitally Signed Clinical PDF
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 mt-0.5">{selectedReport.fileName}</h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Verified By: <strong>{selectedReport.pathologistName}</strong> · SHA-256:{' '}
                        <span className="font-mono">{selectedReport.checksumSha256.slice(0, 14)}...</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={apiClient.getReportPdfUrl(selectedReport.bookingNumber, false, 'patient')}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[40px]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View PDF</span>
                      </a>
                      <a
                        href={apiClient.getReportPdfUrl(selectedReport.bookingNumber, true, 'patient')}
                        download={selectedReport.fileName}
                        className="px-3.5 py-2 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[40px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  </div>

                  {/* Read-Only Laboratory Email Delivery Status (Strictly Controlled by Lab Branch Leads & Pathologists) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Mail className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-900">Laboratory Email Delivery Status</div>
                        <div className="text-slate-600 mt-0.5">
                          {selectedReport.emailDispatchedAt
                            ? `Dispatched to ${selectedReport.patientEmail || patientUser.email} by ${selectedReport.branchName} on ${new Date(selectedReport.emailDispatchedAt).toLocaleString()}.`
                            : `Email dispatch is controlled by the Lab Branch Lead & Pathologist. Your PDF copy will be sent to ${selectedReport.patientEmail || patientUser.email}.`}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded shrink-0 border ${
                        selectedReport.emailDispatchedAt
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border-amber-200'
                      }`}
                    >
                      {selectedReport.emailDispatchedAt ? 'EMAILED BY LAB' : 'LAB DISPATCH PENDING'}
                    </span>
                  </div>

                  {/* Structured Results Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Parameter</th>
                          <th className="py-2.5 px-4">Result</th>
                          <th className="py-2.5 px-4">Reference Range</th>
                          <th className="py-2.5 px-4">Flag</th>
                          <th className="py-2.5 px-4">Explain</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedReport.parameters.map((p, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{p.parameter}</td>
                            <td className="py-2.5 px-4 font-mono font-bold tabular-nums">
                              {p.observedValue} {p.unit}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-500">{p.referenceRange}</td>
                            <td className="py-2.5 px-4">
                              <span
                                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  p.flag === 'NORMAL'
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {p.flag}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <button
                                onClick={() =>
                                  handleExplainParameter(p.parameter, `${p.observedValue} ${p.unit}`, p.referenceRange)
                                }
                                className="text-[11px] font-semibold text-[#0F5132] hover:underline flex items-center gap-1"
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

                  {/* Pathologist Clinical Notes + Bilingual Full-Panel AI Explainer */}
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#0F5132] flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>LabConnect Intelligence ({aiLanguage === 'UR' ? 'Urdu' : 'English'})</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExplainFullReport(selectedReport)}
                          className="px-3 py-1.5 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-lg text-[11px] font-semibold"
                        >
                          Summarize Full Panel
                        </button>
                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
                          <button
                            onClick={() => setAiLanguage('EN')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                              aiLanguage === 'EN' ? 'bg-[#0F5132] text-white' : 'text-slate-600'
                            }`}
                          >
                            English
                          </button>
                          <button
                            onClick={() => setAiLanguage('UR')}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                              aiLanguage === 'UR' ? 'bg-[#0F5132] text-white' : 'text-slate-600'
                            }`}
                          >
                            اردو (Urdu)
                          </button>
                        </div>
                      </div>
                    </div>

                    {isLoadingAi ? (
                      <div className="text-slate-500">Generating patient-friendly explanation ({aiModel})...</div>
                    ) : aiExplanation ? (
                      <div className="bg-white border border-emerald-200 rounded-lg p-3 text-slate-800 leading-relaxed space-y-1.5" dir={aiLanguage === 'UR' ? 'rtl' : 'ltr'}>
                        <p>{aiExplanation}</p>
                        <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1" dir="ltr">
                          Educational awareness summary ({aiModel}). Always consult your physician for clinical diagnosis.
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-600">
                        <strong>Pathologist Note:</strong> {selectedReport.clinicalNotes} Tap <strong>Explain</strong> on any row or <strong>Summarize Full Panel</strong> above for plain English or Urdu guidance.
                      </p>
                    )}
                  </div>

                  {/* Historical Biomarker Comparison (Passport Longitudinal Check) */}
                  {myReports.length > 1 && (
                    <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[#0F5132]" />
                        <span>Household Report History ({myReports.length} Published Records)</span>
                      </div>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                            <tr>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Booking</th>
                              <th className="py-2 px-3">Patient</th>
                              <th className="py-2 px-3">Laboratory</th>
                              <th className="py-2 px-3">Markers Out of Range</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {myReports.slice(0, 5).map((r) => {
                              const flagged = r.parameters.filter((p) => p.flag !== 'NORMAL').length;
                              return (
                                <tr key={r.id}>
                                  <td className="py-2 px-3 tabular-nums">{new Date(r.publishedAt).toLocaleDateString()}</td>
                                  <td className="py-2 px-3">{r.bookingNumber}</td>
                                  <td className="py-2 px-3 font-sans">{r.familyMemberName || r.patientName}</td>
                                  <td className="py-2 px-3 font-sans">{r.branchName}</td>
                                  <td className={`py-2 px-3 font-bold ${flagged > 0 ? 'text-amber-700' : 'text-[#0F5132]'}`}>
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
        </div>
      )}

      {/* ========================================= */}
      {/* TAB 4: PATIENT ACCOUNT & FAMILY PROFILE   */}
      {/* ========================================= */}
      {activeTab === 'PROFILE' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {!patientUser ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Sign In to Manage Your Patient Profile</h2>
              <p className="text-xs text-slate-600">
                Verify your Pakistani mobile number to configure your report delivery email and family members.
              </p>
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-[#0F5132] text-white rounded-xl text-xs font-semibold min-h-[42px]"
              >
                Open Mobile OTP Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Patient Account Settings</h2>
                  <span className="font-mono text-[11px] text-slate-500">Verified Mobile: {patientUser.phone}</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenFamily}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Manage Family ({patientUser.familyMembers.length})</span>
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name:</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Email (For Automated PDF Reports):</label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lahore Residential Sector / Area:</label>
                <input
                  type="text"
                  value={profileArea}
                  onChange={(e) => setProfileArea(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                />
              </div>

              {profileSavedMsg && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg">
                  {profileSavedMsg}
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-xl font-semibold min-h-[42px]"
              >
                Save Account Changes
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================= */}
      {/* 3-STEP MULTI-TEST BOOKING MODAL           */}
      {/* ========================================= */}
      {bookingTestIds.length > 0 && (() => {
        const selectedTestsList = tests.filter((t) => bookingTestIds.includes(t.id));
        const maxFasting = selectedTestsList.reduce((max, t) => Math.max(max, t.fastingHours), 0);
        const modalTitle =
          selectedTestsList.length > 1
            ? `Book ${selectedTestsList.length} Tests`
            : `Book ${selectedTestsList[0]?.name || 'Diagnostic Test'}`;

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5 my-auto">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Step {bookingStep} of 3
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{modalTitle}</h3>
                  {selectedTestsList.length > 1 && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {selectedTestsList.map((t) => t.name).join(' + ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setBookingTestIds([])}
                  className="text-slate-400 hover:text-slate-700 text-sm font-semibold p-2"
                >
                  ✕
                </button>
              </div>

              {bookingStep === 1 && (() => {
                const currentLab = laboratories.find((l) => l.id === selectedLabId) || laboratories[0];
                const currentBranch = currentLab.branches.find((b) => b.id === selectedBranchId) || currentLab.branches[0];
                return (
                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase">Selected Diagnostic Lab</div>
                        <div className="text-sm font-bold text-slate-900">{currentLab.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{currentLab.phcLicence}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F5132] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCollectionType('HOME_COLLECTION')}
                        className={`p-3 rounded-xl border text-left ${
                          collectionType === 'HOME_COLLECTION'
                            ? 'border-[#0F5132] bg-emerald-50/50 text-[#0F5132] font-semibold'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">Home Collection</div>
                        <div className="text-[10px] text-slate-500">Phlebotomist visits address</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollectionType('BRANCH_VISIT')}
                        className={`p-3 rounded-xl border text-left ${
                          collectionType === 'BRANCH_VISIT'
                            ? 'border-[#0F5132] bg-emerald-50/50 text-[#0F5132] font-semibold'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="font-bold">Branch Walk-In</div>
                        <div className="text-[10px] text-slate-500">Visit selected branch</div>
                      </button>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1.5">
                        Select Exact Lahore Physical Branch ({currentLab.branches.length}):
                      </label>
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {currentLab.branches.map((b) => (
                          <label
                            key={b.id}
                            onClick={() => setSelectedBranchId(b.id)}
                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer ${
                              selectedBranchId === b.id ? 'border-[#0F5132] bg-emerald-50/40' : 'border-slate-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name="branchChoice"
                              checked={selectedBranchId === b.id}
                              onChange={() => setSelectedBranchId(b.id)}
                              className="mt-1 accent-[#0F5132]"
                            />
                            <div className="flex-1">
                              <div className="font-bold text-slate-900">{b.name}</div>
                              <div className="text-[11px] text-slate-600">{b.address}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {b.operatingHours} · Home Fee: {b.homeCollectionFeePkr === 0 ? 'FREE' : `PKR ${b.homeCollectionFeePkr}`}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {collectionType === 'HOME_COLLECTION' && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Exact Lahore Home Street Address:
                        </label>
                        <input
                          type="text"
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          placeholder="House #, Street #, Block, Sector, Lahore"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                        />
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Dispatch hub: {currentBranch.name}
                        </span>
                      </div>
                    )}

                    {bookingError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">{bookingError}</div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          if (collectionType === 'HOME_COLLECTION' && streetAddress.trim().length < 8) {
                            setBookingError('Enter an exact Lahore street address (minimum 8 characters).');
                            return;
                          }
                          setBookingError(null);
                          setBookingStep(2);
                        }}
                        className="px-4 py-2.5 bg-[#0F5132] text-white rounded-xl font-semibold flex items-center gap-1.5 min-h-[42px]"
                      >
                        <span>Continue to Checkout</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
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
                  <form onSubmit={handleCompleteBooking} className="space-y-3.5 text-xs">
                    {!patientUser && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-2">
                        <span className="text-amber-950 font-medium">
                          Verify mobile via OTP first to secure your PDF report & tracking.
                        </span>
                        <button
                          type="button"
                          onClick={onOpenAuth}
                          className="px-3 py-1.5 bg-[#0F5132] text-white rounded-lg font-semibold whitespace-nowrap"
                        >
                          Sign In Now
                        </button>
                      </div>
                    )}

                    {patientUser && patientUser.familyMembers.length > 0 && (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Who is this test for?</label>
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800"
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
                        <label className="block font-semibold text-slate-700 mb-1">Patient Name:</label>
                        <input
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Mobile (+92):</label>
                        <input
                          type="text"
                          required
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Email Address (PDF Report Delivery):</label>
                      <input
                        type="email"
                        required
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Scheduled Date:</label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().slice(0, 10)}
                          max={new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)}
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Time Slot:</label>
                        <select
                          value={selectedTimeSlot}
                          onChange={(e) => setSelectedTimeSlot(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                        >
                          <option value="07:30 AM – 08:30 AM">07:30 AM – 08:30 AM</option>
                          <option value="08:30 AM – 09:30 AM">08:30 AM – 09:30 AM</option>
                          <option value="09:30 AM – 10:30 AM">09:30 AM – 10:30 AM</option>
                          <option value="11:00 AM – 12:00 PM">11:00 AM – 12:00 PM</option>
                          <option value="04:00 PM – 05:00 PM">04:00 PM – 05:00 PM</option>
                        </select>
                      </div>
                    </div>

                    {maxFasting > 0 && (
                      <label className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fastingAcknowledged}
                          onChange={(e) => setFastingAcknowledged(e.target.checked)}
                          className="mt-0.5 accent-amber-700"
                        />
                        <span className="text-[11px] text-amber-950">
                          I confirm {maxFasting}h overnight fasting prior to sample collection.
                        </span>
                      </label>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                      <span className="text-slate-600">
                        Total Payable ({bookingTestIds.length} Test{bookingTestIds.length > 1 ? 's' : ''} + Home Dispatch)
                      </span>
                      <span className="text-base font-bold font-mono text-[#0F5132] tabular-nums">
                        PKR {grandTotal.toLocaleString()}
                      </span>
                    </div>

                    {bookingError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">{bookingError}</div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setBookingStep(1)}
                        className="text-slate-600 font-semibold"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingBooking}
                        className="px-5 py-2.5 bg-[#0F5132] hover:bg-emerald-800 text-white rounded-xl font-semibold min-h-[42px] disabled:opacity-50"
                      >
                        {isSubmittingBooking ? 'Confirming...' : 'Confirm Appointment'}
                      </button>
                    </div>
                  </form>
                );
              })()}

              {bookingStep === 3 && bookingSuccessNum && (
                <div className="text-center space-y-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#0F5132] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Appointment Confirmed</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Booking Number: <strong className="font-mono text-[#0F5132]">{bookingSuccessNum}</strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Signed PDF results will also be emailed to <strong>{patientEmail}</strong> when released by the laboratory.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center pt-2">
                    <button
                      onClick={() => {
                        setBookingTestIds([]);
                        onSelectTab('TRACKING');
                      }}
                      className="px-4 py-2 bg-[#0F5132] text-white rounded-xl text-xs font-semibold min-h-[40px]"
                    >
                      Track Live Status
                    </button>
                    <button
                      onClick={() => setBookingTestIds([])}
                      className="px-4 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold min-h-[40px]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* RESCHEDULE MODAL */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleRescheduleSubmit}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#0F5132]">{rescheduleTarget.bookingNumber}</span>
                <h3 className="text-base font-bold text-slate-900">Reschedule Appointment</h3>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Date (Next 14 Days):</label>
              <input
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                max={new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)}
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Time Slot:</label>
              <select
                value={rescheduleSlot}
                onChange={(e) => setRescheduleSlot(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              >
                <option value="07:30 AM – 08:30 AM">07:30 AM – 08:30 AM</option>
                <option value="08:30 AM – 09:30 AM">08:30 AM – 09:30 AM</option>
                <option value="09:30 AM – 10:30 AM">09:30 AM – 10:30 AM</option>
                <option value="11:00 AM – 12:00 PM">11:00 AM – 12:00 PM</option>
                <option value="04:00 PM – 05:00 PM">04:00 PM – 05:00 PM</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-[#0F5132] text-white rounded-xl font-semibold">
                Save Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VERIFIED BOOKING-GATED REVIEW MODAL */}
      {reviewTargetBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleReviewSubmit}
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-xs"
          >
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-[#0F5132]">
                  Verified Booking · {reviewTargetBooking.bookingNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900">Rate Laboratory Experience</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewTargetBooking(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-2">Overall Star Rating:</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setReviewRating(num)}
                    className={`px-3 py-2 rounded-lg border font-mono font-bold flex items-center gap-1 ${
                      reviewRating >= num
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${reviewRating >= num ? 'fill-amber-500 text-amber-500' : ''}`} />
                    <span>{num}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Verified Patient Feedback:</label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share phlebotomist punctuality, cold-chain care, and PDF turnaround speed..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              />
            </div>

            {reviewError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">{reviewError}</div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReviewTargetBooking(null)}
                className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="px-4 py-2 bg-[#0F5132] text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {isSubmittingReview ? 'Publishing...' : 'Publish Verified Review'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
