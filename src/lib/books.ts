import type { BookWithAuthors, RatingWithDetails } from '@bryandebaun/mcp-client';
import { averageByKey } from './aggregates';

export type BookRow = BookWithAuthors & { averageRating?: number | null; status?: import('@bryandebaun/mcp-client').ItemStatus | string };
type ColumnDescriptor = {
    accessor?: keyof BookRow | string;
    header: string;
    id?: string;
    type?: "text" | "rating" | "actions";
};

export const bookColumnDescriptors: ColumnDescriptor[] = [
    { accessor: "title", header: "Title", type: "text" },
    { id: "authors", header: "Author(s)", type: "text" },
    { id: "rating", header: "Rating", type: "rating" },
    { accessor: "status", header: "Status", type: "text" },
    { id: "actions", header: "", type: "actions" },
];

export function generateBookRows(books: BookWithAuthors[], ratings: RatingWithDetails[]): BookRow[] {
    // Compute accurate averages using the shared helper which applies rounding to 0.1 precision.
    const avgByKey = averageByKey(ratings, (r) => r.bookId, (r) => r.rating);
    // averageByKey returns Map<number, number>

    return books.map((b) => {
        const br = b as BookWithAuthors & Partial<{ averageRating?: number }>;
        const fromRatings = avgByKey.get(b.id as number);
        const a = typeof br.averageRating === 'number' && !Number.isNaN(br.averageRating) ? br.averageRating : fromRatings;
        return { ...b, averageRating: a };
    });
}
