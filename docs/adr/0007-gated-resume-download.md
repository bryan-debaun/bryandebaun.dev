# ADR 0007 — Gated résumé download with request → approval, and private contact fields

Date: 2026-07-01

Status: Accepted (2026-07-01)

## Context

`main` recently landed a **file-backed résumé** (95bbe68): `src/data/resume.json`
(JSON Resume schema, currently a placeholder scaffold), a typed loader
(`src/lib/resume.ts` with a `resumeHasPlaceholders()` noindex gate), a rendered
`/resume` page (`src/app/resume/page.tsx`), and a Playwright print-to-PDF script
(`scripts/generate-resume-pdf.ts`, `pnpm resume:pdf`) that writes the committed
`public/resume.pdf`. The page currently renders contact info and links a public,
ungated PDF download.

Bryan has been maintaining the real résumé as a **Google-Docs-exported `.docx`**
in Google Drive. Content was extracted and analysed (2026-07-01): it is a plain,
single-column **Arial** document — name/section headers bold ~17pt, bold job
titles + dates, bulleted accomplishments, a pipe-separated contact line
(`Merriam, KS | (913) 439-8525 | brn.dbn@gmail.com | LinkedIn Profile`). There is
**no education or certifications section**. Critically for formatting: there is
**nothing exotic** — no tables, columns, images, or custom fonts. The structured
`/resume` renderer reproduces ~100% of the meaningful formatting, so **no
docx-rendering or WYSIWYG library is warranted**; the resume stays structured
data, restyled by the site.

Two goals emerged that the current implementation does not serve:

1. **Keep direct contact info off the public web.** Bryan wants email **and**
   phone — anything that can be used to contact him directly — kept off the
   public, search-indexed `/resume` page to minimise scraping/spam. Direct
   contact info should appear **only** in a downloadable résumé that is gated.
2. **Gate the download behind request → approval.** Only an authenticated user
   with a verified email may **request** the full (contact-bearing) résumé;
   Bryan **approves** each request; approved requesters get a **time-limited**
   download. Requests are **rate-limited to 3 per rolling 30 days per user**.

### Architectural facts this must build on (verified 2026-07-01)

- **Auth:** Supabase Auth; server checks via `supabase.auth.getUser()`
  (`src/lib/supabase/server.ts`). Admin gate is `app_metadata.role === 'admin'`
  in `src/lib/auth-guard.ts` (`requireAdmin` / `requireAdminPage`) — never
  `user_metadata`. Email verification = Supabase `email_confirmed_at`.
