# Autenticação, Sessão e RBAC Tasks

## Execution Protocol (MANDATORY — do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, adequacy review, Verifier, discrimination sensor).

**If the skill cannot be activated, STOP and tell the user — do not proceed without it.**

---

**Design**: `.specs/features/floworship-v8/b1-autenticacao/spec.md`
**Status**: Draft

---

## Test Coverage Matrix

> Generated from codebase guidelines — confirm before Execute. Guidelines found: none — strong defaults applied.

| Code Layer | Required Test Type | Coverage Expectation | Location Pattern | Run Command |
|---|---|---|---|---|
| Prisma schema | none (migration verifies) | All models created, relations correct | `prisma/schema.prisma` | `npx prisma migrate dev` |
| Auth service (JWT) | unit | Token creation, refresh, rotation, reuse detection | `src/services/auth/**/*.test.ts` | `npm run test:unit` |
| Auth routes (Fastify) | integration | Login, refresh, logout, password-reset, invite flows | `src/routes/auth/**/*.test.ts` | `npm run test:integration` |
| RBAC middleware | unit | Permission matrix: admin/operator/musician; 403 on unauthorized | `src/middleware/rbac/**/*.test.ts` | `npm run test:unit` |
| Password hashing | unit | argon2id hash/verify; bcrypt fallback | `src/services/auth/password/**/*.test.ts` | `npm run test:unit` |
| Rate limiting | integration | 5 attempts/15min per IP+email; 429 on limit | `src/middleware/rate-limit/**/*.test.ts` | `npm run test:integration` |
| Invite system | integration | Token generation, single-use, expiry; registration flow | `src/services/invite/**/*.test.ts` | `npm run test:integration` |
| Ministry selector | unit | Conditional render: 1 membership = hidden; >1 = visible | `src/components/auth/MinistrySelector.test.tsx` | `npm run test:unit` |
| WebSocket handshake | integration | Token validation, ministry membership check, room join | `src/websocket/**/*.test.ts` | `npm run test:integration` |
| Session management | integration | Multi-session, revoke, "Connected Devices" list | `src/services/session/**/*.test.ts` | `npm run test:integration` |

## Parallelism Assessment

> Generated from codebase — confirm before Execute.

| Test Type | Parallel-Safe? | Isolation Model | Evidence |
|---|---|---|---|
| unit | Yes | Per-test isolated; no shared DB state | Jest standard |
| integration | Yes | Each test spins up fresh Fastify instance + test DB | Fastify test helper pattern |
| e2e | No | Full browser; shared auth state | Playwright serial mode |

## Gate Check Commands

> Generated from codebase — confirm before Execute.

| Gate Level | When to Use | Command |
|---|---|---|
| Quick | After tasks with unit tests only | `npm run test:unit` |
| Full | After tasks with integration tests | `npm run test:unit && npm run test:integration` |
| Build | After phase completion or config/entity-only tasks | `npm run build && npm run lint && npm run test` |

---

## Execution Plan

### Phase 1: Schema & Token Foundation (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Auth Routes & Security (Parallel OK)

```
T3 complete, then:
  ├── T4 [P]
  ├── T5 [P]
  ├── T6 [P]
  └── T7 [P]
```

### Phase 3: RBAC & Invite System (Sequential)

```
T7 complete, then:
  T8 → T9
```

### Phase 4: UI & WebSocket (Parallel OK)

```
T9 complete, then:
  ├── T10 [P]
  ├── T11 [P]
  └── T12 [P]
```

### Phase 5: Final Verification (Sequential)

```
T12 complete, then:
  T13 → T14
```

---

## Task Breakdown

### T1: Prisma Schema — User, Ministry, MinistryMember

