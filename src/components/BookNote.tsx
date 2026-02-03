export default function BookNote({ reading }: { reading?: string | { title?: string; author?: string } }) {
    if (!reading) return null;
    if (typeof reading === 'string') {
        return <div className="book-note">{reading}</div>;
    }
    return (
        <div className="book-note">
            <strong>{reading.title}</strong>
            {reading.author ? <div>by {reading.author}</div> : null}
        </div>
    );
} 
