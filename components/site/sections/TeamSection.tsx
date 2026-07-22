import type { SectionTeamMember } from './types'

/**
 * Published-site team grid.
 *
 * Each member's `photo` is already validated by the caller, so `null` here
 * means "no usable photo" and the initial avatar takes over — the component
 * never has to judge whether a URL is safe to render.
 */
export function TeamSection({
  members,
  color,
}: {
  members: SectionTeamMember[]
  color: string
}) {
  return (
    <section className="section-pad" id="equipo" style={{ background: '#f8fafc' }}>
      <div className="container">
        <p className="label" style={{ textAlign: 'center' }}>El equipo</p>
        <h2 className="heading-lg" style={{ textAlign: 'center', marginBottom: '3rem' }}>Conocé a nuestro equipo</h2>
        <div className="grid-3">
          {members.map((m) => (
            <div key={m.id} className="card team-member-card">
              {m.photo
                ? <img className="team-photo" src={m.photo} alt={m.name} />
                : <div className="team-avatar">{m.name?.[0] ?? '?'}</div>}
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', marginBottom: '0.25rem' }}>{m.name}</h3>
              <p style={{ fontSize: '0.8rem', color, fontWeight: 600, marginBottom: '0.75rem' }}>{m.role}</p>
              {m.bio && <p className="subtext" style={{ fontSize: '0.875rem' }}>{m.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
