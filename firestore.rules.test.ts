/**
 * LabConnect Security Rules Test Suite Specification (Phase 0 TDD)
 * Validates the Dirty Dozen security boundaries defined in security_spec.md
 * against firestore.rules using @firebase/rules-unit-testing when emulator is present.
 */
export interface RuleTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'ALLOW' | 'DENY';
}

export const DIRTY_DOZEN_TESTS: RuleTestCase[] = [
  { id: 1, name: 'Unauthenticated read on /users/usr-pat-01', collection: 'users/usr-pat-01', operation: 'get', expected: 'DENY' },
  { id: 2, name: 'Patient A reading /users/patient-b-uid', collection: 'users/patient-b-uid', operation: 'get', expected: 'DENY' },
  { id: 3, name: 'Self-escalation create on /users/{uid} attempting SUPER_ADMIN', collection: 'users/attacker', operation: 'create', expected: 'DENY' },
  { id: 4, name: 'Shadow field injection on /users/{uid} adding isVerified/adminBypass', collection: 'users/attacker', operation: 'create', expected: 'DENY' },
  { id: 5, name: 'Poisoned oversized ID (>128 chars) on /bookings', collection: 'bookings/' + 'a'.repeat(200), operation: 'create', expected: 'DENY' },
  { id: 6, name: 'Spoofed patientUserId on /bookings create', collection: 'bookings/bk-spoof', operation: 'create', expected: 'DENY' },
  { id: 7, name: 'Skipping booking state on create (COMPLETED instead of PENDING)', collection: 'bookings/bk-skip', operation: 'create', expected: 'DENY' },
  { id: 8, name: 'Tampering with immutable createdAt or totalPkr on booking update', collection: 'bookings/bk-1', operation: 'update', expected: 'DENY' },
  { id: 9, name: 'Blanket list query on /bookings without uid filter', collection: 'bookings', operation: 'list', expected: 'DENY' },
  { id: 10, name: 'Patient setting status=COMPLETED or reportChecksum on own booking', collection: 'bookings/bk-1', operation: 'update', expected: 'DENY' },
  { id: 11, name: 'Unverified email account creating booking or review', collection: 'bookings/bk-unverified', operation: 'create', expected: 'DENY' },
  { id: 12, name: 'Patient attempting to delete or modify /laboratories/lab-chughtai', collection: 'laboratories/lab-chughtai', operation: 'delete', expected: 'DENY' },
];