- **DB lives in the MCP server, not here.** There is **no local Supabase
  migrations dir**. Articles/books are resources on the MCP server (`bad-mcp`),
  reached through the generated Axios client (`src/lib/mcp.ts`), API-key reads +
  Supabase-JWT admin writes (ADR 0003/0004). Layering is
  repository (client → `/api/admin/*`) → service (public read → MCP) → route
  (server, `requireAdmin` + JWT passthrough). **Any new DB table is backend work
  in `mcp-server`**, exactly as articles were (ADR 0005 referenced mcp-server
  #120).
- **Email:** Resend, via `src/lib/email.ts`
  (`sendContactEmail` / `sendInviteEmail`, env-gated on `RESEND_API_KEY` /
  `CONTACT_FROM_EMAIL`). Used by the contact form and the invites flow.
- **Request → approve analog:** the **invites** system
  (`src/app/api/admin/invites/*`) is the closest existing lifecycle
  (admin-initiated create + revoke; status derived from Supabase user fields).
- **No rate-limiting utility exists** (the contact route flags `@upstash/ratelimit`
  as a future slot-in).
- **Time-limited links that already exist:** Supabase OTP/magic-link and invite
  action links; **Supabase Storage signed URLs** are the natural primitive for a
  time-limited private-file download (storage is used today only via
  `getPublicUrl` in `src/app/api/admin/upload/route.ts`).
- **Print CSS** for the résumé lives in `src/app/globals.css` (`@media print`,
  ~L959–1008): hides chrome, forces an ink-friendly palette, avoids breaks
  inside `.resume-entry`.

## Decision drivers / NFRs

| Driver | Target |
| --- | --- |
| **Spam minimisation** | Email + phone never appear in public HTML or a public asset. Contact is via the existing contact form; direct info only in the gated download. |
| **Real approval** | A human (Bryan) approves each download; not auto-delivered on email entry. |
| **Abuse resistance** | ≤ **3 requests / rolling 30 days / user**; requester must be authenticated with a **verified email**. |
| **Time-limited delivery** | Approved download is a **short-lived** link, not a permanent public URL. |
| **With the grain** | Reuse Supabase auth, MCP-backed resources, Resend, and the invites lifecycle shape. No new vendor; no second auth stack; no runtime headless-Chromium dependency on Vercel. |
| **Formatting fidelity** | Résumé stays structured data, site-styled; the Arial/bold/bullets look is reproduced in CSS. No docx/WYSIWYG library. |
| **Cost** | $0 incremental (Supabase + Resend + Vercel already in place). |

## Decision

Build the **gated download + approval flow first**, and **phase the admin-editor
content migration second** — because the two are separable, and the content
migration is the expensive, low-frequency part while the gated download is the
actual new capability.

### Key decisions

1. **Public `/resume` shows no direct contact info.** Remove email + phone from
   the page and its JSON-LD; keep name, title, summary, skills, experience,
   projects. Replace the current public "Download PDF" button with a **"Request
   full résumé (PDF)"** call-to-action that routes anonymous users to sign in.
   **LinkedIn + GitHub profile links stay public** — they are already-public
   professional profiles with their own spam controls, not direct inboxes. *(Open
   question OQ-1: confirm this classification.)*

2. **Contact fields become "private" résumé data.** In the résumé model, `email`
   and `phone` are flagged private and are **only** rendered into the gated full
   PDF — never into the public page, the public HTML, or `public/`.

3. **No ungated PDF.** Delete the committed `public/resume.pdf` and its public
   link. The only downloadable artifact is the contact-bearing "full" PDF behind
   the gate. *(Per Bryan: gate anything that can contact him.)*

4. **Access gate = authenticated + verified email + approved + unexpired +
   under quota.** A download is authorised only when all hold. Enforced
   server-side on the download route via `supabase.auth.getUser()` +
   `email_confirmed_at` + the request record's status/expiry.

5. **Request → approval lifecycle as a DB resource** (`ResumeDownloadRequest` on
   the MCP server): `pending → approved → fulfilled`, plus `denied` / `expired`.
   Fields (indicative): `id, userId, userEmail, reason?, status, createdAt,
   approvedAt?, expiresAt?, downloadCount, adminNote?`. Admin approves/denies in
   an admin UI mirroring the users/invites screens; approval triggers a Resend
   email with the time-limited link. **Rate limit: reject a new request if the
   user has ≥ 3 in the trailing 30 days** (enforced in the create route/service,
   not client-side).

6. **Full-PDF generation & delivery — recommended: private Storage + signed
   URL.** Generate the contact-bearing PDF with the **existing print pipeline**
   (`resume:pdf` against an authenticated `/resume/full` render that includes the
   private fields), upload it to a **private Supabase Storage bucket** (not
   `public/`), and on approval email a **short-lived signed URL**. This avoids
   running headless Chromium in Vercel serverless and reuses a Supabase
   primitive. *(Open question OQ-2: see "Options considered — PDF generation".)*

7. **Résumé content stays file-backed for now** (`src/data/resume.json`, edited
   via PR) — which actually honours the original "source-controlled résumé" goal.
   The **website admin editor** (content in the MCP DB, live edits) is a
   **deferred Phase 2**, because content changes are rare and the cross-repo
   backend + editor UI is the heaviest, least-valuable slice. *(This sequences
   Bryan's "admin editor" choice rather than dropping it — see OQ-3.)*

### Options considered — résumé content storage

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **A. File-backed `resume.json`, edited via PR** (v1) | Zero new infra; truly source-controlled; edits reviewed; content rarely changes | No live editing; edit needs a deploy | **Chosen for v1** |
| **B. MCP DB-backed + admin editor** (like articles) | Live edits on-site, no deploy | Cross-repo backend work (`mcp-server` resource + endpoints) + editor UI; content changes are infrequent so ROI is low | **Deferred to Phase 2** |
| C. Local Supabase table owned by the frontend | Live edits without MCP | Introduces a frontend-owned DB pattern that doesn't exist today — against the grain | Rejected |

### Options considered — full-PDF generation

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **A. Print pipeline → private Storage + signed URL** (recommended) | Reuses existing `resume:pdf` + print CSS; no runtime Chromium; Supabase-native time-limited delivery | PDF is regenerated out-of-band when content changes (fine while content is file-backed / deploy-driven) | **Recommended (OQ-2)** |
| B. On-demand server render with `@react-pdf/renderer` | Always current; pure-JS, serverless-safe; per-request contact injection; no stored file | New rendering path separate from the print CSS → a second source of truth for résumé layout | Reasonable if live-current PDFs matter after Phase 2 |
| C. On-demand headless Chromium in a route | Single layout source (the page) | Chromium in Vercel serverless is heavy/fragile | Rejected |

### Options considered — access gating

| Option | Pros | Cons | Verdict |
| --- | --- | --- | --- |
| **A. Authenticated + verified email + admin approval + quota** (recommended) | Real human approval; abuse-resistant; reuses auth + invites shape | Highest friction for requesters | **Chosen** (matches Bryan's requirement) |
| B. Email-gated auto-deliver | Low friction | Not real approval; contact info leaks to anyone with an email | Rejected |
| C. Login/invite-gated, no per-request approval | Simple | No per-download control; over-broad once logged in | Rejected |

## Consequences

- **Positive:** direct contact info leaves the public surface; downloads are
  human-approved, verified-user-only, rate-limited, and time-limited; the whole
  flow stays on Supabase + MCP + Resend (no new vendor, no runtime Chromium); the
  résumé content stays source-controlled in v1 (honours the original goal); the
  Arial look is reproduced in CSS with no doc-rendering dependency.
- **Negative / costs:** a new **MCP-server resource** (`ResumeDownloadRequest`,
  and in Phase 2 `Resume`) is backend work in another repo; a new **rate-limit**
  concept enters the codebase (start with a DB-count check, not a new library); a
  **private Storage bucket** + signed-URL flow is new surface; the full PDF must
  be **regenerated** when content changes (acceptable while file-backed).
- **Neutral:** `/resume` stays indexable (no contact info to hide from crawlers);
  `noindex` still auto-lifts once placeholders are replaced.

## Rollout / work order

Phases are the **build order**, mostly on one feature branch per phase.

### Phase 0 — Content (do first, unblocks everything)

- Populate `src/data/resume.json` from the docx (skills, four roles, summary).
  Model `email` + `phone` as **private** fields. Add the real LinkedIn URL and
  the story-forward Education entry (OQ-6).
- Tune `/resume` + print CSS to the Arial/bold/bullets look.
- **Remove** email/phone from the public page + JSON-LD; **remove**
  `public/resume.pdf` and the public download link; add the "Request full résumé"
  CTA (wired to sign-in; request UI arrives in Phase 2).

### Phase 1 — Full PDF + private delivery

- Add an **authenticated `/resume/full`** render (private fields included),
  reachable only server-side / by admin.
- Extend `resume:pdf` to emit the **full** PDF and upload it to a **private
  Supabase Storage bucket** (OQ-2 = Option A). Add a server helper to mint a
  short-lived **signed URL**.

### Phase 2 — Request → approval flow

- **MCP server:** add `ResumeDownloadRequest` resource + endpoints
  (create/list/approve/deny). *(Cross-repo; own issue in `mcp-server`.)*
- **Frontend:** repository → service → `/api/(admin)/resume-requests` routes;
  enforce **verified-email** + **3/30-day quota** on create; admin approve/deny
  UI (mirror `src/app/admin/users`); on approve, Resend email with the signed
  URL (extend `src/lib/email.ts`).
- Requester-facing "Request résumé" form + status.

### Phase 3 (deferred) — Admin content editor

- Migrate résumé **content** to an MCP `Resume` resource + admin editor (mirror
  `ArticleEditor`), retiring `resume.json` as source of truth. Only pursue if
  live editing proves worth the cross-repo cost (OQ-3).

## Resolved decisions (2026-07-01)

- **OQ-1 → Resolved:** LinkedIn + GitHub links stay **public** on `/resume`
  (already-public professional profiles, not direct inboxes).
- **OQ-2 → Adopted:** PDF generation = **Option A** (print pipeline → private
  Supabase Storage + signed URL) for v1.
- **OQ-3 → Adopted:** Ship the gated download with **file-backed content** first;
  defer the DB-backed admin content editor to Phase 3.
- **OQ-4 → Resolved:** Signed link valid **72 h**, max **3** downloads.
- **OQ-5 → Resolved:** LinkedIn =
  `https://www.linkedin.com/in/bryan-debaun-4177b1117/`.
- **OQ-6 → Resolved:** Include a brief, honest **Education** line (story-forward),
  no degree claimed: *Kansas State University — Computer Science, 2013–2016. Left
  in junior year to accept a full-time software engineering offer.*

## Acceptance criteria

- [x] ADR committed to `docs/adr/` capturing drivers, per-area options
  (content storage, PDF generation, access gating), phasing, and open questions.
- [x] Issue breakdown created (frontend repo + a linked `mcp-server` backend
  issue for `ResumeDownloadRequest`).
- [x] Open questions OQ-1…OQ-6 resolved and recorded.

## Related

- Builds on **ADR 0003** (Supabase keys / `app_metadata.role` admin model),
  **ADR 0004** (MCP API client / JWT admin auth), **ADR 0005** (DB-backed
  articles — the cross-repo resource pattern), **ADR 0006** (auth: verified-email
  identities).
- Touches: `src/app/resume/page.tsx`, `src/lib/resume.ts`, `src/data/resume.json`,
  `scripts/generate-resume-pdf.ts`, `src/app/globals.css` (`@media print`),
  `src/lib/email.ts`, `src/lib/auth-guard.ts`, and a new `mcp-server`
  `ResumeDownloadRequest` resource.

### Implementation issues

- **Phase 0** — content + private contact fields + de-index: #114
- **Phase 1** — full-PDF render + private Storage bucket + signed URL: #115
- **Phase 2** — request → approve UI + quota + approval email: #116
- **Phase 3** (deferred) — DB-backed content + admin editor: #117
- **Backend** — `ResumeDownloadRequest` resource + endpoints:
  `bryan-debaun/mcp-server` #139

Author: Bryan DeBaun
