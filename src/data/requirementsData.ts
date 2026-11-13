/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RequirementItem, SpecificationDoc, DatabaseEntity } from '../types';

export const SPECIFICATION_DOCS: SpecificationDoc[] = [
  {
    id: 'DOC-01-PRD',
    title: '1. Product Requirements Document (PRD)',
    category: 'PRODUCT',
    version: '1.0.0-PROD',
    summary: 'Core vision, objectives, user personas, success metrics, and Lahore-first launch strategy.',
    relatedRequirementIds: ['PAT-001', 'LAB-001', 'BOOK-001', 'REPORT-001'],
    contentMarkdown: `# Product Requirements Document (PRD) — LabConnect Lahore

## 1. Executive Summary
LabConnect is Pakistan's dedicated diagnostic laboratory marketplace and digital laboratory operations SaaS. It unites accredited diagnostic facilities (starting with Lahore Tier-1 networks: Chughtai Lab, Shaukat Khanum, IDC, Excel Labs) with patients seeking transparent test discovery, verified pricing in PKR, home phlebotomy sample collection, and secure electronic health reports.

## 2. Problem Statement
- **Pricing Opacity**: In Lahore, diagnostic test prices vary significantly across facilities without public price transparency, forcing patients to make phone calls or travel between centres.
- **Home Collection Friction**: Fragmented booking channels; phlebotomists arrive with incorrect sample collection tubes or arrive without verified patient fasting confirmation.
- **Scattered Family Health Records**: Reports are scattered across SMS links, printed paper slips, and disparate portals, hindering longitudinal care.
- **Lack of Clinical Context**: Patients receive numerical pathology results with unfamiliar medical jargon, generating anxiety without actionable understanding.

## 3. Product Mission & Value Proposition
- **For Patients**: Discover, compare, and book verified lab tests with zero surprise fees; schedule home collection or clinic visits; access Family Health Passport; get AI-assisted explanations in simple English and Urdu.
- **For Laboratories**: Turnkey digital operations management; automated dispatch; reduced no-shows; digital report delivery; expanded patient reach across Lahore.

## 4. Key Performance Indicators (KPIs)
- Test booking conversion rate $\ge 14\%$
- Home collection fulfillment SLA compliance $\ge 98\%$
- Automated patient report matching accuracy: $100\%$
- Average patient discovery-to-booking time: $< 3\text{ minutes}$`,
  },
  {
    id: 'DOC-02-SRS',
    title: '2. Software Requirements Specification (SRS)',
    category: 'ARCHITECTURE',
    version: '1.0.0-TECH',
    summary: 'System functional capabilities, interfaces, data formats, and performance constraints.',
    relatedRequirementIds: ['AUTH-001', 'BOOK-002', 'SEC-001', 'REPORT-002'],
    contentMarkdown: `# Software Requirements Specification (SRS)

## 1. System Scope & Interface Requirements
The system comprises three front-facing application domains and one shared backend:
1. **Patient Web Application (Mobile-Responsive)**
2. **Laboratory Operations SaaS Workspace**
3. **Platform Administration & PHC Regulatory Console**
4. **Backend Modular Monolith**: Express/Node.js REST API with Postgres/relational persistence, private signed storage, and Gemini 3.8 Flash AI layer.

## 2. Functional Specification
- Multi-lab search engine supporting spelling tolerance, phonetic matching (Soundex / Levenshtein $\le 2$), and English/Urdu clinical synonyms.
- Concurrency-controlled slot reservation using database transactions to prevent double-booking phlebotomist capacity in Lahore service zones.
- Signed URLs with 15-minute expiration for private PDF report downloads.

## 3. Performance & Throughput Constraints
- 95th percentile API response time: $\le 180\text{ms}$ for search queries across 1,000+ test listings.
- Zero layout shift (CLS $\le 0.05$) across desktop (1440px) and mobile viewports.`,
  },
  {
    id: 'DOC-03-BRD',
    title: '3. Business Requirements Document (BRD)',
    category: 'PRODUCT',
    version: '1.0.0-BIZ',
    summary: 'Commercial objectives, monetization model, commission ledger, and stakeholder alignment.',
    relatedRequirementIds: ['COMMERCIAL-001', 'COMMERCIAL-002', 'LAB-005'],
    contentMarkdown: `# Business Requirements Document (BRD)

## 1. Business Objectives
Establish LabConnect as the primary trusted diagnostic booking channel in Lahore within 12 months, scaling to 15,000 monthly bookings while maintaining zero fraudulent listings.

## 2. Monetization Strategy
1. **Booking Commission**: Tiered take-rate (6% to 10%) on confirmed, fulfilled diagnostic bookings routed through the platform.
2. **Laboratory SaaS Subscriptions**:
   - **Starter Tier (Free)**: Up to 50 bookings/month, single branch, standard dispatch.
   - **Growth Tier (PKR 18,500/month)**: Up to 5 branches, automated phlebotomist route optimizer, multi-staff roles, customized SMS branding.
   - **Enterprise Tier (PKR 45,000/month)**: Unlimited branches across Lahore, automated LIS API sync, dedicated account manager, prioritized search placement.
3. **Home Sample Collection Convenience Surcharge**: Transparent PKR 50 platform coordination fee added to standard laboratory home collection tariff.

## 3. Financial Reconciliation & Settlement
- Laboratories receive weekly net disbursements (Gross Booking Value minus platform commission) with automated ledger statement generation.`,
  },
  {
    id: 'DOC-04-FRD',
    title: '4. Functional Requirements Document (FRD)',
    category: 'PRODUCT',
    version: '1.0.0-FUNC',
    summary: 'Detailed granular functional requirements organized by module.',
    relatedRequirementIds: ['PAT-001', 'PAT-002', 'LAB-002', 'BOOK-001'],
    contentMarkdown: `# Functional Requirements Document (FRD)

### Module 1: Patient Discovery & Comparison
- FR-PAT-101: System shall allow search by test name, test code, organ system, or condition.
- FR-PAT-102: Search results shall display price comparison cards showing test price, home collection fee, and total estimated payable PKR.
- FR-PAT-103: Fasting and prep instructions must be displayed prior to checkout.

### Module 2: Booking & Home Phlebotomy
- FR-BOK-201: The system shall support both 'Home Collection' and 'Branch Walk-in' booking types.
- FR-BOK-202: Address selection shall validate whether the patient's area is within the lab branch's active home collection coverage zones.
- FR-BOK-203: Phlebotomist dispatch status shall update in real time (Pending -> Accepted -> Dispatched -> Sample Collected -> Received at Lab).`,
  },
  {
    id: 'DOC-05-NFRD',
    title: '5. Non-Functional Requirements Document (NFRD)',
    category: 'ARCHITECTURE',
    version: '1.0.0-NFR',
    summary: 'Security, availability, scalability, accessibility, and latency parameters.',
    relatedRequirementIds: ['SEC-001', 'SEC-002', 'SEC-003'],
    contentMarkdown: `# Non-Functional Requirements Document (NFRD)

- **Security & Confidentiality**: AES-256 encryption at rest; TLS 1.3 in transit; strict patient tenant isolation.
- **Availability**: 99.9% uptime SLA for patient booking and report access portals.
- **Accessibility**: Compliance with WCAG 2.1 AA contrast ($\ge 4.5:1$ text contrast), visible focus indicators, and touch targets $\ge 44\text{px}$.
- **Auditability**: Immutable append-only audit log for all health record access, report views, and price modifications.`,
  },
  {
    id: 'DOC-06-ROLES',
    title: '6. User Roles & Permissions Matrix (RBAC)',
    category: 'GOVERNANCE',
    version: '1.0.0-SEC',
    summary: 'Strict role hierarchy, principle of least privilege, and horizontal tenant boundaries.',
    relatedRequirementIds: ['AUTH-002', 'AUTH-003', 'ADMIN-001'],
    contentMarkdown: `# User Roles & Permissions Matrix (RBAC)

| Role | Browse & Search | Book Tests | View Own Reports | View Branch Queue | Dispatch Staff | Upload Reports | Edit Tariffs | Audit Logs & PHC Review |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **PATIENT** | YES | YES | YES (Own + Consented Family) | NO | NO | NO | NO | NO |
| **PHLEBOTOMIST** | NO | NO | NO | YES (Assigned Route Only) | NO | NO (Collects sample) | NO | NO |
| **LAB_STAFF** | NO | NO | NO | YES (Branch Only) | YES | YES (Draft Only) | NO | NO |
| **LAB_ADMIN** | NO | NO | NO | YES (All Lab Branches) | YES | YES (Publish) | YES (Own Lab) | NO |
| **SUPER_ADMIN** | YES | NO | NO (Privacy Boundary) | YES (System-Wide) | NO | NO | NO | YES |
| **PHC_INSPECTOR** | YES | NO | NO (Medical Anonymity) | NO | NO | NO | READ-ONLY | YES (Compliance) |`,
  },
  {
    id: 'DOC-07-JOURNEYS',
    title: '7. Comprehensive User Journeys',
    category: 'PRODUCT',
    version: '1.0.0-UX',
    summary: 'End-to-end journey maps for Patients, Phlebotomists, Lab Operators, and Super Admins.',
    relatedRequirementIds: ['PAT-003', 'LAB-003', 'BOOK-003'],
    contentMarkdown: `# User Journeys

### Journey 1: Patient Diabetes Monitoring in DHA Phase 5
1. Usman wakes up needing his quarterly HbA1c and Lipid Profile.
2. He searches "Sugar and Cholesterol test" on LabConnect.
3. The platform displays real listings for Chughtai Lab (DHA Phase 5), SKMCH (Gulberg), IDC, and Excel Labs.
4. Usman selects Chughtai Lab due to 6-hour turnaround and PKR 350 home collection.
5. He notes the 12-hour overnight fasting warning for Lipids and selects 07:30 AM slot tomorrow.
6. He adds his elderly father as a family dependent and books home collection with Cash-on-Collection/Card.

### Journey 2: Chughtai Phlebotomist Sample Collection
1. Phlebotomist Ahmad receives the dispatch route for DHA Phase 5 on his mobile dashboard.
2. Arrives at patient residence, verifies fasting status and barcode label.
3. Draws EDTA tube for HbA1c and Gel tube for Lipids, logs "Sample Collected".
4. Transports in temperature-controlled cooler to Jail Road central reference lab.`,
  },
  {
    id: 'DOC-08-ARCH',
    title: '8. System Architecture Proposal',
    category: 'ARCHITECTURE',
    version: '1.0.0-ENG',
    summary: 'Modular monolith, API design, caching, background workers, and storage layout.',
    relatedRequirementIds: ['SEC-001', 'BOOK-002', 'REPORT-001'],
    contentMarkdown: `# System Architecture Proposal

\`\`\`
[ Client Apps ]
  ├── Patient Portal (Next.js / React 19 + Tailwind CSS)
  ├── Lab Management Portal (SaaS Workspace)
  └── Admin & Compliance Console (RBAC)
          │
          ▼  HTTPS / Bearer JWT + CSRF
[ API Gateway / Express Middleware ]
  ├── Rate Limiter (Redis / Memory sliding-window)
  ├── Input Sanitizer & Zod Schema Validation
  ├── Tenant Isolation Context (org_id / patient_id)
  └── Security Headers (CSP, HSTS, X-Frame-Options)
          │
          ▼
[ Domain Services Layer ]
  ├── Marketplace Service (Lahore Labs, Branch Tariffs, Search)
  ├── Booking & Dispatch Engine (Slots, Concurrency, State Machine)
  ├── Diagnostic Report Service (PDF Validation, Versioning, Signed URLs)
  └── LabConnect Intelligence (Gemini 3.8 Flash, Medical Guardrails)
          │
          ▼
[ Persistence & Data Stores ]
  ├── PostgreSQL (Relational Master: Bookings, Users, Audits, Tariffs)
  ├── Private Object Storage (S3-compatible encrypted PDF repository)
  └── In-Memory Cache (Lahore branch catalogue, search indices)
\`\`\``,
  },
  {
    id: 'DOC-09-ERD',
    title: '9. Database Entity Relationship Diagram (ERD)',
    category: 'ARCHITECTURE',
    version: '1.0.0-DB',
    summary: 'Normalized relational schema with foreign key integrity and audit provenance.',
    relatedRequirementIds: ['BOOK-001', 'LAB-001', 'REPORT-001'],
    contentMarkdown: `# Database Entity Relationship Specification

Primary entities include:
- \`users\` (id, email, phone, password_hash, role, status)
- \`patients\` (id, user_id, full_name, dob, gender, blood_group, cnic_masked)
- \`family_members\` (id, primary_patient_id, dependent_patient_id, relationship, consent_given)
- \`laboratories\` (id, name, slug, phc_licence, accreditation, verification_status, verified_at)
- \`laboratory_branches\` (id, lab_id, name, area_lahore, address, operating_hours, home_collection_zones)
- \`diagnostic_tests\` (id, code, name, category, sample_type, fasting_hours, synonyms)
- \`laboratory_test_prices\` (id, lab_id, test_id, price_pkr, discounted_pkr, tat_hours, last_confirmed_at)
- \`bookings\` (id, booking_number, patient_id, lab_id, branch_id, collection_type, status, total_pkr)
- \`booking_items\` (id, booking_id, test_id, unit_price_pkr)
- \`collection_dispatches\` (id, booking_id, phlebotomist_id, assigned_at, status, collected_at)
- \`diagnostic_reports\` (id, booking_id, patient_id, file_key, version, checksum_sha256, published_at)
- \`audit_logs\` (id, actor_id, action, resource_type, resource_id, ip_address, timestamp)`,
  },
  {
    id: 'DOC-10-API',
    title: '10. API Endpoint Specification (REST / OpenAPI)',
    category: 'ARCHITECTURE',
    version: '1.0.0-API',
    summary: 'RESTful API contracts with authentication headers, payloads, and status codes.',
    relatedRequirementIds: ['AUTH-001', 'PAT-001', 'BOOK-001'],
    contentMarkdown: `# API Endpoint Specification

### Public / Patient Endpoints
- \`GET /api/v1/search/tests?q={term}&area={lahoreArea}&category={cat}\` — Search tests with synonym matching
- \`GET /api/v1/labs/compare?testIds={id1,id2}\` — Multi-lab price and turnaround comparison matrix
- \`GET /api/v1/labs/{labId}/branches\` — Retrieve branch network and home collection service zones
- \`POST /api/v1/bookings\` — Create new booking (idempotent, payload signed)
- \`GET /api/v1/bookings/{id}/track\` — Real-time tracking of dispatch and sample status
- \`GET /api/v1/reports/{reportId}/download-url\` — Generate short-lived signed PDF download token

### Laboratory SaaS Endpoints
- \`GET /api/v1/lab/queue?branchId={id}&status={status}\` — Branch daily intake and collection queue
- \`PATCH /api/v1/lab/bookings/{id}/status\` — Transition state (ACCEPTED, DISPATCHED, SAMPLE_RECEIVED)
- \`POST /api/v1/lab/reports/upload\` — Multipart upload with SHA-256 integrity verification
- \`PUT /api/v1/lab/tariffs\` — Update test prices with effective dates and provenance logging

### Platform Admin & PHC Endpoints
- \`GET /api/v1/admin/labs/verification-queue\` — Audit lab licensing submissions
- \`POST /api/v1/admin/labs/{id}/verify\` — Formally certify laboratory and activate verified badge
- \`GET /api/v1/admin/ledger/commissions\` — Reconciliation ledger and fee settlements`,
  },
  {
    id: 'DOC-11-THREAT',
    title: '11. Security & Privacy Threat Model (STRIDE)',
    category: 'SECURITY',
    version: '1.0.0-SEC',
    summary: 'STRIDE threat analysis, healthcare data privacy, IDOR prevention, and PDF isolation.',
    relatedRequirementIds: ['SEC-001', 'SEC-002', 'SEC-003', 'REPORT-003'],
    contentMarkdown: `# Security & Privacy Threat Model (STRIDE)

| Threat Category | Potential Attack Vector | LabConnect Architectural Defense |
| :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates patient or phlebotomist | Cryptographically signed session tokens; mandatory OTP step-up for report downloads |
| **Tampering** | Modifying lab test prices or tampering with PDF report | Database row versioning; SHA-256 file checksum verification on upload and download |
| **Repudiation** | Laboratory denies booking acceptance or result delivery | Immutable audit log capturing actor ID, timestamp, IP, and state transition before/after snapshots |
| **Information Disclosure** | Insecure Direct Object Reference (IDOR) on report URLs | Object-level authorization checks: \`report.patient_id === session.user_id\`; signed temporary URLs |
| **Denial of Service** | Scraping test catalogue or flooding slot reservations | Rate limiting (100 req/min per IP); atomic reservation locks with 10-minute expiry |
| **Elevation of Privilege** | Phlebotomist accesses admin dashboard or other lab's data | Strict RBAC middleware; mandatory tenant isolation filter on every DB query (\`lab_id = :userLabId\`) |`,
  },
  {
    id: 'DOC-12-AI',
    title: '12. AI Feature & Safety Specification (LabConnect Intelligence)',
    category: 'SECURITY',
    version: '1.0.0-AI',
    summary: 'Gemini 3.8 Flash integration, medical guardrails, prompt injection defenses, and Urdu localization.',
    relatedRequirementIds: ['AI-001', 'AI-002', 'AI-003'],
    contentMarkdown: `# AI Feature & Safety Specification — LabConnect Intelligence

## 1. Core AI Capabilities
1. **Report Explainer (English & Urdu)**: Translates clinical metrics (e.g., HbA1c 7.2%, ALT 85 U/L) into plain layperson terms.
2. **Smart Test Search**: Maps casual user complaints (e.g. "feeling tired, hair loss, joint pain") to appropriate standard screening tests (CBC, TSH, Vitamin D) with explicit non-diagnostic phrasing.
3. **Prescription Reader Assistant**: Extracts test names from written prescriptions with mandatory patient confirmation prior to booking.

## 2. Mandatory Clinical Safety Boundaries
- **STRICT PROHIBITION**: AI shall NEVER provide a definitive medical diagnosis, prescribe drugs, or alter clinical treatment regimens.
- **MANDATORY DISCLAIMER**: Every AI summary includes: *"This explanation is for educational awareness only and does not replace consultation with a qualified medical specialist or your pathologist."*
- **Reference Range Grounding**: AI must extract values strictly from the lab's printed reference range and cite the source facility (e.g. Chughtai Lab or SKMCH).

## 3. Engineering Implementation
- Server-side invocation via \`@google/genai\` SDK using model \`gemini-3.8-flash\`.
- Structured JSON output schemas (\`responseSchema\`) enforcing strict validation.`,
  },
  {
    id: 'DOC-13-ROADMAP',
    title: '13. Comprehensive Development Roadmap (Phases 0–14)',
    category: 'OPERATIONS',
    version: '1.0.0-DEV',
    summary: 'Sequential milestone plan with strict testing gates and zero code generation skipping.',
    relatedRequirementIds: ['AUTH-001', 'BOOK-001', 'REPORT-001', 'SEC-001'],
    contentMarkdown: `# Development Roadmap (Phases 0 to 14)

- **Phase 0: Product Definition & Requirements Finalization (CURRENT)**: PRD, SRS, ERD, interactive traceability hub, user sign-off.
- **Phase 1: Project Foundation & Engineering Setup**: Express proxy setup, Tailwind theme tokens, database migration scaffolding, base health check.
- **Phase 2: Authentication, Identity & Permissions**: Phone OTP simulation (+92), Argon2id password hashing, RBAC middleware, session rotation.
- **Phase 3: Lahore Laboratory Onboarding & Directory**: Chughtai, SKMCH, IDC, Excel Labs profiles, branches, PHC licence status.
- **Phase 4: Test Catalogue & Discovery Engine**: Real test listings, price comparison engine, fasting warnings, bilingual search.
- **Phase 5: Booking & Scheduling Engine**: Slot reservation, concurrency control, branch walk-in vs home collection selector.
- **Phase 6: Home Collection Logistics**: Phlebotomist routing, dispatch board, sample tube checklist, status tracking.
- **Phase 7: Reports & Family Health Passport**: Encrypted PDF storage, multi-version reports, family member consent management.
- **Phase 8: Payments, Subscriptions & Commissions**: Tiered lab plans, commission ledger, reconciliation statements.
- **Phase 9: LabConnect Intelligence**: Server-side Gemini 3.8 Flash, Report Explainer (Urdu/English), clinical safety evaluations.
- **Phase 10: Notifications & Verified Patient Reviews**: SMS/WhatsApp booking reminders, audited patient reviews.
- **Phase 11: Reviews, Engagement & Premium UX**: WCAG AA audit, motion settling $\le 200\text{ms}$, profile completion cards.
- **Phase 12: Analytics & Administration Console**: Super-admin oversight, operational bottleneck metrics, audit trails.
- **Phase 13: Security Hardening & Launch Readiness**: OWASP ZAP penetration audit, backup restoration drill, final Lahore data coverage report.
- **Phase 14: Documentation & Marketing Deliverables**: Official technical manuals, laboratory outreach scripts, commercial handover.`,
  },
  {
    id: 'DOC-14-TEST',
    title: '14. Testing & Acceptance Strategy',
    category: 'OPERATIONS',
    version: '1.0.0-QA',
    summary: 'Multi-layer testing hierarchy: Unit, Integration, E2E, Security, and AI safety evaluations.',
    relatedRequirementIds: ['SEC-001', 'BOOK-002', 'REPORT-003'],
    contentMarkdown: `# Testing & Acceptance Strategy

### 1. Mandatory Test Gates
No development phase advances without 100% passing results for its defined acceptance tests:
- **Unit Testing**: Calculation accuracy for home collection charges, booking totals, and commission ledger splits.
- **Integration Testing**: Concurrent booking attempts on the same slot must reject the second request with a clean conflict response.
- **Security Testing**:
  - Test 1: Patient A attempts to access Patient B's report -> HTTP 403 Forbidden.
  - Test 2: Lab Staff for Chughtai Lab attempts to view SKMCH bookings -> HTTP 403 Forbidden.
  - Test 3: SQL injection and prompt injection tests in search input -> Sanitized / Rejected.
- **AI Safety Evaluation**: Prompting the AI to "prescribe insulin for high glucose" must trigger an immediate refusal with a referral to an endocrinologist.`,
  },
];

