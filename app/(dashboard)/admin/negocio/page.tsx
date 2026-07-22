import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { getWebsitePlanConfig } from '@/lib/website-plans'
import {
  ADMIN_OVERVIEW_PROJECT_CAP,
  summarizeProjects,
  type AdminProjectRow,
  type AdminProjectView,
} from '@/lib/admin-overview'

/**
 * /admin/negocio — the row-by-row view of the website generator's billing.
 *
 * DIVISION OF LABOUR WITH /admin, stated so nobody has to guess:
 *
 *   /admin         owns the NUMBERS. MRR, live split, payment problems, trials,
 *                  sign-ups, cancellations, plus the action list and the
 *                  customer roster.
 *   /admin/negocio owns the ROWS. Which sites exactly are live, and which ones
 *                  exactly have a payment problem — with the provenance and the
 *                  reason for each. It is where the overview's "N sitios
 *                  caídos" and "N en gracia" rows link to.
 *
 * The three summary tiles this page used to carry (live sites, MRR, payment
 * problems) were removed rather than duplicated: two pages printing the same
 * figure is two chances to print different figures. Both pages now derive
 * everything from summarizeProjects() in lib/admin-overview.ts, so the counts on
 * /admin and the rows here are the same computation.
 *
 * Same gate as every other /admin/* page: server-side requireAdmin() + 404 for
 * non-admins (see app/(dashboard)/admin/layout.tsx). The layout already gates
 * the whole subtree, but each page re-checks independently on purpose — a
 * layout is not a reliable authorization boundary on its own.
 *
 * Query budget: 1. One capped findMany, twelve scalar columns.
 */
export const dynamic = 'force-dynamic'

function statusBadge(view: AdminProjectView): { label: string; className: string } {
  if (view.cancelled) return { label: 'cancelado', className: 'bg-surface-100 text-surface-600 border-surface-200' }
  switch (view.effective) {
    case 'active':
      return { label: 'activo', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'grace':
      return {
        label: view.graceDaysLeft === null ? 'gracia' : `gracia · ${view.graceDaysLeft}d`,
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      }
    case 'suspended':
      return { label: 'suspendido', className: 'bg-rose-50 text-rose-700 border-rose-200' }
  }
}

const PROVENANCE_LABEL: Record<AdminProjectView['provenance'], string> = {
  sale: 'Venta',
  gift: 'Regalado',
  coupon: 'Cupón 100%',
}

function BillingTable({ rows, empty }: { rows: AdminProjectView[]; empty: string }) {
  return (
    <div className="rounded-2xl bg-white border border-surface-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-surface-400 border-b border-surface-100">
            <th className="px-4 py-3 font-medium">Propietario</th>
            <th className="px-4 py-3 font-medium">Sitio</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Origen</th>
            <th className="px-4 py-3 font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-surface-400">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((r) => {
            const badge = statusBadge(r)
            return (
              <tr key={r.id} className="border-b border-surface-50 last:border-0">
                <td className="px-4 py-3 text-surface-700">{r.ownerEmail}</td>
                <td className="px-4 py-3 text-surface-700">{r.subdomain ?? r.slug}</td>
                <td className="px-4 py-3 text-surface-700">
                  {getWebsitePlanConfig(r.plan)?.name ?? r.plan}
                </td>
                <td className="px-4 py-3 text-surface-500 text-xs">{PROVENANCE_LABEL[r.provenance]}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${badge.className}`}>
                    {badge.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default async function AdminNegocioPage() {
  const session = await requireAdmin()
  if (!session) notFound()

  // Read-only. Only the website generator (Project model) and only rows that
  // ever completed a payment — free/never-paid drafts are irrelevant to live
  // sites and payment problems, and excluding them keeps the set small.
  // No secrets selected (no preapprovalId, no tokens): owner email + billing
  // facts only.
  const projects = await prisma.project.findMany({
    where: { hasPaid: true },
    select: {
      id: true,
      name: true,
      slug: true,
      subdomain: true,
      status: true,
      plan: true,
      hasPaid: true,
      billingStatus: true,
      graceUntil: true,
      suspendedReason: true,
      grantedBy: true,
      couponId: true,
      createdAt: true,
      user: { select: { email: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: ADMIN_OVERVIEW_PROJECT_CAP,
  })

  const rows: AdminProjectRow[] = projects.map((p) => ({ ...p, ownerEmail: p.user.email }))
  // Grace expiry is applied in JS (not in the WHERE clause) because it is
  // derived at read time from graceUntil — the stored billingStatus column can
  // be stale with no scheduler to fix it.
  const summary = summarizeProjects(rows, (planId) => getWebsitePlanConfig(planId)?.monthly ?? 0)

  const problems = [...summary.grace, ...summary.suspendedForPayment]

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Negocio</h1>
        <p className="text-sm text-surface-500 mb-8">
          Detalle fila por fila del generador de sitios (solo lectura). Los totales, el MRR y lo que necesita
          atención están en{' '}
          <Link href="/admin" className="text-brand-600 underline underline-offset-2">
            Resumen
          </Link>
          .
        </p>

        {summary.capped && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-6">
            Mostrando los primeros {ADMIN_OVERVIEW_PROJECT_CAP} proyectos pagos (límite de la consulta).
          </p>
        )}

        <section className="mb-8">
          <h2 className="text-base font-semibold text-surface-900 mb-3">
            Sitios en vivo ({summary.live.length})
          </h2>
          <BillingTable rows={summary.live} empty="Sin sitios en vivo." />
        </section>

        <section className="mb-8">
          <h2 className="text-base font-semibold text-surface-900 mb-3">
            Pagos con problema ({problems.length})
          </h2>
          <BillingTable rows={problems} empty="Sin pagos con problema." />
        </section>

        <section>
          <h2 className="text-base font-semibold text-surface-900 mb-3">
            Cancelados ({summary.cancelledProjects.length})
          </h2>
          <p className="text-xs text-surface-400 mb-3">
            Bajas pedidas por el propietario. Se listan aparte porque no hay nada que reclamar.
          </p>
          <BillingTable rows={summary.cancelledProjects} empty="Sin bajas." />
        </section>
      </div>
    </div>
  )
}
