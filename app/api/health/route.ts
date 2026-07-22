import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkHealth } from '@/lib/health'
import { requestLogger } from '@/lib/request-log'

/**
 * GET /api/health — liveness + database readiness, for uptime monitoring.
 *
 * Unauthenticated by necessity (a monitor cannot log in) and therefore
 * status-only by discipline. The decision logic lives in `lib/health.ts`,
 * where it is unit-tested; this file is the wiring.
 *
 * 200 = process up and database reachable.
 * 503 = database unreachable — the monitor can alert on the status code alone,
 *       with no body parsing and no auth.
 */

// Prisma needs Node, not Edge.
export const runtime = 'nodejs'
// A cached health check reports the health of a moment that has passed.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const log = requestLogger({ route: 'api/health' })

  const { report, httpStatus } = await checkHealth({
    // The cheapest round trip the driver offers: proves the connection is
    // alive, touches no table, takes no lock, and reads no row.
    pingDb: () => prisma.$queryRaw`SELECT 1`,
    uptimeSeconds: process.uptime(),
    commit: process.env.GIT_SHA,
    // The failure is worth an operator's attention, so it goes to the log —
    // where redaction strips the datasource credentials a driver error can
    // carry. It never goes to the response.
    onDbError: (err) => log.error('Health check: database unreachable', { err }),
  })

  return NextResponse.json(report, {
    status: httpStatus,
    headers: {
      // A cached 200 outlives the outage it is supposed to report.
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
