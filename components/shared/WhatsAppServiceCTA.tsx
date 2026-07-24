import { MessageCircle } from 'lucide-react'
import { getProduct, whatsappHrefFor } from '@/data/product-catalog'

/**
 * "Request personalised implementation" panel for a manually-provisioned
 * product. Renders the product's name and explanation from the central catalog
 * (data/product-catalog.ts) and a WhatsApp button with a pre-filled message —
 * deliberately NO price and NO self-checkout, because these products are set up
 * per client by hand.
 *
 * Both the dashboard screens and the public landing render this, so the copy
 * stays identical everywhere by construction: it all comes from the catalog.
 */
export function WhatsAppServiceCTA({
  slug,
  showHeading = true,
}: {
  slug: string
  /** Set false when the surrounding page already shows the product name. */
  showHeading?: boolean
}) {
  const product = getProduct(slug)
  if (!product) return null

  return (
    <div className="bg-white rounded-3xl border border-surface-100 shadow-sm p-6 sm:p-8">
      {showHeading && (
        <h2 className="text-xl font-bold text-surface-900 mb-2">{product.name}</h2>
      )}
      <p className="text-surface-500 mb-6 max-w-2xl">{product.description}</p>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 max-w-xl">
        <h3 className="font-semibold text-surface-900 mb-1">Implementación personalizada</h3>
        <p className="text-sm text-surface-600 mb-4">
          Este servicio se configura a medida para tu caso. Escribinos por WhatsApp y lo
          dejamos funcionando para vos.
        </p>
        <a
          href={whatsappHrefFor(product)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Solicitar por WhatsApp
        </a>
      </div>
    </div>
  )
}
