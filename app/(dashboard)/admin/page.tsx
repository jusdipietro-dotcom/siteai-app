import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertTriangle, Clock, Inbox, Trash2, CheckCircle2 } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { getWebsitePlanConfig, formatARS } from '@/lib/website-plans'
import {
  ADMIN_OVERVIEW_PAGE_SIZE,
  ADMIN_OVERVIEW_PROJECT_CAP,
  buildAttentionItems,
  buildCustomerRows,
  clampOverviewPage,
  currentMonthRange,
  isAllClear,
  overviewPageCount,
  pageSlice,
  summarizeProjects,
  type AdminProjectRow,
  type AdminProjectView,
  type AttentionKind,
} from '@/lib/admin-overview'
import { countTrialsExpiringSoon } from '@/lib/admin-queries'

/**
 * /admin — the first screen. It answers one question: what needs my attention
 * today?
 *
 * Order is the feature. Problems first and ONLY when they exist; then the
 * numbers; then one row per customer. A grid of cards reading "0 suspended,
 * 0 in grace, 0 unread" looks identical to a page that failed to load, so
 * nothing here renders a zero as if it were a finding — when nothing is wrong
 * the page says so in one line.
 *
 * Same gate as every other /admin/* page: server-side requireAdmin() + 404 for
 * non-admins. The layout already gates the subtree; this re-checks on purpose,
 * because a layout is not a reliable authorization boundary on its own.
 *
 * ── WHAT IS NOT ON THIS PAGE, AND WHY ──────────────────────────────────────
 * "Visitas 30 días". `Project.views` is a cumulative counter with no time
 * dimension, and no per-visit table exists anywhere in the schema. A 30-day
 * figure cannot be derived from it, so there is no visits column at all —
 * neither a real one nor a plausible-looking approximation.
 *
 * Cancellations of the twelve subscription products. Those rows carry
 * `status: 'cancelled'` but no cancellation timestamp, and `updatedAt` moves on
 * any write. Only site cancellations can be dated, and the tile says exactly
 * that rather than implying it covers every product.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * QUERY BUDGET — 19 per load, all bounded, none of them N+1:
 *   1   paying projects, capped, 12 scalar columns  (MRR, live split, problems,
 *       attention rows and the roster all derive from this one read)
 *   2   leads per project        — groupBy, scoped to those project ids
 *   3   unread per project       — groupBy, same scope
 *   4   unread leads overall     — count
 *   5   accounts past their purge deadline — count
 *   6   sign-ups this month      — count
 *   7   site cancellations this month — count
 *   8-19 trials expiring in 7 days — 12 counts, one per subscription product
 */
export const dynamic = 'force-dynamic'

const ATTENTION_COPY: Record<
  AttentionKind,
  { icon: typeof AlertTriangle; tone: string; label: (n: number) => string; href: string | null; action: string }
> = {
  suspended_payment: {
    icon: AlertTriangle,
    tone: 'border-rose-200 bg-rose-50 text-rose-900',
    label: (n) => `${n} ${n === 1 ? 'sitio caído' : 'sitios caídos'} por falta de pago`,
    href: '/admin/negocio',
    action: 'Ver el detalle de cada uno',
  },
  grace: {
    icon: Clock,
    tone: 'border-amber-200 bg-amber-50 text-amber-900',
    label: (n) => `${n} ${n === 1 ? 'sitio' : 'sitios'} en período de gracia`,
    href: '/admin/negocio',
    action: 'Siguen online hasta que venza el plazo',
  },
  unread_leads: {
    icon: Inbox,
    tone: 'border-blue-200 bg-blue-50 text-blue-900',
    label: (n) => `${n} ${n === 1 ? 'lead sin leer' : 'leads sin leer'} en sitios de clientes`,
    // The lead inbox belongs to the site owner and an admin cannot open it
    // (app/(dashboard)/projects/[id]/leads gates on userId). The actionable
    // thing here is knowing WHICH customer to nudge, which is the roster below.
    href: '#clientes',
    action: 'Ver a qué cliente avisarle',
  },
  purge_due: {
    icon: Trash2,
    tone: 'border-violet-200 bg-violet-50 text-violet-900',
    label: (n) => `${n} ${n === 1 ? 'cuenta pasó' : 'cuentas pasaron'} su plazo de borrado`,
    // There is no page for this. The purge runs from a route handler and
    // nothing else invokes it, so naming the endpoint is the honest link.
    href: null,
    action: 'Se purgan con POST /api/admin/expire-trials',
  },
}

