import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PublishedSite } from '@/components/site/PublishedSite'

// Never cache: a preview must reflect the project's current saved state.
export const dynamic = 'force-dynamic'

/**
 * Owner-only faithful preview: `/preview/{projectId}`.
 *
 * Renders the SAME component the public site uses (`PublishedSite`) with the
 * project's live data, but WITHOUT the published/paid gate the public routes
 * apply — so the owner can preview a draft. This is the whole point: the editor
 * embeds this route in an iframe, so the preview is byte-for-byte the site that
 * ships. There is no second implementation to drift from the real thing (the
 * old dashboard preview redrew the site by hand and diverged — that is why the
 * mobile menu, for one, looked broken in preview while the real site was fine).
 *
 * Scoped to the owner: `findFirst` on `{ id, userId }`. Someone else's id
 * resolves to nothing and 404s, so this cannot leak another account's draft.
 */
export default async function OwnerPreviewPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) notFound()

  const row = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
  })
  if (!row) notFound()

  return <PublishedSite project={row} />
}
