import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import BooksTable from '@/components/BooksTable';
import { listBooks } from '@/lib/services/books';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const role = (user.user_metadata as Record<string, unknown> | undefined)
        ?.role;
    if (role !== 'admin') {
        redirect('/');
    }

    const books = await listBooks();

    return (
        <main className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Admin</h1>
            <section>
                <h2 className="text-xl font-semibold mb-4">Books</h2>
                <BooksTable books={books} isAdmin={true} />
            </section>
        </main>
    );
}