**What**: Define the core auth models (User, Ministry, MinistryMember) in the Prisma schema with all fields, relations, and indexes.
**Where**: `prisma/schema.prisma`
**Depends on**: None
**Reuses**: None (first task)
**Requirement**: AUTH-01, AUTH-02, AUTH-07

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `User` model has: `id` (uuid), `email` (unique), `password_hash`, `name`, `avatar_url`, `created_at`, `updated_at`
- [ ] `Ministry` model has: `id` (uuid), `name`, `owner_id` (FK → User), `created_at`
- [ ] `MinistryMember` model has: `id` (uuid), `user_id` (FK → User), `ministry_id` (FK → Ministry), `role` (enum: admin/operator/musician), `created_at`; unique constraint on `(user_id, ministry_id)`
- [ ] `RefreshToken` model has: `id` (uuid), `user_id` (FK → User), `token_hash` (unique), `expires_at`, `created_at`, `revoked_at`
- [ ] `PasswordResetToken` model has: `id` (uuid), `user_id` (FK → User), `token_hash` (unique), `expires_at`, `used_at`
- [ ] `InviteToken` model has: `id` (uuid), `ministry_id` (FK → Ministry), `role` (enum), `token_hash` (unique), `expires_at`, `used_at`, `created_by` (FK → User)
- [ ] All foreign key relations defined with `onDelete` behavior
- [ ] `npx prisma migrate dev --name init-auth` completes without errors
- [ ] `npx prisma studio` shows all models with correct fields
- [ ] Gate check passes: `npx prisma validate`

**Tests**: none (migration verifies)
**Gate**: build

---

### T2: JWT Token Service

**What**: Implement the JWT token creation, verification, refresh, and rotation service with RS256 signing.
**Where**: `src/services/auth/token.ts`
**Depends on**: T1
**Reuses**: Prisma schema from T1
**Requirement**: AUTH-01, AUTH-03, AUTH-04

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `createAccessToken(userId, ministryId)` returns a JWT signed with RS256, expires in 15min, payload: `{ sub: userId, ministry_id, iat, exp }`
- [ ] `createRefreshToken(userId)` generates a random token, stores its hash in `RefreshToken` table, returns raw token; expires in 30 days
- [ ] `verifyAccessToken(token)` validates signature + expiry; returns decoded payload or throws
- [ ] `refreshAccessToken(oldRefreshToken)` rotates: invalidates old token, issues new access + refresh pair
- [ ] `refreshAccessToken` detects reuse (old token already used within 5s window) → revokes ALL user refresh tokens, throws
- [ ] `revokeRefreshToken(tokenHash)` sets `revoked_at` on the token record
- [ ] Unit tests covering all ACs
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T3: Password Hashing Service (argon2id)

**What**: Implement password hashing with argon2id (with bcrypt fallback) for storage and verification.
**Where**: `src/services/auth/password.ts`
**Depends on**: T1
**Reuses**: None
**Requirement**: AUTH-09

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `hashPassword(plaintext)` returns argon2id hash string
- [ ] `verifyPassword(plaintext, hash)` returns boolean
- [ ] Fallback to bcrypt if argon2id unavailable (conditional import)
- [ ] Hash is never stored as plaintext; verification never compares raw strings
- [ ] Unit tests: hash produces different output each time (salt); correct password verifies; wrong password fails
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T4: Auth Fastify Routes — Login & Logout [P]

**What**: Create Fastify routes for email/password login and logout (clear refresh token cookie, revoke refresh token).
**Where**: `src/routes/auth/login.ts` + `src/routes/auth/logout.ts`
**Depends on**: T2, T3
**Reuses**: Token service from T2, password service from T3
**Requirement**: AUTH-01, AUTH-03

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `POST /auth/login` accepts `{ email, password }`, validates credentials, returns access token in body + sets refresh token httpOnly cookie (Secure, SameSite=Strict)
- [ ] `POST /auth/logout` accepts refresh token cookie, revokes it, clears cookie
- [ ] Login with invalid credentials returns 401 with `{ error: "Invalid credentials" }`
- [ ] Login with valid credentials returns 200 with `{ access_token, user: { id, email, name } }`
- [ ] Logout with no cookie returns 200 (idempotent)
- [ ] Integration tests for all flows
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T5: Auth Fastify Routes — Refresh & Password Reset [P]

