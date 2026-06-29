import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';
import ArticleEditor from '@/components/admin/ArticleEditor';
import { requireAdminPage } from '@/lib/auth-guard';
import { getAdminArticleBySlug } from '@/lib/services/admin-articles';

export const dynamic = 'force-dynamic';

export default async function EditArticlePage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    // SECURITY: server-side admin guard before loading the (possibly draft)
    // article — non-admins are redirected and never see draft content.
    await requireAdminPage();

    const { slug } = await params;
    const article = await getAdminArticleBySlug(slug);
    if (!article) {
        notFound();
    }

    return (
        <main className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Admin</h1>
            <AdminNav />
            <section>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Edit article</h2>
                    <Link href="/admin/articles" className="text-sm underline">
                        Back to articles
                    </Link>
                </div>
                <ArticleEditor mode="edit" article={article} />
            </section>
        </main>
    );
}
