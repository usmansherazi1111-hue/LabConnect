/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'PATIENT' | 'LAB_ADMIN' | 'PHLEBOTOMIST' | 'SUPER_ADMIN' | 'PHC_INSPECTOR';

export type PortalRoute = '/' | '/patient' | '/lab' | '/phlebotomist' | '/admin' | '/specs';

export type PortalMode =
  | 'GATEWAY'
  | 'PATIENT_PORTAL'
  | 'LAB_PORTAL'
  | 'PHLEBOTOMIST_PORTAL'
  | 'ADMIN_PORTAL'
  | 'REQUIREMENTS_HUB'
  | 'ARCHITECTURE_ERD';

export type RequirementModule = 'AUTH' | 'PAT' | 'LAB' | 'BOOK' | 'REPORT' | 'AI' | 'SEC' | 'ADMIN' | 'COMMERCIAL';

export type PriorityLevel = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';

export type RequirementStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'TESTS_PASSED' | 'VERIFIED';

export interface RequirementItem {
  id: string;
  title: string;
  module: RequirementModule;
  priority: PriorityLevel;
  description: string;
  acceptanceCriteria: string[];
  securityImplications: string;
  responsiblePhase: number;
  status: RequirementStatus;
  testCaseRef: string;
}

export interface SpecificationDoc {
  id: string;
  title: string;
  category: 'PRODUCT' | 'ARCHITECTURE' | 'SECURITY' | 'GOVERNANCE' | 'OPERATIONS';
  version: string;
  summary: string;
  contentMarkdown: string;
  relatedRequirementIds: string[];
}

export interface DatabaseEntity {
  name: string;
  description: string;
  table: string;
  columns: {
    name: string;
    type: string;
    constraints: string;
    description: string;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
    references?: string;
  }[];
  relationships: string[];
}

export interface LahoreLabBranch {
  id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  operatingHours: string;
  homeCollectionZones: string[];
  homeCollectionFeePkr: number;
  isHeadquarters?: boolean;
}

export type LabSubscriptionTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface LahoreLaboratory {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  phcLicence: string;
  accreditation: string;
  verificationStatus: 'VERIFIED' | 'REVOKED' | 'PENDING_AUDIT' | 'UNVERIFIED';
  verifiedAt: string;
  verifiedBy: string;
  headquarters: string;
  branches: LahoreLabBranch[];
  contactEmail: string;
  contactPhone: string;
  sampleCollectionTurnaround: string;
  subscriptionTier?: LabSubscriptionTier;
  monthlySaasFeePkr?: number;
  dataConfidence: 'CONFIRMED_OFFICIAL_CATALOGUE' | 'PARTNER_INTEGRATION' | 'BRANCH_VERIFIED';
  dataSource: string;
  notes: string;
}

export interface DiagnosticTest {
  id: string;
  code: string;
  name: string;
  category: 'HEMATOLOGY' | 'ENDOCRINOLOGY' | 'BIOCHEMISTRY' | 'INFECTIOUS_DISEASE' | 'CARDIOLOGY' | 'VITAMINS';
  sampleType: 'Whole Blood (EDTA)' | 'Serum (Plain/Gel)' | 'Plasma (Fluoride)' | 'Midstream Urine';
  fastingHours: number;
  preparationInstructions: string;
  synonyms: string[];
  description: string;
  commonNormalRange: string;
  defaultParameters?: {
    parameter: string;
    defaultValue: string;
    unit: string;
    referenceRange: string;
    flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
  }[];
}

export interface LaboratoryTestPricing {
  id: string;
  labId: string;
  testId: string;
  pricePkr: number;
  discountedPricePkr?: number;
  statedTurnaroundHours: number;
  effectiveFrom: string;
  lastConfirmedAt: string;
  verifiedBy: string;
  sourceUrl?: string;
  homeCollectionAvailable: boolean;
}

