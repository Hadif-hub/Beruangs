# Firestore Security Specification

This document details the data invariants, test payloads, and validation suites for securing our Firestore database according to a zero-trust architecture.

## 1. Data Invariants

1. **Owner Isolation (Zero-Trust)**:
   - Every document in the `activity_logs` collection belongs to a specific user (identified by `userId`).
   - A user can only access (get, list, create, delete) documents where the authenticated user's ID (`request.auth.uid`) matches the document's `userId` field. No cross-tenant reads or writes are allowed.

2. **Immutable Identity**:
   - The user cannot override or spoof the `userId` field during creation or update. It must strictly match the authenticated user's UID.

3. **Strict Schema Constraints**:
   - All written logs must contain exactly the required fields: `userId`, `action`, `timestamp`, `details`, and `origin`.
   - String sizes must be bounded to prevent Denial of Wallet storage exhaustion.

---

## 2. The "Dirty Dozen" Payloads (Vulnerability Test Cases)

Below are twelve malicious payloads designed to bypass or break the system rules. All must return `PERMISSION_DENIED`.

### Case 1: Identity Spoofing on Create
Attempting to write a log for a different user's ID.
```json
{
  "userId": "victim_user_123",
  "action": "Malicious Trigger",
  "timestamp": "2026-05-30T06:29:40Z",
  "details": "Attacker trying to write logs to someone else's stream",
  "origin": "External IP"
}
```

### Case 2: Missing Required Fields
Leaving out the `userId` or other keys to create orphaned or corrupt records.
```json
{
  "action": "Malicious Trigger",
  "timestamp": "2026-05-30T06:29:40Z",
  "origin": "External IP"
}
```

### Case 3: Shadow Keys Injection (Ghost Field)
Inserting unauthorized fields to test for strict schema filtering.
```json
{
  "userId": "attacker_user_456",
  "action": "Valid Action",
  "timestamp": "2026-05-30T06:29:40Z",
  "details": "Checking if schema rejects shadow variables",
  "origin": "External IP",
  "isAdmin": true
}
```

### Case 4: Extreme String Sizes (Resource Exhaustion)
Passing a massively oversized action string to drain resource storage limits.
```json
{
  "userId": "attacker_user_456",
  "action": "A".repeat(100000),
  "timestamp": "2026-05-30T06:29:40Z",
  "details": "Oversized action title",
  "origin": "External IP"
}
```

### Case 5: Unauthenticated Write Attempt
Writing to the database with `request.auth == null`.
```json
{
  "userId": "attacker_user_456",
  "action": "Anonymous Log",
  "timestamp": "2026-05-30T06:29:40Z",
  "details": "Attempting unauthenticated post",
  "origin": "External IP"
}
```

### Case 6: Cross-User List Query Attempt
Attempting to list logs from another user's collection or execute a blanket list query.
- **Action**: Querying `activity_logs` where `userId != request.auth.uid`.

### Case 7: Path ID Poisoning
Using a corrupt or malicious key size for the document ID.
- **Action**: Writing with document ID `../invalid_path/junk` or an ID of size 10,000 characters.

### Case 8: Attempting to Update Immutable Event
Updating an existing log after it was already captured.
- **Action**: Write operation to change `action` or `details` of an existing log.

### Case 9: Timestamp Spoofing
Writing a timestamp with an extremely old or futuristic string instead of valid time boundaries.
```json
{
  "userId": "attacker_user_456",
  "action": "Backdated Action",
  "timestamp": "1999-01-01T00:00:00Z",
  "details": "Backdated test",
  "origin": "External IP"
}
```

### Case 10: Unauthorized Delete of Foreign Logs
Attempting to delete another user's log record.
- **Action**: Delete on `activity_logs/{foreignLogId}` with a different UID.

### Case 11: Invalid Value Type Injection
Sending non-string values for the required text parameters.
```json
{
  "userId": "attacker_user_456",
  "action": 12345,
  "timestamp": "2026-05-30T06:29:40Z",
  "details": true,
  "origin": []
}
```

### Case 12: Admin Privileges Spoofing
Attempting to write an admin privilege flag to self-elevate profile rights.
```json
{
  "userId": "attacker_user_456",
  "action": "Check Status",
  "timestamp": "2026-05-30T06:29:40Z",
  "details": "Forcing admin flag updates",
  "origin": "External IP",
  "role": "admin"
}
```

---

## 3. Test Runner Specification

```typescript
// firestore.rules.test.ts (Interface Outline)
describe("StratoSync Security Rules Validation", () => {
  it("allows a user to read their own activity logs", async () => {
    // Expect success when requesting logs where userId == current.auth.uid
  });

  it("strictly denies reading another user's activity logs", async () => {
    // Expect permission denied for cross-tenant query
  });

  it("strictly denies unauthenticated requests", async () => {
    // Expect permission denied for null auth
  });

  it("rejects writes with incorrect fields or size exhaustion", async () => {
    // Expect permission denied to any of the dirty dozen payloads
  });
});
```
