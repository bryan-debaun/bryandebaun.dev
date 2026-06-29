import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';
import ArticleEditor from '@/components/admin/ArticleEditor';
import { requireAdminPage } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export default async function NewArticlePage() {
    // SECURITY: server-side admin guard — non-admins are redirected before any
    // editor UI is sent to the browser.
    await requireAdminPage();

    return (
        <main className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Admin</h1>
            <AdminNav />
            <section>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">New article</h2>
                    <Link href="/admin/articles" className="text-sm underline">
                        Back to articles
                    </Link>
                </div>
                <ArticleEditor mode="create" />
            </section>
        </main>
    );
}
