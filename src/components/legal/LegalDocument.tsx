import Link from 'next/link';
import type { LegalDocument as LegalDocumentType } from '@/lib/legal/types';

function withPrivacyLink(text: string) {
  const marker = 'Privacy Policy';
  const idx = text.indexOf(marker);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <Link href="/privacy" className="font-semibold underline underline-offset-2 hover:opacity-80">
        {marker}
      </Link>
      {text.slice(idx + marker.length)}
    </>
  );
}

export default function LegalDocument({ doc }: { doc: LegalDocumentType }) {
  const otherHref = doc.slug === 'terms' ? '/privacy' : '/terms';
  const otherLabel = doc.slug === 'terms' ? 'Privacy Policy' : 'Terms and Conditions';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f8f6' }}>
      <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Legal</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">{doc.title}</h1>
        <p className="text-sm text-slate-500 mb-6">Effective date: {doc.effectiveDate}</p>

        <div className="mb-8">
          <Link
            href={otherHref}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            View {otherLabel}
          </Link>
        </div>

        <article className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm">
          {doc.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="text-sm text-slate-600 leading-relaxed mb-4">
              {withPrivacyLink(paragraph)}
            </p>
          ))}

          <div className="mt-8 space-y-8">
            {doc.sections.map((section) => (
              <section key={section.number} id={`section-${section.number}`}>
                <h2 className="text-base font-extrabold text-slate-900 mb-3">
                  {section.number}. {section.title}
                </h2>
                <div className="space-y-3">
                  {section.blocks.map((block, i) => {
                    if (block.type === 'p') {
                      return (
                        <p key={i} className="text-sm text-slate-600 leading-relaxed">
                          {withPrivacyLink(block.text)}
                        </p>
                      );
                    }
                    if (block.type === 'ul') {
                      return (
                        <ul key={i} className="list-disc pl-5 space-y-2">
                          {block.items.map((item) => (
                            <li key={item} className="text-sm text-slate-600 leading-relaxed">
                              {item}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className="rounded-xl border border-amber-200 px-4 py-3"
                        style={{ backgroundColor: 'rgba(217,119,6,0.08)' }}
                      >
                        <p className="text-sm font-extrabold text-amber-800 mb-1">{block.title}</p>
                        <p className="text-sm text-amber-900/80 leading-relaxed">{block.text}</p>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100">
            <p className="text-sm font-extrabold text-slate-900 mb-1">{doc.contact.company}</p>
            {doc.contact.extra && (
              <p className="text-sm text-slate-500 mb-1">{doc.contact.extra}</p>
            )}
            <p className="text-sm text-slate-500">
              Email:{' '}
              <a
                href={`mailto:${doc.contact.email}`}
                className="font-semibold hover:underline"
                style={{ color: '#112116' }}
              >
                {doc.contact.email}
              </a>
            </p>
            <p className="text-sm text-slate-500">
              Website:{' '}
              <a
                href={doc.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: '#112116' }}
              >
                {doc.contact.website.replace(/^https?:\/\//, '')}
              </a>
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