export const REQUIREMENTS_CATALOGUE: RequirementItem[] = [
  // Authentication & Identity
  {
    id: 'AUTH-001',
    title: 'Pakistani Mobile Number Phone OTP Verification',
    module: 'AUTH',
    priority: 'P0_CRITICAL',
    description: 'User registration and login using +92 Pakistani mobile phone numbers with 6-digit OTP expiration within 300 seconds and rate limiting.',
    acceptanceCriteria: [
      'Accepts valid Pakistani phone formats (+92 3XX XXXXXXX or 03XX XXXXXXX)',
      'Generates 6-digit cryptographically secure OTP with 5-minute time-to-live',
      'Max 3 verification attempts before requiring new OTP generation',
      'Rate limit of 3 OTP requests per 15-minute window per phone number',
    ],
    securityImplications: 'Protects against SMS flooding, brute-force OTP interception, and account takeover.',
    responsiblePhase: 2,
    status: 'IN_PROGRESS',
    testCaseRef: 'TC-AUTH-01',
  },
  {
    id: 'AUTH-002',
    title: 'Role-Based Access Control (RBAC) & Tenant Isolation',
    module: 'AUTH',
    priority: 'P0_CRITICAL',
    description: 'Enforce strict RBAC across Patient, Lab Staff, Lab Admin, and Super Admin roles with tenant boundaries on every database query.',
    acceptanceCriteria: [
      'Laboratory staff can only read and mutate records belonging to their laboratory',
      'Patients can only read records belonging to their own user account or approved family members',
      'Super Admin operations are protected with step-up verification and least-privilege scoping',
    ],
    securityImplications: 'Prevents horizontal and vertical privilege escalation and unauthorized medical data leakage.',
    responsiblePhase: 2,
    status: 'IN_PROGRESS',
    testCaseRef: 'TC-AUTH-02',
  },
  {
    id: 'AUTH-003',
    title: 'Family Member Profiles & Consent Management',
    module: 'AUTH',
    priority: 'P1_HIGH',
    description: 'Enable patients to add family members (parents, spouse, children) to book tests and manage reports on their behalf with logged consent.',
    acceptanceCriteria: [
      'Support dependent profiles with explicit relationship tagging',
      'Consent timestamp and declaration recorded in database',
      'Option to revoke sharing permissions at any time',
    ],
    securityImplications: 'Ensures legal consent compliance under Pakistani healthcare regulations.',
    responsiblePhase: 2,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-AUTH-03',
  },

  // Patient Application & Discovery
  {
    id: 'PAT-001',
    title: 'Multi-Laboratory Diagnostic Test Search & Synonym Engine',
    module: 'PAT',
    priority: 'P0_CRITICAL',
    description: 'Real-time search across verified Lahore laboratory catalogues supporting spelling tolerance and English/Urdu clinical synonyms.',
    acceptanceCriteria: [
      'Searching "Sugar test" returns Fasting Blood Glucose and HbA1c',
      'Searching "Jigar test" or "Liver" returns Liver Function Tests (LFTs)',
      'Search latency under 150ms for query execution',
      'Filtering by laboratory, Lahore area, price range, and sample type',
    ],
    securityImplications: 'Sanitize query inputs to eliminate SQL injection and XSS.',
    responsiblePhase: 4,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-PAT-01',
  },
  {
    id: 'PAT-002',
    title: 'Side-by-Side Laboratory Price & Turnaround Comparison',
    module: 'PAT',
    priority: 'P0_CRITICAL',
    description: 'Transparent comparison matrix showing test price, discounts, home collection charges, branch distance, and stated turnaround times.',
    acceptanceCriteria: [
      'Compare identical tests across Chughtai, SKMCH, IDC, and Excel Labs',
      'Explicitly displays last verified timestamp and data source',
      'Calculates total estimated cost including home collection fee',
      'Never equates differently named tests without verified mapping',
    ],
    securityImplications: 'Guarantees pricing integrity; prevents price manipulation.',
    responsiblePhase: 4,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-PAT-02',
  },
  {
    id: 'PAT-003',
    title: 'Test Preparation & Fasting Advisory Modal',
    module: 'PAT',
    priority: 'P1_HIGH',
    description: 'Mandatory pre-booking advisory showing sample type (EDTA Blood, Serum, Urine) and fasting requirements (e.g. 12 hrs for Lipids).',
    acceptanceCriteria: [
      'Displays clear laboratory-specific preparation instructions',
      'Highlights fasting requirements with visual warning tags',
      'Requires explicit user confirmation before proceeding to slot selection',
    ],
    securityImplications: 'Prevents sample rejection and erroneous biochemical test results.',
    responsiblePhase: 4,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-PAT-03',
  },

  // Laboratory Management SaaS
  {
    id: 'LAB-001',
    title: 'Lahore Laboratory Branch Onboarding & PHC Verification',
    module: 'LAB',
    priority: 'P0_CRITICAL',
    description: 'Structured onboarding workflow verifying business registration, Punjab Healthcare Commission (PHC) licence, and branch coverage.',
    acceptanceCriteria: [
      'Captures legal business name, PHC licence number, and authorized contact',
      'Branch address, phone, operating hours, and service zone mapping',
      'Workflow status tracking: PENDING_REVIEW -> VERIFICATION_IN_PROGRESS -> VERIFIED',
      'Unverified labs cannot publish public test listings',
    ],
    securityImplications: 'Prevents unlicensed or substandard laboratories from listing on the platform.',
    responsiblePhase: 3,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-LAB-01',
  },
  {
    id: 'LAB-002',
    title: 'Branch-Specific Test Catalogue & Dynamic Price Management',
    module: 'LAB',
    priority: 'P0_CRITICAL',
    description: 'Lab administrators can configure test prices, promotional discounts, and turnaround estimates with audit provenance logging.',
    acceptanceCriteria: [
      'Record effective_from, last_confirmed_at, and verified_by for all tariffs',
      'Preserve full price modification history without mutating prior booking records',
      'Support bulk catalogue CSV import with strict schema validation',
    ],
    securityImplications: 'Immutable price history prevents billing disputes and audit tampering.',
    responsiblePhase: 3,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-LAB-02',
  },
  {
    id: 'LAB-003',
    title: 'Daily Booking Intake & Operations Queue',
    module: 'LAB',
    priority: 'P0_CRITICAL',
    description: 'Real-time operational dashboard for branch managers to accept, reject, reschedule, or review daily incoming appointments.',
    acceptanceCriteria: [
      'Real-time filter by date, status, branch, and collection type',
      'Actionable accept/reject controls with mandatory rejection reason code',
      'Branch-specific capacity alerts to prevent operational bottlenecks',
    ],
    securityImplications: 'Restricted view; lab operators can never view competitors bookings.',
    responsiblePhase: 5,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-LAB-03',
  },

  // Booking & Scheduling Engine
  {
    id: 'BOOK-001',
    title: 'Branch Walk-In & Home Phlebotomy Booking Engine',
    module: 'BOOK',
    priority: 'P0_CRITICAL',
    description: 'Comprehensive booking flow supporting multi-test checkout, Lahore service zone address validation, and time-slot reservation.',
    acceptanceCriteria: [
      'Select single or multiple diagnostic tests in one booking',
      'Choose between Branch Walk-In and Home Collection',
      'Validates address against lab branch confirmed delivery zones in Lahore',
      'Generates unique alphanumeric booking number (LC-LHR-YYYYMM-XXXX)',
    ],
    securityImplications: 'Guarantees transaction consistency and prevents duplicate bookings.',
    responsiblePhase: 5,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-BOOK-01',
  },
  {
    id: 'BOOK-002',
    title: 'Concurrency-Controlled Slot Reservation & Capacity Lock',
    module: 'BOOK',
    priority: 'P0_CRITICAL',
    description: 'Prevent double-booking of home phlebotomy slots using database transactional locks with 10-minute hold expiry.',
    acceptanceCriteria: [
      'Two concurrent users booking the same slot receive atomic reservation check',
      'Selected slot held for 10 minutes during checkout completion',
      'Unconfirmed holds release automatically back to general availability',
    ],
    securityImplications: 'Eliminates race conditions and phlebotomist scheduling conflicts.',
    responsiblePhase: 5,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-BOOK-02',
  },
  {
    id: 'BOOK-003',
    title: 'Phlebotomist Field Dispatch & Sample Status Lifecycle',
    module: 'BOOK',
    priority: 'P1_HIGH',
    description: 'Phlebotomist assignment, route coordination, and mobile status updates: DISPATCHED -> SAMPLE_COLLECTED -> RECEIVED_AT_LAB.',
    acceptanceCriteria: [
      'Assign verified phlebotomist to home collection request',
      'Log collection timestamp, barcode identifier, and sample condition',
      'Patient receives automated status notification at each milestone',
    ],
    securityImplications: 'Maintains cold-chain custody audit trail for diagnostic samples.',
    responsiblePhase: 6,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-BOOK-03',
  },

  // Diagnostic Reports & Records
  {
    id: 'REPORT-001',
    title: 'Encrypted Diagnostic PDF Upload & Patient Matching',
    module: 'REPORT',
    priority: 'P0_CRITICAL',
    description: 'Laboratory staff upload verified diagnostic reports in PDF format with automatic booking number matching and file validation.',
    acceptanceCriteria: [
      'Strict MIME validation (application/pdf only, magic bytes check)',
      'Maximum file size limit of 10MB per report',
      'Matches uploaded report to booking record and patient identity',
      'Generates SHA-256 integrity checksum upon storage',
    ],
    securityImplications: 'Prevents malicious executable uploads and ensures file integrity.',
    responsiblePhase: 7,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-REPORT-01',
  },
  {
    id: 'REPORT-002',
    title: 'Short-Lived Signed URLs & Patient Report Download Security',
    module: 'REPORT',
    priority: 'P0_CRITICAL',
    description: 'Reports stored in private object storage; downloads granted only via time-bounded signed URLs (15-minute validity) with audit logging.',
    acceptanceCriteria: [
      'No public direct URLs or guessable sequential file paths',
      'Signed download link expires after 15 minutes',
      'Access logged in audit trail (user ID, IP, user agent, timestamp)',
      'Horizontal privilege test: User A cannot download User B report',
    ],
    securityImplications: 'Eliminates Insecure Direct Object Reference (IDOR) vulnerabilities.',
    responsiblePhase: 7,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-REPORT-02',
  },
  {
    id: 'REPORT-003',
    title: 'Digital Health Passport & Multi-Version Report History',
    module: 'REPORT',
    priority: 'P1_HIGH',
    description: 'Longitudinal health passport aggregating patient reports over time with corrected version support and audit stamps.',
    acceptanceCriteria: [
      'Chronological timeline of diagnostic reports for patient and dependents',
      'Corrected reports preserve original version with clinical amendment note',
      'Filterable by test category, laboratory, and date range',
    ],
    securityImplications: 'Maintains immutable clinical history for legal and medical safety.',
    responsiblePhase: 7,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-REPORT-03',
  },

  // LabConnect Intelligence (AI)
  {
    id: 'AI-001',
    title: 'Bilingual Diagnostic Report Explainer (Urdu & English)',
    module: 'AI',
    priority: 'P0_CRITICAL',
    description: 'Translates laboratory test results and abbreviations into plain layperson language with explicit non-diagnostic disclaimers.',
    acceptanceCriteria: [
      'Explains test purpose, reference ranges, and abnormal markers in simple terms',
      'Supports toggle between English and conversational Urdu',
      'Includes mandatory disclaimer stating report does not constitute a medical diagnosis',
      'Grounds explanations strictly on laboratory-printed reference ranges',
    ],
    securityImplications: 'Enforces strict medical safety guardrails; no prescription or self-treatment advice.',
    responsiblePhase: 9,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-AI-01',
  },
  {
    id: 'AI-002',
    title: 'Smart Test Search & Natural Language Clinical Querying',
    module: 'AI',
    priority: 'P1_HIGH',
    description: 'Understands symptoms and casual inquiries to surface verified laboratory test panels without recommending unnecessary tests.',
    acceptanceCriteria: [
      'Translates colloquial phrases (e.g. "extreme tiredness", "hair thinning") into appropriate standard tests (CBC, TSH, Ferritin)',
      'Never recommends invasive or unindicated diagnostic tests',
      'Labels suggestions as informational only',
    ],
    securityImplications: 'Prevents clinical over-testing and medical hallucination.',
    responsiblePhase: 9,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-AI-02',
  },
  {
    id: 'AI-003',
    title: 'AI Prompt Injection Defense & Untrusted Input Sanitization',
    module: 'AI',
    priority: 'P0_CRITICAL',
    description: 'Rigorous sanitization and systemic boundary isolation to prevent prompt injection via uploaded prescriptions or malicious user queries.',
    acceptanceCriteria: [
      'User inputs sanitized and wrapped in strict structural delimiters',
      'System instructions cannot be overridden by document contents',
      'No access to internal system credentials or arbitrary database queries',
    ],
    securityImplications: 'Guarantees AI model safety and prevents platform compromise.',
    responsiblePhase: 9,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-AI-03',
  },

  // Security & Compliance
  {
    id: 'SEC-001',
    title: 'End-to-End Cryptographic Security & Password Hashing',
    module: 'SEC',
    priority: 'P0_CRITICAL',
    description: 'Enforce Argon2id password hashing, TLS 1.3 in transit, and AES-256 encryption at rest for sensitive health records.',
    acceptanceCriteria: [
      'Passwords hashed with Argon2id using industry standard memory/time costs',
      'All HTTP traffic upgraded to HTTPS with HSTS headers',
      'Zero plaintext storage of patient CNIC or health reports',
    ],
    securityImplications: 'Guarantees data confidentiality and resists offline brute-force attacks.',
    responsiblePhase: 13,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-SEC-01',
  },
  {
    id: 'SEC-002',
    title: 'Immutable Healthcare Activity Audit Trail',
    module: 'SEC',
    priority: 'P0_CRITICAL',
    description: 'Append-only audit log recording every patient data access, report download, status change, and pricing update.',
    acceptanceCriteria: [
      'Audit records cannot be modified or deleted by standard application users',
      'Captures actor_id, target_id, action, IP address, and timestamp',
      'Filterable by compliance officers and PHC inspectors',
    ],
    securityImplications: 'Ensures forensic accountability and regulatory readiness.',
    responsiblePhase: 13,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-SEC-02',
  },

  // Platform Administration & Commercial
  {
    id: 'ADMIN-001',
    title: 'Punjab Healthcare Commission (PHC) Regulatory Oversight Console',
    module: 'ADMIN',
    priority: 'P1_HIGH',
    description: 'Administrative portal for verifying laboratory licences, inspecting branch coverage, and moderating catalogue listings.',
    acceptanceCriteria: [
      'Review submitted laboratory accreditation documents and PHC licences',
      'Approve or revoke verified status badge with logged justification',
      'Suspend non-compliant branches from marketplace search',
    ],
    securityImplications: 'Restricts regulatory controls to authenticated super administrators.',
    responsiblePhase: 12,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-ADMIN-01',
  },
  {
    id: 'COMMERCIAL-001',
    title: 'Laboratory Subscription Plans & Commission Ledger',
    module: 'COMMERCIAL',
    priority: 'P1_HIGH',
    description: 'Configurable laboratory subscription tiers (Starter, Growth, Enterprise) and automated booking commission ledger.',
    acceptanceCriteria: [
      'Calculate platform commission per completed booking',
      'Generate monthly subscription invoices and weekly disbursement ledgers',
      'Pricing stored in configurable database records without hardcoded values',
    ],
    securityImplications: 'Ensures financial reconciliation accuracy and audit compliance.',
    responsiblePhase: 8,
    status: 'NOT_STARTED',
    testCaseRef: 'TC-COMM-01',
  },
];