export interface TrackingEvent {
  id: string;
  stage:
    | 'BOOKING_CREATED'
    | 'ACCEPTED'
    | 'DISPATCHED'
    | 'EN_ROUTE'
    | 'ARRIVED'
    | 'SAMPLE_COLLECTED'
    | 'IN_TRANSIT'
    | 'RECEIVED_AT_LAB'
    | 'PROCESSING'
    | 'REPORT_RELEASED';
  title: string;
  description: string;
  actor: string;
  location?: string;
  timestamp: string;
}

export interface ReportParameter {
  parameter: string;
  observedValue: string;
  unit: string;
  referenceRange: string;
  flag: 'NORMAL' | 'HIGH' | 'LOW' | 'CRITICAL';
}

export interface DiagnosticReportRecord {
  id: string;
  bookingNumber: string;
  labId: string;
  branchName: string;
  patientName: string;
  familyMemberId?: string;
  familyMemberName?: string;
  patientPhone: string;
  patientEmail?: string;
  fileName: string;
  pdfUrl: string;
  checksumSha256: string;
  pathologistName: string;
  clinicalNotes: string;
  parameters: ReportParameter[];
  publishedAt: string;
  emailDispatchedAt?: string;
  emailDispatchStatus?: 'SENT_SMTP' | 'QUEUED_MIME_VERIFIED' | 'NOT_SENT';
}

export interface EmailDispatchLog {
  id: string;
  bookingNumber: string;
  recipientEmail: string;
  subject: string;
  status: 'SENT_SMTP' | 'QUEUED_MIME_VERIFIED';
  attachmentFileName: string;
  sentAt: string;
  previewText: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  role: UserRole | 'SYSTEM';
  action: string;
  target: string;
  timestamp: string;
}

export interface MockBooking {
  id: string;
  bookingNumber: string;
  patientUserId?: string;
  patientName: string;
  familyMemberId?: string;
  familyMemberName?: string;
  patientPhone: string;
  patientEmail?: string;
  patientArea: string;
  streetAddress?: string;
  labId: string;
  branchId: string;
  branchName?: string;
  branchAddress?: string;
  testIds: string[];
  collectionType: 'HOME_COLLECTION' | 'BRANCH_VISIT';
  scheduledDate: string;
  scheduledTimeSlot: string;
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  totalPkr: number;
  homeCollectionFeePkr: number;
  phlebotomistName?: string;
  phlebotomistPhone?: string;
  phlebotomistStatus?:
    | 'PENDING_ASSIGNMENT'
    | 'EN_ROUTE'
    | 'ARRIVED'
    | 'SAMPLE_COLLECTED'
    | 'IN_TRANSIT'
    | 'RECEIVED_AT_LAB';
  sampleBarcode?: string;
  coldChainTempCelsius?: number;
  fastingConfirmed?: boolean;
  fastingAcknowledged?: boolean;
  reportUrl?: string;
  reportChecksum?: string;
  emailDispatchedAt?: string;
  settlementId?: string;
  trackingEvents?: TrackingEvent[];
  createdAt: string;
}

export interface LabReviewRecord {
  id: string;
  labId: string;
  bookingNumber: string;
  patientUserId?: string;
  patientName: string;
  rating: number;
  punctualityRating: number;
  turnaroundRating: number;
  comment: string;
  verifiedBooking: true;
  createdAt: string;
}

export interface LabRatingSummary {
  labId: string;
  averageRating: number;
  reviewCount: number;
}

export interface LabPhlebotomistSummary {
  id: string;
  name: string;
  phone: string;
  staffCode?: string;
  branchId?: string;
  area?: string;
}

export interface NotificationRecord {
  id: string;
  recipientRole: UserRole | 'ALL';
  targetUserId?: string;
  targetPhone?: string;
  targetLabId?: string;
  title: string;
  message: string;
  category: 'BOOKING' | 'DISPATCH' | 'REPORT' | 'COMPLIANCE' | 'BILLING';
  relatedId?: string;
  read: boolean;
  createdAt: string;
}

export interface SettlementPayoutRecord {
  id: string;
  labId: string;
  labName: string;
  periodLabel: string;
  bookingCount: number;
  grossPkr: number;
  commissionPkr: number;
  saasFeePkr: number;
  netPayablePkr: number;
  referenceCode: string;
  settledAt: string;
  settledBy: string;
}
