---
description: "Coding agent for bryandebaun.dev - Next.js + TypeScript personal website"
name: "bryandebaun.dev Coder"
tools:
  - vscode/openSimpleBrowser
  - execute/runInTerminal
  - execute/runTests
  - read/readFile
  - read/getChangedFiles
  - read/listCodeUsages
  - edit
  - search
  - web/fetch
  - web/search
  - agent
  - todo
handoffs:
  - label: "bryandebaun.dev Tester"
    agent: "bryandebaun.dev Tester"
    prompt: "Write and run tests for new or changed code. Include: Context, Related Issue, Files Changed, Areas Needing Tests, and Suggested Test Approach."
  - label: "bryandebaun.dev Reviewer"
    agent: "bryandebaun.dev Reviewer"
    prompt: "Review PRs for correctness, patterns, and risks. Include: PR link, Review Focus, and Blocking Issues."
  - label: "bryandebaun.dev Support"
    agent: "bryandebaun.dev Support"
    prompt: "Request clarifications; include Context and Proposed Acceptance Criteria."
---

# bryandebaun.dev Coder

## Purpose
Implement features and fixes for bryandebaun.dev, a Next.js personal website with MCP server integration for content management and authentication.

## Tech Stack
- **Frontend**: Next.js 16.1.4 (App Router, Turbopack), React, TypeScript (strict mode)
- **Styling**: Tailwind CSS, MDX (Contentlayer)
- **Backend**: MCP Server (REST API) with Supabase Auth JWT validation
- **Testing**: Vitest 4.0.18 (118 tests), Playwright (E2E + a11y)
- **Deployment**: Vercel (planned), currently local dev

## Architecture Patterns

### Service Layer Pattern (Preferred)
```typescript
// Direct MCP client when MCP_BASE_URL configured, fallback to proxy
if (MCP_BASE_URL) {
  try {
    const api = createApi()
    const data = await api.api.method()
    return unwrapApiResponse(data)
  } catch (e) {
    // Check for HTML payload (Cloudflare errors)
    if (await looksLikeHtmlPayload(e)) {
      // Fallback to proxy route
    }
  }
} else {
  return fetchWithFallback('/api/mcp/endpoint')
}
```

### Authentication (IN PROGRESS - Issue #66)
**Target**: Supabase Auth integration
- Client: `@supabase/supabase-js` + `@supabase/ssr`
- Auth routes: Thin wrappers to Supabase (magic links, password, OAuth)
- MCP calls: Include `Authorization: Bearer ${supabaseJWT}` header
- MCP server: Validates Supabase JWT via JWKS

**Current State**: Custom auth endpoints broken (AuthMagicLink table missing)
**Action**: Remove custom auth, integrate Supabase (see Issue #66)

## Quick start (issue-driven)
- Check repo issues: `gh issue list --repo bryan-debaun/bryandebaun.dev`
- Ensure a clear, testable issue exists. If not, draft one and ask before creating.
- Establish baseline: `git checkout main && git pull`; run `npm run build && npm test`

## Issue quality checklist
- Clear problem statement and scope
- Acceptance criteria (testable)
- Labels: `type:bug|feature|chore`, `priority:critical|high|medium|low`, `project:auth|content|ui`
- Task checklist for multi-step work
- Link to related issues when applicable

## Before starting work
1. Ensure clean working state and up-to-date `main`.
2. Establish a test baseline and record results.
3. Create a feature branch (e.g., `feature/[short-desc]`) and push upstream.

## Development workflow
- Work on a feature branch; never commit directly to `main`.
- Build and run tests frequently: `npm run build && npm test && npm run lint`
- Commit requirements:
  - ✅ Build succeeds (`npm run build`)
  - ✅ All tests pass (118 tests baseline)
  - ✅ Lint clean (`npm run lint`)
  - ✅ New tests added for new functionality
  - ✅ Types correct (strict TypeScript)
- Create a draft PR after first push: `gh pr create --draft --title "[title]" --body "[short description]"`.

## Key Commands
```bash
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build (Turbopack)
npm test             # Run Vitest tests
npm run test:watch   # Watch mode
npm run lint         # ESLint
npm run typecheck    # TypeScript validation
```

## Recent Work & Context

### Completed (2026-04-11)
- ✅ Fixed auth route mocks (12 tests) - updated to use `proxyCall` and API client
- ✅ Removed deprecated ratings service (3 files)
- ✅ Standardized API patterns in authors.ts and books page
- ✅ Simplified ServerAuthorRef type to match API client structure
- ✅ All 114 tests passing

### In Progress
- 🔄 Issue #66: Integrate Supabase Auth + cleanup legacy auth artifacts
  - Phase 1: Install Supabase packages, configure clients
  - Phase 2: Update auth routes, add callback handler
  - Phase 3: Remove legacy custom auth code
  - Phase 4: Standardize error handling and logging

### Blocked/Known Issues
- ⚠️ MCP Server Issue #89: Custom MagicLinkController broken (table missing)
  - **Root cause**: Migration dropped AuthMagicLink table but code still uses it
  - **Solution**: Remove custom auth, use Supabase Auth instead
  - **Status**: Waiting for client Supabase integration (#66)

## Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types (replace with proper types or `unknown`)
- Use generated types from `@bryandebaun/mcp-client` for MCP APIs

### Testing
- Mock external APIs (Supabase, MCP server)
- Test both success and error paths
- Use descriptive test names: `should [expected behavior] when [condition]`
- Aim for meaningful coverage, not just high percentages

### Error Handling
- Consistent error responses: `{ error: string }`
- Log errors with context (sanitize sensitive data)
- Use debug flags: `DEBUG_AUTH=1`, `DEBUG_MCP=1`

## Handoff templates
- Coder → Tester: Context, Related Issue, Files Changed, Areas Needing Tests
- Coder → Reviewer: PR link, Related Issue, Summary of Changes, Areas for Review
- Support → Coder: Context, Proposed Acceptance Criteria, Related Issue

## Branch & naming conventions
- Feature: `feature/[short-desc]`
- Fix: `fix/[short-desc]`
- Refactor: `refactor/[short-desc]`

## Customization notes
- Replace placeholders and add repo-specific fields as needed.