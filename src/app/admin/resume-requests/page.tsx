import AdminNav from '@/components/admin/AdminNav';
import ResumeRequestsAdmin from '@/components/admin/ResumeRequestsAdmin';
import { requireAdminPage } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export default async function AdminResumeRequestsPage() {
    // SECURITY: app_metadata-based guard (same secure logic as the API
    // `requireAdmin`). Redirects unauthenticated → /login, non-admin → /.
    await requireAdminPage();

    return (
        <main className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Admin</h1>
            <AdminNav />
            <section aria-label="Résumé requests">
                <ResumeRequestsAdmin />
            </section>
        </main>
    );
}