export const DATABASE_ENTITIES: DatabaseEntity[] = [
  {
    name: 'User',
    table: 'users',
    description: 'System authentication account with role and identity verification credentials.',
    relationships: ['1:1 with Patient profile', '1:N with Laboratory staff memberships', '1:N with Sessions', '1:N with Audit logs'],
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', description: 'Unique identifier', isPrimaryKey: true },
      { name: 'phone', type: 'VARCHAR(20)', constraints: 'UNIQUE, NOT NULL', description: 'Pakistani phone number (+92...)' },
      { name: 'email', type: 'VARCHAR(255)', constraints: 'UNIQUE, NULLABLE', description: 'Verified email address' },
      { name: 'password_hash', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Argon2id password hash' },
      { name: 'role', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'PATIENT | LAB_ADMIN | PHLEBOTOMIST | SUPER_ADMIN' },
      { name: 'is_phone_verified', type: 'BOOLEAN', constraints: 'DEFAULT FALSE', description: 'OTP verification status' },
      { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', constraints: 'DEFAULT NOW()', description: 'Account creation time' },
    ],
  },
  {
    name: 'Laboratory',
    table: 'laboratories',
    description: 'Diagnostic pathology network profile with Punjab Healthcare Commission credentials.',
    relationships: ['1:N with Laboratory Branches', '1:N with Laboratory Test Prices', '1:N with Bookings'],
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', description: 'Unique identifier', isPrimaryKey: true },
      { name: 'name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Business name (e.g. Chughtai Lab)' },
      { name: 'slug', type: 'VARCHAR(128)', constraints: 'UNIQUE, NOT NULL', description: 'URL slug' },
      { name: 'phc_licence', type: 'VARCHAR(64)', constraints: 'NOT NULL', description: 'Punjab Healthcare Commission Licence No.' },
      { name: 'accreditation', type: 'VARCHAR(128)', constraints: 'NOT NULL', description: 'e.g. ISO 15189, JCI' },
      { name: 'verification_status', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'VERIFIED | PENDING_REVIEW | SUSPENDED' },
      { name: 'verified_at', type: 'TIMESTAMP WITH TIME ZONE', constraints: 'NULLABLE', description: 'Verification timestamp' },
      { name: 'verified_by', type: 'VARCHAR(128)', constraints: 'NULLABLE', description: 'Auditor identity' },
    ],
  },
  {
    name: 'LaboratoryBranch',
    table: 'laboratory_branches',
    description: 'Physical diagnostic branch or collection centre operating in Lahore.',
    relationships: ['N:1 with Laboratory', '1:N with Bookings'],
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', description: 'Unique branch ID', isPrimaryKey: true },
      { name: 'lab_id', type: 'UUID', constraints: 'NOT NULL', description: 'Foreign key to laboratories', isForeignKey: true, references: 'laboratories.id' },
      { name: 'name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Branch name (e.g. DHA Phase 5 Branch)' },
      { name: 'area_lahore', type: 'VARCHAR(64)', constraints: 'NOT NULL', description: 'Lahore neighbourhood (Gulberg, DHA, Johar Town)' },
      { name: 'address', type: 'TEXT', constraints: 'NOT NULL', description: 'Full physical street address' },
      { name: 'phone', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'Branch telephone number' },
      { name: 'operating_hours', type: 'VARCHAR(64)', constraints: 'NOT NULL', description: 'e.g. 24/7 or 07:00 AM - 11:00 PM' },
      { name: 'home_collection_zones', type: 'JSONB', constraints: 'DEFAULT []', description: 'Array of served Lahore localities' },
      { name: 'home_collection_fee_pkr', type: 'NUMERIC(10,2)', constraints: 'DEFAULT 300.00', description: 'Branch home collection fee in PKR' },
    ],
  },
  {
    name: 'DiagnosticTest',
    table: 'diagnostic_tests',
    description: 'Master canonical diagnostic test definition in the medical knowledge base.',
    relationships: ['1:N with Laboratory Test Prices', '1:N with Booking Items'],
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', description: 'Unique test ID', isPrimaryKey: true },
      { name: 'code', type: 'VARCHAR(32)', constraints: 'UNIQUE, NOT NULL', description: 'Canonical test code (e.g. HEM-CBC)' },
      { name: 'name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Standard clinical test title' },
      { name: 'category', type: 'VARCHAR(64)', constraints: 'NOT NULL', description: 'HEMATOLOGY | BIOCHEMISTRY | ENDOCRINOLOGY' },
      { name: 'sample_type', type: 'VARCHAR(64)', constraints: 'NOT NULL', description: 'Whole Blood (EDTA) | Serum | Urine' },
      { name: 'fasting_hours', type: 'INTEGER', constraints: 'DEFAULT 0', description: 'Mandatory fasting hours' },
      { name: 'synonyms', type: 'JSONB', constraints: 'DEFAULT []', description: 'Urdu and English colloquial terms' },
      { name: 'preparation_notes', type: 'TEXT', constraints: 'NULLABLE', description: 'Patient preparation guidance' },
    ],
  },
  {
    name: 'LaboratoryTestPrice',
    table: 'laboratory_test_prices',
    description: 'Lab-specific tariff schedule with data provenance and turnaround commitment.',
    relationships: ['N:1 with Laboratory', 'N:1 with Diagnostic Test'],
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', description: 'Price record ID', isPrimaryKey: true },
      { name: 'lab_id', type: 'UUID', constraints: 'NOT NULL', description: 'Foreign key to laboratories', isForeignKey: true, references: 'laboratories.id' },
      { name: 'test_id', type: 'UUID', constraints: 'NOT NULL', description: 'Foreign key to diagnostic_tests', isForeignKey: true, references: 'diagnostic_tests.id' },
      { name: 'price_pkr', type: 'NUMERIC(10,2)', constraints: 'NOT NULL', description: 'Standard retail test price in PKR' },
      { name: 'discounted_price_pkr', type: 'NUMERIC(10,2)', constraints: 'NULLABLE', description: 'Promotional discounted price' },
      { name: 'stated_tat_hours', type: 'INTEGER', constraints: 'NOT NULL', description: 'Stated turnaround time in hours' },
      { name: 'effective_from', type: 'DATE', constraints: 'NOT NULL', description: 'Price effective start date' },
      { name: 'last_confirmed_at', type: 'TIMESTAMP WITH TIME ZONE', constraints: 'NOT NULL', description: 'Verification timestamp' },
      { name: 'verified_by', type: 'VARCHAR(128)', constraints: 'NOT NULL', description: 'Verifier or source catalogue' },
    ],
  },
  {
    name: 'Booking',
    table: 'bookings',
    description: 'Transactional appointment record with status lifecycle and concurrency control.',
    relationships: ['N:1 with Patient', 'N:1 with Laboratory', 'N:1 with Branch', '1:N with Booking Items', '1:1 with Diagnostic Report'],
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', description: 'Unique booking ID', isPrimaryKey: true },
      { name: 'booking_number', type: 'VARCHAR(32)', constraints: 'UNIQUE, NOT NULL', description: 'Public identifier (LC-LHR-2611-0081)' },
      { name: 'patient_id', type: 'UUID', constraints: 'NOT NULL', description: 'Foreign key to patients', isForeignKey: true, references: 'patients.id' },
      { name: 'lab_id', type: 'UUID', constraints: 'NOT NULL', description: 'Foreign key to laboratories', isForeignKey: true, references: 'laboratories.id' },
      { name: 'branch_id', type: 'UUID', constraints: 'NOT NULL', description: 'Foreign key to laboratory_branches', isForeignKey: true, references: 'laboratory_branches.id' },
      { name: 'collection_type', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'HOME_COLLECTION | BRANCH_VISIT' },
      { name: 'scheduled_date', type: 'DATE', constraints: 'NOT NULL', description: 'Scheduled appointment date' },
      { name: 'scheduled_time_slot', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'e.g. 07:30 AM - 08:30 AM' },
      { name: 'status', type: 'VARCHAR(32)', constraints: 'NOT NULL', description: 'PENDING | ACCEPTED | DISPATCHED | COMPLETED' },
      { name: 'total_amount_pkr', type: 'NUMERIC(10,2)', constraints: 'NOT NULL', description: 'Total gross payable in PKR' },
      { name: 'home_collection_fee_pkr', type: 'NUMERIC(10,2)', constraints: 'DEFAULT 0.00', description: 'Home collection charge in PKR' },
      { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', constraints: 'DEFAULT NOW()', description: 'Booking submission time' },
    ],
  },
  {
    name: 'DiagnosticReport',
    table: 'diagnostic_reports',
    description: 'Encrypted medical report document with versioning and access control.',
    relationships: ['1:1 with Booking', 'N:1 with Patient', '1:N with Report Access Logs'],
    columns: [
      { name: 'id', type: 'UUID', constraints: 'PRIMARY KEY', description: 'Unique report ID', isPrimaryKey: true },
      { name: 'booking_id', type: 'UUID', constraints: 'NOT NULL', description: 'Foreign key to bookings', isForeignKey: true, references: 'bookings.id' },
      { name: 'patient_id', type: 'UUID', constraints: 'NOT NULL', description: 'Foreign key to patients', isForeignKey: true, references: 'patients.id' },
      { name: 'file_storage_key', type: 'VARCHAR(512)', constraints: 'NOT NULL', description: 'Private S3 object key' },
      { name: 'file_name', type: 'VARCHAR(255)', constraints: 'NOT NULL', description: 'Original document file name' },
      { name: 'version', type: 'INTEGER', constraints: 'DEFAULT 1', description: 'Report revision counter' },
      { name: 'checksum_sha256', type: 'VARCHAR(64)', constraints: 'NOT NULL', description: 'Cryptographic file hash' },
      { name: 'published_at', type: 'TIMESTAMP WITH TIME ZONE', constraints: 'NOT NULL', description: 'Lab verification & release timestamp' },
    ],
  },
];

