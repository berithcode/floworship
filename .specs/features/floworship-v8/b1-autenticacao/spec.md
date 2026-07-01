# Autenticação, Sessão e RBAC Specification

## Problem Statement

Floworship requires a secure authentication system with invite-only registration, short-lived JWT access tokens with silent refresh, multi-session support (web + mobile simultaneously), and a role-based access control (RBAC) model where roles are scoped per-ministry (not global). The system must integrate with WebSocket handshakes to protect live session data. Without this foundation, no other block can securely identify users, enforce permissions, or maintain session integrity across devices.

## Goals

- [ ] Email/password + Google OAuth login shared between Web and Mobile
- [ ] Invite-only registration: first leader creates ministry freely; others join via invite linking `ministry_member` with role
- [ ] JWT access token (~15min, in-memory only); refresh token (httpOnly, Secure, SameSite=Strict, ~30 days, never in localStorage/IndexedDB)
- [ ] Silent token refresh via `/auth/refresh` before access token expiry
- [ ] Multiple simultaneous sessions per user (mobile + web) without invalidating existing sessions
- [ ] "Connected Devices" screen in Profile listing active sessions with individual revocation
- [ ] RBAC: `admin`, `operator`, `musician` roles via `ministry_member` (user_id, ministry_id, role); per-ministry roles; permission matrix enforced (403 on unauthorized access)
- [ ] Ministry selector in UI only when user has multiple `ministry_member` links
- [ ] Security: bcrypt/argon2id password hash; rate limiting (5/limited login (5 attempts/15min per IP+email); single-use password reset token (~30min); restricted CORS; HTTPS enforced
- [ ] WebSocket handshake validates token and confirms user ministry/session link before admitting to room

## Out of Scope

| Feature | Reason |
|---|---|
| Two-factor authentication (2FA) | Not in source spec §7 |
| Social login beyond Google (Apple, GitHub) | Only Google OAuth specified |
| Passwordless / magic link login | Not specified |
| Session auto-extension on activity | Access token has fixed ~15min lifetime; refresh handles续期 |
| Admin impersonation / "login as" | Not specified |
| Device fingerprinting / trust scores | Not in source spec |

---

## Assumptions & Open Questions

| Assumption / decision | Chosen default | Rationale | Confirmed? |
|---|---|---|---|
| Password hashing algorithm | argon2id (via `@node-rs/argon2` or native `crypto`) | More future-proof than bcrypt; available in Node 20+ without native addons. Falls back to bcrypt if needed. | n |
| JWT signing algorithm | RS256 (asymmetric) | Allows rotating public keys without invalidating all tokens; JWKS endpoint for WebSocket validation. | n |
| Access token lifetime | 15 minutes exactly | Matches REQ-AUTH-03 "~15min". Short enough to limit damage from theft; long enough to avoid constant refresh noise. | n |
| Refresh token lifetime | 30 days exactly | Matches REQ-AUTH-03 "~30 dias". Standard for mobile apps; long enough for "remember me" feel. | n |
| Refresh token rotation | Yes — rotate on every use, invalidate old | Industry best practice; detects stolen refresh tokens (reuse detection). | n |
| Refresh token reuse detection window | 5 seconds grace period | Allows for legitimate double-submit (network retry) without false positives. | n |
| Rate limiting storage | In-memory with Redis fallback (Fastify `rate-limit` plugin) | Simple for dev; production needs Redis for multi-instance. | n |
| Rate limit key | Composite: `${ip}:${email}` | Per REQ-AUTH-09 "por IP+e-mail". | n |
| Password reset token lifetime | 30 minutes exactly | Matches REQ-AUTH-09 "~30min". | n |
| Password reset token delivery | Email only (no SMS) | Only email specified in source spec §7. | n |
| WebSocket auth protocol | JWT in `Authorization` header during handshake, validated before room join | Standard approach; token validated by Fastify middleware before socket upgrade. | n |
| WebSocket room naming | `ministry:{ministryId}:session:{sessionId}` | Scopes to ministry + session; allows multi-ministry on same server. | n |
| Ministry selector UI pattern | Dropdown in topbar (Web) / modal bottom sheet (Mobile) | Consistent with mobile patterns; only shows when >1 membership (REQ-AUTH-08). | n |
| "Connected Devices" data | Session ID, device name (UA parsed), IP, last active, created at, revoke action | Covers REQ-AUTH-06 requirements. | n |
| Session revocation | Immediate — delete refresh token + add access token to blocklist (short TTL) | Ensures revoked session can't use remaining access token lifetime. | n |

**Open questions:** none — all resolved or logged above.

---

## User Stories

### P1: Login & Token Management ⭐ MVP

**User Story**: As a user, I want to log in with email/password or Google OAuth and receive short-lived access tokens that refresh silently so that my session stays alive without manual re-login.

**Why P1**: Core authentication flow; all other blocks depend on authenticated users.

**Acceptance Criteria**:

1. WHEN a user submits valid email/password THEN the backend SHALL return an access token (JWT, ~15min) in response body and set a refresh token (httpOnly, Secure, SameSite=Strict, ~30 days) in a cookie. *(REQ-AUTH-01, REQ-AUTH-03)*
2. WHEN a user clicks "Login with Google" THEN the OAuth flow SHALL complete and SHALL return the same token pair as email/password. *(REQ-AUTH-01)*
3. WHEN the access token is about to expire (e.g., < 2 min remaining) THEN the client SHALL automatically call `/auth/refresh` with the refresh token cookie and SHALL receive a new access token + rotated refresh token. *(REQ-AUTH-04)*
4. WHEN the refresh token is used THEN the old refresh token SHALL be invalidated and a new one issued (rotation). *(Security best practice)*
5. WHEN a refresh token is presented that was already used (reuse detection) THEN the backend SHALL revoke ALL refresh tokens for that user and SHALL return 401 (forcing full re-login). *(Security best practice)*
6. WHEN the access token expires and no valid refresh token exists THEN the client SHALL redirect to login. *(REQ-AUTH-04 implicit)*

**Independent Test**: Login via email/password → wait 16 min → verify access token was silently refreshed (new access token, new refresh token cookie) without user interaction; attempt to reuse old refresh token → 401 and all sessions revoked.

---

### P1: Invite-Only Registration ⭐ MVP

**User Story**: As the first leader of a ministry, I want to create my ministry and register freely; as an invited member, I want to accept an invite link that pre-assigns my role so that I can join without an admin manually approving me.

**Why P1**: Defines the onboarding flow; without it, no users can exist in the system.

**Acceptance Criteria**:

1. WHEN no ministries exist for the registering user THEN the registration SHALL allow creating a new ministry and SHALL assign the user `role: admin` in the new ministry. *(REQ-AUTH-02)*
2. WHEN ministries already exist THEN registration SHALL require a valid invite token; the invite SHALL encode `ministry_id` and `role`; on acceptance, the user SHALL be added to `ministry_member` with that role. *(REQ-AUTH-02)*
3. WHEN an invite token is used THEN it SHALL be single-use and SHALL expire (e.g., 7 days). *(Implied security)*
4. WHEN a user registers via invite THEN they SHALL NOT be able to choose a different ministry or role — the invite determines both. *(REQ-AUTH-02)*

**Independent Test**: Register first user → ministry created, user is admin. Create invite for role=musician → register second user via invite link → user added to ministry_member with role=musician.

---

### P1: Multi-Session Support ⭐ MVP

**User Story**: As a musician, I want to be logged in on my phone (Modo Operador) and laptop (Web admin) at the same time so that I can switch devices without being logged out.

**Why P1**: Explicitly required by REQ-AUTH-05; critical for live sessions where mobile is primary but web is used for prep.

**Acceptance Criteria**:

1. WHEN a user logs in on a new device THEN existing sessions on other devices SHALL remain valid (access + refresh tokens unchanged). *(REQ-AUTH-05)*
2. WHEN a user logs out on one device THEN only that device's refresh token SHALL be revoked; other devices SHALL stay logged in. *(REQ-AUTH-05)*
3. WHEN the "Connected Devices" screen loads THEN it SHALL list all active sessions with device info and a revoke action per session. *(REQ-AUTH-06)*
4. WHEN a user revokes a specific session THEN only that session's refresh token SHALL be deleted and its access token added to a short-TTL blocklist. *(REQ-AUTH-06)*

**Independent Test**: Login on Chrome (Web) → login on Mobile Safari → both show in "Connected Devices" → revoke Mobile → Mobile redirects to login on next API call; Chrome still works.

---

### P1: RBAC & Permission Matrix ⭐ MVP

**User Story**: As an operator, I want to access the Modo Operador but be blocked from the Editor de Cue and member management so that I only see what my role permits.

**Why P1**: Core authorization; every API route and UI feature depends on this matrix.

**Acceptance Criteria**:

1. WHEN a request reaches a protected route THEN the RBAC middleware SHALL extract the user's role for the current ministry (from `ministry_member`) and SHALL allow or deny based on the permission matrix. *(REQ-AUTH-07)*
2. Permission matrix (enforced, testable via 403):
   - `admin`: ALL permissions (create/edit ministry, manage members, CRUD songs/cues, manage scales, access live session, send WhatsApp)
   - `operator`: Can access Modo Operador (live session); CANNOT access Editor de Cue (B3), CANNOT manage members (invite/remove), CANNOT manage scales, CANNOT access WhatsApp templates
   - `musician`: Can access Modo Letra/Cifra (read-only live view), Modo Estudio; CANNOT access any admin/operator features
3. WHEN a user has no `ministry_member` link for the requested ministry THEN the middleware SHALL return 403.
4. WHEN a user has multiple ministry memberships THEN the active ministry (selected via ministry selector) SHALL determine the role for permission checks. *(REQ-AUTH-08)*

**Independent Test**: Login as operator → GET /songs (should 403) → GET /sessions/:id/state (should 200). Login as admin → both 200. Login as musician → GET /sessions/:id/state (should 403) → GET /sessions/:id/lyrics (should 200).

---

### P1: Ministry Selector ⭐ MVP

**User Story**: As a user who serves in multiple ministries, I want a ministry selector in the UI so that I can switch context and see the correct data for each ministry.

**Why P1**: Required by REQ-AUTH-08; only shows when user has >1 membership.

**Acceptance Criteria**:

1. WHEN a user has exactly one `ministry_member` record THEN no ministry selector SHALL appear in the UI. *(REQ-AUTH-08)*
2. WHEN a user has two or more `ministry_member` records THEN a ministry selector SHALL appear (topbar dropdown Web / modal bottom sheet Mobile). *(REQ-AUTH-08)*
3. WHEN the user changes the selected ministry THEN the active ministry ID SHALL be stored in client state (and optionally a cookie) and all subsequent API requests SHALL use that ministry for RBAC. *(REQ-AUTH-08 implicit)*

**Independent Test**: Create user with 2 ministry memberships → load Web app → selector visible in topbar → switch ministry → API calls now scoped to new ministry.

---

### P1: Security Hardening ⭐ MVP

**User Story**: As a security-conscious admin, I want password hashing with argon2id, rate-limited login, single-use password reset tokens, restricted CORS, and enforced HTTPS so that the system resists common attacks.

**Why P1**: Explicitly required by REQ-AUTH-09; non-negotiable for production.

**Acceptance Criteria**:

1. WHEN a password is stored THEN it SHALL be hashed with argon2id (or bcrypt fallback) — never plaintext, never unsalted. *(REQ-AUTH-09)*
2. WHEN login fails 5 times within 15 minutes for the same IP+email THEN further attempts SHALL return 429 (rate limited) until the window resets. *(REQ-AUTH-09)*
3. WHEN a password reset is requested THEN a single-use token SHALL be generated, emailed, and SHALL expire in ~30 minutes; the token SHALL NOT be reusable; the current password SHALL NEVER be emailed. *(REQ-AUTH-09)*
4. WHEN any API request originates from an origin not in the allowed CORS list THEN the request SHALL be rejected. *(REQ-AUTH-09)*
5. WHEN the app runs in production THEN all endpoints SHALL be accessible only via HTTPS (HSTS, Secure cookies). *(REQ-AUTH-09)*

**Independent Test**: Attempt 6 failed logins rapidly → 6th returns 429. Request password reset → check email → token works once → second use returns 400/404. Call API from unlisted origin → CORS error.

---

### P1: WebSocket Authentication Handshake ⭐ MVP

**User Story**: As a live session participant, I want my WebSocket connection to validate my token and ministry link before joining the room so that no unauthorized device receives live session data.

**Why P1**: Required by REQ-AUTH-10; protects all live session data (B4/B5).

**Acceptance Criteria**:

1. WHEN a WebSocket connection is initiated THEN the handshake SHALL require a valid access token (in `Authorization` header or query param) and SHALL validate it before upgrading. *(REQ-AUTH-10)*
2. WHEN the token is valid THEN the server SHALL confirm the user has a `ministry_member` link to the ministry associated with the session room. *(REQ-AUTH-10)*
3. WHEN the token is invalid, expired, or the user lacks ministry membership THEN the handshake SHALL fail (connection closed, no room join). *(REQ-AUTH-10)*
4. WHEN authenticated THEN the socket SHALL join the room `ministry:{ministryId}:session:{sessionId}` and SHALL receive `block_changed` events. *(REQ-AUTH-10 + REQ-CORE-08)*

**Independent Test**: Connect WS with valid token + correct ministry → join room, receive events. Connect with valid token but wrong ministry → connection rejected. Connect with expired token → connection rejected.

---

## Edge Cases

- WHEN a user's ministry membership is revoked while they have an active WebSocket connection THEN the server SHALL disconnect them on the next heartbeat or block_changed event.
- WHEN a refresh token cookie is missing (cleared by browser) THEN `/auth/refresh` SHALL return 401 and client SHALL redirect to login.
- WHEN the system clock skews (client time ≠ server time) THEN token expiry SHALL be validated server-side only; client SHALL use `exp` claim for proactive refresh but not trust local time for auth decisions.
- WHEN an invite token is used after its ministry is deleted THEN registration SHALL fail with a clear error.
- WHEN a user belongs to a ministry but the ministry is archived THEN the user SHALL NOT be able to select it; selector SHALL filter to active ministries only.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
|---|---|---|---|
| AUTH-01 | P1: Login & Token Management | Auth | Pending |
| AUTH-02 | P1: Invite-Only Registration | Auth | Pending |
| AUTH-03 | P1: Login & Token Management | Auth | Pending |
| AUTH-04 | P1: Login & Token Management | Auth | Pending |
| AUTH-05 | P1: Multi-Session Support | Auth | Pending |
| AUTH-06 | P1: Multi-Session Support | Auth | Pending |
| AUTH-07 | P1: RBAC & Permission Matrix | Auth | Pending |
| AUTH-08 | P1: Ministry Selector | Auth | Pending |
| AUTH-09 | P1: Security Hardening | Auth | Pending |
| AUTH-10 | P1: WebSocket Authentication Handshake | Auth | Pending |

**Coverage:** 10 total, 10 mapped to tasks, 0 unmapped

---

## Success Criteria

- [ ] User can register (first leader creates ministry; others via invite), login (email/password + Google OAuth), and stay logged in across devices
- [ ] Access tokens auto-refresh silently; refresh tokens rotate on use; reuse detection revokes all sessions
- [ ] "Connected Devices" lists all sessions with per-session revoke
- [ ] RBAC matrix enforced: admin=all, operator=live-only, musician=read-only live + study; 403 on unauthorized access
- [ ] Ministry selector appears only when >1 membership; switches context correctly
- [ ] Security: argon2id hashing, 5/15min rate limit, 30min single-use reset tokens, CORS restricted, HTTPS enforced
- [ ] WebSocket handshake validates token + ministry membership before room join