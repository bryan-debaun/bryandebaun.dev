import type { BookWithAuthors } from '@bryandebaun/mcp-client';
import { ItemStatus } from '@bryandebaun/mcp-client';

export function mergeBook(existing: BookWithAuthors, updated: Partial<BookWithAuthors>): BookWithAuthors {
    // Preserve derived fields like averageRating if not supplied by server
    return { ...existing, ...updated } as BookWithAuthors;
}

export function toggledStatus(current?: ItemStatus | string): ItemStatus {
    const s = current as ItemStatus | undefined;
    return s === ItemStatus.COMPLETED ? ItemStatus.NOT_STARTED : ItemStatus.COMPLETED;
}
