# ADR 0006 — Auth modernization: social login (GitHub + Google) & passkeys

Date: 2026-06-29

Status: Proposed

## Context

The site already has a working Supabase Auth surface (see ADR 0003 for the key
model and the `app_metadata.role === 'admin'` authorization rule). Today users
can authenticate with **email/password** (`signInWithPassword`) and
**magic-link** (`signInWithOtp`), and a **PKCE `/auth/callback`** route
(`src/app/auth/callback/route.ts`) already calls `exchangeCodeForSession`. The
auth surface lives under `src/app/login`, `src/app/register`, and
`src/app/api/auth/{login,register,magic-link,me,reset-password,update-password,logout}`,
with clients in `src/lib/supabase/{server,client,admin}.ts`.

Two modern sign-in methods are worth adding:

1. **Social login (GitHub + Google)** — lower-friction sign-in, no password to
   manage, and a natural fit since the real admin (`brn.dbn@gmail.com`) has both
   a Google and a GitHub identity.
2. **Passkeys / WebAuthn (biometric)** — phishing-resistant, passwordless
   authentication bound to the device. The strongest available protection for
   the single privileged admin account.

This is a personal site with **one real admin** and a learning goal, not an
enterprise SSO rollout. The bar is: make sign-in nicer and meaningfully harder
to phish **without ever risking lockout of the admin** and **without breaking
the email/password e2e suite**. Everything else is right-sized down.

### Current stack (verified against the code, 2026-06-29)

- Next.js 16 App Router, React 19, TS strict.
- `@supabase/ssr` `^0.10.2`, `@supabase/supabase-js` **`^2.103.0`**.
- Supabase project ref `nanodcvcpklffksxofbm`; modern publishable/secret keys
  (ADR 0003).
- Browser client: `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)`.
- Admin auth: `app_metadata.role === 'admin'` enforced in `src/lib/auth-guard.ts`
  (`requireAdmin` / `requireAdminPage`) — **never** `user_metadata`.
- e2e/integration: Playwright suite logs in dedicated `e2e-admin@` / `e2e-user@`
  users with **email/password** (creds in gitignored `.env.local`).

### Verified facts (Supabase docs, re-confirmed 2026-06-29)

- **Social OAuth** is GA and first-class: `signInWithOAuth({ provider, options: { redirectTo } })`
  returns a provider URL; the redirect lands on the existing `/auth/callback`
  PKCE route and reuses `exchangeCodeForSession`. Works on the installed
  `supabase-js` 2.103.0. **No client bump required.**
- **Automatic identity linking**: when a user signs in via a new provider with
  an email that matches an existing user, Supabase **auto-links** the identity —
  **but only when the email is verified** on both sides. Linking to unverified
  emails is refused (pre-account-takeover protection), and unconfirmed
  identities are removed when a new identity is linked. Emails must be unique.
  Manual `linkIdentity()` / `unlinkIdentity()` exist but require opt-in
  (`GOTRUE_SECURITY_MANUAL_LINKING_ENABLED`); unlinking requires ≥2 identities.
