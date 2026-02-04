import BooksTable from '@/components/BooksTable';


export default async function Page() {
    // Server-side fetch to our API routes via services
    const [books, ratings] = await Promise.all([
        import('@/lib/services/books').then(m => m.listBooks()),
        import('@/lib/services/ratings').then(m => m.listRatings()),
    ]);


    return (
        <main className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Books</h1>
            </div>

            <BooksTable books={books} ratings={ratings} />
        </main>
    );
}