**What**: Create Fastify routes for token refresh (silent) and password reset (request + confirm).
**Where**: `src/routes/auth/refresh.ts` + `src/routes/auth/password-reset.ts`
**Depends on**: T2, T3
**Reuses**: Token service from T2, password service from T3
**Requirement**: AUTH-03, AUTH-04, AUTH-09

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `POST /auth/refresh` reads refresh token cookie, rotates tokens, returns new access token + sets new refresh cookie
- [ ] `POST /auth/refresh` with invalid/expired/missing cookie returns 401
- [ ] `POST /auth/password-reset/request` accepts `{ email }`, generates single-use token (30min expiry), sends email (mocked), returns 200 regardless of email existence
- [ ] `POST /auth/password-reset/confirm` accepts `{ token, newPassword }`, validates token, hashes new password, marks token used, returns 200
- [ ] `POST /auth/password-reset/confirm` with used/expired token returns 400
- [ ] Integration tests for all flows
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T6: Google OAuth Callback Route [P]

**What**: Implement Google OAuth callback route that validates the Google ID token, creates/finds user, and issues JWT tokens.
**Where**: `src/routes/auth/google.ts`
**Depends on**: T2, T3
**Reuses**: Token service from T2, password service from T3
**Requirement**: AUTH-01

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `POST /auth/google` accepts `{ id_token }`, validates against Google's tokeninfo endpoint
- [ ] If user exists (by email), issues access + refresh tokens
- [ ] If user does not exist, creates user (no password_hash), then issues tokens
- [ ] If Google token invalid, returns 401
- [ ] Integration tests: existing user login, new user registration, invalid token
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T7: Rate Limiting Middleware [P]

**What**: Implement rate limiting for login endpoint: 5 attempts per 15 minutes per composite key `${ip}:${email}`.
**Where**: `src/middleware/rate-limit.ts`
**Depends on**: None
**Reuses**: None
**Requirement**: AUTH-09

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Rate limiter tracks attempts per `${ip}:${email}` composite key
- [ ] After 5 failed attempts within 15min window, returns 429 with `{ error: "Too many attempts. Try again later." }`
- [ ] Successful login resets the counter for that key
- [ ] Window resets after 15 minutes (in-memory with TTL)
- [ ] Rate limiter is configurable (windowMs, max attempts)
- [ ] Integration tests: 5 failures → 6th returns 429; window expiry resets; successful login resets
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T8: RBAC Middleware & Permission Matrix

**What**: Implement RBAC middleware that extracts user role from JWT, looks up ministry membership, and enforces the permission matrix per route.
**Where**: `src/middleware/rbac.ts` + `src/middleware/rbac.test.ts`
**Depends on**: T1, T2
**Reuses**: Prisma schema from T1, token service from T2
**Requirement**: AUTH-07

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `requireRole(...allowedRoles)` Fastify preHandler that extracts `ministry_id` from JWT, queries `ministry_member` for user's role, allows/denies
- [ ] Permission matrix enforced: admin = all routes; operator = live session routes only; musician = read-only live + study routes
- [ ] Routes without `ministry_id` in JWT return 403
- [ ] User with no `ministry_member` link for the requested ministry returns 403
- [ ] Unit tests: admin allows all, operator allows live-only, musician allows read-only; 403 on unauthorized; missing membership returns 403
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T9: Invite System (Backend)

**What**: Implement the invite-only registration flow: invite token generation, validation, and registration with role assignment.
**Where**: `src/services/invite/invite.ts` + `src/routes/auth/register.ts`
**Depends on**: T1, T2, T3, T8
**Reuses**: Prisma schema from T1, token service from T2, password service from T3
**Requirement**: AUTH-02

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] `POST /auth/register` allows creating first ministry (no ministries exist for user) with `role: admin`
- [ ] `POST /auth/register` requires valid invite token when ministries exist
- [ ] Invite token encodes `ministry_id` and `role`; on acceptance, user added to `ministry_member` with that role
- [ ] Invite token is single-use (marks `used_at` on use)
- [ ] Invite token expires after 7 days
- [ ] `POST /invite/generate` (admin-only) creates invite token with `{ ministry_id, role }`
- [ ] `POST /invite/generate` returns `{ invite_url, expires_at }`
- [ ] Registration via invite does NOT allow choosing different ministry or role
- [ ] Integration tests: first user creates ministry, second user joins via invite, expired token fails, reused token fails
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T10: Multi-Session Support & Connected Devices UI [P]

