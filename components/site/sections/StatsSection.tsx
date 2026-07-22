import type { BusinessStat } from '@/types'

/**
 * Published-site figures band.
 *
 * Owner-supplied only. There is deliberately no default set of numbers to fall
 * back to: an invented "+500 clientes" on a client's live site is deceptive
 * advertising the business owner would be liable for.
 */
export function StatsSection({ stats }: { stats: BusinessStat[] }) {
  return (
    <section className="section-pad-sm stats-section">
      <div className="container">
        <div className="grid-4" style={{ textAlign: 'center' }}>
          {stats.map((st) => (
            <div key={st.id}>
              <div className="stat-number">{st.number}</div>
              <div className="stat-label">{st.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
