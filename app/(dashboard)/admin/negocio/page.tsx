import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { effectiveBillingStatus, type BillingStatus } from '@/lib/project-billing'
import { getWebsitePlanConfig, formatARS } from '@/lib/website-plans'

// Same gate as every other /admin/* page: server-side requireAdmin() + 404 for
// non-admins (see app/(dashboard)/admin/layout.tsx). The layout already gates
// the whole /admin subtree, but each page re-checks independently on purpose —
// a layout is not a reliable authorization boundary on its own.
export const dynamic = 'force-dynamic'

// Defensive cap. The Project table (the website generator) is small today, but
// an unbounded findMany on a growing table is a latent problem, so we cap and
// surface when the cap is reached instead of silently truncating.
const MAX_ROWS = 500

type PanelRow = {
  id: string
  slug: string
  subdomain: string | null
  status: string
  plan: string
  hasPaid: boolean
  grantedBy: string | null
  ownerEmail: string
  effective: BillingStatus
}

function statusBadge(effective: BillingStatus): string {
  switch (effective) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'grace':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'suspended':
      return 'bg-rose-50 text-rose-700 border-rose-200'
  }
}

export default async function AdminNegocioPage() {
  const session = await requireAdmin()
  if (!session) notFound()

  // Read-only. Only the website generator (Project model) and only rows that
  // ever completed a payment — free/never-paid drafts are irrelevant to live
  // sites, MRR and payment problems, and excluding them keeps the set small.
  // No secrets selected (no preapprovalId, no tokens): owner email + billing
  // facts only.
  const projects = await prisma.project.findMany({
    where: { hasPaid: true },
    select: {
      id: true,
      slug: true,
      subdomain: true,
      status: true,
      plan: true,
      hasPaid: true,
      billingStatus: true,
      graceUntil: true,
      grantedBy: true,
      user: { select: { email: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: MAX_ROWS,
  })

  const now = new Date()
  const capped = projects.length === MAX_ROWS

  // effectiveBillingStatus is applied in JS (not in the WHERE clause) because
  // grace expiry is derived at read time from graceUntil — the stored
  // billingStatus column can be stale with no scheduler to fix it.
  const rows: PanelRow[] = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    subdomain: p.subdomain,
    status: p.status,
    plan: p.plan,
    hasPaid: p.hasPaid,
    grantedBy: p.grantedBy,
    ownerEmail: p.user.email,
    effective: effectiveBillingStatus(p, now),
  }))

  // Live sites: published + paid + billing active OR still in grace. Mirrors the
  // public publish gate in lib/published-site.ts.
  const live = rows.filter(
    (r) => r.status === 'published' && r.hasPaid && (r.effective === 'active' || r.effective === 'grace')
  )

  // MRR estimate: monthly list price summed over active paid projects. Gifted
  // projects (grantedBy set) contribute 0 — they generate no revenue. It is an
  // estimate: Project does not store billing cadence, so annual subscribers are
  // counted at the monthly list price rather than their lower monthly-equivalent.
  const activePaid = rows.filter((r) => r.hasPaid && r.effective === 'active')
  const mrr = activePaid.reduce((sum, r) => {
    if (r.grantedBy) return sum
    return sum + (getWebsitePlanConfig(r.plan)?.monthly ?? 0)
  }, 0)
  const giftedActive = activePaid.filter((r) => r.grantedBy).length

  // Payment problems: grace (charge failed, still within window) and suspended
  // (grace elapsed or cancelled).
  const grace = rows.filter((r) => r.effective === 'grace')
  const suspended = rows.filter((r) => r.effective === 'suspended')

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Negocio</h1>
        <p className="text-sm text-surface-500 mb-8">
          Panel operativo del generador de sitios (solo lectura).
        </p>

        {/* Summary tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-white border border-surface-200 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-surface-400 mb-1">Sitios en vivo</p>
            <p className="text-3xl font-bold text-surface-900">{live.length}</p>
          </div>
          <div className="rounded-2xl bg-white border border-surface-200 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-surface-400 mb-1">MRR estimado</p>
            <p className="text-3xl font-bold text-surface-900">{formatARS(mrr)}</p>
            <p className="text-[11px] text-surface-400 mt-1">
              {activePaid.length - giftedActive} pagos activos · {giftedActive} regalados (0)
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-surface-200 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-surface-400 mb-1">Pagos con problema</p>
            <p className="text-3xl font-bold text-surface-900">{grace.length + suspended.length}</p>
            <p className="text-[11px] text-surface-400 mt-1">
              {grace.length} en gracia · {suspended.length} suspendidos
            </p>
          </div>
        </div>

        {capped && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-6">
            Mostrando los primeros {MAX_ROWS} proyectos pagos (límite de la consulta).
          </p>
        )}

        {/* Live sites */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-surface-900 mb-3">Sitios en vivo ({live.length})</h2>
          <div className="rounded-2xl bg-white border border-surface-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-surface-400 border-b border-surface-100">
                  <th className="px-4 py-3 font-medium">Propietario</th>
                  <th className="px-4 py-3 font-medium">Sitio</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {live.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-surface-400">Sin sitios en vivo.</td></tr>
                )}
                {live.map((r) => (
                  <tr key={r.id} className="border-b border-surface-50 last:border-0">
                    <td className="px-4 py-3 text-surface-700">{r.ownerEmail}</td>
                    <td className="px-4 py-3 text-surface-700">{r.subdomain ?? r.slug}</td>
                    <td className="px-4 py-3 text-surface-700">
                      {getWebsitePlanConfig(r.plan)?.name ?? r.plan}
                      {r.grantedBy && <span className="ml-1 text-[11px] text-violet-600">(regalado)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${statusBadge(r.effective)}`}>
                        {r.effective}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment problems */}
        <section>
          <h2 className="text-base font-semibold text-surface-900 mb-3">
            Pagos con problema ({grace.length + suspended.length})
          </h2>
          <div className="rounded-2xl bg-white border border-surface-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-surface-400 border-b border-surface-100">
                  <th className="px-4 py-3 font-medium">Propietario</th>
                  <th className="px-4 py-3 font-medium">Sitio</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {grace.length + suspended.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-6 text-center text-surface-400">Sin pagos con problema.</td></tr>
                )}
                {[...grace, ...suspended].map((r) => (
                  <tr key={r.id} className="border-b border-surface-50 last:border-0">
                    <td className="px-4 py-3 text-surface-700">{r.ownerEmail}</td>
                    <td className="px-4 py-3 text-surface-700">{r.subdomain ?? r.slug}</td>
                    <td className="px-4 py-3 text-surface-700">{getWebsitePlanConfig(r.plan)?.name ?? r.plan}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${statusBadge(r.effective)}`}>
                        {r.effective}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