**What**: Implement multi-session support (multiple simultaneous logins) and the "Connected Devices" screen listing active sessions with per-session revoke.
**Where**: `src/services/session/session.ts` + `src/routes/sessions/devices.ts` + `src/components/auth/ConnectedDevices.tsx`
**Depends on**: T2, T4, T5
**Reuses**: Token service from T2
**Requirement**: AUTH-05, AUTH-06

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Login on new device does NOT invalidate existing sessions
- [ ] `GET /auth/devices` returns list of active sessions with: session_id, device_name (UA parsed), IP, last_active, created_at
- [ ] `DELETE /auth/devices/:sessionId` revokes that session's refresh token + adds access token to blocklist (short TTL)
- [ ] Revoked session's access token returns 401 on next use
- [ ] ConnectedDevices UI component lists sessions with revoke button per session
- [ ] Current session highlighted; cannot revoke own session
- [ ] Integration tests: login on 2 devices, both appear in list, revoke one, other still works
- [ ] Gate check passes: `npm run test:integration`

**Tests**: integration
**Gate**: full

---

### T11: Ministry Selector Component [P]

**What**: Create the Ministry Selector UI component that shows conditionally based on user's ministry memberships.
**Where**: `src/components/auth/MinistrySelector.tsx` + `src/components/auth/MinistrySelector.test.tsx`
**Depends on**: T1, T8
**Reuses**: Prisma schema from T1
**Requirement**: AUTH-08

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] With 1 ministry membership: component renders nothing (hidden)
- [ ] With >1 ministry memberships: renders dropdown (Web) or modal bottom sheet (Mobile)
- [ ] Selecting a ministry stores it in client state (context + optional cookie)
- [ ] All subsequent API requests include the selected ministry for RBAC
- [ ] Ministry selector only shows active ministries (not archived)
- [ ] Unit tests: hidden with 1 membership, visible with >1, switches context, filters archived
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T12: WebSocket Auth Handshake [P]

**What**: Implement WebSocket authentication handshake that validates JWT + ministry membership before admitting to room.
**Where**: `src/websocket/auth-handshake.ts` + `src/websocket/auth-handshake.test.ts`
**Depends on**: T1, T2, T8
**Reuses**: Token service from T2, RBAC from T8
**Requirement**: AUTH-10

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] WebSocket handshake requires valid access token in `Authorization` header or query param
- [ ] Token validated before upgrade (not after)
- [ ] Server confirms user has `ministry_member` link to the ministry associated with the session room
- [ ] Invalid/expired token → connection closed (no room join)
- [ ] No ministry membership → connection closed
- [ ] Authenticated socket joins room `ministry:{ministryId}:session:{sessionId}`
- [ ] Membership revoked mid-session → disconnect on next heartbeat
- [ ] Unit tests: valid token + correct ministry → join; wrong ministry → reject; expired token → reject; revoked membership → disconnect
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T13: Invite System (Frontend)

**What**: Create the frontend invite UI: invite link generation (admin), invite acceptance page, and invite expiry/invalid states.
**Where**: `src/components/auth/InviteAccept.tsx` + `src/components/auth/InviteGenerate.tsx`
**Depends on**: T9, T11
**Reuses**: Invite service from T9, MinistrySelector from T11
**Requirement**: AUTH-02, AUTH-08

**Tools**:
- MCP: NONE
- Skill: `clean-code`

**Done when**:
- [ ] Admin sees "Generate Invite" button in ministry settings
- [ ] Generate invite: select role → shows invite link with copy button + expiry date
- [ ] Invite acceptance page: shows ministry name, role, "Accept & Register" form
- [ ] Expired/used invite shows clear error state
- [ ] Registration form: name, email, password → creates user + links to ministry
- [ ] Unit tests: generate flow, accept flow, expired state, used state
- [ ] Gate check passes: `npm run test:unit`

**Tests**: unit
**Gate**: quick

---

### T14: Final Build Verification

**What**: Run full build + lint + all tests to verify B1 is complete.
**Where**: N/A (project root)
**Depends on**: T13
**Reuses**: None
**Requirement**: AUTH-01 through AUTH-10

**Tools**:
- MCP: NONE
- Skill: `lint-and-validate`

