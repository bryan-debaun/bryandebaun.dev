import { CONTACT_EMAIL } from '@/lib/contact';
import type { Metadata } from 'next';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
    title: 'Contact — Bryan DeBaun',
    description:
        'Get in touch with Bryan DeBaun — send a message or reach out by email.',
};

export default function ContactPage() {
    return (
        <div className="max-w-xl mx-auto">
            <div className="prose prose-norwegian dark:prose-invert max-w-none">
                <h2>Contact</h2>
                <p>
                    Have a question, an idea, or just want to say hello? Send a
                    note below and I&apos;ll get back to you. You can also email
                    me directly at{' '}
                    <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
                </p>
            </div>

            <div className="mt-6">
                <ContactForm />
            </div>
        </div>
    );
}
