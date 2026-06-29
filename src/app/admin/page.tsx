import BooksTable from '@/components/BooksTable';
import AdminNav from '@/components/admin/AdminNav';
import { requireAdminPage } from '@/lib/auth-guard';
import { listBooks } from '@/lib/services/books';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    // SECURITY: app_metadata-based guard inside requireAdminPage(). Redirects
    // non-admins. The role is NEVER read from the user-editable metadata bag,
    // which would be a privilege-escalation bug.
    await requireAdminPage();

    const books = await listBooks();

    return (
        <main className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Admin</h1>
            <AdminNav />
            <section aria-label="Books">
                <BooksTable books={books} isAdmin={true} />
            </section>
        </main>
    );
}
