# LabConnect Firestore Security Specification (Phase 0 TDD)

## Data Invariants
1. **Default Deny**: Unmatched Firestore paths are denied (`allow read, write: if false`).
2. **PII Isolation (`users/{userId}`)**: Patient/staff emails, phones, family lists, and street addresses are never readable by other users (`isOwner(userId) || isAdmin()`).
3. **Anti-Privilege-Escalation**: Users creating/updating their own profile cannot set `SUPER_ADMIN` or `PHC_INSPECTOR` roles, nor change `uid` or `createdAt`.
4. **Booking Ownership & State Locks**:
   - Bookings require authenticated creation where `incoming().patientUserId == request.auth.uid`, `status == 'PENDING'`, and `createdAt == request.time`.
   - Terminal states (`COMPLETED`, `CANCELLED`) lock patient/courier status mutations (only `isAdmin()` can override).
   - List queries on `bookings`, `reports`, and `notifications` enforce resource-field checks directly (`resource.data.patientUserId == request.auth.uid || resource.data.phlebotomistUid == request.auth.uid`) with zero `get()` calls inside `allow list`.
5. **Verified Identity for Writes**: Standard writes require `request.auth != null` and email-verified Google/OAuth tokens (`request.auth.token.email_verified == true`) or verified Phone OTP tokens (`request.auth.token.phone_number != null`).
6. **Public Catalog Integrity**: `laboratories`, `tests`, and `pricings` allow public reads for marketplace tariff comparison and restrict mutations strictly to verified `isAdmin()` or laboratory branch leads (`isLabStaffForLab(labId)`).

## The "Dirty Dozen" Attack Payloads (Expected: `PERMISSION_DENIED`)
1. Unauthenticated read on `/users/usr-pat-01`.
2. Authenticated Patient A reading `/users/patient-b-uid`.
3. Self-escalation create on `/users/{uid}` attempting `role: "SUPER_ADMIN"`.
4. Shadow field injection on `/users/{uid}` adding `{ isVerified: true, adminBypass: true }`.
5. Poisoned oversized ID (`'a'.repeat(200)`) on `/bookings/{bookingId}`.
6. Spoofed `patientUserId` on `/bookings` create (`patientUserId: "victim-uid"`).
7. Skipping booking states on create (`status: "COMPLETED"` instead of `"PENDING"`).
8. Tampering with immutable `createdAt` or `totalPkr` on patient booking reschedule/cancel.
9. Blanket `list` query on `/bookings` without `where('patientUserId', '==', uid)`.
10. Patient updating `status: "COMPLETED"` or injecting `reportChecksum` on their own booking.
11. Unverified email account (`email_verified: false`) attempting booking or review creation.
12. Patient attempting to delete or modify `/laboratories/lab-chughtai`.
