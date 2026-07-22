import type { FAQItem } from '@/types'

/** Published-site FAQ list. */
export function FaqSection({ faqs }: { faqs: FAQItem[] }) {
  return (
    <section className="section-pad" id="faq" style={{ background: '#fff' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        <p className="label" style={{ textAlign: 'center' }}>Preguntas frecuentes</p>
        <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '3rem' }}>¿Tenés dudas?</h2>
        <div>
          {faqs.map((f) => (
            <div key={f.id} className="faq-item">
              <p className="faq-q">{f.question}</p>
              <p className="faq-a">{f.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
