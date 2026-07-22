import type { ReactNode } from 'react'
import type { SectionContact } from './types'

/**
 * Published-site contact block.
 *
 * The lead form arrives as a slot rather than being built here. Its element ids
 * are a contract with the delegated-submit script the shell emits, and its
 * endpoint is a server concern — both belong to whoever owns the document, not
 * to a presentational section. Everything around it (the layout, the contact
 * lines, the WhatsApp button) is plain markup and lives here.
 *
 * `whatsappNumber` is the already-digits-only number, because building the
 * wa.me URL from a raw, punctuated string is how you get a dead link.
 */
export function ContactSection({
  contact,
  whatsappNumber,
  leadForm,
}: {
  contact?: SectionContact
  whatsappNumber?: string
  leadForm: ReactNode
}) {
  return (
    <section className="section-pad" id="contacto" style={{ background: '#fff' }}>
      <div className="container">
        <p className="label" style={{ textAlign: 'center' }}>Contacto</p>
        <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '3rem' }}>Contactate con nosotros</h2>
        <div className="grid-2" style={{ maxWidth: '800px', margin: '0 auto', alignItems: 'start' }}>
          <div>
            {contact?.phone && (
              <a href={`tel:${contact.phone}`} className="contact-info-item" style={{ display: 'flex', color: '#475569', marginBottom: '1rem' }}>
                <span className="contact-info-icon">📞</span>
                <span>{contact.phone}</span>
              </a>
            )}
            {contact?.email && (
              <a href={`mailto:${contact.email}`} className="contact-info-item" style={{ display: 'flex', color: '#475569', marginBottom: '1rem' }}>
                <span className="contact-info-icon">✉️</span>
                <span>{contact.email}</span>
              </a>
            )}
            {(contact?.city || contact?.address) && (
              <div className="contact-info-item" style={{ display: 'flex', color: '#475569', marginBottom: '1rem' }}>
                <span className="contact-info-icon">📍</span>
                <span>{[contact.address, contact.city, contact.province].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {contact?.schedule && (
              <div className="contact-info-item" style={{ display: 'flex', color: '#475569', marginBottom: '1.5rem' }}>
                <span className="contact-info-icon">🕐</span>
                <span>{contact.schedule}</span>
              </div>
            )}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#25D366', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '9999px', fontWeight: 700, fontSize: '0.875rem', marginTop: '0.5rem' }}
              >
                💬 Escribinos por WhatsApp
              </a>
            )}
          </div>
          <div className="contact-form">
            <p style={{ fontWeight: 700, color: '#0f172a', marginBottom: '1rem', fontSize: '0.95rem' }}>Envianos un mensaje</p>
            {leadForm}
          </div>
        </div>
      </div>
    </section>
  )
}
