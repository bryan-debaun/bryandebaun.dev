# Authentication Requests Return 200 But Don't Reach Server

## Problem Statement

User `brn.dbn@gmail.com` cannot authenticate via either password login or magic link. Client logs show 200 success responses, but MCP server logs show NO corresponding requests. This indicates a critical routing, proxy, or middleware failure.

## Current Behavior

### Client Logs (Next.js dev server)

1. Password login attempt → 401 Unauthorized
2. Magic link request → **200 Success** with "success" log
3. All `/api/auth/me` calls → 401 (expected when not authenticated)

### Server Logs (MCP server)

```
incoming request: GET / authPresent=false
mcp-auth: auth failed { path: '/', ip: '127.0.0.1', got: 'none' }
```

**Critical Gap**: Server only logs a `GET /` request — no `/api/auth/password/login` or `/api/auth/magic-link/send` requests appear.

## Expected Behavior

When client POSTs to `/api/auth/magic-link`, the Next.js route should proxy to MCP server `POST /api/auth/magic-link/send`, and server should log:

- Incoming request details
- Email processing attempt
- Success/failure outcome

## Evidence

### Client Request Flow

```
POST /api/auth/magic-link
→ proxyCall() to api.api.send({ email })
→ Returns 200 with { status: "success" } or similar
→ Logs: "auth.magic-link: success { status: 200 }"
```

### Server Silence

- No request logged
- No email sent
- No error logged

## Hypotheses

1. **Route proxy not reaching server**
   - `proxyCall()` may be mocking response or hitting wrong endpoint
   - Generated API client method `api.api.send()` may target incorrect URL
   - Network/proxy issue preventing request from leaving Next.js server

2. **Server logging configuration**
   - MCP server may not log auth endpoints
   - Auth middleware may fail silently before logging

3. **Schema mismatch**
   - MCP tool error: `Unknown field 'role' for include statement on model Profile`
   - Indicates server schema has diverged from expected structure
   - May cause silent failures in auth flow

## Acceptance Criteria

- [ ] Identify where magic link request is failing (client proxy, network, server routing)
- [ ] Verify MCP server receives and logs all auth endpoint requests
- [ ] Confirm email sending functionality works when request reaches handler
- [ ] Fix schema mismatch causing MCP tool failures
- [ ] Verify user `brn.dbn@gmail.com` exists in database
- [ ] Successfully authenticate user via magic link
- [ ] Add instrumentation to prevent this class of silent failure

## Investigation Steps

1. **Verify API client configuration**
   - Check generated client method `api.api.send()` target URL
   - Confirm `baseURL` in route matches MCP server
   - Enable debug logging on client-side HTTP requests

2. **Check server-side routing**
   - Verify `/api/auth/magic-link/send` endpoint exists
   - Check middleware/auth guards for silent failures
   - Add comprehensive request logging

3. **Database verification**
   - Query for user with email `brn.dbn@gmail.com`
   - Verify Profile schema structure
   - Check if account exists but is in invalid state

4. **Network trace**
   - Use network inspector to confirm request leaves browser
   - Check server access logs for any incoming POST requests
   - Verify no proxy/firewall blocking

## Context

- Branch: `feature/fix-registration-associate-admin-64`
- Related work: Recently standardized auth routes to use `proxyCall()` and generated API client
- Environment: Local Next.js dev server → MCP server at `https://bad-mcp.onrender.com`
- Debug mode: `DEBUG_AUTH=1` (client-side logging enabled)