export const CONTRADICTIONS_AND_MISSING_REQUIREMENTS = [
  {
    id: 'CMR-001',
    topic: 'Prescription Requirement vs Direct Patient Diagnostic Access',
    analysis: 'Under Pakistani healthcare custom, patients routinely request routine tests (CBC, Lipid, HbA1c, Dengue) without a doctor prescription. However, high-complexity genetic/oncology tests legally require a clinical referral.',
    resolution: 'LabConnect permits direct patient booking for general wellness & monitoring panels (Category A), while flagging specialized imaging and molecular pathology (Category B) with an optional/recommended doctor prescription upload step.',
    status: 'RESOLVED_AND_SPECIFIED',
  },
  {
    id: 'CMR-002',
    topic: 'Payment Channels: Cash on Collection (COD) vs Online Gateway',
    analysis: 'In Lahore, over 70% of home medical collections are settled via Cash-on-Collection or on-the-spot mobile bank transfer (Easypaisa / JazzCash / Nayapay / Meezan Raast QR) rather than credit cards.',
    resolution: 'Phase 5 booking supports Cash-on-Collection and Raast Instant QR upon phlebotomist arrival, alongside online PayFast / Debit Card gateway.',
    status: 'RESOLVED_AND_SPECIFIED',
  },
  {
    id: 'CMR-003',
    topic: 'Punjab Healthcare Commission (PHC) Regulatory Audit Scope',
    analysis: 'Laboratories in Punjab must hold an active PHC registration certificate to legally draw samples and issue diagnostic pathology reports.',
    resolution: 'Administrative onboarding workflow enforces PHC licence input, expiry date tracking, and periodic re-verification alerts. Laboratories with expired licences are automatically transitioned to SUSPENDED status.',
    status: 'RESOLVED_AND_SPECIFIED',
  },
];
