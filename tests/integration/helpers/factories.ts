import type { APIRequestContext } from '@playwright/test';
import type {
    Book,
    BookWithAuthors,
    ListBooksResponse,
} from '@bryandebaun/mcp-client';
import { MCP_REQ_TIMEOUT } from '../fixtures/auth';

/**
 * Test-data factories + lifecycle management for the integration suite.
 *
 * NOTE on scope: the website exposes admin create/update/delete for **books**
 * (`/api/admin/books`, `/api/admin/books/[id]`) but only **create** for authors
 * (`/api/admin/authors` POST — there is no admin author update/delete route).
 * Because we cannot delete authors through the site, we deliberately do NOT
 * create authors here: every record this suite creates must be tearable-down so
 * we never orphan data on the prod MCP. Books CRUD is the symmetric surface.
 */

/** Prefix that marks a record as test-owned so the sweeper can find leftovers. */
export const E2E_PREFIX = '[e2e-';

/** Build the namespaced label for a given run, e.g. `[e2e-<runId>]`. */
export function e2eTag(runId: string): string {
    return `${E2E_PREFIX}${runId}]`;
}

/** True if a title/name was created by the integration suite (any run). */
export function isE2eRecord(label: string | undefined | null): boolean {
    return typeof label === 'string' && label.startsWith(E2E_PREFIX);
}

interface CreatedRecord {
    kind: 'book';
    id: number;
}

/**
 * Tracks every record a test creates and guarantees teardown. Construct one per
 * test (or per file) and call `cleanup()` in afterAll/afterEach — even on
 * failure — so no orphan `[e2e-` data is ever left on the prod MCP.
 */
export class TestData {
    private readonly created: CreatedRecord[] = [];

    constructor(
        private readonly admin: APIRequestContext,
        private readonly runId: string,
    ) {}

    /** Namespaced label for this test data's run. */
    tag(): string {
        return e2eTag(this.runId);
    }

    /**
     * Creates a book via `/api/admin/books`, namespaced + registered for
     * teardown. `suffix` disambiguates multiple records in one test.
     */
    async createBook(
        suffix = 'book',
        overrides: Record<string, unknown> = {},
    ): Promise<Book> {
        const title = `${this.tag()} ${suffix}`;
        const res = await this.admin.post('/api/admin/books', {
            data: { title, ...overrides },
            failOnStatusCode: false,
            timeout: MCP_REQ_TIMEOUT,
        });
        if (res.status() !== 201) {
            const body = await res.text().catch(() => '');
            throw new Error(
                `createBook expected 201, got ${res.status()}: ${body.slice(0, 200)}`,
            );
        }
        const book = (await res.json()) as Book;
        this.created.push({ kind: 'book', id: book.id });
        return book;
    }

    /** Manually register a book id (e.g. created indirectly) for teardown. */
    track(id: number): void {
        this.created.push({ kind: 'book', id });
    }

    /** Forget a book id once a test has deliberately deleted it. */
    untrack(id: number): void {
        const idx = this.created.findIndex((r) => r.id === id);
        if (idx >= 0) this.created.splice(idx, 1);
    }

    /**
     * Deletes every still-tracked record. Best-effort and idempotent: a record
     * a test already deleted (and untracked) is skipped; failures are collected
     * and surfaced so teardown problems are visible without aborting cleanup.
     */
    async cleanup(): Promise<void> {
        const errors: string[] = [];
        // Copy + clear first so a re-entrant cleanup is a no-op.
        const records = this.created.splice(0, this.created.length);
        for (const rec of records) {
            const path = `/api/admin/books/${rec.id}`;
            try {
                const res = await this.admin.delete(path, {
                    failOnStatusCode: false,
                    timeout: MCP_REQ_TIMEOUT,
                });
                const ok = res.status() === 204 || res.status() === 200;
                if (!ok) {
                    errors.push(`${path} -> ${res.status()}`);
                }
            } catch (e) {
                errors.push(`${path} -> ${(e as Error).message}`);
            }
        }
        if (errors.length > 0) {
            throw new Error(`cleanup failed for: ${errors.join('; ')}`);
        }
    }
}

/**
 * Removes stale `[e2e-` books left by crashed prior runs. Reads the public list
 * endpoint (which the website proxies to the MCP server), then deletes any
 * test-tagged book via the admin endpoint. Safe to run before a suite; returns
 * a count for logging.
 *
 * Authors are intentionally not swept: the site has no admin author delete, so
 * the suite never creates authors and there is nothing to reap.
 */
export async function sweepLeftovers(
    admin: APIRequestContext,
): Promise<{ books: number }> {
    let books = 0;

    const booksRes = await admin.get('/api/mcp/books?limit=200', {
        failOnStatusCode: false,
        timeout: MCP_REQ_TIMEOUT,
    });
    if (booksRes.ok()) {
        const data = (await booksRes.json()) as ListBooksResponse;
        const stale = (data.books ?? []).filter((b: BookWithAuthors) =>
            isE2eRecord(b.title),
        );
        for (const b of stale) {
            const del = await admin.delete(`/api/admin/books/${b.id}`, {
                failOnStatusCode: false,
                timeout: MCP_REQ_TIMEOUT,
            });
            if (del.status() === 204 || del.status() === 200) books += 1;
        }
    }

    return { books };
}
