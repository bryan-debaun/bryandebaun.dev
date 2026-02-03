import type { BookWithAuthors, RatingWithDetails } from '@bryandebaun/mcp-client';

export type BookRow = BookWithAuthors & { averageRating?: number };
type ColumnDescriptor = {
    accessor?: keyof BookRow;
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
    // Compute accurate averages using grouping (coerce ids to strings for map keys).
    const sums = new Map<string, { sum: number; count: number }>();
    for (const r of ratings) {
        const id = String(r.bookId);
        const s = sums.get(id) ?? { sum: 0, count: 0 };
        s.sum += r.rating;
        s.count += 1;
        sums.set(id, s);
    }

    const avg = new Map<string, number>();
    for (const [k, v] of sums.entries()) {
        avg.set(k, v.sum / v.count);
    }

    return books.map((b) => {
        const br = b as BookWithAuthors & Partial<{ averageRating?: number }>;
        const a = typeof br.averageRating === 'number' && !Number.isNaN(br.averageRating) ? br.averageRating : avg.get(String(b.id));
        return { ...b, averageRating: a };
    });
}
