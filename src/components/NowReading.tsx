import { ItemStatus } from '@bryandebaun/mcp-client';
import { listBooks } from '@/lib/services/books';
import BookNote from './BookNote';

/**
 * "Now Reading" — books currently in progress.
 *
 * Historically this read a `reading` field from file-based philosophy
 * frontmatter (Contentlayer). The DB-backed Article model has no such field, so
 * this now sources the same UX from the books API: any book whose status is
 * `IN_PROGRESS`. Renders nothing when there are none (unchanged behavior).
 */
export default async function NowReading() {
    const books = await listBooks();
    const reading = books.filter((b) => b.status === ItemStatus.IN_PROGRESS);
    if (reading.length === 0) return null;
    return (
        <section>
            <h3>Now Reading</h3>
            <ul className="list-none pl-0">
                {reading.map((b) => (
                    <li key={b.id}>
                        <BookNote
                            reading={{
                                title: b.title,
                                author: b.authors?.[0]?.name,
                            }}
                        />
                    </li>
                ))}
            </ul>
        </section>
    );
}
