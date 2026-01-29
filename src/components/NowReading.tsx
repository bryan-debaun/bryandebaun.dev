import { allPhilosophies } from 'contentlayer/generated'
import { publicOnly } from '@/lib/content'
import BookNote from './BookNote'

export default function NowReading() {
    const items = publicOnly(allPhilosophies).filter((p) => p.reading)
    if (items.length === 0) return null
    return (
        <section>
            <h3>Now Reading</h3>
            <ul>
                {items.map((p) => (
                    <li key={p._id}>
                        <BookNote reading={p.reading} />
                        {p.title ? <div className="text-sm">— {p.title}</div> : null}
                    </li>
                ))}
            </ul>
        </section>
    )
}