- **Passkeys / WebAuthn** are **EXPERIMENTAL** ("The API may change without
  notice"):
  - Requires `@supabase/supabase-js` **≥ 2.105.0** (a bump from 2.103.0) and an
    explicit opt-in: `auth: { experimental: { passkey: true } }`.
  - Client methods: `registerPasskey()` (enroll, must be an authenticated,
    confirmed, non-anonymous, non-SSO user) and `signInWithPasskey()`
    (passwordless via **discoverable credentials** — no email needed at
    sign-in). A lower-level `auth.passkey.*` two-step API also exists.
  - Dashboard config needs a **Relying Party (RP) ID** = the **bare domain**
    (`bryandebaun.dev`, no scheme/port), a display name, and up to **5 HTTPS
    origins** that match or are subdomains of the RP ID. `localhost` is allowed
    for dev.
  - **Changing the RP ID invalidates every enrolled passkey** — pick it once and
    keep it stable.
  - Anonymous and SSO users cannot enroll.

## Decision drivers / NFRs

| Driver | Target |
| --- | --- |
| **No lockout / recovery** | The admin (`brn.dbn@gmail.com`) must **always** have ≥2 independent ways in; no single method (passkey, one provider) can be a single point of failure. This is the hard constraint. |
| **Phishing resistance** | Add at least one phishing-resistant factor (passkey) for the admin; social OAuth raises the bar over password reuse. |
| **e2e/CI continuity** | A **programmatic email/password** login path must remain for the Playwright integration suite. Social/passkey cannot be automated cheaply. |
| **Admin security** | Defense-in-depth for the one account that can mutate content; authorization stays on `app_metadata.role`. |
| **Maintenance burden** | Prefer "with the grain" (stay on Supabase) over a parallel auth stack. |
| **Experimental-API risk** | Passkeys may change without notice → must be additive, behind fallbacks, and trivially disable-able. |
| **Cost** | $0. Supabase OAuth and passkeys add no line-item cost; provider apps (GitHub/Google) are free. |

## Decision

Adopt a **two-phase, additive** modernization that keeps every existing method
working:

- **Phase 1 — Social login (GitHub + Google) via Supabase OAuth.** Mature, GA,
  no client bump. Add `signInWithOAuth` buttons on `/login` (and `/register`)
  that redirect through the **existing** `/auth/callback`. **Recommended and
  low-risk.**
- **Phase 2 — Passkeys via Supabase-native experimental API**, **strictly
  additive and behind the existing fallbacks**, gated by an env flag, and
  shipped as its own `supabase-js ≥ 2.105.0` bump. Primarily to give the admin a
  phishing-resistant factor — **never** the only way in.
- **Keep email/password + magic-link permanently** as universal fallbacks and as
  the programmatic path for e2e. Nothing is removed.
- **Identity-linking policy:** rely on Supabase's **automatic linking on
  verified email** and **keep manual linking disabled**. Same verified email via
  Google/GitHub/password resolves to one account (see policy below).
- **RP ID = `bryandebaun.dev`**, chosen once and frozen. Origins:
  `https://bryandebaun.dev` (prod) and `http://localhost:3000` (dev).

### Options considered — Social login

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **A. Supabase OAuth** (recommended) | GA; reuses existing PKCE `/auth/callback`; no client bump; sessions/`app_metadata` model unchanged; auto identity-linking on verified email | Provider apps + redirect allowlists to configure in two consoles | **Chosen** |
| B. External auth layer (Auth.js / NextAuth) | Provider-rich; framework-popular | Introduces a **second** session/identity system parallel to Supabase; the entire authorization model (`app_metadata.role`, `auth-guard.ts`, MCP JWT in ADR 0004) assumes a Supabase session; large rewrite for zero net benefit on a single-admin site | Rejected — runs against the "with the grain" principle |
| C. Hand-rolled OAuth | Full control | Reinvents a solved, security-sensitive flow | Rejected |

Staying on Supabase is correct because the **incumbent** authorization model,
the MCP API client's Supabase-JWT admin auth (ADR 0004), and `auth-guard.ts` are
all built on a Supabase session. OAuth here is purely additive: a new way to
obtain that **same** session.

### Options considered — Passkeys

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **A. Supabase-native experimental** (recommended, Phase 2) | Integrates with the existing Supabase session & `app_metadata`; discoverable credentials; admin API; minimal code | **Experimental** (may change without notice); needs `supabase-js ≥ 2.105.0` + opt-in flag; RP-ID fragility | **Chosen, behind fallbacks + env flag** |
| B. Self-managed WebAuthn (SimpleWebAuthn) + custom credential storage | Stable, fully controlled API; not tied to Supabase's experimental track | Must build registration/auth ceremonies, challenge storage, and **bind credentials to the Supabase session myself**; materially more code and a new security-critical surface to maintain for one user | Rejected for now — disproportionate effort |
| C. Defer passkeys | Zero risk; no churn | Leaves the admin without a phishing-resistant factor | Rejected — but acceptable as a Phase-2 hold if the experimental API proves unstable |

Rationale: for a single-admin learning project, the experimental Supabase path
gives 80% of the value for ~10% of the effort of B. The experimental risk is
**contained** because passkeys are never the only factor and the feature can be
disabled by an env flag without touching the OAuth/password paths. If Supabase
churns the API painfully, fall back to Option C (defer) — not B.

### Identity-linking policy

- **Keep automatic linking on; keep manual linking off** (do **not** set
  `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED`).
- Consequence for the admin: `brn.dbn@gmail.com` is the same verified email on
  the existing email/password identity and on both Google and GitHub (GitHub
  must have that address as a **verified** email). Signing in via any of them
  resolves to the **one** existing user — so `app_metadata.role: admin` is
  preserved and admin access "just works" across methods. **Action item:**
  confirm `brn.dbn@gmail.com` is a verified email on the GitHub account before
  relying on GitHub linking; otherwise GitHub returns a different/again-verified
  identity.
- **Security note:** auto-linking is only safe because Supabase refuses to link
  **unverified** emails (pre-account-takeover protection). The risk to avoid is a
  provider that returns an **unverified** email — Supabase won't auto-link it,
  which is the safe outcome (a separate, non-admin user is created rather than a
  takeover). We accept Supabase's default behavior here rather than building
  custom linking logic.
- **Out of scope:** user-facing "connect your GitHub/Google" account-management
  UI. Not needed for one admin; revisit only if multi-identity self-service is
  ever wanted.

### Anti-lockout / fallback strategy (the hard constraint)

- **Email/password stays forever.** It is the recovery floor and the e2e path.
- **Magic-link stays forever.** Email-based passwordless recovery if a password
  is forgotten.
- **Passkeys are additive only.** The admin enrolls a passkey **in addition to**
  password + at least one social identity — never as a sole credential.
- **Admin-specific protection for `brn.dbn@gmail.com`:**
  - Maintain **≥2 independent factors at all times**: (password + magic-link via
    email) is already two; social and passkey are bonuses.
  - **Passkey lost-device recovery:** because email/password and magic-link
    remain, a lost passkey is **not** a lockout — sign in by password/magic-link
    and re-enroll a new passkey. Enroll passkeys on **≥2 devices** where
    practical (e.g. phone + laptop, or rely on iCloud/Google passkey sync).
  - **RP-ID safety:** never change the RP ID after first enrollment (it would
    silently invalidate every passkey). If it ever must change, treat it as a
    full re-enrollment event with password/magic-link as the bridge.
  - **Service-role break-glass:** the existing Supabase **secret key** (ADR 0003)
    can reset the admin password or `app_metadata` out-of-band via `auth.admin.*`
    — the ultimate recovery lever, already in place.
- **Net effect:** no method we add can cause lockout, because the two
  email-bound methods that exist today are never removed.

### CI / e2e impact

- The Playwright integration suite authenticates `e2e-admin@` / `e2e-user@` via
  **email/password** through `/api/auth/login`. **That path is untouched** by
  this ADR — email/password sign-in is explicitly retained, so the suite keeps
  working with no changes.
- **Do not** attempt to automate OAuth or passkey ceremonies in CI (real
  provider consent screens / platform authenticators can't be driven reliably
  and cheaply). Coverage for the new flows is:
  - Social: a lightweight test asserting the OAuth button calls
    `signInWithOAuth` with the right provider + `redirectTo` (mock the client),
    plus a manual smoke check against the provider once per setup.
  - Passkey: unit-level assertions that the UI calls `registerPasskey` /
    `signInWithPasskey` behind the env flag; no real WebAuthn ceremony in CI.
- **Guard:** keep at least one e2e test that fails if email/password login ever
  stops working, so a future refactor can't quietly remove the e2e/recovery path.

## Consequences

- **Positive**
  - Lower-friction sign-in (one-click GitHub/Google) and a phishing-resistant
    option (passkey) for the admin — better security posture for the one account
    that matters.
  - Stays entirely "with the grain": same Supabase session, same
    `app_metadata.role` authorization, same `/auth/callback`, same MCP admin auth
    (ADR 0004). No second auth stack.
  - $0 incremental cost.
  - Additive-only: nothing existing is removed; the e2e/recovery path is
    preserved by design.
  - A genuine **learning** surface: OAuth/PKCE wiring and WebAuthn/passkeys.
- **Negative**
  - **Passkeys ride an experimental API** that may change without notice →
    ongoing maintenance attention; mitigated by env-flag gating and fallbacks.
  - A **`supabase-js` bump to ≥ 2.105.0** is required for Phase 2 (its own
    reviewed step; re-verify no breaking changes in `@supabase/ssr` interop).
  - More configuration surface: provider apps (GitHub/Google), redirect-URL
    allowlists in **both** Supabase and each provider console, and dev-vs-prod
    origins/RP ID to keep straight.
  - **RP-ID fragility:** an accidental RP-ID change invalidates all passkeys
    (mitigated by freezing it and documenting it loudly).
  - Auto identity-linking depends on provider-verified emails; a misconfigured
    GitHub email could create a separate non-admin user (safe, but confusing) —
    mitigated by the verify-GitHub-email action item.

## Rollout / Rollback

### Phase 1 — Social login (GitHub + Google) — *low risk, do first*

1. **Provider apps:** create a GitHub OAuth App and a Google OAuth client; set
   each provider's callback to the Supabase auth callback
   (`https://<project-ref>.supabase.co/auth/v1/callback`).
2. **Supabase dashboard:** enable GitHub + Google providers; paste client
   IDs/secrets; add **Redirect URL allowlist** entries for
   `https://bryandebaun.dev/auth/callback` and
   `http://localhost:3000/auth/callback`.
3. **Code:** add "Continue with GitHub / Google" buttons on `/login` (and
   `/register`) calling
   `supabase.auth.signInWithOAuth({ provider, options: { redirectTo: \`${SITE_URL}/auth/callback\` } })`.
   No callback-route change needed (it already does `exchangeCodeForSession`).
4. **Verify:** `brn.dbn@gmail.com` via Google and via GitHub both resolve to the
   existing admin user (auto-link on verified email) and retain
   `app_metadata.role: admin`.
5. **Rollback:** disable the providers in the Supabase dashboard and hide the
   buttons — password/magic-link unaffected. Pure config + UI revert.

### Phase 2 — Passkeys — *experimental, do after Phase 1 is stable*

1. **Bump** `@supabase/supabase-js` to **≥ 2.105.0** as a standalone change;
   verify build + e2e + `@supabase/ssr` interop. Treat as its own PR.
2. **Dashboard:** configure RP **ID = `bryandebaun.dev`** (frozen), display name,
   and origins `https://bryandebaun.dev` + `http://localhost:3000`.
3. **Client opt-in:** enable `auth: { experimental: { passkey: true } }` on the
   browser client, gated by an env flag (e.g. `NEXT_PUBLIC_ENABLE_PASSKEYS`) so
   it can be turned off instantly.
4. **UI:** add "Enroll a passkey" in an authenticated/account context
   (`registerPasskey`) and "Sign in with a passkey" on `/login`
   (`signInWithPasskey`), both shown only when the flag is on and **always
   alongside** the password/magic-link options.
5. **Admin enrollment:** enroll passkeys on ≥2 devices (or rely on platform
   sync), with password/magic-link confirmed working first.
6. **Rollback:** flip `NEXT_PUBLIC_ENABLE_PASSKEYS` off (UI disappears, fallbacks
   remain). If the experimental API breaks, defer (Option C) without affecting
   OAuth/password. **Do not** change the RP ID as part of any rollback.

### Operability notes

- Document the redirect-URL allowlists (Supabase **and** both provider consoles)
  and the dev-vs-prod origins/RP-ID in the rollout runbook; allowlist drift is
  the most likely cause of a broken OAuth redirect.
- Add the verify-`brn.dbn@gmail.com`-on-GitHub action item to Phase-1 acceptance.
- No new alerting needed at this scale; rely on the existing auth-route debug
  logging (masked email) and a manual post-deploy smoke check per method.

## Acceptance criteria

- [ ] ADR committed to `docs/adr/` capturing drivers/NFRs, per-capability
  options, identity-linking policy, anti-lockout strategy, CI/e2e impact,
  phased rollout, and consequences.
- [ ] Phase-1 (social login) implementation issue created and linked.
- [ ] Phase-2 (passkeys) follow-up issue created and linked, noting the
  `supabase-js ≥ 2.105.0` bump as its own step and the experimental risk.

## Open questions (for Bryan)

1. **GitHub email:** is `brn.dbn@gmail.com` a **verified** email on the GitHub
   account (required for clean auto-linking to the existing admin)?
2. **Passkey scope:** admin-only for now, or offered to all users? (Recommend
   admin-only initially — fewer support paths, the value is admin phishing
   resistance.)
3. **Phase-2 timing:** ship passkeys soon after Phase 1, or hold until the
   Supabase experimental API stabilizes / graduates to GA?
4. **`/register` exposure:** put social buttons on `/register` too, or keep
   registration email/password-only and surface social only on `/login`?

## Related

- Builds on **ADR 0003** (Supabase API keys & `app_metadata.role` admin model)
  and **ADR 0004** (MCP API client — Supabase-JWT admin auth), both of which
  assume a Supabase session that this ADR keeps as the single identity system.
- Touches the existing PKCE `/auth/callback` route and the
  `src/app/api/auth/*` surface.

Author: Bryan DeBaun