function statusBadge(view: AdminProjectView): { label: string; className: string } {
  if (!view.hasPaid) return { label: 'sin pago', className: 'bg-surface-100 text-surface-600 border-surface-200' }
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

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams?: { page?: string }
}) {
  const session = await requireAdmin()
  if (!session) notFound()

  const now = new Date()
  const month = currentMonthRange(now)

  // ── Query 1 ───────────────────────────────────────────────────────────────
  // Every paying project, capped. This single read feeds the attention rows,
  // MRR, the live split, the payment problems AND the roster — which is why the
  // page costs 19 queries instead of one per section. `hasPaid: true` is the
  // definition of "customer": a never-paid draft is a sign-up, not a client,
  // and it can never be published or receive a lead.
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
  const summary = summarizeProjects(
    rows,
    (planId) => getWebsitePlanConfig(planId)?.monthly ?? 0,
    now
  )

  const projectIds = rows.map((r) => r.id)

  // ── Queries 2-19 ──────────────────────────────────────────────────────────
  const [
    leadsGrouped,
    unreadGrouped,
    unreadLeads,
    purgeDue,
    signupsThisMonth,
    siteCancellationsThisMonth,
    trialsExpiringSoon,
  ] = await Promise.all([
    // Aggregates, not rows: the roster shows counts, so counts are what is read.
    // Scoped to the ids already in hand, so the result set is bounded by the
    // same cap as query 1 rather than by the size of SiteLead.
    projectIds.length
      ? prisma.siteLead.groupBy({ by: ['projectId'], where: { projectId: { in: projectIds } }, _count: { _all: true } })
      : Promise.resolve([] as { projectId: string; _count: { _all: number } }[]),
    projectIds.length
      ? prisma.siteLead.groupBy({
          by: ['projectId'],
          where: { projectId: { in: projectIds }, status: 'new' },
          _count: { _all: true },
        })
      : Promise.resolve([] as { projectId: string; _count: { _all: number } }[]),
    // Deliberately NOT the sum of the groupBy above: that one is capped at the
    // first 500 paying projects, and the attention row has to be exact.
    prisma.siteLead.count({ where: { status: 'new' } }),
    // The same predicate the purge sweep uses (findAccountsDueForPurge).
    prisma.user.count({ where: { deletionScheduledFor: { lte: now }, deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: month.start, lt: month.end } } }),
    // Only deliberate cancellations, and only sites: `suspendedAt` is the one
    // dated cancellation column in the schema.
    prisma.project.count({
      where: { suspendedReason: 'cancelled', suspendedAt: { gte: month.start, lt: month.end } },
    }),
    countTrialsExpiringSoon(now),
  ])

  const leadsByProject = new Map(leadsGrouped.map((g) => [g.projectId, g._count._all]))
  const unreadByProject = new Map(unreadGrouped.map((g) => [g.projectId, g._count._all]))

  const attention = buildAttentionItems({
    suspendedForPayment: summary.suspendedForPayment.length,
    grace: summary.grace.length,
    unreadLeads,
    purgeDue,
  })

  const customers = buildCustomerRows(summary.rows, leadsByProject, unreadByProject)
  const page = clampOverviewPage(searchParams?.page, customers.length)
  const pageCount = overviewPageCount(customers.length)
  const visible = pageSlice(customers, page)

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Resumen</h1>
        <p className="text-sm text-surface-500 mb-8">
          Qué necesita atención hoy. Para el detalle fila por fila de cobros y sitios,{' '}
          <Link href="/admin/negocio" className="text-brand-600 underline underline-offset-2">
            Negocio
          </Link>
          .
        </p>

        {/* ── a) What needs action ─────────────────────────────────────────── */}
        <section className="mb-10" aria-labelledby="atencion">
          <h2 id="atencion" className="text-base font-semibold text-surface-900 mb-3">
            Para hacer
          </h2>

          {isAllClear(attention) ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Todo en orden. Ningún cobro caído, ninguna gracia venciendo, ningún lead sin leer.</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {attention.map((item) => {
                const copy = ATTENTION_COPY[item.kind]
                const Icon = copy.icon
                const body = (
                  <>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="font-medium">{copy.label(item.count)}</span>
                    <span className="ml-auto text-xs opacity-70">{copy.action}</span>
                  </>
                )
                return (
                  <li key={item.kind}>
                    {copy.href ? (
                      <Link
                        href={copy.href}
                        className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm hover:brightness-95 transition ${copy.tone}`}
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${copy.tone}`}>
                        {body}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {/* Grace is the only attention row with a per-site deadline, and the
              deadline is the actionable part. */}
          {summary.grace.length > 0 && (
            <ul className="mt-2 space-y-1 pl-4 text-xs text-surface-500">
              {summary.grace.map((g) => (
                <li key={g.id}>
                  <span className="font-mono">{g.subdomain ?? g.slug}</span> ({g.ownerEmail}) —{' '}
                  {g.graceDaysLeft === 0
                    ? 'vence hoy'
                    : `${g.graceDaysLeft} ${g.graceDaysLeft === 1 ? 'día' : 'días'} restantes`}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── b) Numbers ───────────────────────────────────────────────────── */}
        <section className="mb-10" aria-labelledby="numeros">
          <h2 id="numeros" className="text-base font-semibold text-surface-900 mb-3">
            Números
          </h2>

          {summary.capped && (
            <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Calculado sobre los primeros {ADMIN_OVERVIEW_PROJECT_CAP} proyectos pagos. Con más que eso, estos
              totales quedan cortos.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-surface-200 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-surface-400 mb-1">MRR estimado</p>
              <p className="text-3xl font-bold text-surface-900">{formatARS(summary.mrr)}</p>
              <p className="text-[11px] text-surface-400 mt-1">
                Precio de lista mensual de los sitios activos vendidos. Regalados y cupones 100% suman 0. Es
                estimado: el plan anual se cuenta al precio mensual porque no guardamos la modalidad de cobro.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-surface-200 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-surface-400 mb-1">Sitios en vivo</p>
              <p className="text-3xl font-bold text-surface-900">{summary.live.length}</p>
              <p className="text-[11px] text-surface-400 mt-1">
                {summary.livePaid} pagos · {summary.liveGifted} regalados
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-surface-200 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-surface-400 mb-1">
                Pagos con problema
              </p>
              <p className="text-3xl font-bold text-surface-900">
                {summary.grace.length + summary.suspendedForPayment.length}
              </p>
              <p className="text-[11px] text-surface-400 mt-1">
                {summary.grace.length} en gracia · {summary.suspendedForPayment.length} caídos.{' '}
                {summary.cancelledProjects.length} cancelados aparte (no son un problema a resolver).
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-surface-200 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-surface-400 mb-1">
                Pruebas que vencen en 7 días
              </p>
              <p className="text-3xl font-bold text-surface-900">{trialsExpiringSoon}</p>
              <p className="text-[11px] text-surface-400 mt-1">
                Sobre los 12 productos con suscripción. El generador de sitios no tiene prueba gratis.
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-surface-200 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-surface-400 mb-1">
                Altas este mes
              </p>
              <p className="text-3xl font-bold text-surface-900">{signupsThisMonth}</p>
              <p className="text-[11px] text-surface-400 mt-1">Cuentas creadas desde el 1° del mes.</p>
            </div>

            <div className="rounded-2xl bg-white border border-surface-200 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-surface-400 mb-1">
                Bajas de sitios este mes
              </p>
              <p className="text-3xl font-bold text-surface-900">{siteCancellationsThisMonth}</p>
              <p className="text-[11px] text-surface-400 mt-1">
                Solo sitios: es la única baja con fecha en la base. Las suscripciones cancelan sin registrar
                cuándo, así que no entran en este número.
              </p>
            </div>
          </div>
        </section>

        {/* ── c) One row per customer ──────────────────────────────────────── */}
        <section id="clientes" aria-labelledby="clientes-title">
          <div className="flex items-baseline gap-3 mb-3">
            <h2 id="clientes-title" className="text-base font-semibold text-surface-900">
              Clientes ({customers.length})
            </h2>
            <p className="text-xs text-surface-400">
              Ordenados por leads sin leer. Sin columna de visitas: ver nota abajo.
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-surface-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-surface-400 border-b border-surface-100">
                  <th className="px-4 py-3 font-medium">Propietario</th>
                  <th className="px-4 py-3 font-medium">Sitio</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Leads</th>
                  <th className="px-4 py-3 font-medium text-right">Sin leer</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-surface-400">
                      Todavía no hay clientes con un sitio pago.
                    </td>
                  </tr>
                )}
                {visible.map(({ project, leads, unread }) => {
                  const badge = statusBadge(project)
                  return (
                    <tr key={project.id} className="border-b border-surface-50 last:border-0">
                      <td className="px-4 py-3 text-surface-700">{project.ownerEmail}</td>
                      <td className="px-4 py-3 text-surface-700">{project.subdomain ?? project.slug}</td>
                      <td className="px-4 py-3 text-surface-700">
                        {getWebsitePlanConfig(project.plan)?.name ?? project.plan}
                        {project.provenance === 'gift' && (
                          <span className="ml-1 text-[11px] text-violet-600">(regalado)</span>
                        )}
                        {project.provenance === 'coupon' && (
                          <span className="ml-1 text-[11px] text-sky-600">(cupón)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-surface-700">{leads}</td>
                      <td className="px-4 py-3 text-right">
                        {unread > 0 ? (
                          <span className="font-semibold text-blue-700">{unread}</span>
                        ) : (
                          <span className="text-surface-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between mt-3 text-xs text-surface-500">
              <span>
                Página {page + 1} de {pageCount} · {ADMIN_OVERVIEW_PAGE_SIZE} por página
              </span>
              <div className="flex gap-2">
                {page > 0 && (
                  <Link href={`/admin?page=${page - 1}#clientes`} className="text-brand-600 underline underline-offset-2">
                    Anterior
                  </Link>
                )}
                {page + 1 < pageCount && (
                  <Link href={`/admin?page=${page + 1}#clientes`} className="text-brand-600 underline underline-offset-2">
                    Siguiente
                  </Link>
                )}
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-surface-400 max-w-2xl">
            <strong className="text-surface-500">Sobre las visitas:</strong> el único dato de tráfico que guardamos
            es <code>Project.views</code>, un contador acumulado sin fecha. No existe una tabla de visitas, así que
            no se puede calcular ningún período —ni 30 días ni ninguno— y por eso esta tabla no tiene columna de
            visitas en lugar de mostrar un número que parecería medido.
          </p>
        </section>
      </div>
    </div>
  )
}