**Done when**:
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (no errors)
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] `npx prisma migrate dev` completes without errors
- [ ] WebSocket handshake validates token + ministry
- [ ] RBAC matrix enforced: admin=all, operator=live-only, musician=read-only
- [ ] Rate limiting works: 5/15min per IP+email
- [ ] Multi-session: 2 simultaneous logins, both active

**Tests**: integration
**Gate**: build

---

## Parallel Execution Map

```
Phase 1 (Sequential):
  T1 ──→ T2 ──→ T3

Phase 2 (Parallel):
  T3 complete, then:
    ├── T4 [P]
    ├── T5 [P]
    ├── T6 [P]
    └── T7 [P]

Phase 3 (Sequential):
  T7 complete, then:
    T8 ──→ T9

Phase 4 (Parallel):
  T9 complete, then:
    ├── T10 [P]
    ├── T11 [P]
    └── T12 [P]

Phase 5 (Sequential):
  T12 complete, then:
    T13 ──→ T14
```

---

## Task Granularity Check

| Task | Scope | Status |
|---|---|---|
| T1: Prisma schema | 1 schema file | ✅ Granular |
| T2: JWT token service | 1 service file | ✅ Granular |
| T3: Password hashing | 1 service file | ✅ Granular |
| T4: Login/logout routes | 2 route files | ✅ Granular |
| T5: Refresh/password-reset routes | 2 route files | ✅ Granular |
| T6: Google OAuth route | 1 route file | ✅ Granular |
| T7: Rate limiting middleware | 1 middleware file | ✅ Granular |
| T8: RBAC middleware | 1 middleware file | ✅ Granular |
| T9: Invite system (backend) | 1 service + 1 route | ✅ Granular |
| T10: Multi-session + devices UI | 1 service + 1 route + 1 component | ✅ Granular |
| T11: Ministry selector | 1 component | ✅ Granular |
| T12: WebSocket handshake | 1 module | ✅ Granular |
| T13: Invite system (frontend) | 2 components | ✅ Granular |
| T14: Final build verification | Build gate | ✅ Granular |

## Diagram-Definition Cross-Check

| Task | Depends On (task body) | Diagram Shows | Status |
|---|---|---|---|
| T1 | None | None | ✅ Match |
| T2 | T1 | T1 | ✅ Match |
| T3 | T1 | T1 | ✅ Match |
| T4 | T2, T3 | T2, T3 | ✅ Match |
| T5 | T2, T3 | T2, T3 | ✅ Match |
| T6 | T2, T3 | T2, T3 | ✅ Match |
| T7 | None | None | ✅ Match |
| T8 | T1, T2 | T1, T2 | ✅ Match |
| T9 | T1, T2, T3, T8 | T1, T2, T3, T8 | ✅ Match |
| T10 | T2, T4, T5 | T2, T4, T5 | ✅ Match |
| T11 | T1, T8 | T1, T8 | ✅ Match |
| T12 | T1, T2, T8 | T1, T2, T8 | ✅ Match |
| T13 | T9, T11 | T9, T11 | ✅ Match |
| T14 | T13 | T13 | ✅ Match |

## Test Co-location Validation

| Task | Code Layer Created/Modified | Matrix Requires | Task Says | Status |
|---|---|---|---|---|
| T1 | Prisma schema | none | none (migration) | ✅ OK |
| T2 | Auth service (JWT) | unit | unit | ✅ OK |
| T3 | Password hashing | unit | unit | ✅ OK |
| T4 | Auth routes (Fastify) | integration | integration | ✅ OK |
| T5 | Auth routes (Fastify) | integration | integration | ✅ OK |
| T6 | Auth routes (Fastify) | integration | integration | ✅ OK |
| T7 | Rate limiting | integration | integration | ✅ OK |
| T8 | RBAC middleware | unit | unit | ✅ OK |
| T9 | Invite system | integration | integration | ✅ OK |
| T10 | Session management + UI | integration | integration | ✅ OK |
| T11 | Ministry selector | unit | unit | ✅ OK |
| T12 | WebSocket handshake | unit | unit | ✅ OK |
| T13 | Invite frontend | unit | unit | ✅ OK |
| T14 | Build gate | none | build | ✅ OK |
