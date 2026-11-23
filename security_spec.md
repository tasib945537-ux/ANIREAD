# ANIREAD Firestore Security Specification

## 1. Data Invariants
1. **Identity & Ownership**: Every user profile (`/users/{userId}`), private PII record (`/users/{userId}/private/{docId}`), My Dub List entry (`/users/{userId}/dubList/{entryId}`), favorite (`/users/{userId}/favorites/{favId}`), and reading progress record (`/users/{userId}/readingProgress/{mangaId}`) must belong strictly to `request.auth.uid` with `request.auth.token.email_verified == true`.
2. **PII Isolation**: User email addresses are stored exclusively inside `/users/{userId}/private/info` and are readable/writable only by the owning verified user or verified admin. `/users/{userId}` stores only public non-PII fields (`uid`, `displayName`, `photoURL`, `role`).
3. **Anti-Privilege-Escalation**: Users cannot assign themselves an `admin` role on `/users/{userId}` (`role == 'user'`), nor write to `/admins/{uid}` or `/hindiDubOverrides/{overrideId}`. Admin overrides require a verified admin (`isAdmin()`).
4. **Master Gate & Global Consistency**: Every subcollection write verifies parent `/users/{userId}` document existence and ownership via `exists()` / `get()`.
5. **Strict Timestamps & Immortal Fields**: `createdAt` and `updatedAt` must equal `request.time`; `createdAt` and `userId`/`uid` are immutable on update.
6. **Bounded Strings & Arrays**: All strings have explicit `.size()` caps and all arrays (`dubLanguages`, `verifiedPlatforms`, `platforms`) have `.size() <= 10`.
7. **Secure List Queries**: No blanket `allow list: if isSignedIn();`. List queries strictly verify `resource.data.userId == request.auth.uid` without `get()`/`exists()` inside `allow list`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Shadow Field Injection on DubList**: Creating `/users/u1/dubList/1` with `{ ..., isAdmin: true }` -> rejected by `hasOnly(...)`.
2. **Self-Assigned Admin Role**: Creating `/users/u1` with `{ uid: "u1", role: "admin", ... }` -> rejected by `data.role == 'user'`.
3. **Cross-User Spoofed userId**: Creating `/users/u1/dubList/2` while signed in as `u2` -> rejected by `isOwner(userId)` + `data.userId == request.auth.uid`.
4. **Unverified Email Spoof**: Attempting write as admin email `gamerbangla436@gmail.com` with `email_verified: false` -> rejected by `request.auth.token.email_verified == true`.
5. **1MB String Exhaustion Attack**: Setting `title` to 5,000 characters or `entryId` to 500 junk chars -> rejected by `isValidId()` and `.size() <= 240`.
6. **Array Explosion Attack**: Setting `dubLanguages` to 50 elements -> rejected by `data.dubLanguages.size() <= 10`.
7. **Client Clock Manipulation**: Creating `/users/u1/dubList/3` with `createdAt: "2020-01-01T00:00:00Z"` -> rejected by `incoming().createdAt == request.time`.
8. **Immortal Timestamp Mutation**: Updating `/users/u1/dubList/3` while changing `createdAt` or `userId` -> rejected by immutability invariants.
9. **Terminal Status Tampering**: Updating a `completed` dub entry back to `watching` by sending forbidden fields like `id` or `animeId` -> rejected by `affectedKeys().hasOnly(...)`.
10. **PII Blanket Read Attempt**: Authenticated user `u2` reading `/users/u1/private/info` -> rejected by `isOwner(userId) || isAdmin()`.
11. **Unauthorized Admin Override Write**: Non-admin user `u2` writing `/hindiDubOverrides/52991` -> rejected by `isAdmin()`.
12. **Blanket List Query Scraping**: Authenticated user `u2` attempting `list` on `/users/u1/dubList` -> rejected by `resource.data.userId == request.auth.uid`.
